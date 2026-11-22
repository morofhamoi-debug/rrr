const express = require("express");
const crypto = require("node:crypto");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");

const required = ["BOT_TOKEN", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "ADMIN_IDS"];
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
let BOT_USERNAME = "";
let BOT_ID = null;
const BOT_API = "https://api.telegram.org/bot" + BOT_TOKEN;
const WEBAPP_URL = (process.env.RENDER_EXTERNAL_URL || "").replace(/\/$/, "");
const MAIN_CHANNEL = process.env.MAIN_CHANNEL || "@khamoi";
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || crypto.randomBytes(32).toString("hex");
const ADMIN_IDS = new Set(process.env.ADMIN_IDS.split(",").map(x => x.trim()).filter(Boolean));

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
  return user;
}

async function registerUser(tgUser) {
  const id = String(tgUser.id);
  const { error } = await supabase.from("users").upsert({
    id,
    username: tgUser.username || null,
    first_name: tgUser.first_name || "Участник",
    last_name: tgUser.last_name || null
  }, { onConflict: "id" });
  if (error) throw error;
  return {
    id,
    username: tgUser.username || null,
    first_name: tgUser.first_name || "Участник",
    last_name: tgUser.last_name || null,
    is_admin: ADMIN_IDS.has(id)
  };
}

async function ensureReferralLink(userId) {
  const id = String(userId);
  const { data: user, error } = await supabase.from("users")
    .select("channel_invite_link").eq("id", id).single();
  if (error) throw error;
  if (user.channel_invite_link) return user.channel_invite_link;

  const invite = await telegram("createChatInviteLink", {
    chat_id: MAIN_CHANNEL,
    name: ("KHAMOI " + id).slice(0, 32)
  });
  const { error: updateError } = await supabase.from("users")
    .update({ channel_invite_link: invite.invite_link }).eq("id", id);
  if (updateError) throw updateError;
  return invite.invite_link;
}

async function leaderboard(period = "all") {
  if (period === "all") {
    const { data, error } = await supabase.from("referral_totals")
      .select("user_id, first_name, username, referrals_count")
      .gt("referrals_count", 0)
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
  })).filter(x => x.referrals_count > 0).sort((a, b) => b.referrals_count - a.referrals_count)
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
  let referralLink = null;
  try { referralLink = await ensureReferralLink(id); }
  catch (e) { console.error("Referral link creation failed:", e.message); }
  return { ...user, referrals_count: count || 0, rank, referral_link: referralLink };
}

function isActiveMember(member) {
  if (!member) return false;
  return ["member", "administrator", "creator"].includes(member.status) ||
    (member.status === "restricted" && member.is_member === true);
}

async function recordChannelJoin(update) {
  const joined = update.new_chat_member?.user;
  const inviteLink = update.invite_link?.invite_link;
  if (!joined || !inviteLink || !isActiveMember(update.new_chat_member)) return;
  if (isActiveMember(update.old_chat_member)) return;

  await registerUser(joined);
  const { data: inviter, error } = await supabase.from("users")
    .select("id").eq("channel_invite_link", inviteLink).maybeSingle();
  if (error) throw error;
  if (!inviter || String(inviter.id) === String(joined.id)) return;

  const { error: insertError } = await supabase.from("referrals").insert({
    inviter_id: String(inviter.id),
    referred_id: String(joined.id)
  });
  if (insertError && insertError.code !== "23505") throw insertError;
  if (!insertError) {
    await supabase.from("users").update({ referred_by: String(inviter.id) })
      .eq("id", String(joined.id)).is("referred_by", null);
    console.log("Confirmed referral:", inviter.id, "->", joined.id);
  }
}

async function saveBotChannel(chat, active) {
  if (!chat || chat.type !== "channel") return;
  const values = {
    chat_id: String(chat.id),
    title: chat.title || chat.username || "Telegram-канал",
    username: chat.username || null,
    is_active: active,
    updated_at: new Date().toISOString()
  };
  const { error } = await supabase.from("bot_channels").upsert(values, { onConflict: "chat_id" });
  if (error) throw error;
}

async function syncMainChannel() {
  try {
    const chat = await telegram("getChat", { chat_id: MAIN_CHANNEL });
    const member = await telegram("getChatMember", { chat_id: chat.id, user_id: BOT_ID });
    await saveBotChannel(chat, ["administrator", "creator"].includes(member.status));
    if (!["administrator", "creator"].includes(member.status)) {
      console.warn("Bot is not an administrator in", MAIN_CHANNEL);
    }
  } catch (e) {
    console.error("Main channel sync failed:", e.message);
  }
}

async function activeChannels() {
  const { data, error } = await supabase.from("bot_channels")
    .select("chat_id,title").eq("is_active", true);
  if (error) throw error;
  return data || [];
}

async function publishToAllChannels(text, keyboard = null) {
  const channels = await activeChannels();
  const sent = [];
  const failed = [];
  for (const channel of channels) {
    try {
      const result = await telegram("sendMessage", {
        chat_id: channel.chat_id,
        text,
        ...(keyboard ? { reply_markup: keyboard } : {})
      });
      sent.push({ chat_id: channel.chat_id, message_id: result.message_id });
    } catch (e) {
      failed.push({ chat_id: channel.chat_id, error: e.message });
      console.error("Channel publication failed:", channel.chat_id, e.message);
    }
  }
  return { sent, failed };
}

