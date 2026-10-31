import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/newsletter
 * Body: { "email": "..." }
 *
 * Subscribes the email to the Mailchimp audience list.
 * Env vars required:
 *   MAILCHIMP_API_KEY      – e.g. "abc123def456-us21"
 *   MAILCHIMP_AUDIENCE_ID  – the Audience / List ID from Mailchimp
 *
 * The server prefix (e.g. "us21") is extracted from the API key automatically.
 */
export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: "Please enter a valid email address." }, { status: 422 });
  }

  const apiKey = process.env.MAILCHIMP_API_KEY;
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;

  if (!apiKey || !audienceId) {
    console.error("[Newsletter] MAILCHIMP_API_KEY or MAILCHIMP_AUDIENCE_ID is not set.");
    return NextResponse.json({ message: "Newsletter service is not configured." }, { status: 500 });
  }

  // Mailchimp API keys end with "-usXX" — that suffix is the data-center/server prefix.
  const server = apiKey.split("-").pop();
  const url = `https://${server}.api.mailchimp.com/3.0/lists/${audienceId}/members`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `apikey ${apiKey}`,
      },
      body: JSON.stringify({
        email_address: email,
        status: "subscribed",
        tags: ["website-popup"],
      }),
    });

    const data = await res.json();

    if (res.ok) {
      return NextResponse.json({ message: "You're subscribed! Check your inbox for a welcome email." });
    }

    // Mailchimp returns "Member Exists" when the email is already subscribed.
    if (data.title === "Member Exists") {
      return NextResponse.json({ message: "You're already subscribed!" });
    }

    // Invalid email or compliance issue.
    if (res.status === 400) {
      const detail = (data.detail as string) ?? "Subscription failed.";
      // Mailchimp sometimes returns verbose compliance messages; keep it short.
      const short = detail.includes("compliance") ? "This email cannot be subscribed. Please use a different address." : detail;
      return NextResponse.json({ message: short }, { status: 422 });
    }

    console.error("[Newsletter] Mailchimp error:", res.status, data);
    return NextResponse.json({ message: "Something went wrong. Please try again." }, { status: 502 });
  } catch (error) {
    console.error("[Newsletter] Fetch error:", error);
    return NextResponse.json({ message: "Could not reach the newsletter service. Please try again." }, { status: 502 });
  }
}
