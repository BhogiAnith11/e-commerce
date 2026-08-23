"""
Wraps shopez's existing /api/mcp/orders endpoints (cart + order tracking + order creation) as CrewAI tools.
"""
from typing import Optional, Dict, Any
import httpx
from crewai.tools import BaseTool
from pydantic import BaseModel, Field

from config import NEXT_API_BASE, INTERNAL_SERVICE_TOKEN

HEADERS = {
    "Authorization": f"Bearer {INTERNAL_SERVICE_TOKEN}",
    "Content-Type": "application/json",
}


class TrackOrderInput(BaseModel):
    order_id: str = Field(..., description="The MongoDB order ID to look up")


class TrackOrderTool(BaseTool):
    name: str = "track_order"
    description: str = "Get the live status and delivery tracking info for an order."
    args_schema: type[BaseModel] = TrackOrderInput

    def _run(self, order_id: str) -> str:
        try:
            resp = httpx.get(
                f"{NEXT_API_BASE}/api/mcp/orders/status/{order_id}",
                headers=HEADERS,
                timeout=15,
            )
            resp.raise_for_status()
            return resp.text
        except httpx.HTTPStatusError as e:
            return f"Order tracking failed ({e.response.status_code}): {e.response.text}"
        except httpx.RequestError as e:
            return f"Could not reach order service: {e}"


class AddToCartInput(BaseModel):
    product_id: str = Field(..., description="The product ID to add to cart")
    quantity: int = Field(1, description="Quantity to add, defaults to 1")


class AddToCartTool(BaseTool):
    name: str = "add_to_cart"
    description: str = "Add a product to the buyer's cart. Matches exact fields {product_id, qty}."
    args_schema: type[BaseModel] = AddToCartInput

    def _run(self, product_id: str, quantity: int = 1) -> str:
        try:
            # Matches exact fields expected by app/api/mcp/orders/cart/route.ts
            payload = {
                "product_id": product_id,
                "qty": quantity,
            }
            resp = httpx.post(
                f"{NEXT_API_BASE}/api/mcp/orders/cart",
                json=payload,
                headers=HEADERS,
                timeout=15,
            )
            resp.raise_for_status()
            return resp.text
        except httpx.HTTPStatusError as e:
            return f"Add to cart failed ({e.response.status_code}): {e.response.text}"
        except httpx.RequestError as e:
            return f"Could not reach cart service: {e}"


class GetCartSummaryInput(BaseModel):
    pass


class GetCartSummaryTool(BaseTool):
    name: str = "get_cart_summary"
    description: str = "Retrieves items, subtotal, and total count from current shopping cart."
    args_schema: type[BaseModel] = GetCartSummaryInput

    def _run(self) -> str:
        try:
            resp = httpx.get(
                f"{NEXT_API_BASE}/api/mcp/orders/cart",
                headers=HEADERS,
                timeout=15,
            )
            resp.raise_for_status()
            return resp.text
        except httpx.HTTPStatusError as e:
            return f"Get cart failed ({e.response.status_code}): {e.response.text}"
        except httpx.RequestError as e:
            return f"Could not reach cart service: {e}"


class CreateOrderInput(BaseModel):
    shipping_address: Dict[str, Any] = Field(
        ...,
        description="Shipping address object containing {address, city, postalCode, country}",
    )


class CreateOrderTool(BaseTool):
    name: str = "create_order"
    description: str = "Converts current shopping cart into a placed order. Matches exact fields {shipping_address}."
    args_schema: type[BaseModel] = CreateOrderInput

    def _run(self, shipping_address: Dict[str, Any]) -> str:
        try:
            # Matches exact fields expected by app/api/mcp/orders/create/route.ts
            payload = {
                "shipping_address": shipping_address,
            }
            resp = httpx.post(
                f"{NEXT_API_BASE}/api/mcp/orders/create",
                json=payload,
                headers=HEADERS,
                timeout=15,
            )
            resp.raise_for_status()
            return resp.text
        except httpx.HTTPStatusError as e:
            return f"Create order failed ({e.response.status_code}): {e.response.text}"
        except httpx.RequestError as e:
            return f"Could not reach order creation service: {e}"
