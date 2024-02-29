# AWS Serverless Prometheus Push Gateway

AWS Serverless Prometheus Push Gateway enables you to push metrics into Prometheus from any source without modifying
your application or running an always-on service for Prometheus to scrape.
It includes an AWS CDK construct library that deploys an AWS Lambda function using the Amazon Distribution for
OpenTelemetry (
ADOT) extension layer and connects it with an Amazon SQS queue and an Amazon Managed Service for Prometheus (AMP)
workspace.

For example, you could create an AWS IoT Core rule to send telemetry data to AMP.

## Build procedure

```
yarn
yarn run projen
yarn run build
```

## Usage

This construct creates a Lambda that can be invoked with single events or by SQS with batches. [API](cdk/API.md)

See `example/` for a sample CDK app that implements this construct.

### Lambda event payload

**`Example`**

```json
{
  "dimensions": {
    "customerId": "customer1"
  },
  "timestamp": 1676398017000,
  "metrics": {
    "temperature": "14.3",
    "ph": "6.7"
  }
}
```

#### Properties

- **dimensions**: Key/value pairs of dimension names and values.
- **metrics**: Key/value pairs of metric names and values.
- **timestamp**: Timestamp in milliseconds since epoch.

### Metric type inference

Metric values can either be integers or floating point numbers. There is a risk
that floating point metrics will be interpreted as integers by the JSON parser.
To avoid this, we recommend sending metrics as strings to preserve the decimal
point.

```json
{
  "metric1": 12.0,
  "metric2": "12.0"
}
```

In this example, `metric1` will get interpreted as the integer value `12`, but
`metric2` will have the decimal preserved.

## Caveats

Amazon Managed Prometheus requires metrics for a given combination of labels to
arrive in strictly ascending order by timestamp.
Anything that arrives late gets rejected and dropped.
In practice, as long as events for a given combination are sent on an interval
of at most every 10 seconds, out-of-order messages are unlikely.
