from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

from crew import build_crew
from config import INTERNAL_SERVICE_TOKEN, PORT

app = FastAPI(title="ShopEZ Crew Service")


class ChatRequest(BaseModel):
    message: str
    buyer_id: str | None = None


class ChatResponse(BaseModel):
    result: str


def check_auth(authorization: str | None):
    expected = f"Bearer {INTERNAL_SERVICE_TOKEN}"
    if authorization != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/crew/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, authorization: str | None = Header(None)):
    check_auth(authorization)

    query = req.message
    if req.buyer_id:
        query = f"[buyer_id: {req.buyer_id}] {query}"

    crew = build_crew(query)
    result = crew.kickoff()
    return ChatResponse(result=str(result))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
