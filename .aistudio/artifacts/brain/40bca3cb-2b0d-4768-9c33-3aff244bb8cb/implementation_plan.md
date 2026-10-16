# Implementation Plan: Google Search Console Optimization & Technical SEO

This plan details the end-to-end implementation for optimizing Love Link for Google Search Console (GSC), major search engine crawlers, and social discovery, while keeping all private couple spaces and user data strictly protected.

---

## 1. Google Search Console Verification System
Google Search Console requires ownership verification through one or more supported methods. We will implement multi-channel verification:

- **HTML Meta Tag Verification**:
  - Add `<meta name="google-site-verification" content="..." />` support in `index.html` with environment variable injection (`VITE_GOOGLE_SITE_VERIFICATION`) and dynamic document head injection.
  - Provide an interactive Google Search Console configuration card in the App Settings where the site owner can view, paste, and test their verification code without needing code deployments.
- **HTML File Verification Route (`/google<token>.html`)**:
  - Implement an Express route in `server.ts` matching `/google:code([0-9a-fA-F]+).html` that returns `google-site-verification: google:code.html` with `text/html; charset=utf-8`.
  - Also support static verification files placed into `/public`.
- **Domain Verification Helpers**:
  - Guidance on DNS TXT records and Search Console property configuration directly accessible in the settings view.

---

## 2. Crawler Access Control (`robots.txt`)
Search engines must be directed to index high-value public pages while strictly preventing crawler access to couple spaces, personal chat, private media, and backend API routes.

- **Dynamic & Static `robots.txt`**:
  - Serve both static `/public/robots.txt` and an Express route `/robots.txt` with proper `text/plain` headers.
  - Automatically resolve the host/domain from incoming request headers (`req.protocol` + `req.get('host')`) or `APP_URL` / `VITE_APP_URL`.
  - Reference the sitemap location dynamically: `Sitemap: https://<domain>/sitemap.xml`.
- **Rules Breakdown**:
  - **Allowed**:
    - `/` (Home landing & app introduction)
    - `/market` (Virtual Gifts & Loveverse catalog preview)
    - `/features` & `/about`
    - `/privacy` & `/terms`
    - `/favicon.ico`, `/icon.svg`, `/pwa-*.png`
  - **Disallowed (Protected Private Data)**:
    - `/space/*` (Couple spaces)
    - `/chat/*` (Private conversations)
    - `/timeline/*` (Couple memories)
    - `/settings/*` (Account management)
    - `/api/*` (Backend services & internal endpoints)

---

## 3. Dynamic XML Sitemap (`sitemap.xml`)
Google Search Console relies on sitemaps to discover and periodically index all public pages.

- **XML Sitemap Generator**:
  - Create both static `/public/sitemap.xml` and an Express route `/sitemap.xml` serving valid XML with `Content-Type: application/xml`.
  - Include all public landing and preview pages:
    - `/` (Priority: 1.0, Changefreq: daily)
    - `/market` (Priority: 0.9, Changefreq: daily)
    - `/features` (Priority: 0.8, Changefreq: weekly)
    - `/terms` (Priority: 0.5, Changefreq: monthly)
    - `/privacy` (Priority: 0.5, Changefreq: monthly)
  - Ensure canonical domain formatting with current timestamp (`<lastmod>`).

---

## 4. Schema.org Structured Data (JSON-LD)
Structured data enables rich snippets on Google Search, including software ratings, application categories, and feature lists.

- **WebApplication / SoftwareApplication JSON-LD**:
  - Embed valid schema in `<script type="application/ld+json">` in `index.html`.
  - Include:
    - `@type`: `WebApplication`
    - `name`: `Love Link`
    - `applicationCategory`: `LifestyleApplication`
    - `operatingSystem`: `All (Web, Android, iOS)`
    - `description`: "Private relationship app for couples to connect, share memories, track love streaks, send virtual gifts, and grow closer together."
    - `offers`: Free tier (`price: 0`, `priceCurrency: USD`).
    - `featureList`: Private Couple Spaces, Real-time Chat, Memory Timeline, Love Streaks, 3D Loveverse Gifts, Custom Themes.
- **Organization / Brand JSON-LD**:
  - Brand identity, logo URL (`/icon.svg` and `/pwa-512x512.png`), and official website URL.

---

## 5. Enhanced Meta Tags, Canonical URLs & Social Cards
- **HTML Document Header Updates (`index.html`)**:
  - Precise `<title>`: "Love Link – Private Relationship App for Couples" (optimized for search snippet length).
  - Search Meta: `description`, `keywords`, `robots` ("index, follow, max-image-preview:large").
  - Dynamic canonical URL link (`<link rel="canonical" href="..." />`) updated by client router on page changes.
  - OpenGraph tags: `og:title`, `og:description`, `og:type`, `og:url`, `og:image`, `og:site_name`, `og:locale`.
  - Twitter / X cards: `twitter:card` ("summary_large_image"), `twitter:title`, `twitter:description`, `twitter:image`.
  - Update `metadata.json` to keep app title and description in full alignment.

---

## 6. Mobile Usability & Core Web Vitals Alignment
Google Search Console heavily weighs mobile friendliness and Core Web Vitals (LCP, FID/INP, CLS):
- Prevent layout shifts with explicit image dimensions and responsive aspect ratio boxes.
- Verify viewport configuration (`viewport-fit=cover`, standard zoom, no horizontal scroll).
- Touch target sizes (> 44x44px) on all public links and navigation items.

---

## 7. Verification & Testing
- Run `compile_applet` to confirm zero compilation errors.
- Test `/robots.txt` endpoint to verify correct headers and disallow rules.
- Test `/sitemap.xml` endpoint for XML validity and proper URLs.
- Test Google verification endpoint `/google12345abcdef.html`.
- Validate Schema.org structured data JSON syntax.
