# AWS Serverless Prometheus Push Gateway

AWS Serverless Prometheus Push Gateway enables you to push metrics into Prometheus from any source without modifying
your application or running an always-on service for Prometheus to scrape.
This AWS CDK construct library deploys an AWS Lambda function using the Amazon Distribution for
OpenTelemetry (ADOT) extension layer and connects it with an Amazon SQS queue and an Amazon Managed Service for
Prometheus (AMP)
workspace.

For example, you could create an AWS IoT Core rule to send telemetry data to AMP.

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

# API Reference <a name="API Reference" id="api-reference"></a>

## Constructs <a name="Constructs" id="Constructs"></a>

### PrometheusLambdaPushGateway <a name="PrometheusLambdaPushGateway" id="cdk-aws-serverless-prometheus-push-gateway.PrometheusLambdaPushGateway"></a>

Create an AWS Lambda function that pushes metrics to Prometheus.

It can
either be called directly or via Amazon SQS.

#### Initializers <a name="Initializers" id="cdk-aws-serverless-prometheus-push-gateway.PrometheusLambdaPushGateway.Initializer"></a>

```typescript
import { PrometheusLambdaPushGateway } from 'cdk-aws-serverless-prometheus-push-gateway'

new PrometheusLambdaPushGateway(scope: Construct, id: string, props: PrometheusLambdaPushGatewayProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-aws-serverless-prometheus-push-gateway.PrometheusLambdaPushGateway.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#cdk-aws-serverless-prometheus-push-gateway.PrometheusLambdaPushGateway.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#cdk-aws-serverless-prometheus-push-gateway.PrometheusLambdaPushGateway.Initializer.parameter.props">props</a></code> | <code><a href="#cdk-aws-serverless-prometheus-push-gateway.PrometheusLambdaPushGatewayProps">PrometheusLambdaPushGatewayProps</a></code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="cdk-aws-serverless-prometheus-push-gateway.PrometheusLambdaPushGateway.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-aws-serverless-prometheus-push-gateway.PrometheusLambdaPushGateway.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="cdk-aws-serverless-prometheus-push-gateway.PrometheusLambdaPushGateway.Initializer.parameter.props"></a>

- *Type:* <a href="#cdk-aws-serverless-prometheus-push-gateway.PrometheusLambdaPushGatewayProps">PrometheusLambdaPushGatewayProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-aws-serverless-prometheus-push-gateway.PrometheusLambdaPushGateway.toString">toString</a></code> | Returns a string representation of this construct. |

---

##### `toString` <a name="toString" id="cdk-aws-serverless-prometheus-push-gateway.PrometheusLambdaPushGateway.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-aws-serverless-prometheus-push-gateway.PrometheusLambdaPushGateway.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### `isConstruct` <a name="isConstruct" id="cdk-aws-serverless-prometheus-push-gateway.PrometheusLambdaPushGateway.isConstruct"></a>

```typescript
import { PrometheusLambdaPushGateway } from 'cdk-aws-serverless-prometheus-push-gateway'

