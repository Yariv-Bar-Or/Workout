import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const PUSH_PAYLOAD = JSON.stringify({
  title: "LiftLog ⏱️",
  body: "זמן המנוחה הסתיים — בוא נתחיל את הסט הבא!",
  icon: "/icons/icon-192x192.png",
  badge: "/icons/icon-72x72.png",
  tag: "rest-timer",
  renotify: true,
});

export async function sendPushNotification(subscription) {
  await webpush.sendNotification(subscription, PUSH_PAYLOAD);
}
