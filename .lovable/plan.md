

## Problem

The `/embed/:businessId` and `/widget/:businessId` URLs are being indexed by search engines because:

1. **`robots.txt` allows all crawlers** to index every page — no paths are disallowed
2. **No `noindex` meta tag** exists on the embed/widget pages
3. **No canonical URL** points crawlers away from these pages

When Google finds these URLs (via links, sitemaps, or crawling), it indexes them as standalone pages instead of recognizing them as embeddable widgets.

## Plan

### 1. Update `robots.txt` to block widget/embed paths

Disallow `/widget/` and `/embed/` paths for all crawlers so search engines stop crawling them.

### 2. Add `noindex` meta tag in `WidgetEmbed.tsx`

Add a `<meta name="robots" content="noindex, nofollow">` tag dynamically when the embed page loads, as a second layer of protection for pages already indexed.

### 3. Add `X-Frame-Options` consideration

Add a small notice in the embed page that when accessed directly (not in an iframe), shows a message like "This widget is meant to be embedded" or redirects to the main site — so direct visitors aren't confused.

### Technical Details

**Files to modify:**
- `public/robots.txt` — add `Disallow: /widget/` and `Disallow: /embed/`
- `src/pages/WidgetEmbed.tsx` — add dynamic `noindex` meta tag + detect if not in iframe and show redirect/message

**Note:** Already-indexed pages may take a few days/weeks to be removed from Google after these changes. You can also use Google Search Console to request removal of specific URLs for faster de-indexing.

