// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { awscdk } from "projen";
import { NxMonorepoProject } from "@aws-prototyping-sdk/nx-monorepo";
import { TypeScriptProject } from "projen/lib/typescript";

const project = new NxMonorepoProject({
  name: "aws-serverless-prometheus-push-gateway",
  defaultReleaseBranch: "main",
  projenrcTs: true,
  prettier: true,
  devDeps: [
    "@aws-prototyping-sdk/nx-monorepo",
    "@types/jest",
    "@commitlint/cli",
    "@commitlint/config-conventional",
    "commitizen",
    "cz-conventional-changelog",
  ],
  gitignore: [
    ".DS_Store",
    ".idea",
    ".vscode",
    "**/*.js",
    "**/*.d.ts",
    "cdk.out",
  ],
});

// Commit lint and commitizen settings
project.addFields({
  config: {
    commitizen: {
      path: "./node_modules/cz-conventional-changelog",
    },
  },
  commitlint: {
    extends: ["@commitlint/config-conventional"],
  },
});

const pushGateway = new TypeScriptProject({
  parent: project,
  name: "aws-serverless-prometheus-push-gateway",
  defaultReleaseBranch: "main",
  description:
    "A serverless gateway to allow any source application/device to send metrics to a Prometheus workspace without long running services.",
  license: "Apache-2.0",
  outdir: "aws-serverless-prometheus-push-gateway",
  devDeps: ["@types/jest", "@types/node"],
  bundledDeps: [
    "@opentelemetry/api",
    "@opentelemetry/core",
    "@opentelemetry/exporter-metrics-otlp-proto",
    "@opentelemetry/resources",
    "@opentelemetry/sdk-metrics",
    "@types/aws-lambda",
    "loglevel",
  ],
  tsconfig: {
    compilerOptions: {
      lib: ["es2020", "dom"],
      target: "es2020",
      module: "commonjs",
      esModuleInterop: true,
    },
    exclude: ["node_modules", "**/*.test.ts"],
  },
  eslintOptions: {
    dirs: ["."],
    ignorePatterns: [
      "**/*.test.ts",
      "*.js",
      "!.projenrc.js",
      "*.d.ts",
      "node_modules/",
      "*.generated.ts",
      "coverage",
    ],
  },
  prettier: true,
  package: false,
});

const pushGatewayBundle = pushGateway.bundler.addBundle("src/index.ts", {
  target: "es2020",
  platform: "node",
});

const pushGatewayConstruct = new awscdk.AwsCdkConstructLibrary({
  parent: project,
  author: "Jeff Strunk",
  authorAddress: "strunkjd@amazon.com",
  cdkVersion: "2.88.0",
  defaultReleaseBranch: "main",
  name: "cdk-aws-serverless-prometheus-push-gateway",
  license: "Apache-2.0",
  description:
    "A CDK Construct to deploy a gateway to allow any source application/device to send metrics to a Prometheus workspace without long running services.",
  repositoryUrl:
    "git@ssh.gitlab.aws.dev:strunkjd/aws-lambda-prometheus-gateway.git",
  keywords: ["iot", "prometheus"],
  outdir: "cdk",
  deps: ["aws-cdk-lib", "cdk-nag"],
  devDeps: ["@types/jest", "@types/node"],
  prettier: true,
  lambdaAutoDiscover: false,
  sampleCode: false,
});
pushGatewayConstruct.addPackageIgnore("example/*");

const pgcPostCompile = pushGatewayConstruct.tasks.tryFind("post-compile");
if (pgcPostCompile) {
  pgcPostCompile.exec(`mkdir -p ${pushGatewayConstruct.outdir}/lib/lambda/`);
  pgcPostCompile.exec(
    `cp ${pushGateway.outdir}/${pushGatewayBundle.outfile} ${pushGatewayConstruct.outdir}/lib/lambda/`
  );
  pgcPostCompile.exec(
    `cp ${pushGateway.outdir}/src/otel-config.yaml ${pushGatewayConstruct.outdir}/lib/lambda/`
  );
}

project.addImplicitDependency(pushGatewayConstruct, pushGateway);

project.synth();
