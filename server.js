const express = require("express");
const crypto = require("node:crypto");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");

const required = ["BOT_TOKEN", "BOT_USERNAME", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "WEBAPP_URL", "ADMIN_IDS"];
for (const key of required) {
  if (!process.env[key]) {
    console.error("Missing required environment variable:", key);
    process.exit(1);
  }
}

const app = express();
app.use(express.json({ limit: "1mb" }));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});
const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_USERNAME = process.env.BOT_USERNAME.replace(/^@/, "");
const BOT_API = "https://api.telegram.org/bot" + BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL.replace(/\/$/, "");
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || crypto.randomBytes(32).toString("hex");
const ADMIN_IDS = new Set(process.env.ADMIN_IDS.split(",").map(x => x.trim()).filter(Boolean));
const DEFAULT_CHANNEL = process.env.DEFAULT_CHANNEL || "";

async function telegram(method, body = {}) {
  const response = await fetch(BOT_API + "/" + method, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.description || "Telegram API error");
  return data.result;
}

function verifyInitData(initData) {
  if (!initData || typeof initData !== "string") throw new Error("Открой Mini App через Telegram-бота.");
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) throw new Error("Некорректные данные Telegram.");
  params.delete("hash");
  const authDate = Number(params.get("auth_date"));
  const now = Math.floor(Date.now() / 1000);
  if (!authDate || now - authDate > 86400 || authDate > now + 60) throw new Error("Сессия Telegram устарела. Закрой и снова открой Mini App.");
  const dataCheckString = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => k + "=" + v).join("\n");
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const calculated = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  const a = Buffer.from(calculated, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new Error("Не удалось проверить Telegram-авторизацию.");
  const rawUser = params.get("user");
  if (!rawUser) throw new Error("Telegram не передал профиль пользователя.");
  const user = JSON.parse(rawUser);
  if (!user.id) throw new Error("Не найден Telegram ID.");
  user.start_param = params.get("start_param") || "";
  return user;
}

async function registerUser(tgUser, refParam = "") {
  const id = String(tgUser.id);
  const { data: existing, error: findError } = await supabase.from("users").select("id").eq("id", id).maybeSingle();
  if (findError) throw findError;
  let inviter = null;
  if (!existing && /^\d+$/.test(String(refParam)) && String(refParam) !== id) {
    const { data: inviterRow, error } = await supabase.from("users").select("id").eq("id", String(refParam)).maybeSingle();
    if (error) throw error;
    if (inviterRow) inviter = String(refParam);
  }
  const { error: upsertError } = await supabase.from("users").upsert({
    id,
    username: tgUser.username || null,
    first_name: tgUser.first_name || "Участник",
    last_name: tgUser.last_name || null,
    ...(existing ? {} : { referred_by: inviter })
  }, { onConflict: "id" });
  if (upsertError) throw upsertError;

  if (!existing && inviter) {
    const { error } = await supabase.from("referrals").insert({ inviter_id: inviter, referred_id: id });
    if (error && error.code !== "23505") throw error;
  }
  return {
    id,
    username: tgUser.username || null,
    first_name: tgUser.first_name || "Участник",
    last_name: tgUser.last_name || null,
    is_admin: ADMIN_IDS.has(id)
  };
}

async function leaderboard(period = "all") {
  if (period === "all") {
    const { data, error } = await supabase.from("referral_totals")
      .select("user_id, first_name, username, referrals_count")
      .order("referrals_count", { ascending: false }).limit(100);
    if (error) throw error;
    return (data || []).map((x, i) => ({ ...x, rank: i + 1 }));
  }
  const since = new Date(Date.now() - (period === "week" ? 7 : 30) * 86400000).toISOString();
  const { data: referrals, error: rError } = await supabase.from("referrals")
    .select("inviter_id").gte("created_at", since).limit(10000);
  if (rError) throw rError;
  const counts = new Map();
  for (const row of referrals || []) counts.set(row.inviter_id, (counts.get(row.inviter_id) || 0) + 1);
  const ids = [...counts.keys()];
  if (!ids.length) return [];
  const { data: users, error: uError } = await supabase.from("users")
    .select("id, first_name, username").in("id", ids);
  if (uError) throw uError;
  return (users || []).map(u => ({
    user_id: u.id, first_name: u.first_name, username: u.username,
    referrals_count: counts.get(u.id) || 0
  })).sort((a, b) => b.referrals_count - a.referrals_count)
    .slice(0, 100).map((x, i) => ({ ...x, rank: i + 1 }));
}

