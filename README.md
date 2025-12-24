# 🎓 Plateforme de Recrutement Sémantique - LYMZ

> Projet Web Sémantique - BDIA3 Semestre 5  
> ENSA Agadir - 2024/2025

## 📋 Description

Plateforme intelligente de recrutement basée sur une ontologie OWL pour la modélisation de CV et la sélection automatisée de candidats.

## ✨ Fonctionnalités

- 🔍 **Recherche Intelligente** : Filtrage multi-critères (compétences, diplômes, expérience)
- 💻 **Éditeur SPARQL Interactif** : Testez vos requêtes en temps réel
- 📊 **Visualisations Graphiques** : Analyses visuelles des données
- 🎯 **Sélection Automatique** : Règles logiques de matching
- 🌐 **Interface Moderne** : React + Tailwind CSS

## 🛠️ Technologies

### Backend
- **Python 3.11+**
- **FastAPI** - Framework web moderne
- **RDFLib** - Manipulation d'ontologies OWL
- **Uvicorn** - Serveur ASGI

### Frontend
- **React 18** - Framework JavaScript
- **Vite** - Build tool
- **Tailwind CSS** - Framework CSS
- **Recharts** - Visualisations graphiques
- **Axios** - Client HTTP
- **Lucide React** - Icônes

### Ontologie
- **Protégé** - Éditeur d'ontologie
- **OWL/Turtle** - Format de données
- **SPARQL** - Langage de requêtes

## 🚀 Installation

### Prérequis
- Python 3.11+
- Node.js 18+
- npm

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend
```bash
cd frontend
npm install
```

## ▶️ Lancement

### Terminal 1 - Backend
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

Le backend sera accessible sur http://localhost:8000

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

Le frontend sera accessible sur http://localhost:5173

## 📁 Structure du Projet
```
cv-recruitment-platform/
├── backend/
│   ├── app/
│   │   ├── main.py              # Application FastAPI
│   │   ├── config.py            # Configuration
│   │   ├── routes/
│   │   │   └── candidates.py    # Endpoints API
│   │   ├── services/
│   │   │   └── rdf_service.py   # Service RDFLib
│   │   └── models/
│   │       └── schemas.py       # Modèles Pydantic
│   ├── cv_ontology.ttl          # Ontologie OWL
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Composant principal
│   │   ├── SPARQLEditor.jsx     # Éditeur SPARQL
│   │   └── Visualizations.jsx   # Graphiques
│   └── package.json
└── README.md
```

## 🎯 Ontologie

### Classes Principales
- **Person** : Candidat
- **Skill** : Compétence (TechnicalSkill, SoftSkill)
- **Degree** : Diplôme
- **Experience** : Expérience professionnelle
- **Profile** : Profil (DataScientist, Developer, etc.)

### Propriétés
- `hasSkill` : Relie une personne à ses compétences
- `hasDegree` : Relie une personne à ses diplômes
- `hasExperience` : Relie une personne à ses expériences
- `hasProfile` : Relie une personne à son profil

## 📊 API Endpoints

### Candidats
- `GET /api/candidates` - Liste tous les candidats
- `POST /api/candidates/search` - Recherche avec filtres
- `GET /api/candidates/{id}` - Détails d'un candidat

### SPARQL
- `POST /api/sparql/execute` - Exécuter une requête SPARQL
- `GET /api/sparql/examples` - Exemples de requêtes

### Statistiques
- `GET /api/stats` - Statistiques globales
- `GET /api/skills` - Liste des compétences
- `GET /api/profiles` - Liste des profils

## 👥 Équipe - Groupe LYMZ

Projet réalisé dans le cadre du module **Ingénierie des Connaissances et Web Sémantique**.

## 📄 Licence

Projet académique - ENSA Agadir © 2024-2025

## 🙏 Remerciements

- Pr. Nisrine EL AYAT - Encadrement du projet
- ENSA Agadir - Formation BDIA3
