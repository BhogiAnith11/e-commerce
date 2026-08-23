"""
Wraps shopez's existing /api/mcp/catalog endpoints as CrewAI tools.
No product logic lives here — it all stays in your Next.js MCP routes.
"""
import httpx
from crewai.tools import BaseTool
from pydantic import BaseModel, Field

from config import NEXT_API_BASE, INTERNAL_SERVICE_TOKEN

HEADERS = {"Authorization": f"Bearer {INTERNAL_SERVICE_TOKEN}"}


class CatalogSearchInput(BaseModel):
    query: str = Field(..., description="Free-text product search query, e.g. 'wireless headphones under 2000'")


class CatalogSearchTool(BaseTool):
    name: str = "search_catalog"
    description: str = (
        "Search the ShopEZ product catalog by keyword. Returns matching products "
        "with title, price, stock, and rating."
    )
    args_schema: type[BaseModel] = CatalogSearchInput

    def _run(self, query: str) -> str:
        try:
            resp = httpx.get(
                f"{NEXT_API_BASE}/api/mcp/catalog/search",
                params={"q": query},
                headers=HEADERS,
                timeout=15,
            )
            resp.raise_for_status()
            return resp.text
        except httpx.HTTPStatusError as e:
            return f"Catalog search failed ({e.response.status_code}): {e.response.text}"
        except httpx.RequestError as e:
            return f"Could not reach catalog service: {e}"


class ProductLookupInput(BaseModel):
    product_id: str = Field(..., description="The MongoDB ObjectId of the product")


class ProductLookupTool(BaseTool):
    name: str = "get_product_details"
    description: str = "Fetch full details for a single product by its ID."
    args_schema: type[BaseModel] = ProductLookupInput

    def _run(self, product_id: str) -> str:
        try:
            resp = httpx.get(
                f"{NEXT_API_BASE}/api/products/{product_id}",
                headers=HEADERS,
                timeout=15,
            )
            resp.raise_for_status()
            return resp.text
        except httpx.HTTPStatusError as e:
            return f"Product lookup failed ({e.response.status_code}): {e.response.text}"
        except httpx.RequestError as e:
            return f"Could not reach product service: {e}"