PrometheusLambdaPushGateway.isConstruct(x: any)
```

Checks if `x` is a construct.

Use this method instead of `instanceof` to properly detect `Construct`
instances, even when the construct library is symlinked.

Explanation: in JavaScript, multiple copies of the `constructs` library on
disk are seen as independent, completely different libraries. As a
consequence, the class `Construct` in each copy of the `constructs` library
is seen as a different class, and an instance of one class will not test as
`instanceof` the other class. `npm install` will not create installations
like this, but users may manually symlink construct libraries together or
use a monorepo tool: in those cases, multiple copies of the `constructs`
library can be accidentally installed, and `instanceof` will behave
unpredictably. It is safest to avoid using `instanceof`, and using
this type-testing method instead.

###### `x`<sup>Required</sup> <a name="x" id="cdk-aws-serverless-prometheus-push-gateway.PrometheusLambdaPushGateway.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-aws-serverless-prometheus-push-gateway.PrometheusLambdaPushGateway.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#cdk-aws-serverless-prometheus-push-gateway.PrometheusLambdaPushGateway.property.lambda">lambda</a></code> | <code>aws-cdk-lib.aws_lambda.Function</code> | *No description.* |

---

##### `node`<sup>Required</sup> <a name="node" id="cdk-aws-serverless-prometheus-push-gateway.PrometheusLambdaPushGateway.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `lambda`<sup>Required</sup> <a name="lambda" id="cdk-aws-serverless-prometheus-push-gateway.PrometheusLambdaPushGateway.property.lambda"></a>

```typescript
public readonly lambda: Function;
```

- *Type:* aws-cdk-lib.aws_lambda.Function

---


## Structs <a name="Structs" id="Structs"></a>

### PrometheusLambdaPushGatewayProps <a name="PrometheusLambdaPushGatewayProps" id="cdk-aws-serverless-prometheus-push-gateway.PrometheusLambdaPushGatewayProps"></a>

The properties for PrometheusLambdaPushGateway.

#### Initializer <a name="Initializer" id="cdk-aws-serverless-prometheus-push-gateway.PrometheusLambdaPushGatewayProps.Initializer"></a>

```typescript
import { PrometheusLambdaPushGatewayProps } from 'cdk-aws-serverless-prometheus-push-gateway'

const prometheusLambdaPushGatewayProps: PrometheusLambdaPushGatewayProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-aws-serverless-prometheus-push-gateway.PrometheusLambdaPushGatewayProps.property.prometheusArn">prometheusArn</a></code> | <code>string</code> | ARN for the Amazon Managed Prometheus workspace. |
| <code><a href="#cdk-aws-serverless-prometheus-push-gateway.PrometheusLambdaPushGatewayProps.property.prometheusEndpoint">prometheusEndpoint</a></code> | <code>string</code> | HTTP endpoint for Prometheus. |
| <code><a href="#cdk-aws-serverless-prometheus-push-gateway.PrometheusLambdaPushGatewayProps.property.queue">queue</a></code> | <code>aws-cdk-lib.aws_sqs.IQueue</code> | Optional SQS queue for receiving metrics. |
| <code><a href="#cdk-aws-serverless-prometheus-push-gateway.PrometheusLambdaPushGatewayProps.property.xray">xray</a></code> | <code>boolean</code> | Enable X-Ray tracing for Lambda functions. |

---

##### `prometheusArn`<sup>Required</sup> <a name="prometheusArn" id="cdk-aws-serverless-prometheus-push-gateway.PrometheusLambdaPushGatewayProps.property.prometheusArn"></a>

```typescript
public readonly prometheusArn: string;
```

- *Type:* string

ARN for the Amazon Managed Prometheus workspace.

---

##### `prometheusEndpoint`<sup>Required</sup> <a name="prometheusEndpoint" id="cdk-aws-serverless-prometheus-push-gateway.PrometheusLambdaPushGatewayProps.property.prometheusEndpoint"></a>

```typescript
public readonly prometheusEndpoint: string;
```

- *Type:* string

HTTP endpoint for Prometheus.

---

##### `queue`<sup>Optional</sup> <a name="queue" id="cdk-aws-serverless-prometheus-push-gateway.PrometheusLambdaPushGatewayProps.property.queue"></a>

```typescript
public readonly queue: IQueue;
```

- *Type:* aws-cdk-lib.aws_sqs.IQueue
- *Default:* No queue. Invoke the Lambda with the metrics payload directly.

Optional SQS queue for receiving metrics.

---

##### `xray`<sup>Optional</sup> <a name="xray" id="cdk-aws-serverless-prometheus-push-gateway.PrometheusLambdaPushGatewayProps.property.xray"></a>

```typescript
public readonly xray: boolean;
```

- *Type:* boolean
- *Default:* false

Enable X-Ray tracing for Lambda functions.

---



