import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request) {
  const { subscription } = await request.json();
  if (!subscription) return Response.json({ error: "missing subscription" }, { status: 400 });

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

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({ user_id: user.id, subscription }, { onConflict: "user_id" });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
