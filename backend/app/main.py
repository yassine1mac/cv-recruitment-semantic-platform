from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import candidates

app = FastAPI(
    title="CV Recruitment Platform API",
    description="API basée sur ontologie OWL avec Protégé",
    version="1.0.0"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, spécifiez les domaines autorisés
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclure les routes
app.include_router(candidates.router, prefix="/api", tags=["candidates"])

@app.get("/")
def read_root():
    return {
        "message": "API de Recrutement Sémantique avec Protégé",
        "docs": "/docs",
        "technology": "RDFLib + OWL"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)