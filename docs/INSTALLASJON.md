# installasjon

Denne guiden viser hvordan du starter prosjektet lokalt.

## 1) krav

Du trenger:

- Node.js 18+ (helst nyeste LTS)
- npm 9+

Sjekk versjon:

```bash
node -v
npm -v
```

## 2) last ned prosjektet

```bash
git clone <repo-url>
cd ebb_rocks
```

## 3) installer pakker

```bash
npm install
```

## 4) sett opp `.env`

Lag filen `.env` i rotmappa.

Legg inn:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Tips:

- Ikke commit ekte nøkler.
- Hvis disse mangler, blir login deaktivert i appen.

## 5) start lokalt

```bash
npm run dev
```

Åpne URL-en som Vite viser i terminalen (ofte `http://localhost:5173`).

## 6) bygg for produksjon

```bash
npm run build
```

For å teste build lokalt:

```bash
npm run preview
```

## vanlige feil

**`npm install` feiler**

- Sjekk at Node-versjon er 18 eller nyere.
- Prøv: slett `node_modules` og `package-lock.json`, kjør `npm install` på nytt.

**Får ikke logget inn**

- Sjekk at `.env` finnes og har riktig `VITE_SUPABASE_URL` og `VITE_SUPABASE_ANON_KEY`.
- Sjekk at Auth er aktivert i Supabase.

**Kommentarer fungerer ikke**

- Sjekk at tabell/policy i Supabase er satt opp riktig.
- Se i browser console etter feilmelding fra API-kall.