async function closeGiveaway(id) {
  const { data: draw, error } = await supabase.from("giveaways").select("*").eq("id", id).single();
  if (error) throw error;
  if (draw.status !== "active") return draw;

  const { data: top, error: topError } = await supabase.from("referral_totals")
    .select("user_id, first_name, username, referrals_count")
    .gt("referrals_count", 0)
    .order("referrals_count", { ascending: false }).order("user_id", { ascending: true }).limit(1);
  if (topError) throw topError;
  const winner = top && top.length ? top[0] : null;

  const { data: updated, error: updateError } = await supabase.from("giveaways").update({
    status: "finished",
    winner_id: winner ? winner.user_id : null,
    winner_name: winner ? [winner.first_name, winner.username ? "(@" + winner.username + ")" : ""].filter(Boolean).join(" ") : null,
    finished_at: new Date().toISOString()
  }).eq("id", id).eq("status", "active").select().single();
  if (updateError) throw updateError;

  const message = winner
    ? "🏆 Розыгрыш завершён!\n" + draw.title + "\nПобедитель: " + (updated.winner_name || winner.user_id) + "\nПриз: " + draw.prize + " ⭐"
    : "Розыгрыш завершён: " + draw.title + ". Подтверждённых приглашений пока нет.";
  await publishToAllChannels(message);
  return updated;
}

async function publishGiveaway(draw) {
  const text = "🎁 " + draw.title + "\n\nПриз: " + draw.prize + " ⭐\nОкончание: " +
    new Date(draw.ends_at).toLocaleString("ru-RU") +
    "\n\nПриглашай друзей в канал KHAMOI по своей персональной ссылке.";
  const keyboard = { inline_keyboard: [[{ text: "Открыть KHAMOI", web_app: { url: WEBAPP_URL } }]] };
  const result = await publishToAllChannels(text, keyboard);
  if (result.sent.length) {
    const { error } = await supabase.from("giveaways")
      .update({ telegram_message_id: result.sent[0].message_id }).eq("id", draw.id);
    if (error) throw error;
  }
  if (!result.sent.length) throw new Error("Бот пока не зарегистрировал ни одного канала, где у него есть права администратора.");
  if (result.failed.length) console.warn("Some channels did not receive the giveaway:", result.failed);
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
    const user = await registerUser(tgUser);
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
    const { title, prize, ends_at } = req.body || {};
    const end = new Date(ends_at);
    if (!title || String(title).trim().length > 100 || !Number.isInteger(Number(prize)) ||
        Number(prize) < 1 || !Number.isFinite(end.getTime()) || end <= new Date()) {
      return res.status(400).json({ error: "Проверь название, приз и дату окончания" });
    }
    const { data, error } = await supabase.from("giveaways").insert({
      title: String(title).trim(), prize: Number(prize), ends_at: end.toISOString(),
      created_by: String(user.id), status: "active"
    }).select().single();
    if (error) throw error;
    let warning = null;
    try { await publishGiveaway(data); }
    catch (e) { warning = "Розыгрыш сохранён, но публикация не удалась: " + e.message; }
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
    const update = req.body || {};
    if (update.my_chat_member) {
      const change = update.my_chat_member;
      const status = change.new_chat_member?.status;
      await saveBotChannel(change.chat, ["administrator", "creator"].includes(status));
      return;
    }
    if (update.chat_member) {
      await recordChannelJoin(update.chat_member);
      return;
    }
    const message = update.message;
    if (!message?.from || typeof message.text !== "string" || !message.text.startsWith("/start")) return;
    const user = await registerUser(message.from);
    let inviteLink = null;
    try { inviteLink = await ensureReferralLink(user.id); }
    catch (e) { console.error("Could not create channel referral link:", e.message); }
    const keyboard = { inline_keyboard: [[{ text: "Открыть KHAMOI", web_app: { url: WEBAPP_URL } }]] };
    let greeting = "Привет, " + user.first_name + "! 👋\n\nДобро пожаловать в KHAMOI.\n\n";
    greeting += inviteLink
      ? "Твоя персональная ссылка для приглашения друзей в канал:\n" + inviteLink + "\n\nОтправь её друзьям. Приглашение засчитается после их вступления в канал."
      : "Не удалось создать ссылку. Проверь, что бот является администратором канала @khamoi и имеет право приглашать пользователей.";
    await telegram("sendMessage", { chat_id: message.chat.id, text: greeting, reply_markup: keyboard });
  } catch (e) { console.error("Telegram update error:", e.message); }
});

async function configureWebhook() {
  const botInfo = await telegram("getMe");
  BOT_USERNAME = botInfo.username;
  BOT_ID = botInfo.id;
  const url = process.env.RENDER_EXTERNAL_URL;
  if (!url) { console.warn("RENDER_EXTERNAL_URL is not set; configure webhook manually."); return; }
  try {
    await telegram("setWebhook", {
      url: url.replace(/\/$/, "") + "/telegram/webhook",
      secret_token: WEBHOOK_SECRET,
      allowed_updates: ["message", "chat_member", "my_chat_member"]
    });
    console.log("Telegram webhook configured.");
    await syncMainChannel();
  } catch (e) { console.error("Webhook setup failed:", e.message); }
}

const port = Number(process.env.PORT || 3000);
app.listen(port, async () => {
  console.log("KHAMOI server listening on", port);
  await configureWebhook();
  await checkScheduledGiveaways();
  setInterval(checkScheduledGiveaways, 30000);
});
