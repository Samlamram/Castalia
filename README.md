# Castalia Field Report – PWA

A lightweight, offline-first Progressive Web App for generating technical field reports in the field. No backend, no database, no login required.

## Quick Start (Local Development)

You need a local HTTP server because service workers require HTTPS or `localhost`.

**Option A – Python:**
```bash
python -m http.server 8000
```

**Option B – Node (npx):**
```bash
npx -y serve .
```

Then open `http://localhost:8000` (or the port shown) in your browser.

## Deploy to Vercel

1. Push this project to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) and import the repository.
3. Vercel will auto-detect it as a static site. No build step needed.
4. Click **Deploy**.

Or use the Vercel CLI:
```bash
npx -y vercel --prod
```

## Replacing Branding Assets

All branding images live in the `assets/` folder:

| File | Purpose | Recommended Size |
|---|---|---|
| `assets/logo.png` | App logo (navbar, splash, PWA icon) | 512×512 px, square |
| `assets/header.png` | Report header image | 1200×200 px, landscape |
| `assets/footer.png` | Report footer image | 1200×150 px, landscape |
| `assets/icon-192.png` | PWA icon (required) | 192×192 px, square |
| `assets/icon-512.png` | PWA icon (required) | 512×512 px, square |

Simply replace the files in `assets/` with your own images using the same filenames.

> **Tip:** After replacing images on a deployed version, update the `CACHE_NAME` in `service-worker.js` (e.g., change `castalia-report-v1` to `castalia-report-v2`) so the service worker re-caches the new assets.

## Project Structure

```
Castalia_STC/
├── index.html              # Main app shell (form + report views)
├── manifest.webmanifest    # PWA manifest
├── service-worker.js       # Offline caching
├── css/
│   └── style.css           # Mobile-first styles + print CSS
├── js/
│   └── app.js              # App logic (no frameworks)
├── assets/
│   ├── logo.png            # App logo
│   ├── header.png          # Report header
│   ├── footer.png          # Report footer
│   ├── icon-192.png        # PWA icon 192px
│   └── icon-512.png        # PWA icon 512px
└── README.md
```

## How It Works

1. Open the app on your phone.
2. Fill out the field report form.
3. Tap **Generate Report** to see a clean, printable report.
4. Tap **Download PDF** to print or save as PDF (uses the native browser print dialog).
5. Tap **Edit Form** to go back and make changes.

## Offline Support

After the first visit, the app works entirely offline. All assets are cached by the service worker. Reports are generated client-side with no server required.

## iOS Installation

1. Open the app URL in Safari.
2. Tap the **Share** button.
3. Select **Add to Home Screen**.
4. The app will launch in standalone mode like a native app.
