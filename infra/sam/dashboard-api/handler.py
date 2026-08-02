"""SafeDeck dashboard API — placeholder.

TODO (Week 2): implement
- GET /deals — list with filters (stage, tenant)
- GET /deals/{id} — full detail with audit, meetings, emails
- PATCH /deals/{id}/stage — update stage, emit EventBridge event
"""

import json
import os


def lambda_handler(event, context):
    method = event.get("httpMethod")
    path = event.get("resource", "")

    # Stub responses so the SAM stack can be deployed
    if method == "GET" and path == "/deals":
        return {"statusCode": 200, "body": json.dumps({"deals": []})}
    if method == "GET" and path == "/deals/{deal_id}":
        return {"statusCode": 200, "body": json.dumps({"deal": None})}
    if method == "PATCH" and path == "/deals/{deal_id}/stage":
        return {"statusCode": 200, "body": json.dumps({"updated": True})}

    return {"statusCode": 404, "body": json.dumps({"error": "not found"})}
