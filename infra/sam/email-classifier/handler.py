"""SafeDeck email classifier — placeholder.

TODO (Week 3): LLM decides relevant | noise based on:
- subject + body
- thread context (previous emails)
- tenant context (which deal this might belong to)
Output: { relevant: bool, confidence: float, deal_id?, reason }
"""


def lambda_handler(event, context):
    return {"statusCode": 200, "body": '{"relevant": True, "confidence": 0.0, "reason": "stub"}'}
