export async function POST(req: Request) {
  try {
    const body = await req.json();

    const webhookUrl = process.env.N8N_PROTECT_BLOCK_WEBHOOK;
    if (!webhookUrl) {
      console.error("N8N_PROTECT_BLOCK_WEBHOOK is not set");
      return Response.json(
        { status: "error", message: "Webhook URL not configured" },
        { status: 500 }
      );
    }

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    let json: any = {};
    try {
      json = await res.json();
    } catch {
      // n8n might return empty body; treat 2xx as success
    }

    if (!res.ok) {
      console.error("n8n defend-block error:", json || res.statusText);
      return Response.json(
        { status: "error", message: "n8n call failed" },
        { status: 500 }
      );
    }

    // Normalise response
    if (!json || typeof json !== "object") {
      json = { status: "success", message: "Focus block protected." };
    }

    return Response.json(json);
  } catch (err) {
    console.error("Defend-block API error:", err);
    return Response.json(
      { status: "error", message: "Unexpected server error" },
      { status: 500 }
    );
  }
}
