from crewai import Agent, LLM

from tools.catalog_tool import CatalogSearchTool, ProductLookupTool
from tools.orders_tool import TrackOrderTool, AddToCartTool
from tools.payments_tool import VerifyPaymentTool
from config import ANTHROPIC_API_KEY

# Shared LLM config — using Claude since the rest of shopez already runs on it.
llm = LLM(
    model="claude-sonnet-4-6",
    api_key=ANTHROPIC_API_KEY,
)

shopping_assistant = Agent(
    role="Shopping Assistant",
    goal="Help buyers discover products that match what they're looking for and add items to their cart",
    backstory=(
        "An expert personal shopper for the ShopEZ marketplace who knows how to "
        "narrow down vague requests into good product matches."
    ),
    tools=[CatalogSearchTool(), ProductLookupTool(), AddToCartTool()],
    llm=llm,
    verbose=True,
)

order_support_agent = Agent(
    role="Order Support Specialist",
    goal="Answer questions about order status, delivery tracking, and payment confirmation",
    backstory="Knows the ShopEZ order, delivery, and payment pipeline inside out.",
    tools=[TrackOrderTool(), VerifyPaymentTool()],
    llm=llm,
    verbose=True,
)

triage_manager = Agent(
    role="Support Triage Manager",
    goal="Understand what the buyer needs and delegate to the right specialist agent",
    backstory=(
        "A senior support lead who quickly routes buyer questions to whichever "
        "specialist can actually resolve them, and combines their answers into "
        "one clear reply."
    ),
    llm=llm,
    verbose=True,
    allow_delegation=True,
)
