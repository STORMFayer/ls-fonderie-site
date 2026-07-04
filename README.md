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

## Espace Employé (Supabase) — business RP complet

Le site reprend l'intégralité des fonctionnalités de gestion de `fonderie-react`
(minerais → salaire, commandes légales/marché noir, avances, alertes stock, journal
d'audit), avec une vraie base Postgres via [Supabase](https://supabase.com) à la place
de l'ancien backend Google Apps Script.

**Connexion** : par identifiant Discord (comme l'original), pas par email — le formulaire
résout le Discord ID vers l'email interne via `get_login_email()` puis authentifie avec
Supabase Auth (mots de passe gérés nativement, jamais stockés en clair).

**Pages employé** (`/dashboard`, `/soumission`, `/avance`, `/alertes`) :
- Tableau de bord : minerais soumis, salaire (minerais × prix), quota hebdo (1600),
  classement de tous les employés (transparence totale, comme l'original).
- Soumission de minerai, demande d'avance sur salaire (max 20 000$), signalement
  d'alerte stock (plats/boissons/kits/pioches, faible ou critique).

**Pages admin** (`/admin/employees`, `/admin/orders`, `/admin/finances`,
`/admin/journal`, `/admin/settings`) :
- Employés : classement, recherche, édition discord/rôle.
- Commandes : filtres par statut, changement de statut (livrée = archivée en journal
  puis supprimée, comme l'original).
- Finances : revenus légal/noir, masse salariale, versement d'avances ou paiement complet.
- Journal : historique de toute l'activité, purge alertes/avances.
- Réglages : édition des tarifs, reset complet de la semaine (irréversible).

**Pages publiques** : `/commander` (lingots), `/suivi` (suivi de commande par numéro),
`/marche-noir` (accessible via le point discret en bas du footer — easter egg comme
l'original — avec l'avertissement 70% argent propre / 30% argent sale).

Toutes les mutations passent par des fonctions RPC Postgres (`SECURITY DEFINER`) qui
vérifient elles-mêmes les permissions (admin ou non) — les tables restent verrouillées
par RLS et ne sont jamais modifiables directement depuis le client.

Schéma versionné dans `supabase/migrations/`. Pour appliquer des changements de schéma :

```bash
npx supabase link --project-ref <ref>
npx supabase db push
```

### Ajouter un nouvel employé

Aucune page d'inscription publique n'existe volontairement (accès sur invitation
uniquement). Un admin peut créer un compte directement depuis `/admin/employees` →
**Nouveau compte** (prénom, nom, Discord ID, mot de passe, rôle).

Ça passe par une **Edge Function** (`supabase/functions/create-employee`) qui :
- vérifie que l'appelant est bien authentifié et admin (sinon rejet),
- utilise la clé `service_role` **côté serveur uniquement** (jamais exposée au client)
  pour créer le compte Auth via `auth.admin.createUser()`,
- le profil `employees` (discord, rôle, nom) est ensuite rempli automatiquement par le
  trigger `on_auth_user_created` à partir des métadonnées transmises.

Pour déployer la fonction après une modification :

```bash
npx supabase functions deploy create-employee --use-api
```

Alternative manuelle (sans passer par l'UI) : Dashboard Supabase → **Authentication →
Users → Add user**, avec **Auto Confirm User** coché et, dans **User Metadata** :
```json
{ "full_name": "Prénom Nom", "discord": "pseudo#0001", "role": "employe" }
```

### Modifier / supprimer un employé

Depuis `/admin/employees`, clique le crayon sur une ligne pour :
- **Éditer** nom complet, Discord et rôle (RPC `update_employee`),
- **Changer le mot de passe** (Edge Function `manage-employee`, action `set_password`),
- **Supprimer le compte** (même fonction, action `delete` — supprime le compte Auth,
  ce qui supprime le profil `employees` en cascade). Un admin ne peut pas supprimer
  son propre compte (garde-fou anti-verrouillage).

```bash
npx supabase functions deploy manage-employee --use-api
```

### Notifications Discord

Chaque commande passée (`/commander` ou `/marche-noir`) envoie automatiquement un
message dans un salon Discord via une **Edge Function** (`supabase/functions/notify-order`) :

- Le front appelle `notify-order` juste après `place_order`, avec seulement le numéro
  de commande (pas le détail — évite qu'un client falsifie le contenu du message).
- La fonction relit la commande via `service_role` (contourne les RLS côté serveur
  uniquement) et poste un embed (client, contact, articles, total, type) sur l'URL de
  webhook Discord stockée dans le secret `DISCORD_WEBHOOK_URL`.
- Le message ping le rôle configuré dans le secret `DISCORD_FONDERIE_ROLE_ID`
  (`<@&ROLE_ID>` + `allowed_mentions: { parse: ['roles'] }` pour garantir la notif).
- Un échec de notification Discord n'empêche jamais la commande d'aboutir (appel best-effort).

Configurer/modifier le webhook ou le rôle à ping :

```bash
npx supabase secrets set DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
npx supabase secrets set DISCORD_FONDERIE_ROLE_ID="123456789012345678"
npx supabase functions deploy notify-order --use-api
```

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

Dépôt : [STORMFayer/LS-Fonderie-LJLife](https://github.com/STORMFayer/LS-Fonderie-LJLife)
— site en ligne sur **https://stormfayer.github.io/LS-Fonderie-LJLife/**

Si tu renommes encore le dépôt, mets à jour `base` dans [vite.config.ts](vite.config.ts)
pour qu'il corresponde à `/<nom-du-repo>/`.

## Structure

```
src/
  components/ui/     Button, Card, Badge (style shadcn)
  components/        Embers, Reveal, Counter, SuccessModal, OrderCatalogue
  sections/          Nav, Hero, Stats, Products, Process, Testimonials, CTA, Footer
  auth/              AuthContext, ProtectedRoute, AdminRoute (Supabase)
  pages/             Home, Login, Tracking, OrderLegal, OrderBlack
  pages/app/         AppLayout, Dashboard, Submission, Avance, Alertes (employé)
  pages/app/admin/   Employees, Orders, Finances, Journal, Settings (admin)
  lib/supabase.ts    client + types Supabase
  App.tsx            routeur (HashRouter)
supabase/migrations/  schéma SQL versionné (tables + RLS + fonctions RPC)
supabase/functions/    Edge Functions (create-employee, manage-employee, notify-order : service_role côté serveur)
```
