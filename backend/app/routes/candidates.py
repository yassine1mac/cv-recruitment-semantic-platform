from fastapi import APIRouter, HTTPException, status
from typing import List
from pydantic import BaseModel
from app.models.schemas import Candidate, SearchFilters
from app.services.rdf_service import rdf_service

router = APIRouter()

# Modèle pour les requêtes SPARQL
class SPARQLQuery(BaseModel):
    query: str

@router.get("/candidates", response_model=List[Candidate])
async def get_all_candidates():
    """
    Récupère tous les candidats de l'ontologie
    """
    try:
        candidates = rdf_service.get_all_candidates()
        return candidates
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des candidats: {str(e)}"
        )

@router.post("/candidates/search", response_model=List[Candidate])
async def search_candidates(filters: SearchFilters):
    """
    Recherche de candidats avec filtres multiples
    
    Filtres disponibles:
    - skills: Liste de compétences requises (le candidat doit les avoir TOUTES)
    - minExperience: Années d'expérience minimales
    - minDegreeLevel: Niveau de diplôme minimum (Bac+2, Bac+3, Bac+5, Doctorat)
    - profile: Profil professionnel recherché
    - searchTerm: Recherche dans le nom du candidat
    """
    try:
        candidates = rdf_service.search_candidates(filters.dict())
        return candidates
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la recherche: {str(e)}"
        )

@router.get("/candidates/{candidate_id}", response_model=Candidate)
async def get_candidate(candidate_id: str):
    """
    Récupère un candidat spécifique par son ID
    
    Exemple: /api/candidates/Candidate1
    """
    try:
        candidate = rdf_service.get_candidate_by_id(candidate_id)
        if not candidate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Candidat {candidate_id} non trouvé"
            )
        return candidate
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur: {str(e)}"
        )

@router.get("/skills")
async def get_all_skills():
    """
    Récupère toutes les compétences disponibles dans l'ontologie
    
    Retourne une liste avec:
    - name: Nom de la compétence
    - type: "technical" ou "soft"
    """
    try:
        skills = rdf_service.get_all_skills()
        return {
            "total": len(skills),
            "technical": [s for s in skills if s['type'] == 'technical'],
            "soft": [s for s in skills if s['type'] == 'soft'],
            "all": skills
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur: {str(e)}"
        )

@router.get("/profiles")
async def get_all_profiles():
    """
    Récupère tous les profils professionnels disponibles
    """
    try:
        profiles = rdf_service.get_all_profiles()
        return {
            "total": len(profiles),
            "profiles": profiles
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur: {str(e)}"
        )

@router.get("/stats")
async def get_statistics():
    """
    Récupère des statistiques sur les candidats
    """
    try:
        candidates = rdf_service.get_all_candidates()
        skills = rdf_service.get_all_skills()
        profiles = rdf_service.get_all_profiles()
        
        # Calculer quelques statistiques
        total_candidates = len(candidates)
        avg_experience = sum(c['yearsOfExperience'] for c in candidates) / total_candidates if total_candidates > 0 else 0
        
        # Compter les candidats par profil
        profile_distribution = {}
        for c in candidates:
            profile = c.get('profile', 'Non défini')
            profile_distribution[profile] = profile_distribution.get(profile, 0) + 1
        
        # Compétences les plus demandées
        skill_count = {}
        for c in candidates:
            for skill in c['skills']:
                skill_name = skill['name']
                skill_count[skill_name] = skill_count.get(skill_name, 0) + 1
        
        most_common_skills = sorted(skill_count.items(), key=lambda x: x[1], reverse=True)[:10]
        
        return {
            "total_candidates": total_candidates,
            "total_skills": len(skills),
            "total_profiles": len(profiles),
            "average_experience": round(avg_experience, 1),
            "profile_distribution": profile_distribution,
            "most_common_skills": [
                {"skill": skill, "count": count} 
                for skill, count in most_common_skills
            ]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur: {str(e)}"
        )

# ============= NOUVELLES ROUTES SPARQL =============

@router.post("/sparql/execute")
async def execute_sparql(sparql_query: SPARQLQuery):
    """
    Exécute une requête SPARQL personnalisée
    
    Permet au professeur de tester des requêtes SPARQL directement
    depuis l'interface web
    """
    try:
        # Exécuter la requête
        results = list(rdf_service.graph.query(sparql_query.query))
        
        # Convertir les résultats en format JSON
        if not results:
            return {
                "success": True,
                "results": [],
                "count": 0,
                "message": "Requête exécutée avec succès - Aucun résultat"
            }
        
        # Extraire les noms de colonnes et formater les résultats
        formatted_results = []
        columns = []
        
        if results and len(results) > 0:
            # Obtenir les variables (colonnes)
            first_row = results[0]
            if hasattr(first_row, 'labels'):
                columns = [str(var) for var in first_row.labels]
            elif hasattr(first_row, '__iter__') and not isinstance(first_row, str):
                # Essayer de détecter les variables
                columns = [f"var{i}" for i in range(len(first_row))]
            
            # Formater chaque ligne
            for row in results:
                if hasattr(row, 'asdict'):
                    # Si la ligne a une méthode asdict
                    formatted_results.append(row.asdict())
                elif hasattr(row, '__iter__') and not isinstance(row, str):
                    # Si la ligne est itérable
                    row_data = {}
                    for i, value in enumerate(row):
                        col_name = columns[i] if i < len(columns) else f"var{i}"
                        row_data[col_name] = str(value) if value is not None else None
                    formatted_results.append(row_data)
                else:
                    # Cas par défaut
                    formatted_results.append({"result": str(row)})
        
        return {
            "success": True,
            "results": formatted_results,
            "columns": columns if columns else list(formatted_results[0].keys()) if formatted_results else [],
            "count": len(formatted_results),
            "message": f"{len(formatted_results)} résultat(s) trouvé(s)"
        }
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreur SPARQL: {str(e)}"
        )

