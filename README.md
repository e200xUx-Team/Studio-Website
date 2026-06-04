# The ePlane Co. — Clay Studio Dashboard

Full-stack inventory & project dashboard for ePlane.ai team.

## Deploy to Vercel (step-by-step)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2. Connect to Vercel
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repository
3. Framework Preset: **Other**
4. Root Directory: ` . ` (leave as-is)
5. Click **Deploy**

### 3. Set Environment Variables (REQUIRED)
In Vercel → Your Project → Settings → Environment Variables, add:

| Variable | Value |
|---|---|
| `JWT_SECRET` | A long random string (run `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`) |
| `ADMIN_EMAIL_1` | `rahul.sp@eplane.ai` |
| `ADMIN_NAME_1` | `Rahul Sakthevel` |
| `ADMIN_PASS_1` | Your secure password |
| `ADMIN_EMAIL_2` | `rajan.sunjay@eplane.ai` |
| `ADMIN_NAME_2` | `Rajan Sunjay` |
| `ADMIN_PASS_2` | Your secure password |

After adding env vars, **Redeploy** the project.

## Local Development

```bash
npm install
cp .env.example .env
# Edit .env and fill in real values
npm run dev
```

Open http://localhost:3000

## Important Notes

- **Database persistence**: On Vercel, the SQLite DB lives in `/tmp` which resets on cold starts. This is fine for an internal tool but data won't survive redeploys. For permanent storage, migrate to [Supabase](https://supabase.com) or [PlanetScale](https://planetscale.com).
- **Signups**: Only `@eplane.ai` email addresses can register.
- **Approval flow**: New users need admin approval before they can log in.
