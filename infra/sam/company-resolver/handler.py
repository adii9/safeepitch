"""SafeDeck company resolver — placeholder.

TODO (Week 3): implement deterministic resolution:
1. Extract domain from email sender
2. Look up Companies table by domain
3. If not found → create new company with domain
4. Return company_id
"""


def lambda_handler(event, context):
    return {"statusCode": 200, "body": '{"company_id": null, "domain": null}'}
