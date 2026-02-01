# MyEFREI Grades 📚

Application de gestion des notes pour les étudiants EFREI. Permet aux étudiants de suivre leurs notes, moyennes et ECTS par semestre.

## Fonctionnalités

### Pour les Étudiants
- 📊 Visualisation des notes par semestre (S1 / S2)
- 📈 Calcul automatique des moyennes par module, UE et semestre
- 🎯 Suivi des ECTS obtenus
- 📅 Support multi-parcours (ex: P1 PMP puis P2 PLUS)
- 🔐 Connexion sécurisée via OAuth (Google)

### Pour les Administrateurs
- 🛠️ Création de templates d'année (S1 et/ou S2)
- 📋 Structure complète : UE → Modules → Évaluations
- ✏️ Gestion des types d'évaluations (TP, TD, CC, PRJ, etc.)
- 🔄 Versioning automatique des templates

## Stack Technique

- **Framework**: Next.js 16 (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **Auth**: NextAuth.js
- **Database**: MongoDB
- **Hébergement**: Contabo VPS

## Installation

```bash
# Cloner le repo
git clone <repo-url>
cd myefrei-grades

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Remplir les variables dans .env

# Lancer en développement
npm run dev
```

## Variables d'Environnement

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="" // Add your Google Client ID here
GOOGLE_CLIENT_SECRET="" // Add your Google Client Secret here
MONGODB_URI="" // Add your MongoDB connection string here
NEXTAUTH_SECRET="" // Add a strong secret for NextAuth here

# New Relic Configuration
ENABLE_NEW_RELIC="false" // Set to "true" to enable New Relic monitoring
NODE_ENV="development" // Set the environment to "development" or "production"
NEW_RELIC_APP_NAME="myEfreiGrades-Dev" // Set your New Relic application name
NEW_RELIC_LICENSE_KEY="YOUR_NEW_RELIC_LICENSE_KEY" // Add your New Relic license key here
```

## Structure du Projet

```
app/
├───admin
│   └───year-templates
│       ├───create
│       └───edit
│           └───[id]
├───api
│   ├───admin
│   │   └───year-templates
│   │       └───[id]
│   │           └───sync
│   ├───auth
│   │   └───[...nextauth]
│   ├───grades
│   │   ├───cursus
│   │   ├───filieres
│   │   ├───groupes
│   │   ├───paths
│   │   ├───semesters
│   │   ├───setup-profile
│   │   └───stats
│   └───user
│       └───check-admin
├───components
│   ├───main_components
│   └───pages
├───grades
├───legal
├───lib
│   ├───grades
│   ├───hooks
│   └───user
├───privacy
├───setup
├───statistics
└───terms
```

## Gestion des Templates

### Concept
1 Template = 1 Année complète (peut contenir S1, S2, ou les deux)

```javascript
{
  name: "P1 PLUS - 2024-2025",
  code: "PGE_P1_PLUS_2024-2025",
  semesters: [
    { semester: 1, ues: [...], totalECTS: 30 },
    { semester: 2, ues: [...], totalECTS: 30 }
  ]
}
```

### Workflow
1. Admin crée un template d'année avec S1 et/ou S2
2. Étudiant ajoute le parcours à son profil
3. Interface affiche automatiquement les onglets S1/S2
4. Si un semestre n'est pas défini → message "Non défini"
5. Quand admin ajoute S2 → apparaît automatiquement

## Développement

```bash
npm run dev      # Développement
npm run build    # Build production
npm run start    # Production
npm run lint     # Vérification ESLint
```

## License

Projet personnel - Tous droits réservés
