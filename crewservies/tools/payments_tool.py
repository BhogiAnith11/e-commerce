"""
Wraps shopez's existing /api/mcp/payments endpoints as CrewAI tools.
This tool only VERIFIES payment status — it never initiates charges.
Charging must always go through your existing Stripe/Razorpay checkout flow.
"""
import httpx
from crewai.tools import BaseTool
from pydantic import BaseModel, Field

from config import NEXT_API_BASE, INTERNAL_SERVICE_TOKEN

HEADERS = {"Authorization": f"Bearer {INTERNAL_SERVICE_TOKEN}"}


class VerifyPaymentInput(BaseModel):
    order_id: str = Field(..., description="The order ID whose payment status should be checked")


class VerifyPaymentTool(BaseTool):
    name: str = "verify_payment_status"
    description: str = (
        "Check whether payment for an order has succeeded, failed, or is pending. "
        "Read-only — never triggers a new charge."
    )
    args_schema: type[BaseModel] = VerifyPaymentInput

    def _run(self, order_id: str) -> str:
        try:
            resp = httpx.get(
                f"{NEXT_API_BASE}/api/mcp/payments/{order_id}/status",
                headers=HEADERS,
                timeout=15,
            )
            resp.raise_for_status()
            return resp.text
        except httpx.HTTPStatusError as e:
            return f"Payment status check failed ({e.response.status_code}): {e.response.text}"
        except httpx.RequestError as e:
            return f"Could not reach payments service: {e}"
