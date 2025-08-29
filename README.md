Lamppost — Eidcard

A small static site and card generator adapted from an Eid-card template. Use it to create a simple shareable PNG of a templated card containing a name and an optional note, or to generate a QR code that links back to a prefilled card view.

Quick start

1. From the project root, run a simple static server. Python3 example:

```bash
# start a static web server on port 8000
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

Generating a .woff2 (optional, recommended)

If you want a compressed webfont for faster page loads, generate a WOFF2 and place it in `assets/`. This project provides helper scripts to convert a local TTF into a WOFF2; the scripts expect you to pass the source TTF as an argument.

Options to generate a WOFF2 (optional, recommended):

1. Native tool (macOS/Homebrew):

   brew install woff2

   ./tools/generate-woff2.sh "/path/to/source.ttf" assets

2. Node/npm (no Homebrew needed):

   npm install --cache ./.npm-cache
   npm run generate:woff2 -- "/path/to/source.ttf" assets

The scripts will create `assets/Li Shamim Chitranee Unicode.woff2`. Commit that file into the repo and the app will use it.

2. Open `index.html` in your browser (or the URL above). The UI provides:
   - Template thumbnails (left) to choose card backgrounds
   - Name and Note fields (right) to customize the card
   - Buttons: Download (PNG), Share (copy link / Web Share fallback), QR (download QR image)

Key files

- `index.html` — app entry, UI markup and script includes.
- `app.js` — client-side logic: template loading, SVG composition, PNG export, QR generation and share helpers.
- `dist/lamppost.css` — stylesheet (copied from the original project and extended with small layout tweaks).
- `templates/` — SVG template files used as card backgrounds.
- `assets/` — fonts and images (include `Li Shamim Chitranee Unicode.woff2` and `logo.webp`).

Notable behavior and decisions

- The app injects a @font-face into exported SVGs so the downloaded PNG preserves the intended font when possible.
- Sharing uses `navigator.clipboard` to copy a share URL. If that fails, the code attempts the Web Share API, then falls back to a manual `prompt()` so a user can copy the link.
- Small responsive tweaks were added to keep the three action buttons visually spaced and usable on very small screens.

Troubleshooting

- If templates don't load, confirm the `templates/` files exist and the server can serve them (CORS is not an issue for a local static server).
- If fonts don't embed into exported PNGs, ensure `assets/Li Shamim Chitranee Unicode.woff2` exists and is reachable.
- If share/copy doesn't work in your browser, check that the page is served over HTTPS or served from `localhost` (clipboard and Web Share API may be restricted in insecure contexts).

Contributing / next steps

- Move inline styles (logo sizing) into `dist/lamppost.css` for better maintainability.
- Optionally remove legacy files (e.g., `dist/eid.css`) if present to avoid confusion.

License / Attribution

This project was adapted from an Eid-card template. Keep original licenses and attributions as needed.
