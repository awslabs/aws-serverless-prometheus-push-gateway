// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ValueType } from "@opentelemetry/api";
import { millisToHrTime } from "@opentelemetry/core";
import {
  AggregationTemporality,
  DataPointType,
  GaugeMetricData,
  InstrumentType,
} from "@opentelemetry/sdk-metrics";
import { SQSBatchItemFailure } from "aws-lambda";
import log from "loglevel";

/**
 * An individual set of metrics.
 *
 * @example
 {
  "dimensions": {
    "customerId": "customer1",
  },
  "timestamp": 1578376400,
  "metrics": {
    "temperature": 14.3,
    "ph": 6.7
  }
}
 */
type Dimensions = Record<string, string>;
type Metrics = Record<string, string | number>;

export interface MetricRecord {
  /**
   * Key/value pairs of dimension names and values.
   */
  dimensions: Dimensions;

  /**
   * Timestamp in milliseconds since epoch.
   *
   */
  timestamp: number;

  /**
   * Key/value pairs of metric names and values.
   */
  metrics: Metrics;
}

export function isDimensions(dimensions: any): dimensions is Dimensions {
  if (typeof dimensions !== "object") {
    return false;
  }

  if (Object.keys(dimensions).length === 0) {
    return false;
  }

  const initDimensions = true;
  const result: boolean = Object.values(dimensions).reduce(
    (accumulator: boolean, value) => {
      return accumulator && typeof value === "string";
    },
    initDimensions,
  );
  return result;
}

export function isMetrics(metrics: any): metrics is Metrics {
  if (typeof metrics !== "object") {
    return false;
  }

  if (Object.keys(metrics).length === 0) {
    return false;
  }

  const initMetrics = true;
  const result: boolean = Object.values(metrics).reduce(
    (accumulator: boolean, value) => {
      return (
        accumulator && (typeof value === "number" || typeof value === "string")
      );
    },
    initMetrics,
  );
  return result;
}

export function isValidTimestamp(timestamp: number) {
  const cur = Date.now();
  if (timestamp > cur) {
    return false;
  } else if (timestamp < cur - 60 * 60 * 24 * 1000) {
    return false;
  } else return true;
}

export function isMetricRecord(record: any): record is MetricRecord {
  if (
    !(
      isDimensions(record.dimensions) &&
      typeof record.timestamp === "number" &&
      isValidTimestamp(record.timestamp) &&
      isMetrics(record.metrics)
    )
  ) {
    return false;
  } else {
    const { dimensions, timestamp, metrics, ...rest } = record;
    if (Object.keys(rest).length > 0) {
      return false;
    } else {
      return true;
    }
  }
}

/**
 * Check if a metric value is a number and determine the type by the presence
 * of a decimal point.
 * @param {string} value - The value to check.
 * @returns {ValueType} - The type of the value.
 */
export const inferMetricType = (value: string): ValueType => {
  if (!isNaN(Number(value))) {
    return value.includes(".") ? ValueType.DOUBLE : ValueType.INT;
  } else {
    throw new TypeError("Metric is not a number");
  }
};

/**
 * Process the message and return a list of metrics.
 * @param [MetricRecord] message - The message to process.
 * @param [string=] messageId - The SQS message id.
 * @param [SQSBatchItemFailure[]=] batchItemFailures - The list of failed SQS messages.
 * @returns [GaugeMetricData[]] - The processed and grouped metrics.
 */
export const batchMetrics = (
  message: MetricRecord,
  messageId?: string,
  batchItemFailures?: SQSBatchItemFailure[],
): GaugeMetricData[] => {
  let metrics: GaugeMetricData[] = [];
  try {
    metrics = [
      ...Object.keys(message.metrics).map((metricName): GaugeMetricData => {
        const value = String(message.metrics[metricName]);
        const timestamp = millisToHrTime(message.timestamp);

        return {
          dataPointType: DataPointType.GAUGE,
          dataPoints: [
            {
              attributes: { ...message.dimensions },
              startTime: timestamp,
              endTime: timestamp,
              value: Number(value),
            },
          ],
          aggregationTemporality: AggregationTemporality.CUMULATIVE,
          descriptor: {
            name: metricName,
            description: metricName,
            unit: "",
            valueType: inferMetricType(value),
            type: InstrumentType.OBSERVABLE_GAUGE,
          },
        };
      }),
    ];
  } catch (e) {
    if (e instanceof TypeError) {
      if (messageId && batchItemFailures) {
        batchItemFailures.push({
          itemIdentifier: messageId,
          ...e,
        });
      }
      log.error(e);
    } else {
      throw e;
    }
  }
  return metrics;
};