async function getProfile(id) {
  const { data: user, error } = await supabase.from("users")
    .select("id, username, first_name, last_name, created_at").eq("id", id).single();
  if (error) throw error;
  const { count, error: countError } = await supabase.from("referrals")
    .select("*", { count: "exact", head: true }).eq("inviter_id", id);
  if (countError) throw countError;
  const board = await leaderboard("all");
  const rank = board.find(x => x.user_id === id)?.rank || null;
  return {
    ...user,
    referrals_count: count || 0,
    rank,
    referral_link: "https://t.me/" + BOT_USERNAME + "?start=ref_" + id
  };
}

async function closeGiveaway(id) {
  const { data: draw, error } = await supabase.from("giveaways").select("*").eq("id", id).single();
  if (error) throw error;
  if (draw.status !== "active") return draw;

  const { data: top, error: topError } = await supabase.from("referral_totals")
    .select("user_id, first_name, username, referrals_count")
    .order("referrals_count", { ascending: false }).order("user_id", { ascending: true }).limit(1);
  if (topError) throw topError;
  const winner = top && top.length && top[0].referrals_count > 0 ? top[0] : null;

  const { data: updated, error: updateError } = await supabase.from("giveaways").update({
    status: "finished",
    winner_id: winner ? winner.user_id : null,
    winner_name: winner ? [winner.first_name, winner.username ? "(@" + winner.username + ")" : ""].filter(Boolean).join(" ") : null,
    finished_at: new Date().toISOString()
  }).eq("id", id).eq("status", "active").select().single();
  if (updateError) throw updateError;

  if (draw.channel) {
    const message = winner
      ? "🏆 Розыгрыш завершён!\n" + draw.title + "\nПобедитель: " + (updated.winner_name || winner.user_id) + "\nПриз: " + draw.prize + " ⭐"
      : "Розыгрыш завершён: " + draw.title + ". Подтверждённых приглашений пока нет.";
    try { await telegram("sendMessage", { chat_id: draw.channel, text: message }); }
    catch (e) { console.error("Could not post result to channel:", e.message); }
  }
  return updated;
}

async function publishGiveaway(draw) {
  if (!draw.channel) return;
  const text = "🎁 " + draw.title + "\n\nПриз: " + draw.prize + " ⭐\nОкончание: " +
    new Date(draw.ends_at).toLocaleString("ru-RU") +
    "\n\nПриглашай друзей через персональную ссылку в KHAMOI.";
  const result = await telegram("sendMessage", {
    chat_id: draw.channel,
    text,
    reply_markup: { inline_keyboard: [[{ text: "Открыть KHAMOI", web_app: { url: WEBAPP_URL } }]] }
  });
  const { error } = await supabase.from("giveaways")
    .update({ telegram_message_id: result.message_id }).eq("id", draw.id);
  if (error) throw error;
}

async function checkScheduledGiveaways() {
  const { data, error } = await supabase.from("giveaways").select("id")
    .eq("status", "active").lte("ends_at", new Date().toISOString()).limit(30);
  if (error) { console.error("Timer query failed:", error.message); return; }
  for (const draw of data || []) {
    try { await closeGiveaway(draw.id); }
    catch (e) { console.error("Auto-close failed:", draw.id, e.message); }
  }
}

app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/health", (_req, res) => res.json({ ok: true, service: "KHAMOI" }));

app.post("/api/auth", async (req, res) => {
  try {
    const tgUser = verifyInitData(req.body?.initData);
    const startParam = tgUser.start_param || "";
    const ref = String(startParam).startsWith("ref_") ? String(startParam).slice(4) : "";
    const user = await registerUser(tgUser, ref);
    const profile = await getProfile(user.id);
    res.json({ user, profile });
  } catch (e) { res.status(401).json({ error: e.message || "Ошибка авторизации" }); }
});

app.get("/api/leaderboard", async (req, res) => {
  try {
    const period = ["all", "week", "month"].includes(req.query.period) ? req.query.period : "all";
    res.json({ rows: await leaderboard(period) });
  } catch (e) {
    console.error("Leaderboard error:", e.message);
    res.status(500).json({ error: "Не удалось загрузить рейтинг" });
  }
});

