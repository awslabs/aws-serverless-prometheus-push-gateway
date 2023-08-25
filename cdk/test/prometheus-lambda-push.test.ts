// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  App,
  Stack,
  Aspects,
  aws_aps as aps,
  aws_sqs as sqs,
} from "aws-cdk-lib";
import { Annotations, Match, Template } from "aws-cdk-lib/assertions";
import { AwsSolutionsChecks } from "cdk-nag";
import { PrometheusLambdaPushGateway } from "../lib";

describe("PrometheusLambdaPushGateway CDK Construct unit tests", () => {
  let app: App;
  let stack: Stack;
  let prometheus: aps.CfnWorkspace;

  beforeEach(() => {
    app = new App();
    stack = new Stack(app, "TestStack");
    Aspects.of(app).add(new AwsSolutionsChecks());
    prometheus = new aps.CfnWorkspace(stack, "Prometheus", {
      alias: "pushGatewayExample",
    });
  });

  it("default simple lambda", () => {
    new PrometheusLambdaPushGateway(stack, "PrometheusLambdaPushGateway", {
      prometheusArn: prometheus.attrArn,
      prometheusEndpoint: prometheus.attrPrometheusEndpoint,
    });

    app.synth();

    const errors = Annotations.fromStack(stack).findError(
      "*",
      Match.stringLikeRegexp("AwsSolutions-.*"),
    );
    expect(errors).toHaveLength(0);
    expect(Template.fromStack(stack)).toMatchSnapshot();
  });

  it("lambda with queue", () => {
    const dlq = new sqs.Queue(stack, "PrometheusDLQ", {
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      enforceSSL: true,
    });
    const queue = new sqs.Queue(stack, "PrometheusQueue", {
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3,
      },
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      enforceSSL: true,
    });

    new PrometheusLambdaPushGateway(stack, "PrometheusLambdaPushGateway", {
      prometheusArn: prometheus.attrArn,
      prometheusEndpoint: prometheus.attrPrometheusEndpoint,
      queue: queue,
    });

    app.synth();

    const errors = Annotations.fromStack(stack).findError(
      "*",
      Match.stringLikeRegexp("AwsSolutions-.*"),
    );
    expect(errors).toHaveLength(0);
    expect(Template.fromStack(stack)).toMatchSnapshot();
  });

  it("lambda with x-ray", () => {
    new PrometheusLambdaPushGateway(stack, "PrometheusLambdaPushGateway", {
      prometheusArn: prometheus.attrArn,
      prometheusEndpoint: prometheus.attrPrometheusEndpoint,
      xray: true,
    });

    app.synth();

    const errors = Annotations.fromStack(stack).findError(
      "*",
      Match.stringLikeRegexp("AwsSolutions-.*"),
    );
    expect(errors).toHaveLength(0);
    expect(Template.fromStack(stack)).toMatchSnapshot();
  });
});
