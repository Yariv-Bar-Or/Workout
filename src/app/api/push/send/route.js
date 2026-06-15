import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { sendPushNotification } from "@/lib/webpush";

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

  const result = await sendPushNotification(data.subscription, user.id, supabase);
  return Response.json(result);
}
