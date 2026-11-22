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
2. Set the bot username without @.
3. Add the bot as an administrator to your Telegram channel and grant permission to post messages.
4. Find your numeric Telegram user ID and use it as `ADMIN_IDS`. Multiple admins can be comma-separated.

## 3. Render

1. Push this repository to GitHub.
2. In Render choose **New -> Blueprint** and select this repository, or create a Node Web Service.
3. Build command: `npm install`.
4. Start command: `npm start`.
5. Add the environment variables listed below.
6. Deploy. The server automatically registers the Telegram webhook using `RENDER_EXTERNAL_URL`.

Required Render variables:
- `BOT_TOKEN`
- `BOT_USERNAME`
- `WEBAPP_URL` — the public HTTPS URL of this Render service
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_IDS` — numeric Telegram ID(s), comma-separated
- `DEFAULT_CHANNEL` — optional, e.g. `@my_channel`
- `WEBHOOK_SECRET` — optional; Render blueprint generates one

After deployment, open `https://YOUR-SERVICE.onrender.com/health`; it should return `{"ok":true,"service":"KHAMOI"}`.

## 4. Enable Mini App

In @BotFather configure the bot's Mini App / Web App URL to the same Render HTTPS URL. The bot also sends an Open KHAMOI Web App button after /start.

## Important behaviour

- Users are registered from the Telegram `/start` deep link and validated Mini App init data.
- A referral is counted once, only when a new Telegram user starts with a valid existing inviter's link. Self-referrals are rejected.
- The leaderboard counts confirmed referrals.
- The admin panel is available only to Telegram IDs listed in `ADMIN_IDS`.
- Giveaways are stored in Supabase and published to the configured channel if the bot has posting permission.
- The timer checks active giveaways every 30 seconds. On close, the current top referrer is selected as winner and the result is posted to the channel.

## Limitations to understand

The current winner rule is **the participant with the most confirmed referrals**, as agreed for this project; it is not a random draw. If multiple users tie, the user with the lexicographically smaller Telegram ID wins, so the result is deterministic. For a fair random draw or additional anti-fraud checks, implement and publish those rules before launching a prize campaign.

Render free services may sleep when idle; scheduled checks run only while the service is running. Use an always-on paid instance for reliable deadline execution. Back up your Supabase database and never share bot or service-role credentials.
