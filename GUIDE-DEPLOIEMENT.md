# Guide de déploiement — Design Agent sur Vercel

Ce guide te mène de zéro à une URL publique, étape par étape.
Durée estimée : 20 à 30 minutes.

---

## Ce que tu vas faire

1. Récupérer une clé API Anthropic (5 min)
2. Installer Node.js sur ton ordinateur (5 min)
3. Créer un compte GitHub et y déposer le projet (10 min)
4. Connecter Vercel à GitHub et déployer (5 min)

---

## ÉTAPE 1 — Clé API Anthropic

C'est ce qui permet à ton application d'appeler le modèle Claude.

1. Va sur **https://console.anthropic.com**
2. Crée un compte (ou connecte-toi si tu en as un)
3. Dans le menu de gauche, clique sur **"API Keys"**
4. Clique sur **"Create Key"**
5. Donne-lui un nom (ex: `design-agent`)
6. **Copie la clé et garde-la précieusement** — elle commence par `sk-ant-...`
   ⚠️ Tu ne pourras plus la revoir une fois la fenêtre fermée.

> 💡 Note sur les coûts : Anthropic donne du crédit gratuit aux nouveaux comptes.
> Chaque génération coûte environ $0.003. Pour un usage personnel, le coût mensuel
> sera négligeable (quelques centimes à quelques euros selon ton usage).

---

## ÉTAPE 2 — Installer Node.js

Node.js est nécessaire pour lancer le projet en local et l'envoyer sur GitHub.

1. Va sur **https://nodejs.org**
2. Télécharge la version **LTS** (la recommandée, bouton vert à gauche)
3. Lance l'installeur et clique "Next" jusqu'à la fin
4. Pour vérifier que ça marche, ouvre un terminal :
   - Windows : cherche "Invite de commandes" ou "PowerShell" dans le menu Démarrer
   - Mac : cherche "Terminal" dans Spotlight (⌘ + espace)
5. Tape cette commande et appuie sur Entrée :
   ```
   node --version
   ```
   Tu dois voir quelque chose comme `v20.11.0`. Si c'est le cas, Node est installé ✓

---

## ÉTAPE 3 — Préparer le projet sur ton ordinateur

### 3a. Télécharger les fichiers du projet

Tu as reçu un fichier ZIP contenant le projet. Décompresse-le dans un dossier de ton choix,
par exemple `Documents/design-agent`.

La structure du dossier doit ressembler à ceci :
```
design-agent/
├── components/
│   └── DesignAgent.jsx
├── pages/
│   ├── _app.js
│   ├── index.js
│   └── api/
│       └── generate.js
├── styles/
│   └── globals.css
├── .gitignore
├── next.config.js
└── package.json
```

### 3b. Installer les dépendances du projet

1. Dans ton terminal, navigue vers le dossier du projet :
   ```
   cd chemin/vers/design-agent
   ```
   Par exemple sur Windows : `cd C:\Users\TonNom\Documents\design-agent`
   Sur Mac : `cd ~/Documents/design-agent`

2. Lance l'installation des dépendances :
   ```
   npm install
   ```
   Ça peut prendre 1 à 2 minutes. Des messages vont défiler, c'est normal.

### 3c. Tester en local (optionnel mais recommandé)

1. Crée un fichier `.env.local` à la racine du projet avec le contenu suivant :
   ```
   ANTHROPIC_API_KEY=sk-ant-ta-cle-ici
   ```
   Remplace `sk-ant-ta-cle-ici` par ta vraie clé API.

2. Lance le projet :
   ```
   npm run dev
   ```

3. Ouvre **http://localhost:3000** dans ton navigateur.
   L'agent doit s'afficher et fonctionner ✓

4. Pour arrêter le serveur local : `Ctrl + C` dans le terminal.

---

## ÉTAPE 4 — Créer un dépôt GitHub

GitHub est l'endroit où ton code sera hébergé avant d'être déployé sur Vercel.

### 4a. Créer un compte GitHub

