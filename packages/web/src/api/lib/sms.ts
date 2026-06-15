/**
 * T3 MedAgent — SMS Alert Service
 *
 * Sends health risk notifications via Africa's Talking SMS API (free tier, no credit card).
 * Fallback: SMSLeopard (same payload shape as Mazingira competitor).
 *
 * Set in .env:
 *   SMS_API_KEY=your_africas_talking_api_key
 *   SMS_API_USERNAME=your_at_username        (default: "sandbox")
 *   SMS_PROVIDER=africas_talking | smsleopard
 */

export interface SmsResult {
  success: boolean;
  provider: string;
  messageId?: string;
  error?: string;
}

// ─── Africa's Talking ─────────────────────────────────────────────────────────
async function sendAfricasTalking(
  to: string,
  message: string,
  apiKey: string,
  username: string
): Promise<SmsResult> {
  const url = "https://api.africastalking.com/version1/messaging";

  const body = new URLSearchParams({
    username,
    to,
    message,
    from: "T3MedAgent",
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    return {
      success: false,
      provider: "africas_talking",
      error: `HTTP ${res.status}: ${await res.text()}`,
    };
  }

  const data = (await res.json()) as {
    SMSMessageData?: { Recipients?: Array<{ messageId: string; status: string }> };
  };
  const recipient = data.SMSMessageData?.Recipients?.[0];

  return {
    success: recipient?.status === "Success",
    provider: "africas_talking",
    messageId: recipient?.messageId,
  };
}

// ─── SMSLeopard ───────────────────────────────────────────────────────────────
async function sendSmsLeopard(
  to: string,
  message: string,
  apiKey: string
): Promise<SmsResult> {
  const res = await fetch("https://api.smsleopard.com/v1/sms/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      source: "T3MedAgent",
      message,
      destinations: [{ number: to }],
    }),
  });

  if (!res.ok) {
    return {
      success: false,
      provider: "smsleopard",
      error: `HTTP ${res.status}: ${await res.text()}`,
    };
  }

  const data = (await res.json()) as { success?: boolean; parts?: Array<{ msgid?: string }> };
  return {
    success: Boolean(data.success),
    provider: "smsleopard",
    messageId: data.parts?.[0]?.msgid,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface SmsAlertPayload {
  phone: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  recommendation: string;
  analysisId: string;
}

/**
 * Sends a health alert SMS after contract execution.
 * Automatically picks provider based on SMS_PROVIDER env var.
 * Returns success/failure — never throws (best-effort notification).
 */
export async function sendHealthAlert(payload: SmsAlertPayload): Promise<SmsResult> {
  const apiKey = process.env.SMS_API_KEY ?? "";
  const provider = (process.env.SMS_PROVIDER ?? "africas_talking").toLowerCase();

  if (!apiKey) {
    return {
      success: false,
      provider,
      error: "SMS_API_KEY not configured — set in .env to enable alerts",
    };
  }

  const emoji: Record<string, string> = {
    low: "✅",
    medium: "⚠️",
    high: "🔴",
    critical: "🚨",
  };

  const message = [
    `${emoji[payload.riskLevel] ?? "📋"} T3 MedAgent Health Alert`,
    `Risk Level: ${payload.riskLevel.toUpperCase()}`,
    payload.recommendation,
    `Ref: ${payload.analysisId}`,
    "Powered by Terminal3 Network",
  ].join("\n");

  try {
    if (provider === "smsleopard") {
      return await sendSmsLeopard(payload.phone, message, apiKey);
    }
    // Default: Africa's Talking
    const username = process.env.SMS_API_USERNAME ?? "sandbox";
    return await sendAfricasTalking(payload.phone, message, apiKey, username);
  } catch (err) {
    return {
      success: false,
      provider,
      error: `SMS send failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
