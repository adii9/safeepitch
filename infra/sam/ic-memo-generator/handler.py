"""SafeDeck IC memo generator — placeholder.

TODO (Week 4):
- Pull audit + meetings + emails for deal
- Apply tenant IC memo template
- Diff against required fields
- Return { memo_md: str, missing_fields: list[str] }
- Frontend surfaces missing fields for one-click follow-up email
"""


def lambda_handler(event, context):
    return {
        "statusCode": 200,
        "body": '{"memo_md": "# IC Memo\\n\\nStub.", "missing_fields": []}',
    }
