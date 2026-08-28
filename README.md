# Polyoko site (local)

Run this on your Mac. You do not need the cloud agent.

```bash
git clone https://github.com/victorgmor/polyoko.git
cd polyoko
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
