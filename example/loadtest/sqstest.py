# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import sys

import boto3
import time
import json

from multiprocessing import Pool

from common import gen_event

PROCESSES = 1

ssm = boto3.client("ssm")

queue_url = ssm.get_parameter(Name=f"/prometheusPushGateway/{sys.argv[1]}/queueUrl")["Parameter"]["Value"]


def send_messages(i):
    sqs = boto3.resource("sqs")
    queue = sqs.Queue(queue_url)

    print(f"starting process {i} with {queue_url}")

    while True:
        event = gen_event()
        res = queue.send_message(MessageBody=json.dumps(event))
        # time.sleep(0.02)


if __name__ == "__main__":
    pool = Pool(processes=PROCESSES)
    pool.map(send_messages, range(PROCESSES))
