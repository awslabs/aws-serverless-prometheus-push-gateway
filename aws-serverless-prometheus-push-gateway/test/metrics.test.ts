// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ValueType } from "@opentelemetry/api";
import { millisToHrTime } from "@opentelemetry/core";
import { SQSBatchItemFailure } from "aws-lambda";
import log from "loglevel";
import {
  batchMetrics,
  inferMetricType,
  isDimensions,
  isMetricRecord,
  isMetrics,
  isValidTimestamp,
  MetricRecord,
} from "../src/metrics";

describe("Functions to manipulate metrics", () => {
  let validMetricRecord: any;

  beforeAll(() => {
    jest.spyOn(log, "error").mockImplementation(() => {});
  });

  beforeEach(() => {
    validMetricRecord = {
      dimensions: {
        customerId: "customer1",
      },
      timestamp: Date.now(),
      metrics: {
        temperature: 14.3,
        ph: "6.7",
      },
    };
  });

  describe("isMetricRecord", () => {
    it("should return true if the object is a valid metric record", () => {
      expect(isMetricRecord(validMetricRecord)).toBeTruthy();
    });

    it("should return false if the object is empty", () => {
      expect(isMetricRecord({})).toBeFalsy();
    });

    it("should return false if there are extra keys", () => {
      validMetricRecord.extra = "extra";
      expect(isMetricRecord(validMetricRecord)).toBeFalsy();
    });

    it("isMetrics should return false if the metric values are not numbers or strings", () => {
      validMetricRecord.metrics.temperature = true;
      expect(isMetrics(validMetricRecord.metrics)).toBeFalsy();
    });

    it("isMetrics should return false if the metrics are empty", () => {
      expect(isMetrics({})).toBeFalsy();
    });

    it("should return false if the timestamp is not a number", () => {
      validMetricRecord.timestamp = "timestamp";
      expect(isMetricRecord(validMetricRecord)).toBeFalsy();
    });

    it("isValidTimestamp should return false if the timestamp is too old", () => {
      expect(
        isValidTimestamp(Date.now() - (60 * 60 * 24 * 1000 + 10)),
      ).toBeFalsy();
    });

    it("isValidTimestamp should return false if the timestamp is in the future", () => {
      expect(isValidTimestamp(Date.now() + 10000)).toBeFalsy();
    });

    it("should return false if dimensions is not an object", () => {
      validMetricRecord.dimensions = "dimensions";
      expect(isMetricRecord(validMetricRecord)).toBeFalsy();
    });

    it("should return false if metrics is not an object", () => {
      validMetricRecord.metrics = "metrics";
      expect(isMetricRecord(validMetricRecord)).toBeFalsy();
    });

    it("isDimensions should return false if the dimensions are empty", () => {
      expect(isDimensions({})).toBeFalsy();
    });

    it("isDimensions should return false if the dimensions contain non-string values", () => {
      validMetricRecord.dimensions.customerId = 12;
      expect(isDimensions(validMetricRecord.dimensions)).toBeFalsy();
    });
  });

  describe("inferMetricType", () => {
    it("should return int for 12", () => {
      expect(inferMetricType("12")).toBe(ValueType.INT);
    });

    it("should return double for 12.3", () => {
      expect(inferMetricType("12.3")).toBe(ValueType.DOUBLE);
    });

    it("should return double for 12.0", () => {
      expect(inferMetricType("12.0")).toBe(ValueType.DOUBLE);
    });

    it("should return int for -12", () => {
      expect(inferMetricType("-12")).toBe(ValueType.INT);
    });

    it("should throw an error for 'hello'", () => {
      expect(() => {
        inferMetricType("hello");
      }).toThrow(TypeError);
    });

    it("should throw an error for '12hello'", () => {
      expect(() => {
        inferMetricType("12hello");
      }).toThrow(TypeError);
    });
  });

  describe("batchMetrics", function () {
    it("should return an array of two GaugeMetricData objects", () => {
      const result = batchMetrics(validMetricRecord as MetricRecord);
      expect(result.length).toBe(2);
      expect(result[0].descriptor.name).toBe("temperature");
      expect(result[0].dataPoints[0].value).toBe(14.3);
      expect(result[0].dataPoints[0].startTime).toEqual(
        millisToHrTime(validMetricRecord.timestamp),
      );
      expect(result[0].dataPoints[0].attributes).toEqual({
        customerId: "customer1",
      });
      expect(result[1].descriptor.name).toBe("ph");
      expect(result[1].dataPoints[0].value).toBe(6.7);
      expect(result[1].dataPoints[0].startTime).toEqual(
        millisToHrTime(validMetricRecord.timestamp),
      );
      expect(result[1].dataPoints[0].attributes).toEqual({
        customerId: "customer1",
      });
    });

    it("should append to batchItemFailures if the metric record is invalid", () => {
      const batchItemFailures: SQSBatchItemFailure[] = [];
      validMetricRecord.metrics.temperature = true;
      const result = batchMetrics(
        validMetricRecord as MetricRecord,
        "testID",
        batchItemFailures,
      );

      expect(result).toEqual([]);
      expect(batchItemFailures.length).toBe(1);
      expect(log.error).toHaveBeenCalledTimes(1);
    });
  });
});
