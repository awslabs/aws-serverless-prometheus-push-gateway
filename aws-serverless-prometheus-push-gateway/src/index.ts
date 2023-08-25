// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as crypto from "crypto";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { Resource } from "@opentelemetry/resources";
import { GaugeMetricData } from "@opentelemetry/sdk-metrics";
import {
  SQSBatchItemFailure,
  SQSBatchResponse,
  SQSEvent,
  SQSHandler,
} from "aws-lambda";
import log from "loglevel";
import { batchMetrics, isMetricRecord, MetricRecord } from "./metrics";

log.setLevel(process.env.DEBUG ? "debug" : "info");

const otlpResource = new Resource({});
const otlpExporter = new OTLPMetricExporter();

const messageIds = new Set();

/**
 * Send the metrics to the collector.
 *
 * @param {GaugeMetricData[]} metrics - The processed and grouped metrics.
 */
const exportMetrics = (metrics: GaugeMetricData[]) => {
  const id = crypto
    .createHash("sha256")
    .update(JSON.stringify(metrics))
    .digest("hex");
  messageIds.add(id);
  try {
    log.debug(`exporting ${id}: ${JSON.stringify(metrics)}`);
    otlpExporter.export(
      {
        resource: otlpResource,
        scopeMetrics: [
          {
            metrics: metrics,
            scope: { name: "default" },
          },
        ],
      },
      (result) => {
        if (result.code !== 0) {
          log.error(result.error);
          throw new Error(`Export failed with error ${result.error}`);
        } else {
          messageIds.delete(id);
          log.info(`successfuly exported ${id}`);
        }
      },
    );
  } catch (e) {
    if (e instanceof TypeError) {
      log.error(e);
    } else {
      throw e;
    }
  }
};

/**
 * Wait for all messages to be exported before closing the exporter because export() only uses callbacks but doesn't return a Promise.
 */
const waitMessages = async (timeout: number) => {
  let count = 0;
  const interval = 10;
  while (messageIds.size > 0 && count < timeout / interval) {
    await new Promise((r) => setTimeout(r, interval));
    count++;
  }
  if (count >= timeout / interval) {
    log.error("timeout reached");
    throw new Error("timeout reached");
  }
};

/**
 * A handler to take individual events and send them to Prometheus.
 *
 * @param {MetricRecord} event - The metrics including dimensions and timestamp.
 */
export const simpleHandler = async (event: MetricRecord) => {
  if (isMetricRecord(event)) {
    exportMetrics(batchMetrics(event));
  } else {
    log.error("Message is not a MetricRecord. dropping.", event);
    throw new TypeError("Message is not a MetricRecord.");
  }
  await waitMessages(2000);
  await otlpExporter.forceFlush();
};

/**
 * A handler to take batched events and send them to Prometheus.
 *
 * @param {SQSEvent} event - The SQS event with metrics. The payload is a MetricRecord.
 */
export const sqsHandler: SQSHandler = async (
  event: SQSEvent,
): Promise<SQSBatchResponse> => {
  const batchItemFailures: SQSBatchItemFailure[] = [];
  const metrics: GaugeMetricData[] = [];
  event.Records.forEach((record) => {
    const message = JSON.parse(record.body) as MetricRecord;
    if (isMetricRecord(message)) {
      metrics.push(
        ...batchMetrics(message, record.messageId, batchItemFailures),
      );
    } else {
      log.warn("Message is not a MetricRecord. dropping.", record.body);
    }
  });
  exportMetrics(metrics);
  await waitMessages(2000);
  await otlpExporter.forceFlush();

  log.info(JSON.stringify({ batchItemFailures }));
  return { batchItemFailures };
};
