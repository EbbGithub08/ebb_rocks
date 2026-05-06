# ebb.rocks

En enkel, rask og “one page” hjemmeside bygget med **Vite** og (valgfritt) **Supabase** for innlogging og kommentarer. Siden består av en hero-seksjon med bakgrunnsvideo + et “PDA”-overlay som spiller av musikk, etterfulgt av en kommentarseksjon hvor brukere kan logge inn og poste kommentarer.

## Hva er på nettsiden

- **Hero / intro** (`index.html`)
  - Fullskjerms bakgrunnsvideo (`/video/oceanloop.mp4`)
  - “PDA”-bilde (`/img/PDA2.png`) med et overlay UI:
    - cover art
    - play/pause
    - progress bar
    - varighet / tid igjen
  - **Sosiale lenker** under PDA-en
- **Comments**
  - Auth-panel (login/register/logout) via Supabase Auth
  - Kommentar-input + liste over kommentarer fra Supabase DB
  - (Valgfritt) slett-knapp for admin-bruker (UI sjekker epost)

## Hvordan det fungerer (kort)

Prosjektet er “vanilla” HTML/CSS/JS med ES-moduler. `src/main.js` starter små moduler som hver finner sine DOM-noder via `data-*` attributter.

### Moduler

- **`src/main.js`**
  - Starter alt: video, auth, comments, PDA-player, PDA-refresh knapp
- **`src/app/video.js`**
  - Lytter på video events (loadeddata/canplay/error) og fjerner loading-overlay
  - Har fallback timeout så siden ikke “låser seg” på treg mobil
- **`src/app/pdaPlayer.js`**
  - Leser spor fra `src/app/pdaTracks.js`
  - Oppdaterer overlay UI (title, cover, progress, times)
  - Spiller av via et `<audio>` element, og synker UI via audio events
- **`src/app/pdaButton.js`**
  - “Next song”-knappen sender `pda:randomize-track` event (playeren lytter)
- **`src/app/auth.js`**
  - Supabase Auth login/register/logout
  - Oppdaterer UI og et lite “scroll-nav” når du scroller
- **`src/app/comments.js`**
  - Laster kommentarer fra Supabase tabell `comments`
  - Poster nye kommentarer når bruker er logget inn
  - Admin-bruker kan få delete-knapp i UI
- **`src/app/supabase.js`**
  - Lager `supabase` klient hvis env-variablene finnes, ellers `null`

### Styling

- `src/style.css` importerer alt:
  - `src/styles/tokens.css` (variabler)
  - `src/styles/base.css` (reset/base)
  - `src/styles/layout.css`
  - `src/styles/components.css` (PDA, knapper, scroll-nav osv.)
  - `src/styles/sections.css` (hero/comments layout)

## Kom i gang (lokalt)

Krav: **Node.js 18+** og **npm 9+**.

```bash
npm install
npm run dev
```

Vite printer en URL i terminalen (ofte `http://localhost:5173`).

### Bygg og preview

```bash
npm run build
npm run preview
```

## Supabase (valgfritt, men anbefalt for comments/auth)

Hvis du ikke setter opp Supabase, vil appen fortsatt laste, men **login og kommentarer blir deaktivert/“read-only”** (UI viser statusmelding).

### Env-variabler

Lag `.env` i rotmappa:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

`VITE_` prefix er nødvendig fordi Vite eksponerer disse til klienten.

### Database-tabell (forslag)

Appen forventer en tabell som heter `comments` med minst disse feltene (matchende select/insert i `src/app/comments.js`):

- `id` (uuid / identity) – primærnøkkel
- `user_id` (uuid) – id fra Supabase auth (kan være null hvis du vil tillate anonyme, men UI poster som innlogget)
- `author_email` (text)
- `author_name` (text)
- `body` (text)
- `created_at` (timestamptz, default `now()`)

### RLS / policies (anbefalt)

Appen gjør noen sjekker i UI, men **sikkerhet må håndheves i Supabase**.

Et enkelt, trygt oppsett er:

- **SELECT**: Tillat alle å lese kommentarer (public read)
- **INSERT**: Tillat kun authenticated users å poste
- **DELETE**: Tillat kun eier av kommentaren (match `user_id`) *eller* en admin-rolle du setter opp

Hvis du vil bruke “admin via epost” slik UI-en gjør, bør du heller implementere dette server-side (f.eks. via en Edge Function) eller via Supabase auth claims/rolle, ikke kun i frontend.

## Deploy

### Vercel

Dette er en vanlig Vite-app, så Vercel funker fint:

- **Framework preset**: Vite
- **Build command**: `npm run build`
- **Output directory**: `dist`

Husk å legge inn env vars i Vercel:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Etter deploy vil Vercel serve `dist/` som en statisk side.

## Prosjektstruktur

```
.
├─ index.html
├─ src/
│  ├─ main.js
│  ├─ style.css
│  ├─ app/
│  │  ├─ auth.js
│  │  ├─ comments.js
│  │  ├─ pdaButton.js
│  │  ├─ pdaPlayer.js
│  │  ├─ pdaTracks.js
│  │  ├─ supabase.js
│  │  └─ video.js
│  └─ styles/
│     ├─ base.css
│     ├─ components.css
│     ├─ layout.css
│     ├─ sections.css
│     └─ tokens.css
└─ docs/
   ├─ INSTALLASJON.md
   ├─ REQUIREMENTS.md
   └─ TODO.md
```

## Docs

- `docs/INSTALLASJON.md` (steg-for-steg lokalt)
- `docs/REQUIREMENTS.md` (krav + env)
- `docs/TODO.md`

