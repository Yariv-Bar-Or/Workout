import webpush from "web-push";

const PUSH_PAYLOAD = JSON.stringify({
  title: "LiftLog ⏱️",
  body: "זמן המנוחה הסתיים — בוא נתחיל את הסט הבא!",
  icon: "/icons/icon-192x192.png",
  badge: "/icons/icon-72x72.png",
  tag: "rest-timer",
  renotify: true,
});

export async function sendPushNotification(subscription, userId, supabase) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  try {
    await webpush.sendNotification(subscription, PUSH_PAYLOAD);
    return { success: true, cleaned: false };
  } catch (err) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      if (userId && supabase) {
        await supabase.from("push_subscriptions").delete().eq("user_id", userId).then(null, console.error);
      }
      return { success: false, cleaned: true };
    }
    console.error("[webpush] sendNotification failed:", err.statusCode ?? err.message);
    return { success: false, cleaned: false };
  }
}
