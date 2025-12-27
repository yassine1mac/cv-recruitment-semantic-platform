from rdflib import Graph, Namespace, RDF, RDFS, Literal
from typing import List, Dict, Optional
from app.config import settings
import os

class RDFService:
    def __init__(self):
        self.graph = Graph()
        self.cv_ns = Namespace(settings.CV_NAMESPACE)
        
        # Charger l'ontologie
        ontology_path = os.path.join(os.path.dirname(__file__), '..', '..', settings.ONTOLOGY_FILE)
        try:
            self.graph.parse(ontology_path, format='turtle')
            print(f"✅ Ontologie chargée avec succès : {len(self.graph)} triplets")
        except Exception as e:
            print(f"❌ Erreur de chargement de l'ontologie : {e}")
            raise
        
        # Définir les namespaces
        self.graph.bind("cv", self.cv_ns)
    
    def get_all_candidates(self) -> List[Dict]:
        """Récupère tous les candidats avec leurs informations complètes"""
        query = f"""
        PREFIX : <{settings.CV_NAMESPACE}>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
        
        SELECT ?person ?name ?email ?experience
        WHERE {{
            ?person a :Person ;
                    :name ?name ;
                    :email ?email ;
                    :yearsOfExperience ?experience .
        }}
        ORDER BY DESC(?experience)
        """
        
        results = self.graph.query(query)
        candidates = []
        
        for row in results:
            candidate_uri = str(row.person)
            candidate = {
                'id': candidate_uri.split('#')[-1],
                'name': str(row.name),
                'email': str(row.email),
                'yearsOfExperience': int(row.experience),
                'profile': self._get_profile(candidate_uri),
                'skills': self._get_skills(candidate_uri),
                'degree': self._get_degree(candidate_uri),
                'experiences': self._get_experiences(candidate_uri)
            }
            candidates.append(candidate)
        
        return candidates
    
    def search_candidates(self, filters: Dict) -> List[Dict]:
        """Recherche de candidats avec filtres"""
        all_candidates = self.get_all_candidates()
        filtered = []
        
        for candidate in all_candidates:
            # Filtre par nom
            if filters.get('searchTerm'):
                if filters['searchTerm'].lower() not in candidate['name'].lower():
                    continue
            
            # Filtre par compétences (doit avoir TOUTES les compétences demandées)
            if filters.get('skills'):
                candidate_skills = [s['name'] for s in candidate['skills']]
                if not all(skill in candidate_skills for skill in filters['skills']):
                    continue
            
            # Filtre par expérience minimale
            if filters.get('minExperience', 0) > 0:
                if candidate['yearsOfExperience'] < filters['minExperience']:
                    continue
            
            # Filtre par niveau de diplôme
            if filters.get('minDegreeLevel'):
                degree_scores = {"Bac+2": 2, "Bac+3": 3, "Bac+5": 5, "Doctorat": 8}
                min_score = degree_scores.get(filters['minDegreeLevel'], 0)
                candidate_score = degree_scores.get(candidate.get('degree', {}).get('level', ''), 0)
                if candidate_score < min_score:
                    continue
            
            # Filtre par profil
            if filters.get('profile'):
                if candidate.get('profile') != filters['profile']:
                    continue
            
            filtered.append(candidate)
        
        return filtered
    
    def get_candidate_by_id(self, candidate_id: str) -> Optional[Dict]:
        """Récupère un candidat spécifique par son ID"""
        candidate_uri = f"{settings.CV_NAMESPACE}{candidate_id}"
        
        query = f"""
        PREFIX : <{settings.CV_NAMESPACE}>
        
        SELECT ?name ?email ?experience
        WHERE {{
            <{candidate_uri}> a :Person ;
                             :name ?name ;
                             :email ?email ;
                             :yearsOfExperience ?experience .
        }}
        """
        
        results = list(self.graph.query(query))
        if not results:
            return None
        
        row = results[0]
        return {
            'id': candidate_id,
            'name': str(row.name),
            'email': str(row.email),
            'yearsOfExperience': int(row.experience),
            'profile': self._get_profile(candidate_uri),
            'skills': self._get_skills(candidate_uri),
            'degree': self._get_degree(candidate_uri),
            'experiences': self._get_experiences(candidate_uri)
        }
    
    def get_all_skills(self) -> List[Dict]:
        """Récupère toutes les compétences disponibles"""
        query = f"""
        PREFIX : <{settings.CV_NAMESPACE}>
        
        SELECT DISTINCT ?skill ?skillName ?type
        WHERE {{
            ?skill a ?type ;
                   :skillName ?skillName .
            FILTER(?type = :TechnicalSkill || ?type = :SoftSkill)
        }}
        ORDER BY ?skillName
        """
        
        results = self.graph.query(query)
        skills = []
        
        for row in results:
            skill_type = "technical" if "TechnicalSkill" in str(row.type) else "soft"
            skills.append({
                'id': str(row.skill).split('#')[-1],
                'name': str(row.skillName),
                'type': skill_type
            })
        
        return skills
    
    def get_all_profiles(self) -> List[str]:
        """Récupère tous les profils disponibles (labels si dispo)"""
        query = f"""
        PREFIX : <{settings.CV_NAMESPACE}>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

        SELECT DISTINCT ?profile ?label
        WHERE {{
            ?person a :Person ;
                    :hasProfile ?profile .
            OPTIONAL {{ ?profile rdfs:label ?label . }}
        }}
        """

        results = list(self.graph.query(query))

        # group labels by profile URI
        by_profile = {}
        for row in results:
            p = str(row.profile)
            by_profile.setdefault(p, []).append(row.label if row.label else None)

        profiles = []
        for p, labels in by_profile.items():
            labels = [l for l in labels if l]
            chosen = None
            for l in labels:
                if getattr(l, "language", None) == "fr":
                    chosen = str(l); break
            if not chosen:
                for l in labels:
                    if getattr(l, "language", None) == "en":
                        chosen = str(l); break
            if not chosen:
                chosen = p.split("#")[-1].split("/")[-1]
            profiles.append(chosen)

        return sorted(set(profiles))
    
    def _get_profile(self, person_uri: str) -> Optional[str]:
        """Récupère le profil d'une personne (label si dispo, sinon nom local)"""
        query = f"""
        PREFIX : <{settings.CV_NAMESPACE}>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

        SELECT ?profile ?label
        WHERE {{
            <{person_uri}> :hasProfile ?profile .
            OPTIONAL {{ ?profile rdfs:label ?label . }}
        }}
        """

        rows = list(self.graph.query(query))
        if not rows:
            return None

        profile_uri = str(rows[0].profile)

        # choisir label fr puis en si présent
        labels = [row.label for row in rows if row.label]
        for l in labels:
            if getattr(l, "language", None) == "fr":
                return str(l)
        for l in labels:
            if getattr(l, "language", None) == "en":
                return str(l)

        # fallback : DataScientist / CloudEngineer ...
        return profile_uri.split("#")[-1].split("/")[-1]

    
    def _get_skills(self, person_uri: str) -> List[Dict]:
        """Récupère les compétences d'une personne"""
        query = f"""
        PREFIX : <{settings.CV_NAMESPACE}>
        
        SELECT ?skillName ?type
        WHERE {{
            <{person_uri}> :hasSkill ?skill .
            ?skill :skillName ?skillName ;
                   a ?type .
            FILTER(?type = :TechnicalSkill || ?type = :SoftSkill)
        }}
        """
        
        results = self.graph.query(query)
        skills = []
        
        for row in results:
            skill_type = "technical" if "TechnicalSkill" in str(row.type) else "soft"
            skills.append({
                'name': str(row.skillName),
                'type': skill_type
            })
        
        return skills
    
    def _get_degree(self, person_uri: str) -> Optional[Dict]:
        """Récupère le diplôme d'une personne"""
        query = f"""
        PREFIX : <{settings.CV_NAMESPACE}>
        
        SELECT ?degreeName ?degreeLevel ?yearObtained
        WHERE {{
            <{person_uri}> :hasDegree ?degree .
            ?degree :degreeName ?degreeName ;
                    :degreeLevel ?degreeLevel .
            OPTIONAL {{ ?degree :yearObtained ?yearObtained }}
        }}
        """
        
        results = list(self.graph.query(query))
        if results:
            row = results[0]
            return {
                'name': str(row.degreeName),
                'level': str(row.degreeLevel),
                'year': int(row.yearObtained) if row.yearObtained else None
            }
        return None
    
    def _get_experiences(self, person_uri: str) -> List[Dict]:
        """Récupère les expériences d'une personne"""
        query = f"""
        PREFIX : <{settings.CV_NAMESPACE}>
        
        SELECT ?jobTitle ?company ?duration ?startYear ?endYear
        WHERE {{
            <{person_uri}> :hasExperience ?exp .
            ?exp :jobTitle ?jobTitle ;
                 :company ?company ;
                 :duration ?duration ;
                 :startYear ?startYear ;
                 :endYear ?endYear .
        }}
        """
        
        results = self.graph.query(query)
        experiences = []
        
        for row in results:
            experiences.append({
                'jobTitle': str(row.jobTitle),
                'company': str(row.company),
                'duration': int(row.duration),
                'startYear': int(row.startYear),
                'endYear': int(row.endYear)
            })
        
        return experiences

# Instance globale
rdf_service = RDFService()