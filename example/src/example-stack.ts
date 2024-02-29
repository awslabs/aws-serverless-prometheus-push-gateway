// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { aws_aps as aps, aws_ssm as ssm, aws_sqs as sqs } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { PrometheusLambdaPushGateway } from "../../cdk/lib";

export class ExampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const prometheus = new aps.CfnWorkspace(this, "Prometheus", {
      alias: "pushGatewayExample",
    });

    const dlq = new sqs.Queue(this, "PrometheusDLQ", {
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      enforceSSL: true,
    });
    const queue = new sqs.Queue(this, "PrometheusQueue", {
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3,
      },
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      enforceSSL: true,
    });

    new PrometheusLambdaPushGateway(this, "SQSPrometheusPushGateway", {
      prometheusArn: prometheus.attrArn,
      prometheusEndpoint: prometheus.attrPrometheusEndpoint,
      queue: queue,
    });

    new ssm.StringParameter(this, "QueueParam", {
      parameterName: `/prometheusPushGateway/${this.stackName}/queueUrl`,
      stringValue: queue.queueUrl,
    });

    new cdk.CfnOutput(this, "QueueUrl", {
      value: queue.queueUrl,
    });

    new cdk.CfnOutput(this, "PrometheusUrl", {
      value: prometheus.attrPrometheusEndpoint,
    });
  }
}
