import "server-only";
import type { MpesaConfig } from "@/lib/mpesa/config";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function timestamp(d = new Date()): string {
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

function b64(value: string): string {
  return Buffer.from(value).toString("base64");
}

// Normalize a Kenyan number to Daraja's 2547XXXXXXXX / 2541XXXXXXXX form.
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return "254" + digits.slice(1);
  if (digits.startsWith("7") || digits.startsWith("1")) return "254" + digits;
  return digits;
}

async function getToken(cfg: MpesaConfig): Promise<string> {
  const auth = b64(`${cfg.consumerKey}:${cfg.consumerSecret}`);
  const res = await fetch(
    `${cfg.base}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` }, cache: "no-store" },
  );
  if (!res.ok) throw new Error("mpesa_auth_failed");
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("mpesa_auth_failed");
  return json.access_token;
}

export interface StkPushResult {
  ok: boolean;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  message: string;
}

export async function stkPush(
  cfg: MpesaConfig,
  args: {
    amountKes: number;
    phone: string;
    accountRef: string;
    description: string;
    callbackUrl: string;
  },
): Promise<StkPushResult> {
  const token = await getToken(cfg);
  const ts = timestamp();
  const password = b64(`${cfg.shortcode}${cfg.passkey}${ts}`);

  const res = await fetch(`${cfg.base}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      BusinessShortCode: cfg.shortcode,
      Password: password,
      Timestamp: ts,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.max(1, Math.round(args.amountKes)),
      PartyA: args.phone,
      PartyB: cfg.shortcode,
      PhoneNumber: args.phone,
      CallBackURL: args.callbackUrl,
      AccountReference: args.accountRef.slice(0, 12),
      TransactionDesc: args.description.slice(0, 20),
    }),
  });

  const json = (await res.json()) as Record<string, unknown>;
  const code = String(json.ResponseCode ?? "");
  if (code === "0") {
    return {
      ok: true,
      checkoutRequestId: String(json.CheckoutRequestID ?? ""),
      merchantRequestId: String(json.MerchantRequestID ?? ""),
      message: "accepted",
    };
  }
  return {
    ok: false,
    message: String(json.errorMessage ?? json.ResponseDescription ?? "STK push failed"),
  };
}

export interface StkQueryResult {
  resultCode: string | null;
  paid: boolean;
}

// Reconciliation query — used when the STK callback never arrives.
export async function stkQuery(
  cfg: MpesaConfig,
  checkoutRequestId: string,
): Promise<StkQueryResult> {
  const token = await getToken(cfg);
  const ts = timestamp();
  const password = b64(`${cfg.shortcode}${cfg.passkey}${ts}`);

  const res = await fetch(`${cfg.base}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      BusinessShortCode: cfg.shortcode,
      Password: password,
      Timestamp: ts,
      CheckoutRequestID: checkoutRequestId,
    }),
  });

  const json = (await res.json()) as Record<string, unknown>;
  const resultCode = json.ResultCode != null ? String(json.ResultCode) : null;
  return { resultCode, paid: resultCode === "0" };
}
