// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as path from "path";
import {
  aws_iam as iam,
  aws_lambda as lambda,
  aws_lambda_event_sources as lambda_event_sources,
  aws_sqs as sqs,
  Duration,
  Aws,
} from "aws-cdk-lib";
import { NagSuppressions } from "cdk-nag";
import { Construct } from "constructs";

// source of truth for the latest version https://aws-otel.github.io/docs/getting-started/lambda/lambda-go#lambda-layer
const adotLayerVersionArn =
  "arn:aws:lambda:us-east-1:901920570463:layer:aws-otel-collector-arm64-ver-0-80-0:1";

/**
 * The properties for PrometheusLambdaPushGateway.
 */
export interface PrometheusLambdaPushGatewayProps {
  /**
   * ARN for the Amazon Managed Prometheus workspace.
   */
  readonly prometheusArn: string;

  /**
   * HTTP endpoint for Prometheus.
   */
  readonly prometheusEndpoint: string;

  /**
   * Optional SQS queue for receiving metrics.
   *
   * @default - No queue. Invoke the Lambda with the metrics payload directly.
   */
  readonly queue?: sqs.IQueue;

  /**
   * Enable X-Ray tracing for Lambda functions
   *
   * @default - false
   */
  readonly xray?: boolean;
}

/**
 * Create an AWS Lambda function that pushes metrics to Prometheus. It can
 * either be called directly or via Amazon SQS.
 */
export class PrometheusLambdaPushGateway extends Construct {
  public readonly lambda: lambda.Function;

  constructor(
    scope: Construct,
    id: string,
    props: PrometheusLambdaPushGatewayProps,
  ) {
    super(scope, id);

    // Setup the IAM Role for Lambda Service
    const lambdaServiceRole = new iam.Role(
      scope,
      this.node.id + "ServiceRole",
      {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        inlinePolicies: {
          LambdaFunctionServiceRolePolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                actions: [
                  "logs:CreateLogGroup",
                  "logs:CreateLogStream",
                  "logs:PutLogEvents",
                ],
                resources: [
                  `arn:${Aws.PARTITION}:logs:${Aws.REGION}:${Aws.ACCOUNT_ID}:log-group:/aws/lambda/*`,
                ],
              }),
            ],
          }),
        },
      },
    );

    NagSuppressions.addResourceSuppressions(lambdaServiceRole, [
      {
        id: "AwsSolutions-IAM5",
        reason:
          "Lambda function has the required permission to write CloudWatch Logs. It uses custom policy instead of arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole with tighter permissions.",
        appliesTo: [
          "Resource::arn:<AWS::Partition>:logs:<AWS::Region>:<AWS::AccountId>:log-group:/aws/lambda/*",
        ],
      },
    ]);

    this.lambda = new lambda.Function(this, "lambda", {
      role: lambdaServiceRole,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 192,
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset(path.join(__dirname, "lambda")),
      handler: props.queue ? "index.sqsHandler" : "index.simpleHandler",
      tracing: props.xray ? lambda.Tracing.ACTIVE : lambda.Tracing.DISABLED,
      environment: {
        AWS_PROMETHEUS_ENDPOINT: `${props.prometheusEndpoint}api/v1/remote_write`,
        OPENTELEMETRY_COLLECTOR_CONFIG_FILE: "/var/task/otel-config.yaml",
      },
      layers: [
        lambda.LayerVersion.fromLayerVersionArn(
          this,
          "AdotLambdaLayerGenericVersion",
          adotLayerVersionArn,
        ),
      ],
    });

    lambdaServiceRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["aps:RemoteWrite"],
        resources: [props.prometheusArn],
      }),
    );

    if (props.queue) {
      this.lambda.addEventSource(
        new lambda_event_sources.SqsEventSource(props.queue, {
          batchSize: 50,
          maxBatchingWindow: Duration.minutes(1),
          reportBatchItemFailures: true,
        }),
      );

      props.queue.grantConsumeMessages(lambdaServiceRole);
    }

    props.xray &&
      NagSuppressions.addResourceSuppressions(
        lambdaServiceRole,
        [
          {
            id: "AwsSolutions-IAM5",
            reason:
              "The Lambda function needs access to X-Ray, but X-Ray does not allow resource restrictions.",
            appliesTo: ["Resource::*"],
          },
        ],
        true,
      );
  }
}
