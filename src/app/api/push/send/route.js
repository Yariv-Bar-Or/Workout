import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function POST(request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("subscription")
    .eq("user_id", user.id)
    .single();

  if (error || !data) return Response.json({ skipped: true });

  const payload = JSON.stringify({
    title: "LiftLog ⏱️",
    body: "זמן המנוחה הסתיים — בוא נתחיל את הסט הבא!",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    tag: "rest-timer",
    renotify: true,
  });

  await webpush.sendNotification(data.subscription, payload);
  return Response.json({ success: true });
}
