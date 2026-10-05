# Shop to Post
AI-generated Instagram posts for small local shops, auto-published on schedule.

Local shop owners know they should post on Instagram but have no time, designer, or copywriter. Shop to Post turns one product photo and one line about the offer into a ready-to-publish post, and schedules it straight to Instagram.

**Live app:** https://shoptopost-ai.lovable.app
**Demo Instagram:** https://instagram.com/shoptopost.demo
(every post on that profile was created and published by this app)

## How it works
1. Upload a product photo, type the offer (e.g. "Festive kurti set, now ₹1,800"), pick the business type
2. AI generates a styled post image (3 templates), 3 captions in different tones, 10 hashtags, and a best time to post
3. Pick a caption, choose "Post now" or a date and time
4. The app sends the post to a Make webhook, which adds it to a Google Sheets queue
5. A second Make scenario picks up due posts, publishes them via the Instagram Graph API, and marks them as posted

## Tech
React · TypeScript · Tailwind · Supabase Edge Functions · Make · Google Sheets · Instagram Graph API · AI model for content
Built with Lovable (AI-assisted coding).

## Security
- API keys and the webhook URL are stored server-side as secrets, never in the frontend
- Scheduling is passcode-protected, so public visitors can generate posts but can't publish to the account
- Uploads are validated (images only, max 5MB)
- Rate limited to 10 generations per visitor per hour
- Images are served through signed links that expire after 30 days
