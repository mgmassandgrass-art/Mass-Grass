# Mass & Grass: website handoff for Claude Code

*16 October 2026. Prototype version 11 (the live preview artifact).*

**Mass & Grass** is a watercolour art brand from Gaza, founded by **Farah Al-Helou** (painter) and **Ahmed** (architect, project owner).

This folder is a **finished front-end prototype** built in plain HTML, CSS and JS. The job now is to turn it into the real site on **massandgrass.com**, with a real backend for:
- accounts and Google sign-in,
- PayPal payments and subscriptions,
- file delivery,
- an admin panel.

Work with Ahmed in **Arabic**. Keep the design exactly as it is. Do one step at a time, and show him before moving on.

---

## 1. Brand rules (do not break these)

- **Digital first.** Everything sold today is a digital file: paintings and postcards as **PDF + PNG high-res**, stickers as **PNG + WhatsApp/Telegram packs**, and the calendar as a **PDF in A3 and A4**.
  - Tees, hoodies, totes and mugs are **"coming soon"** (later via Printful print-on-demand).
- **No shipping claims anywhere.** Nothing physical ships yet.
- **Light theme only.** Dark mode was removed on purpose.
- **Bilingual EN/AR.** Every page has a toggle (`ع` / `EN`), saved in `localStorage.mgLang`.
  - Arabic is RTL, in a Levantine/Palestinian voice.
  - Arabic text is animated **per word**, never per letter, so the letters stay joined.
- **Look.** VOX-style cut paper (hard ink shadows, tags, tickers), on a beige paper field `#E9DCC2`.
  - Palette:

    | Name | Hex |
    |---|---|
    | ink | `#2E241B` |
    | paper | `#FAF5E9` |
    | terra | `#C4593F` |
    | sage | `#66805A` |
    | ochre | `#D9A441` |
    | sky | `#3f6b8a` |

  - Fonts (self-hosted in `fonts/`):

    | Use | Font |
    |---|---|
    | Display | Anton |
    | Arabic display | Lalezar |
    | Body | IBM Plex Sans Arabic |
    | Labels | IBM Plex Mono |
    | Handwriting | Caveat / Aref Ruqaa |
    | Accents | Permanent Marker |

- **Paintings are always shown whole**, never cropped, on watercolour paper with a light 1px frame.
- **Product mockups:**
  - Painting: the painting, then **framed on a wall**. The wall colour is picked automatically from the painting's dominant hue.
  - Postcard: the card, then **front & back**.
  - Sticker: the sticker, then **on a laptop**.
  - Calendar: **cover**, **on the wall**, **12 months**.
  - There is no "on the wall" pegboard mockup and no phone-wallpaper mockup. Ahmed removed both.
- **Contact email:** `info@massandgrass.com`. **Instagram:** `@farahh.gaza`.

---

## 2. Files

```
site/
  index.html      Homepage (see §3)
  shop.html       All products: paintings · postcards · stickers (+ pack of 6) · calendars by year · tees (soon)
  paintings.html  "Farah's line" (paintings pegged on a line) + Gaza map of where each was painted
  postcards.html  Postcard rack + "write & send a postcard" studio (free e-postcard link)
  stickers.html   Sticker sheet, ready packs, build-your-own pack, "seal it with stickers" envelope
  calendar.html   Calendar 2027 (tear-off months), past calendars 2024–2026, free month wallpaper
  story.html      Farah's story: envelope opens, map of displacement, timeline, "Mass & Green" name, support
  checkout.html   Checkout: details → (gifts) → pay; "Sealed in Gaza" thank-you page with downloads
  account.html    Sign in / create account / Continue with Google
  profile.html    Profile: photo, files, orders, "A painting a month" subscription, settings
  help.html       FAQ (9 questions) + contact form
  terms.html      Licence, terms of sale, privacy (DRAFT, needs a lawyer)
  404.html        "This letter got lost" (wire it as the server 404)
  assets/
    mg.js         SHARED SCRIPT for every page (see §4)
    *.webp/*.jpg  paintings, stickers (s-*), envelope parts, truck, birds, jug, postmark, seals…
    logo.svg      main logo
  fonts/          woff2 + fonts.css
docs/
  reference-francobolli-analysis.md   the motion/stamp reference site Ahmed liked
```

Each page is a single self-contained HTML file with its CSS and JS inline. The only shared piece is `assets/mg.js`. To preview the site, serve the folder with `python -m http.server`.

---

## 3. Homepage, top to bottom

1. **Splash** with the main logo.
2. **Farah's table**, the first section.
   - 12 paintings on paper, with pointer tilt and shine.
   - The cursor takes each painting's colour.
   - A road along the bottom carries a truck. Clicking the truck plays a "beep beep" (WebAudio) and drives it right → left, with smoke puffs.
   - Scrolling locks on the table. The first scroll down eases over 2.6 s to the next section.
3. **Envelope.** The selected painting flies into the envelope as a stamp, and a postmark thuds.
4. **Sheets.** The stamp flies on to its category sheet.
5. **Best sellers.** Auto-sorted by units sold (`BS` array; replace with real sales). Sale and "new" badges.
6. **"From Gaza to your screen."** A scroll-driven truck and 3 step boxes.
7. **The painter.** Farah's photo with a clay jug.
8. **Footer.**

Across the whole page, a **blue bird guide** follows the visitor with a tip in every section.

On mobile:
- swiping changes the painting,
- arrow buttons are shown,
- vertical scrolling is never blocked.

