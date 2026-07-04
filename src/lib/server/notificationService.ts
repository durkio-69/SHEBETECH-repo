// ============================================================================
// Notification Service — the ONE place that talks to SMS/WhatsApp/Email
// providers. Every other part of the backend just calls `dispatch(...)`
// and gets a truthful sent/failed result — nothing is faked here.
// ============================================================================
import nodemailer from "nodemailer";
import type pg from "pg";

export type Channel = "sms" | "whatsapp" | "email";

export interface DispatchInput {
  channel: Channel;
  to: string;            // phone (E.164 for sms/whatsapp) or email address
  message: string;
  subject?: string;      // email only
  eventType?: string;    // e.g. "order_placed" — for audit logging
  meta?: Record<string, unknown>;
}

export interface DispatchResult {
  channel: Channel;
  to: string;
  status: "sent" | "failed" | "not_configured";
  providerResponse?: unknown;
  error?: string;
}

// ---------------------------------------------------------------------------
// SMS + OTP via Africa's Talking (https://africastalking.com) — chosen for
// strong Uganda/East-Africa coverage. Swap the fetch call for Twilio easily
// if you expand outside the region.
// ---------------------------------------------------------------------------
async function sendSms(to: string, message: string): Promise<DispatchResult> {
  const username = process.env.AFRICASTALKING_USERNAME;
  const apiKey = process.env.AFRICASTALKING_API_KEY;
  const senderId = process.env.AFRICASTALKING_SENDER_ID || "";
  if (!username || !apiKey) {
    console.warn("⚠️ SMS not sent: AFRICASTALKING_USERNAME/API_KEY missing in .env");
    return { channel: "sms", to, status: "not_configured", error: "SMS provider not configured" };
  }
  try {
    const body = new URLSearchParams({ username, to, message, ...(senderId ? { from: senderId } : {}) });
    const resp = await fetch("https://api.africastalking.com/version1/messaging", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        apiKey,
      },
      body,
    });
    const data = await resp.json();
    const ok = resp.ok && data?.SMSMessageData?.Recipients?.[0]?.status === "Success";
    return { channel: "sms", to, status: ok ? "sent" : "failed", providerResponse: data };
  } catch (err: any) {
    console.error("SMS dispatch error:", err);
    return { channel: "sms", to, status: "failed", error: err.message };
  }
}

// ---------------------------------------------------------------------------
// WhatsApp via Meta's official WhatsApp Cloud API (not a wa.me click-through)
// ---------------------------------------------------------------------------
async function sendWhatsApp(to: string, message: string): Promise<DispatchResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) {
    console.warn("⚠️ WhatsApp not sent: WHATSAPP_PHONE_NUMBER_ID/ACCESS_TOKEN missing in .env");
    return { channel: "whatsapp", to, status: "not_configured", error: "WhatsApp provider not configured" };
  }
  try {
    const resp = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      }),
    });
    const data = await resp.json();
    return { channel: "whatsapp", to, status: resp.ok ? "sent" : "failed", providerResponse: data };
  } catch (err: any) {
    console.error("WhatsApp dispatch error:", err);
    return { channel: "whatsapp", to, status: "failed", error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Email via SMTP (works with SendGrid, Resend, SES, Gmail app-passwords, etc)
// ---------------------------------------------------------------------------
let transporter: nodemailer.Transporter | null = null;
function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT || 587) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

async function sendEmail(to: string, subject: string, message: string): Promise<DispatchResult> {
  const tx = getTransporter();
  if (!tx) {
    console.warn("⚠️ Email not sent: SMTP_HOST/SMTP_USER/SMTP_PASS missing in .env");
    return { channel: "email", to, status: "not_configured", error: "Email provider not configured" };
  }
  try {
    const info = await tx.sendMail({
      from: process.env.SMTP_FROM || "Olimart <no-reply@olimart.co.ug>",
      to,
      subject: subject || "Olimart Notification",
      text: message,
    });
    return { channel: "email", to, status: "sent", providerResponse: { messageId: info.messageId } };
  } catch (err: any) {
    console.error("Email dispatch error:", err);
    return { channel: "email", to, status: "failed", error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Public API — single entrypoint used by order/commission/rbac flows.
// Always persists a truthful audit row to olimart_notifications, whether
// the underlying provider is configured or not.
// ---------------------------------------------------------------------------
export async function dispatch(pool: pg.Pool | null, input: DispatchInput): Promise<DispatchResult> {
  let result: DispatchResult;
  switch (input.channel) {
    case "sms":
      result = await sendSms(input.to, input.message);
      break;
    case "whatsapp":
      result = await sendWhatsApp(input.to, input.message);
      break;
    case "email":
      result = await sendEmail(input.to, input.subject || "", input.message);
      break;
  }

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO olimart_notifications (id, data, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)`,
        [
          `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          JSON.stringify({
            timestamp: new Date().toISOString(),
            eventType: input.eventType || "manual",
            channel: input.channel,
            recipientContact: input.to,
            message: input.message,
            status: result.status, // truthful: sent | failed | not_configured
            error: result.error,
          }),
        ]
      );
    } catch (err) {
      console.error("Failed to persist notification audit row:", err);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// OTP helpers — real, server-verified one-time codes (used for phone
// verification at signup, rider delivery confirmation, and payout approval)
// ---------------------------------------------------------------------------
import crypto from "crypto";

export function generateOtp(): string {
  return String(crypto.randomInt(100000, 999999));
}

export function hashOtp(code: string, salt: string): string {
  return crypto.createHmac("sha256", salt).update(code).digest("hex");
}

export const OTP_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS olimart_otp_codes (
    id VARCHAR(100) PRIMARY KEY,
    purpose VARCHAR(50) NOT NULL,      -- 'phone_verify' | 'delivery_confirm' | 'payout_confirm'
    target VARCHAR(255) NOT NULL,      -- phone number
    reference_id VARCHAR(100),         -- order id / payout id / user id, if applicable
    code_hash VARCHAR(255) NOT NULL,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    expires_at TIMESTAMP NOT NULL,
    consumed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;
