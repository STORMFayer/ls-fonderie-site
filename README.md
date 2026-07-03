# LS Fonderie — site vitrine

Site vitrine one-page pour LS Fonderie : Vite + React + TypeScript + Tailwind CSS v4 + Framer Motion + Radix UI + lucide-react.

## Stack

- **React 19 + TypeScript + Vite** — build rapide, projet séparé de `fonderie-react`
- **Tailwind CSS v4** — thème forge/or personnalisé (`src/index.css`)
- **Framer Motion** — animations au scroll, compteurs animés, hover 3D
- **Radix UI primitives** + composants shadcn-style (`src/components/ui`)
- **lucide-react** — icônes

## Démarrer en local

```bash
npm install
npm run dev
```

## 21st.dev (Magic MCP)

Ce projet est câblé pour utiliser le générateur de composants IA de [21st.dev](https://21st.dev) :

1. Copie `.env.example` en `.env` et renseigne ta clé :
   ```
   TWENTY_FIRST_API_KEY=21st_sk_...
   ```
2. `.env` est ignoré par git — la clé ne sera jamais commit.
3. `.mcp.json` déclare déjà le serveur MCP `21st-magic` (`@21st-dev/magic`), qui lit
   `TWENTY_FIRST_API_KEY` depuis l'environnement. Redémarre Claude Code / ton éditeur
   après avoir renseigné `.env` pour que le serveur MCP se connecte.

## Espace Employé (Supabase)

Le site inclut un espace employé protégé (`/#/login` → `/#/dashboard`), avec une vraie
base de données Postgres via [Supabase](https://supabase.com) :

- **Table `employees`** : profil (nom, rôle), créé automatiquement à la création d'un
  compte Auth (trigger `on_auth_user_created`).
- **Table `orders`** : commandes affichées sur le tableau de bord (stats + liste).
- **RLS activée** : un employé connecté ne voit que son propre profil ; les commandes
  sont lisibles par tout compte authentifié, rien n'est accessible anonymement.
- **Inscription publique désactivée** — c'est un espace sur invitation uniquement.

Schéma versionné dans `supabase/migrations/`. Pour appliquer des changements de schéma :

```bash
npx supabase link --project-ref <ref>
npx supabase db push
```

### Ajouter un nouvel employé

Aucune page d'inscription n'existe volontairement. Pour créer un accès, va dans le
dashboard Supabase → **Authentication → Users → Add user**, renseigne un email et un
mot de passe, et coche **Auto Confirm User**. Le profil `employees` est créé automatiquement.

### Variables d'environnement

En local (`.env`, jamais commit) :

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

Sur GitHub Actions, ces mêmes valeurs sont définies comme **variables de dépôt**
(`Settings → Secrets and variables → Actions → Variables`) — la clé `anon` n'est pas
secrète (elle est protégée par les policies RLS), donc pas besoin d'un secret chiffré.

## Déploiement GitHub Pages

Un workflow (`.github/workflows/deploy.yml`) build et déploie automatiquement sur
GitHub Pages à chaque push sur `main`.

1. Crée le dépôt GitHub (ex: `ls-fonderie-site`) et pousse ce dossier dessus.
2. Dans **Settings → Pages**, choisis la source **GitHub Actions**.
3. Si le nom du dépôt est différent de `ls-fonderie-site`, mets à jour `base` dans
   [vite.config.ts](vite.config.ts) pour qu'il corresponde à `/<nom-du-repo>/`.

## Structure

```
src/
  components/ui/   Button, Card, Badge (style shadcn)
  components/      Embers, Reveal, Counter (effets)
  sections/        Nav, Hero, Stats, Products, Process, Testimonials, CTA, Footer
  auth/            AuthContext, ProtectedRoute (Supabase)
  pages/           Home, Login, Dashboard
  lib/supabase.ts  client Supabase
  App.tsx          routeur (HashRouter)
supabase/migrations/  schéma SQL versionné
```
