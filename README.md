# ebb.rocks test website

This is a tiny static site you can deploy to verify that your domain works.

## 1) Test locally first

From this folder:

```bash
python3 -m http.server 8080
```

Then open:

- <http://localhost:8080>

## 2) Put code online (Netlify - easiest)

1. Create a GitHub repo and upload this folder.
2. Go to <https://app.netlify.com> and sign in with GitHub.
3. Click **Add new site** -> **Import an existing project**.
4. Pick your repo.
5. Build settings:
   - Build command: *(leave empty)*
   - Publish directory: `.`
6. Deploy.

## 3) Connect `ebb.rocks` domain

In Netlify:

1. Open your site -> **Domain management** -> **Add custom domain**.
2. Add `ebb.rocks`.
3. Netlify shows DNS records you must create at your domain registrar.

Typical records are:

- `A` record for root (`@`) -> `75.2.60.5`
- `A` record for root (`@`) -> `99.83.190.102`
- `CNAME` for `www` -> your-netlify-site-name.netlify.app

After DNS propagation (can take a few minutes to a few hours), visiting
<https://ebb.rocks> should show your page.

## 4) Update your website

1. Edit `index.html` or `style.css`.
2. Commit + push to GitHub.
3. Netlify redeploys automatically.

## Optional: Vercel instead

Vercel also works well:

1. Import GitHub repo at <https://vercel.com/new>.
2. Add domain in **Settings -> Domains**.
3. Create the DNS records Vercel asks for at your registrar.
