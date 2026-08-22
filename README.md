# Plusmarket site (local)

Run this on your Mac. You do not need the cloud agent.

```bash
git clone https://github.com/victorgmor/polynex-web.git polyoko
cd polyoko
git checkout cursor/plain-white-bg-a5f8
npm install
npm run dev
```

Open http://localhost:4321/

## Swap the girl

Replace this file with yours, then refresh:

`public/img/menu-girl.png`

Example:

```bash
cp "/Users/victor/Downloads/New Project-14.png" public/img/menu-girl.png
```

Black backgrounds will show as holes unless you export the PNG with transparency.

## Other useful files

- Page color and CRT opacity: `src/styles/app.css` (`--paper`, `.crt-scanlines { opacity }`)
- Menu copy and waitlist link: `src/lib/menu.ts`