@router.get("/sparql/examples")
async def get_sparql_examples():
    """
    Retourne des exemples de requêtes SPARQL prédéfinies
    """
    examples = [
        {
            "name": "Tous les candidats",
            "description": "Liste tous les candidats avec leurs emails et années d'expérience",
            "query": """PREFIX : <http://www.semanticweb.org/ontologies/cv#>

SELECT ?name ?email ?experience
WHERE {
    ?person a :Person ;
            :name ?name ;
            :email ?email ;
            :yearsOfExperience ?experience .
}
ORDER BY DESC(?experience)"""
        },
        {
            "name": "Candidats Python",
            "description": "Tous les candidats maîtrisant Python",
            "query": """PREFIX : <http://www.semanticweb.org/ontologies/cv#>

SELECT ?name ?email
WHERE {
    ?person a :Person ;
            :name ?name ;
            :email ?email ;
            :hasSkill :Python .
}"""
        },
        {
            "name": "Profils Data Science",
            "description": "Candidats avec Python ET Machine Learning",
            "query": """PREFIX : <http://www.semanticweb.org/ontologies/cv#>

SELECT ?name ?experience
WHERE {
    ?person a :Person ;
            :name ?name ;
            :yearsOfExperience ?experience ;
            :hasSkill :Python ;
            :hasSkill :MachineLearning .
}
ORDER BY DESC(?experience)"""
        },
        {
            "name": "Seniors Bac+5",
            "description": "Candidats avec Bac+5 et 5+ ans d'expérience",
            "query": """PREFIX : <http://www.semanticweb.org/ontologies/cv#>

SELECT ?name ?degreeName ?experience
WHERE {
    ?person a :Person ;
            :name ?name ;
            :yearsOfExperience ?experience ;
            :hasDegree ?degree .
    ?degree :degreeLevel "Bac+5" ;
            :degreeName ?degreeName .
    FILTER(?experience >= 5)
}
ORDER BY DESC(?experience)"""
        },
        {
            "name": "Statistiques compétences",
            "description": "Nombre de candidats par compétence technique",
            "query": """PREFIX : <http://www.semanticweb.org/ontologies/cv#>

SELECT ?skillName (COUNT(?person) as ?count)
WHERE {
    ?person a :Person ;
            :hasSkill ?skill .
    ?skill a :TechnicalSkill ;
           :skillName ?skillName .
}
GROUP BY ?skillName
ORDER BY DESC(?count)"""
        },
        {
            "name": "Full Stack Developers",
            "description": "Candidats avec JavaScript ET Node.js",
            "query": """PREFIX : <http://www.semanticweb.org/ontologies/cv#>

SELECT ?name ?profile
WHERE {
    ?person a :Person ;
            :name ?name ;
            :hasSkill :JavaScript ;
            :hasSkill :NodeJS .
    OPTIONAL { 
        ?person :hasProfile ?prof .
        BIND(REPLACE(STR(?prof), ".*#", "") AS ?profile)
    }
}"""
        },
        {
            "name": "Expériences détaillées",
            "description": "Liste complète des expériences professionnelles",
            "query": """PREFIX : <http://www.semanticweb.org/ontologies/cv#>

SELECT ?name ?jobTitle ?company ?duration ?startYear ?endYear
WHERE {
    ?person a :Person ;
            :name ?name ;
            :hasExperience ?exp .
    ?exp :jobTitle ?jobTitle ;
         :company ?company ;
         :duration ?duration ;
         :startYear ?startYear ;
         :endYear ?endYear .
}
ORDER BY ?name ?startYear"""
        },
        {
            "name": "Toutes les compétences",
            "description": "Liste de toutes les compétences techniques disponibles",
            "query": """PREFIX : <http://www.semanticweb.org/ontologies/cv#>

SELECT DISTINCT ?skillName
WHERE {
    ?skill a :TechnicalSkill ;
           :skillName ?skillName .
}
ORDER BY ?skillName"""
        },
        {
            "name": "Diplômes par niveau",
            "description": "Comptage des candidats par niveau de diplôme",
            "query": """PREFIX : <http://www.semanticweb.org/ontologies/cv#>

SELECT ?degreeLevel (COUNT(?person) as ?count)
WHERE {
    ?person a :Person ;
            :hasDegree ?degree .
    ?degree :degreeLevel ?degreeLevel .
}
GROUP BY ?degreeLevel
ORDER BY ?degreeLevel"""
        },
        {
            "name": "Soft Skills",
            "description": "Liste des compétences transversales de tous les candidats",
            "query": """PREFIX : <http://www.semanticweb.org/ontologies/cv#>

SELECT ?name ?skillName
WHERE {
    ?person a :Person ;
            :name ?name ;
            :hasSkill ?skill .
    ?skill a :SoftSkill ;
           :skillName ?skillName .
}
ORDER BY ?name"""
        }
    ]
    
    return {
        "examples": examples,
        "count": len(examples)
    }