1. Va sur **https://github.com**
2. Clique sur **"Sign up"**
3. Suis les étapes (email, mot de passe, nom d'utilisateur)
4. Confirme ton email

### 4b. Installer Git

Git est l'outil qui envoie ton code sur GitHub.

- Windows : télécharge **Git for Windows** sur **https://git-scm.com** et installe-le
- Mac : ouvre le Terminal et tape `git --version`. Si Git n'est pas installé, macOS te proposera de l'installer automatiquement.

Vérifie l'installation :
```
git --version
```
Tu dois voir quelque chose comme `git version 2.42.0` ✓

### 4c. Configurer Git avec ton identité

Dans le terminal, exécute ces deux commandes (remplace avec tes vraies infos) :
```
git config --global user.name "Ton Nom"
git config --global user.email "ton@email.com"
```

### 4d. Créer le dépôt sur GitHub

1. Sur GitHub, clique sur le **"+"** en haut à droite → **"New repository"**
2. Nom du dépôt : `design-agent`
3. Laisse-le en **Public** (requis pour Vercel gratuit)
4. Ne coche rien d'autre
5. Clique **"Create repository"**
6. GitHub t'affiche une page avec des commandes. Garde cette page ouverte.

### 4e. Envoyer ton code sur GitHub

Dans ton terminal (à la racine du projet `design-agent`) :

```
git init
git add .
git commit -m "Initial commit — Design Agent"
git branch -M main
git remote add origin https://github.com/TON-USERNAME/design-agent.git
git push -u origin main
```

Remplace `TON-USERNAME` par ton nom d'utilisateur GitHub.

GitHub te demandera peut-être de t'authentifier. Si c'est le cas :
- Va sur GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
- Génère un token avec les droits `repo`
- Utilise ce token comme mot de passe

Après le push, actualise la page GitHub : tu dois voir tes fichiers ✓

---

## ÉTAPE 5 — Déployer sur Vercel

### 5a. Créer un compte Vercel

1. Va sur **https://vercel.com**
2. Clique **"Sign Up"** → choisis **"Continue with GitHub"**
3. Autorise Vercel à accéder à ton GitHub
4. Ton compte est créé ✓

### 5b. Importer le projet

1. Sur le tableau de bord Vercel, clique **"Add New Project"**
2. Tu vois la liste de tes dépôts GitHub
3. Trouve `design-agent` et clique **"Import"**

### 5c. Configurer la clé API (IMPORTANT)

Avant de déployer, il faut ajouter ta clé API :

1. Dans l'écran de configuration du projet, cherche la section **"Environment Variables"**
2. Clique pour l'ouvrir
3. Ajoute la variable suivante :
   - **Name** : `ANTHROPIC_API_KEY`
   - **Value** : `sk-ant-ta-cle-api`  ← ta vraie clé
4. Clique **"Add"**

### 5d. Déployer

1. Clique **"Deploy"**
2. Vercel va builder et déployer ton projet (1 à 2 minutes)
3. Une fois terminé, tu verras une coche verte et une URL du type :
   ```
   https://design-agent-ton-username.vercel.app
   ```

**C'est terminé. Ton Design Agent est en ligne ! 🎉**

---

## Accéder à l'application

Tu peux maintenant ouvrir ton URL Vercel depuis n'importe quel appareil :
ordinateur, téléphone, tablette — ça fonctionne partout.

---

## Mettre à jour le projet plus tard

Si tu veux modifier le code et redéployer :

1. Fais tes modifications dans les fichiers
2. Dans le terminal :
   ```
   git add .
   git commit -m "Description de tes modifications"
   git push
   ```
3. Vercel détecte le push et redéploie automatiquement en quelques secondes.

---

## En cas de problème

**L'app s'ouvre mais les générations ne fonctionnent pas**
→ Vérifie que ta variable `ANTHROPIC_API_KEY` est bien configurée dans Vercel :
   Dashboard → ton projet → Settings → Environment Variables

**Erreur lors du `npm install`**
→ Assure-toi d'être dans le bon dossier (`cd design-agent`) et que Node.js est bien installé (`node --version`)

**Git demande un mot de passe**
→ Utilise un Personal Access Token GitHub (voir étape 4e)

**La page GitHub affiche "404"**
→ Vérifie que l'URL du remote est correcte :
   `git remote -v` doit afficher ton URL GitHub