---

## 4. `assets/mg.js`, the shared layer (keep it, then move its logic to the backend)

| Module | What it does | Prototype storage, and what replaces it |
|---|---|---|
| Shop menu | Dropdown under "Shop" in the header | — |
| **Bag** `MGBag` | `add/remove/clear/total/open`. A drawer slides from the side (from the left in Arabic). Items look like `{k, kind, t, ta, p, img?, gift?, note?, pack?}` | `localStorage.mgBag` → server cart / session |
| **Product window** `MGProduct.open({...})` | Mockups by `kind` (painting/postcard/sticker/calendar), zoom, specs, add to bag, gift ("send it to someone": name, email, note). Postcards get "Write & send". Stickers: "just this sticker €1" or "add to a pack of 6 €3". Calendars before 2027 are an archive, not for sale | — |
| **Sticker pack** `MGPack` | Fill 6 stickers, then put the pack in the bag. Slots show inside the window, and a tray shows on the shop page | `localStorage.mgPack` |
| **Postcard composer** `MGCompose(key)` | Pick a card and a stamp, write, postmark & seal, then share by WhatsApp, email or link. The message is encoded inside the link (`postcards.html?pc=…`) | stays client-side; it is free |
| **Accounts** `MGUser` | Sign up/in, Google (simulated), profile, orders, subscription. Adds the account chip to every header, and Help / Terms / Account links to every footer | `localStorage.mgUser / mgUsers / mgOrders` → **real auth + DB** |
| **Currency** `MGCur` | Prices are stored in **EUR** and shown in the visitor's currency: EUR / USD / GBP / ILS. Rates are fixed (USD 1.08, GBP .85, ILS 4) and rounded to whole numbers. Every `€n` in the page text is converted automatically. There is a currency picker in the footer | guessed from the time zone → **Cloudflare `CF-IPCountry`** + a real price table per currency (ask Ahmed for exact prices) |
| Wall tone | Samples the painting to colour the framed-mockup wall | keep as is |
| Responsive | Buttons shrink under 640px. The product window goes full-screen on mobile, with a sticky buy bar | — |

---

## 5. Prices (placeholders; Ahmed will confirm)

| Product | Price |
|---|---|
| Painting file (PDF + PNG) | €12 |
| Postcard file | €2 |
| Sticker, single | €1 |
| Sticker pack of 6 (ready or build-your-own) | €3 |
| Calendar 2027 PDF | €8 |
| **"A painting a month" subscription** | **€5 / month** |

The subscription delivers a new painting file on the 1st of each month, before it reaches the shop, with a note from Farah. It can be cancelled any time, and subscribers keep everything they received.

---

## 6. What is fake in the prototype and must become real

1. **Auth.** Email + password with real hashing on the server, plus **Google OAuth**.
   - Forgot-password emails.
   - Profile photo upload.
   - Account deletion and data export (GDPR).
2. **Payments: PayPal.**
   - Orders API for checkout. The site shows the visitor's currency, and PayPal charges in that currency.
   - Subscriptions API for the €5 monthly plan. Webhooks for paid, failed and cancelled.
3. **Delivery.**
   - After payment, signed download links. Store the files in **Cloudflare R2** and serve them with short-lived URLs.
   - An email with the links.
   - Gift orders email the recipient with the buyer's note.
4. **Profile data.** Files, orders and subscription status come from the DB instead of localStorage.
5. **Monthly job.** On the 1st of each month, send the month's painting to active subscribers and add it to their profile.
6. **Forms.** The contact form, newsletter ("A postcard in your inbox", free) and checkout email all need a real email service.
7. **Admin panel** for Ahmed and Farah:
   - add a painting with its title, place (EN/AR), story, prices, category and files. A new painting should automatically appear on Farah's table on the homepage and in the shop;
   - mark items new or on sale;
   - see orders and subscribers;
   - best sellers fill in automatically from sales;
   - upload the month's painting.
8. **Currency** from `CF-IPCountry`, with a fixed price table per currency.
9. **Later:** Printful print-on-demand for tees, totes and mugs, which are currently "coming soon".

**Suggested stack** (confirm with Ahmed): GitHub repo → **Cloudflare Pages** for the static pages, **Workers** for the API, **D1** for the database, **R2** for the files, **PayPal**, and **Google OAuth**.

Keep the pages as they are, as static HTML, and replace the localStorage calls in `mg.js` with `fetch()` calls to the API. The UI barely changes that way.

---

## 7. Content still needed from Ahmed and Farah

- Farah's photo for the painter section (`assets/farah.jpg`).
- Real painting titles, places and stories (EN/AR) for every item.
- **Watermark-free files.** Several paintings and stickers still carry a "MASS & GRASS © FARAH AL HELOU" watermark (pmoon, some stickers).
- The high-res PDF/PNG files to sell.
- Final prices per currency.
- Real sales data for the best sellers.
- Instagram and other links.
- A lawyer's review of `terms.html`.

---

## 8. Checks done on this version

Playwright at 1440, 1366, 1024, 768, 468, 390 and 360 px, in English and Arabic:
- 0 JS errors,
- no horizontal overflow,
- every product window: the image stays whole and the buy bar stays visible,
- the full flow: sign up → add to bag → checkout → profile files and orders → subscribe → settings,
- currency checked for New York, Gaza, London and Berlin.

**Not yet tested:** a real phone, and the truck sound heard by ear.
