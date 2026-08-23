from crewai import Task

from agents import triage_manager


def build_handle_query_task(user_query: str) -> Task:
    return Task(
        description=(
            f"A ShopEZ buyer sent this message:\n\n\"{user_query}\"\n\n"
            "Figure out what they need (product search, order tracking, payment status, "
            "or adding to cart), delegate to the right specialist agent, and reply with "
            "a single clear, friendly answer. If information is missing (like an order ID), "
            "ask for it instead of guessing."
        ),
        expected_output=(
            "A concise, buyer-facing answer. If products are involved, list name, "
            "price, and a one-line reason it matches. If an order is involved, state "
            "its current status plainly."
        ),
        agent=triage_manager,
    )
