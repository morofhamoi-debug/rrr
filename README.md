# KHAMOI

Telegram giveaway bot + Telegram Mini App + Express backend + Supabase.

## 1. Supabase

1. Create a Supabase project.
2. Open **SQL Editor**.
3. Run all SQL from `supabase/schema.sql`.
4. Copy Project URL and the **service_role** key from Project Settings -> API.

The service-role key is a secret. Add it only to Render environment variables. Never put it in `index.html`.

## 2. Telegram bot

1. Create a bot with @BotFather and copy its token.
2. No bot username variable is needed: the server reads it automatically from Telegram.
3. Add the bot as an administrator to the main channel `@khamoi` and grant **Invite Users** and **Post Messages** permissions. Add it as an administrator to every other channel where giveaways should be published. The bot records channels when Telegram reports an admin-status change; for channels where it was already an administrator before deployment, remove and re-add it (or toggle its admin status) once.
4. Find your numeric Telegram user ID and use it as `ADMIN_IDS`. Multiple admins can be comma-separated.

## 3. Render

1. Push this repository to GitHub.
2. In Render choose **New -> Blueprint** and select this repository, or create a Node Web Service.
3. Build command: `npm install`.
4. Start command: `npm start`.
5. Add the environment variables listed below.
6. Deploy. The server automatically registers the Telegram webhook using `RENDER_EXTERNAL_URL`.

Enter only these four variables manually in Render:
- `BOT_TOKEN` — token from @BotFather
- `SUPABASE_URL` — Supabase Project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service_role / secret key
- `ADMIN_IDS` — your numeric Telegram ID; multiple IDs can be comma-separated

Render supplies `RENDER_EXTERNAL_URL` automatically. The server gets the bot username directly from Telegram. The Blueprint generates `WEBHOOK_SECRET` automatically; you do not need to enter it. The main referral channel defaults to `@khamoi`. Set `MAIN_CHANNEL` in Render only if you later change it.

After deployment, open `https://YOUR-SERVICE.onrender.com/health`; it should return `{"ok":true,"service":"KHAMOI"}`.

## 4. Enable Mini App

In @BotFather configure the bot's Mini App / Web App URL to the same Render HTTPS URL. The bot also sends an Open KHAMOI Web App button after /start.

## Important behaviour

- Users are registered from `/start` or when they join a tracked channel.
- Each user receives a personal Telegram channel invite link for `@khamoi`.
- A referral is counted once only after Telegram confirms that a new user joined through that exact invite link. Opening the link or starting the bot alone does not count. Self-referrals are rejected.
- The bot tracks channels where it is an administrator and publishes new giveaways and results to all tracked active channels.
- The leaderboard counts confirmed referrals.
- The admin panel is available only to Telegram IDs listed in `ADMIN_IDS`.
- Giveaways are stored in Supabase and published to the configured channel if the bot has posting permission.
- The timer checks active giveaways every 30 seconds. On close, the current top referrer is selected as winner and the result is posted to the channel.

## Limitations to understand

The current winner rule is **the participant with the most confirmed channel referrals**; it is not a random draw. If multiple users tie, the user with the lexicographically smaller Telegram ID wins, so the result is deterministic. For a fair random draw or additional anti-fraud checks, implement and publish those rules before launching a prize campaign.

Render free services may sleep when idle; scheduled checks run only while the service is running. Use an always-on paid instance for reliable deadline execution. Back up your Supabase database and never share bot or service-role credentials.
