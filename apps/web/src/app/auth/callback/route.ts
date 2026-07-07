import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

// Where Supabase redirects after Google OAuth hands back an auth code.
// Exchanges it for a session (sets the cookie), then sends the shopper on to
// onboarding — which itself skips forward if they're already a member here.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await getServerSupabase();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/onboarding`);
}
