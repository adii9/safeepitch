"""SafeDeck audit worker entrypoint.

This is a placeholder. The actual CrewAI invocation will be wired in Week 2
when the agents/ pipeline is integrated. For now, this handler just logs the
SQS message and writes a stub to DynamoDB to prove the deploy works.
"""

import json
import os
import sys
from pathlib import Path

# Allow importing from apps/agents during local SAM testing
_REPO_ROOT = Path(__file__).resolve().parents[3]
_AGENTS_PATH = _REPO_ROOT / "apps" / "agents" / "src"
if str(_AGENTS_PATH) not in sys.path:
    sys.path.insert(0, str(_AGENTS_PATH))


def lambda_handler(event, context):
    """SQS trigger — one record per audit request."""
    import logging

    logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"))
    logger = logging.getLogger(__name__)

    for record in event.get("Records", []):
        body = json.loads(record["body"])
        audit_id = body.get("audit_id")
        s3_key = body.get("s3_key")
        tenant_id = body.get("tenant_id")

        logger.info(
            "audit received",
            extra={
                "audit_id": audit_id,
                "tenant_id": tenant_id,
                "s3_key": s3_key,
            },
        )

        # TODO (Week 2): invoke CrewAI pipeline
        # from safedeck.flow import SafepitchFlow
        # result = SafepitchFlow().kickoff(inputs=...)

    return {"statusCode": 200, "body": json.dumps({"processed": len(event.get("Records", []))})}
