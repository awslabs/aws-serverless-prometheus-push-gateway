// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from "aws-cdk-lib";
import { AwsSolutionsChecks } from "cdk-nag";
import { ExampleStack } from "./example-stack";

const app = new cdk.App();
new ExampleStack(app, "AWSServerlessPrometheusPushGatewayExample");

cdk.Aspects.of(app).add(new AwsSolutionsChecks());
