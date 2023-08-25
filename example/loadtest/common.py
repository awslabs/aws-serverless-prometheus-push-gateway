# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import time
import random


def get_timestamp():
    return int(time.time() * 1000)


def gen_event():
    event = {
        "timestamp": get_timestamp(),
        "dimensions": {
            "customerId": "customer" + str(random.randint(1, 1000)),  # nosec B311
            "deviceId": "device" + str(random.randint(1, 1000)),  # nosec B311
        },
        "metrics": {
            "ph": str(random.uniform(6.0, 8.0)),  # nosec B311
            "temperature": str(random.uniform(12.0, 24.0)),  # nosec B311

        },
    }
    return event
