
# Product Hunt Launch Kit for LYQN

Goal: ship everything needed to support a live Product Hunt launch — copy you can paste into PH, a dedicated `/launch` page on lyqn.app, social-share metadata that looks sharp when hunters share it, and a polished gallery image set.

## 1. Product Hunt copy (paste-ready)

Delivered as `PRODUCT_HUNT_LAUNCH.md` in `/mnt/documents/` so you can copy/paste into the PH submission form.

Includes:
- **Name**: LYQN
- **Tagline** (60 char max, 3 options to pick from), e.g. "AI support that learns your business — and hands off to humans"
- **Description** (260 char) — what it is, who it's for, why it's different
- **First comment from the maker** (the long-form pitch PH hunters expect): story, problem, what makes it different, 2-week free trial offer, ask for feedback
- **Topics** to tag: Artificial Intelligence, Customer Communication, SaaS, Chatbots, Sales
- **Reply templates** for the 5 most likely PH comment threads (pricing, vs Intercom, self-hosting, data privacy, WhatsApp)
- **Hunter outreach DM** + **launch-day tweet/LinkedIn thread**

## 2. `/launch` landing page

New route `src/pages/Launch.tsx` mounted at `/launch` in `src/App.tsx`. Dark theme, matches existing landing page design system (LYQN monochrome + glassmorphism accents).

Sections (single scroll):
1. **PH badge hero** — "We're live on Product Hunt 🎉" with the official Product Hunt embed badge (links to your PH page) + primary CTA "Upvote on Product Hunt" and secondary "Start 2-week free trial"
2. **The pitch** — one-line value prop + 3 bullet "why LYQN" cards (self-learning RAG, one-click human handoff, WhatsApp bridge)
3. **2-week free trial offer banner** — your launch-day incentive, links to `/auth` then Basic checkout
4. **Live demo** — embedded `LyqnWidgetEmbed` so visitors can chat with the bot on the page itself
5. **Feature gallery grid** — 6 tiles with the gallery images (see §4)
6. **Pricing recap** — Basic / Pro / Business cards (links to `/pricing`)
7. **Maker note + social proof slot** — quote, founder bio, link to PH discussion
8. **Footer CTA** — "Try LYQN free for 2 weeks"

The PH badge will use the official `<a href="https://www.producthunt.com/posts/lyqn">` + badge `<img>` markup; you'll paste your real PH post slug after submission.

## 3. SEO + OG polish (sitewide + /launch)

- `index.html` — verify `<title>`, `<meta name="description">`, `og:title`, `og:description`, `og:type=website`, `og:url=https://lyqn.app/`, `twitter:card=summary_large_image`. Replace any stale Lovable defaults.
- Add `og:image` pointing to a new 1200×630 launch social card (generated in §4) — this is what shows when your PH link gets shared on X/LinkedIn.
- Add `react-helmet-async` so `/launch` can override title/description/og to "LYQN is live on Product Hunt — 2 weeks free" (better social previews when hunters share the launch page specifically).
- Add `<link rel="canonical" href="https://lyqn.app/launch">` on the launch route via Helmet (and remove the sitewide canonical from `index.html` to avoid duplicates, per project SEO rules).
- Add `/launch` to `public/sitemap.xml`.

## 4. Gallery assets

Generated via `imagegen` (premium quality for anything with text) and stored under `src/assets/launch/` as `.asset.json` pointers:

1. **OG / social share card** — 1200×630, "LYQN — AI support that learns your business", dark monochrome, brand mark
2. **PH gallery image 1 (hero)** — 1270×760, product shot of widget + dashboard collage
3. **PH gallery image 2** — self-learning loop diagram
4. **PH gallery image 3** — human handoff / live agent queue screenshot-style
5. **PH gallery image 4** — WhatsApp bridge illustration
6. **PH gallery image 5** — pricing/2-week trial card
7. **PH thumbnail** — 240×240 square logo lockup

QA'd visually after generation (per artifact craft rules).

## Out of scope (call out, don't do)
- No new backend, no schema changes, no pricing changes — Basic plan already ships with a 2-week trial, so the "2 weeks free" offer needs zero backend work.
- Not generating a launch video — say the word if you want one and I'll add it.
- Not auto-submitting to Product Hunt — you'll paste the copy into the PH form yourself.

## Technical details

- Files added: `src/pages/Launch.tsx`, `src/assets/launch/*.asset.json`, `/mnt/documents/PRODUCT_HUNT_LAUNCH.md`
- Files edited: `src/App.tsx` (add `/launch` route), `src/main.tsx` (wrap in `HelmetProvider`), `index.html` (OG/Twitter polish, remove sitewide canonical), `public/sitemap.xml` (add `/launch`)
- New dep: `react-helmet-async`
- After build: I'll ask if you want to publish so the launch page is live before you hit "Submit" on PH.
