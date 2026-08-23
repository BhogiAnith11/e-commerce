from crewai import Crew, Process

from agents import shopping_assistant, order_support_agent, triage_manager
from tasks import build_handle_query_task


def build_crew(user_query: str) -> Crew:
    task = build_handle_query_task(user_query)
    return Crew(
        agents=[shopping_assistant, order_support_agent],
        tasks=[task],
        manager_agent=triage_manager,
        process=Process.hierarchical,
        verbose=True,
    )
