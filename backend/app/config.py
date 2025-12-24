import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    ONTOLOGY_FILE = os.getenv("ONTOLOGY_FILE", "cv_ontology.ttl")
    CV_NAMESPACE = os.getenv("CV_NAMESPACE", "http://www.semanticweb.org/ontologies/cv#")

settings = Settings()