# Example CDK App

This example app creates an Amazon Managed Service for Prometheus workspace, an Amazon SQS queue, and an AWS Lambda
function to receive metrics via SQS.

## Deployment

After running `projen build` in the project root, you can use this app like any other CDK app.

``` shell
npx cdk deploy ExampleStack
```

## Load testing

After deploying, you can run load tests using the scripts in `scripts/`.

The SQS script will generate and send random samples as fast as possible.

```shell
python loadtest/sqstest.py ExampleStack
```
