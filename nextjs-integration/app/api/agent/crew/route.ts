import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { message, buyerId } = await req.json();

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const crewServiceUrl = process.env.CREW_SERVICE_URL;
  const serviceToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (!crewServiceUrl || !serviceToken) {
    return NextResponse.json(
      { error: "Crew service is not configured" },
      { status: 500 }
    );
  }

  try {
    const crewRes = await fetch(`${crewServiceUrl}/crew/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceToken}`,
      },
      body: JSON.stringify({ message, buyer_id: buyerId }),
      // CrewAI runs can take a while — avoid platform default timeouts cutting it short
      signal: AbortSignal.timeout(60_000),
    });

    if (!crewRes.ok) {
      const errText = await crewRes.text();
      return NextResponse.json(
        { error: "Crew service failed", detail: errText },
        { status: 502 }
      );
    }

    const data = await crewRes.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Crew service request failed:", err);
    return NextResponse.json(
      { error: "Could not reach crew service" },
      { status: 502 }
    );
  }
}