app.get("/api/giveaways", async (_req, res) => {
  const { data, error } = await supabase.from("giveaways")
    .select("id,title,prize,ends_at,status,winner_name,created_at,finished_at")
    .order("created_at", { ascending: false }).limit(50);
  if (error) return res.status(500).json({ error: "Не удалось загрузить розыгрыши" });
  res.json({ rows: data || [] });
});

app.post("/api/admin/giveaways", async (req, res) => {
  try {
    const user = verifyInitData(req.headers.authorization?.replace(/^Bearer\s+/i, ""));
    if (!ADMIN_IDS.has(String(user.id))) return res.status(403).json({ error: "Нет доступа" });
    const { title, prize, ends_at, channel } = req.body || {};
    const end = new Date(ends_at);
    if (!title || String(title).trim().length > 100 || !Number.isInteger(Number(prize)) ||
        Number(prize) < 1 || !Number.isFinite(end.getTime()) || end <= new Date()) {
      return res.status(400).json({ error: "Проверь название, приз и дату окончания" });
    }
    const targetChannel = String(channel || DEFAULT_CHANNEL).trim();
    const { data, error } = await supabase.from("giveaways").insert({
      title: String(title).trim(), prize: Number(prize), ends_at: end.toISOString(),
      channel: targetChannel || null, created_by: String(user.id), status: "active"
    }).select().single();
    if (error) throw error;
    let warning = null;
    if (targetChannel) {
      try { await publishGiveaway(data); }
      catch (e) { warning = "Розыгрыш сохранён, но публикация не удалась: " + e.message; }
    }
    res.json({ giveaway: data, warning });
  } catch (e) {
    console.error("Create giveaway error:", e.message);
    res.status(500).json({ error: e.message || "Не удалось создать розыгрыш" });
  }
});

app.post("/api/admin/giveaways/:id/close", async (req, res) => {
  try {
    const user = verifyInitData(req.headers.authorization?.replace(/^Bearer\s+/i, ""));
    if (!ADMIN_IDS.has(String(user.id))) return res.status(403).json({ error: "Нет доступа" });
    const result = await closeGiveaway(req.params.id);
    res.json({ giveaway: result });
  } catch (e) {
    console.error("Close giveaway error:", e.message);
    res.status(500).json({ error: e.message || "Не удалось завершить розыгрыш" });
  }
});

app.post("/telegram/webhook", async (req, res) => {
  if (req.get("x-telegram-bot-api-secret-token") !== WEBHOOK_SECRET) return res.sendStatus(403);
  res.sendStatus(200);
  try {
    const message = req.body?.message;
    if (!message?.from || typeof message.text !== "string" || !message.text.startsWith("/start")) return;
    const payload = message.text.split(/\s+/)[1] || "";
    const ref = payload.startsWith("ref_") ? payload.slice(4) : "";
    const user = await registerUser(message.from, ref);
    const keyboard = { inline_keyboard: [[{ text: "Открыть KHAMOI", web_app: { url: WEBAPP_URL } }]] };
    const greeting = "Привет, " + user.first_name + "! 👋\n\nДобро пожаловать в KHAMOI. Здесь ты можешь следить за рейтингом приглашений и участвовать в розыгрышах.";
    await telegram("sendMessage", { chat_id: message.chat.id, text: greeting, reply_markup: keyboard });
  } catch (e) { console.error("Telegram update error:", e.message); }
});

async function configureWebhook() {
  const url = process.env.RENDER_EXTERNAL_URL;
  if (!url) { console.warn("RENDER_EXTERNAL_URL is not set; configure webhook manually."); return; }
  try {
    await telegram("setWebhook", {
      url: url.replace(/\/$/, "") + "/telegram/webhook",
      secret_token: WEBHOOK_SECRET,
      allowed_updates: ["message"]
    });
    console.log("Telegram webhook configured.");
  } catch (e) { console.error("Webhook setup failed:", e.message); }
}

const port = Number(process.env.PORT || 3000);
app.listen(port, async () => {
  console.log("KHAMOI server listening on", port);
  await configureWebhook();
  await checkScheduledGiveaways();
  setInterval(checkScheduledGiveaways, 30000);
});
