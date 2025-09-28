# BlueTides

A lightweight single-page social app built with plain HTML/CSS/JS (no framework).  
It talks to the **Noroff v2 Social API** for authentication, posts, profiles, reactions and comments.

Live page - https://bluetides.netlify.app
## Features

- Email/password **auth** with JWT (stored locally)  
- Auto-creation/use of **X-Noroff-API-Key**  
- Posts feed with pagination, search, and “following” filter  
- Single post view with comments & reactions  
- Create, edit, and delete your own posts  
- Profiles with avatar, bio, follow/unfollow, follower/following popups  
- Minimal hash-based router (`#/feed`, `#/post/:id`, `#/profile/:name`, etc.)

---

## Tech stack

- **Vanilla JS** (ES modules) + browser Fetch API
- **Hash router** (`src/core/router.js`)
- **DOM helpers** (`src/core/dom.js`)
- **Noroff v2 API** (base: `https://v2.api.noroff.dev`)
- No bundler/build step required (serves as static files)

---

## Quick start

> You **must** run this via a local web server (not `file://`) so ES modules and CORS behave.

### Option A — VS Code “Live Server” (easiest)
1. Open the project folder in VS Code.
2. Install the **Live Server** extension (Ritwick Dey).
3. Right-click `index.html` → **Open with Live Server**.
4. Your browser should open at something like `http://127.0.0.1:5500/`.

### Option B — Netlify or other hosting sites
