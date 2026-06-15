import { createClient } from "@supabase/supabase-js";
import { sendPushNotification } from "@/lib/webpush";

// Vercel injects: Authorization: Bearer <CRON_SECRET> on every cron invocation.
function isAuthorized(request) {
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  // Service-role client bypasses RLS so we can read all users' timers.
  // This key is server-only and never sent to the browser.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: timers, error: fetchError } = await supabase
    .from("active_timers")
    .select("user_id")
    .lte("ends_at", Date.now());

  if (fetchError) {
    console.error("[push/cron] failed to fetch timers:", fetchError);
    return Response.json({ error: fetchError.message }, { status: 500 });
  }

  if (!timers?.length) {
    return Response.json({ sent: 0, errors: 0 });
  }

  let sent = 0;
  let errors = 0;

  for (const { user_id } of timers) {
    // Delete the active_timers row before attempting the push so a failing
    // push doesn't cause infinite retries on every subsequent cron tick.
    await supabase.from("active_timers").delete().eq("user_id", user_id);

    const { data: sub } = await supabase
      .from("push_subscriptions")
      .select("subscription")
      .eq("user_id", user_id)
      .single();

    if (!sub) continue; // user never enabled push — nothing to send

    try {
      await sendPushNotification(sub.subscription);
      sent++;
    } catch (err) {
      errors++;
      // 410 Gone / 404 = subscription revoked by the browser or OS.
      // Remove it so we don't keep trying. (Partial fix for bug 6B.)
      if (err.statusCode === 410 || err.statusCode === 404) {
        await supabase.from("push_subscriptions").delete().eq("user_id", user_id);
      }
      console.error(`[push/cron] push failed for user ${user_id}:`, err.statusCode ?? err.message);
    }
  }

  return Response.json({ sent, errors });
}
