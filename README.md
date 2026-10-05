# Shop Post Creator

Build a web app called "Shop to Post" for small local businesses (salons, gyms, cafes, clothing shops). Single page, no login.

Inputs: upload a product photo, one line about the offer (e.g. "new summer kurtis, 20% off"), business name, and a business type dropdown.

On "Create post", use AI to generate:

1. A finished Instagram post image (1080x1350): the uploaded photo with the business name and offer text overlaid in a bold, styled design. Offer 3 style templates to switch between (Bold, Minimal, Festive).

2. Three caption options in different tones (Fun, Premium, Urgent), each with a call to action.

3. 10 relevant hashtags, including local ones.

4. A suggested best day and time to post, with a one-line reason.

Show a before/after view of the photo, copy buttons for each caption and the hashtags, and a "Download image" button. Add a "Try an example" button that loads a sample product so it works instantly. Show a loading animation while generating and a clear error message if the AI call fails.

Security: keep all API keys server-side, validate uploads (images only, max 5MB), and limit to 10 generations per visitor per hour.

Design: bright, modern, mobile-friendly, cards for each output, one accent color.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://shoptopost-ai.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/35d32908-1bc1-46ae-89c4-7e0ffcc9ec7c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
