"""SafeDeck meeting integrations — placeholder.

TODO (Week 3):
- /webhooks/calendly: receives invitee.created, invitee.canceled
- /webhooks/fireflies: receives transcript ready
- Both write to Meetings table, linked by deal_id
"""


def lambda_handler(event, context):
    return {"statusCode": 200, "body": '{"received": True}'}
