"""
The orchestrator — one LLM agent that decides what to do per email.

This is the right architecture. The LLM has access to:
  - the current email
  - the deal's full history
  - the VC's config (rating criteria, templates)
  - 7 tools (parse, extract, verify, outreach, meeting, persist, l1_l2)

The LLM decides which tools to call. Different emails lead to
different tool sequences. No hardcoded pipeline.

Compared to v1 (CrewAI chained agents):
  - No fixed pipeline. The LLM picks the path.
  - Multiple emails from the same founder are a continuous conversation,
    not separate one-shot runs.
  - The LLM has memory of what it already asked, what was already
    extracted, what verifications ran.

Implementation note: this is the "agent" pattern. LangGraph supports
it natively via the `create_react_agent` helper, or you can build a
custom graph. We start with create_react_agent for simplicity, then
build custom if we need finer control.
"""

from __future__ import annotations

import os
from typing import Any

from langgraph.prebuilt import create_react_agent
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field

from . import tools as tool_impl
from . import AGENT_SYSTEM_PROMPT


# ---------------------------------------------------------------------------
# Pydantic schemas for tool inputs (required for StructuredTool with plain fns)
# ---------------------------------------------------------------------------


class ParsePdfInput(BaseModel):
    s3_path: str = Field(..., description="S3 path to the PDF, e.g. s3://bucket/key.pdf")


class ExtractFieldsInput(BaseModel):
    deck_text: str = Field(..., description="The full markdown text from LlamaParse")
    email_body: str = Field(default="", description="Email body forwarded from the founder")
    fields: list[dict] = Field(..., description="List of {key, label} dicts to extract")


class VerifyClaimInput(BaseModel):
    field_key: str = Field(..., description="Which field we're verifying")
    claim_value: str = Field(..., description="The value claimed by the founder")
    company_name: str = Field(..., description="Company name for context")


class SendOutreachInput(BaseModel):
    founder_email: str = Field(..., description="Founder's email")
    missing_fields: list[str] = Field(..., description="Field keys that need filling")
    deal_id: str = Field(..., description="Deal ID for tracking")


class CreateMeetingInput(BaseModel):
    founder_email: str = Field(..., description="Founder's email")
    deal_id: str = Field(..., description="Deal ID for tracking")


class PersistInput(BaseModel):
    deal_id: str = Field(..., description="Deal ID")
    state: dict = Field(..., description="Deal state to save")


class GenerateL1L2Input(BaseModel):
    deal_id: str = Field(..., description="Deal ID")
    tenant_id: str = Field(..., description="Tenant ID")
    deal_state: dict = Field(..., description="Deal state with extracted fields")


def build_orchestrator(tenant_name: str = "the VC firm") -> Any:
    """Build a ReAct agent that decides which tools to call per email."""
    from langchain_core.tools import StructuredTool

    lc_tools = [
        StructuredTool.from_function(func=tool_impl.parse_pdf, name="parse_pdf",
            description="Download PDF from S3 and extract text via LlamaParse. Returns markdown text.",
            args_schema=ParsePdfInput),
        StructuredTool.from_function(func=tool_impl.extract_fields, name="extract_fields",
            description="Extract 49 fields from the deck text via direct Gemini call. Returns {field_key: value}.",
            args_schema=ExtractFieldsInput),
        StructuredTool.from_function(func=tool_impl.verify_claim, name="verify_claim",
            description="Search the web for the founder's claim. Returns {verified_value, source_url, confidence}.",
            args_schema=VerifyClaimInput),
        StructuredTool.from_function(func=tool_impl.send_outreach, name="send_outreach",
            description="Send a templated email asking the founder for missing data. Returns {queued: True}.",
            args_schema=SendOutreachInput),
        StructuredTool.from_function(func=tool_impl.create_meeting, name="create_meeting",
            description="Create a Calendly scheduling event. Returns {meeting_id, url}.",
            args_schema=CreateMeetingInput),
        StructuredTool.from_function(func=tool_impl.persist, name="persist",
            description="Save the deal state to DynamoDB. Returns {persisted: True}.",
            args_schema=PersistInput),
        StructuredTool.from_function(func=tool_impl.generate_l1_l2, name="generate_l1_l2",
            description="Render L1 + L2 docxtpl notes and upload to S3. Returns {l1_url, l2_url}.",
            args_schema=GenerateL1L2Input),
    ]

    llm = ChatGoogleGenerativeAI(
        model=os.environ.get("EXTRACTION_MODEL", "gemini-2.5-flash"),
        google_api_key=os.environ.get("GEMINI_API_KEY"),
    )

    system_prompt = AGENT_SYSTEM_PROMPT.replace("{tenant_name}", tenant_name)

    agent = create_react_agent(llm, lc_tools)
    return agent, system_prompt


def run_orchestrator_on_email(agent: Any, system_prompt: str, deal_state: dict, current_email: dict) -> dict:
    """Run the orchestrator agent on a single email. Returns the agent's output."""
    from langchain_core.messages import SystemMessage
    user_message = f"""
CURRENT EMAIL:
  from: {current_email.get('from_')}
  subject: {current_email.get('subject')}
  body: {current_email.get('body')}
  attachments: {current_email.get('attachments', [])}
  thread_id: {current_email.get('thread_id', 'none')}

CURRENT DEAL STATE (read-only):
  deal_id: {deal_state.get('deal_id')}
  company_name: {deal_state.get('company_name')}
  founder_email: {deal_state.get('founder_email')}
  emails_in_thread: {len(deal_state.get('emails', []))}
  extracted_fields_keys: {list(deal_state.get('extracted_fields', {}).keys())[:10]}  # first 10
  missing_fields: {deal_state.get('missing_fields', [])}
  verifications_done: {len(deal_state.get('verifications', {}))}
  risk_flags_count: {len(deal_state.get('risk_flags', []))}
  score: {deal_state.get('score')}

WHAT SHOULD YOU DO? Read the email + state. Decide which tools to call.
Return your reasoning and the list of tool calls.
"""
    result = agent.invoke({"messages": [SystemMessage(content=system_prompt), ("user", user_message)]})
    # Debug: log the last AI message
    import os as _os
    if _os.environ.get("DEBUG_ORCHESTRATOR"):
        for msg in result.get("messages", []):
            _content = msg.content if hasattr(msg, "content") else ""
            _role = type(msg).__name__
            if _role == "AIMessage":
                print(f"\n[DEBUG] AI message content type: {type(_content).__name__}")
                print(f"[DEBUG] AI message content: {str(_content)[:1500]}")
                if hasattr(msg, "tool_calls") and msg.tool_calls:
                    print(f"[DEBUG] Tool calls: {msg.tool_calls}")
    return result
