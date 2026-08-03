"""SafeDeck CrewAI assembly.

5 agents + 1 consolidator. Sequential process. Configurable model via
the CREW_MODEL env var.

Model selection:
    CREW_MODEL          - default model for all agents (risk, scoring, etc.)
    EXTRACTION_MODEL    - model for the extraction_specialist agent only

Why two models: the extraction agent must produce valid structured JSON
with 49+ fields from a 36 KB deck. Weak models (e.g. gemini-3.1-flash-lite-preview)
fail silently — they return empty objects. gemini-2.5-flash has the context
window and instruction-following to get this right. The other agents work
fine on the lighter model.

Production default (matches the safepitch-minimax Lambda):
    CREW_MODEL       = gemini/gemini-3.1-flash-lite-preview
    EXTRACTION_MODEL = gemini/gemini-2.5-flash
"""

from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai_tools import SerperDevTool

from safedeck.models import (
    DiscrepancyAnalysis,
    StartupRating,
    VerificationReport,
    FinalConsolidatedReport,
    create_dynamic_model,
)

import os

# Default model for most agents. Production uses gemini-3.1-flash-lite-preview.
DEFAULT_MODEL = os.environ.get("CREW_MODEL", "gemini/gemini-2.5-flash")

# Dedicated model for the extraction agent. This is the only agent that
# must produce structured JSON with 49+ fields from a long deck input —
# lighter models skip fields or return empty objects. See module docstring.
EXTRACTION_MODEL = os.environ.get(
    "EXTRACTION_MODEL",
    os.environ.get("CREW_MODEL", "gemini/gemini-2.5-flash"),
)


@CrewBase
class SafeDeckCrew:
    """SafeDeck Crew for automated Pitch Deck Intelligence."""

    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"

    def __init__(self, client_schema: dict | None = None, *args, **kwargs):
        self.client_schema = client_schema or {}

        # Combine all dynamic fields into one model for extraction task
        all_fields = []
        all_fields.extend(self.client_schema.get("kyc", []))
        all_fields.extend(self.client_schema.get("financial", []))
        all_fields.extend(self.client_schema.get("market", []))

        self.ExtractionModel = create_dynamic_model("DeckExtractionData", all_fields)

    @agent
    def extraction_specialist(self) -> Agent:
        return Agent(
            config=self.agents_config["extraction_specialist"],
            llm=EXTRACTION_MODEL,
            verbose=True,
        )

    @agent
    def osint_investigator(self) -> Agent:
        return Agent(
            config=self.agents_config["osint_investigator"],
            tools=[SerperDevTool()],
            llm=DEFAULT_MODEL,
            verbose=True,
        )

    @agent
    def risk_analyst(self) -> Agent:
        return Agent(
            config=self.agents_config["risk_analyst"],
            llm=DEFAULT_MODEL,
            verbose=True,
        )

    @agent
    def ic_scoring_agent(self) -> Agent:
        return Agent(
            config=self.agents_config["ic_scoring_agent"],
            llm=DEFAULT_MODEL,
            verbose=True,
        )

    @agent
    def claim_truth_scorer(self) -> Agent:
        return Agent(
            config=self.agents_config["claim_truth_scorer"],
            llm=DEFAULT_MODEL,
            verbose=True,
        )

    @task
    def pitch_deck_extraction_task(self) -> Task:
        return Task(
            config=self.tasks_config["pitch_deck_extraction_task"],
            output_json=self.ExtractionModel,
        )

    @task
    def internet_verification_task(self) -> Task:
        return Task(
            config=self.tasks_config["internet_verification_task"],
        )

    @task
    def discrepancy_analysis_task(self) -> Task:
        return Task(
            config=self.tasks_config["discrepancy_analysis_task"],
            output_json=DiscrepancyAnalysis,
        )

    @task
    def startup_rating_task(self) -> Task:
        return Task(
            config=self.tasks_config["startup_rating_task"],
            output_json=StartupRating,
        )

    @task
    def claim_truth_scoring_task(self) -> Task:
        return Task(
            config=self.tasks_config["claim_truth_scoring_task"],
            output_json=VerificationReport,
        )

    @task
    def final_consolidation_task(self) -> Task:
        return Task(
            config=self.tasks_config["final_consolidation_task"],
            output_json=FinalConsolidatedReport,
        )

    @crew
    def crew(self) -> Crew:
        """Creates the SafeDeck crew."""
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
            tracing=True,
        )
