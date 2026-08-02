"""SafeDeck upload API — placeholder.

TODO (Week 2): implement upload flow:
1. Get S3 upload URL (presigned)
2. Return audit_id to client
3. Frontend uploads PDF directly to S3
4. S3 event triggers SQS message → audit worker
"""

import json
import os
import uuid


def lambda_handler(event, context):
    body = json.loads(event.get("body") or "{}")
    tenant_id = body.get("tenant_id")
    company_name = body.get("company_name")

    if not tenant_id or not company_name:
        return {"statusCode": 400, "body": json.dumps({"error": "tenant_id and company_name required"})}

    audit_id = str(uuid.uuid4())

    return {
        "statusCode": 202,
        "body": json.dumps({
            "audit_id": audit_id,
            "upload_url": f"https://s3.amazonaws.com/safedeck-decks-{os.environ.get('ENVIRONMENT', 'dev')}/uploads/{audit_id}.pdf",
            "status": "pending_upload",
        }),
    }
