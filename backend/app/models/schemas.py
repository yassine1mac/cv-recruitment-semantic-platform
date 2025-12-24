from pydantic import BaseModel, EmailStr
from typing import List, Optional

class Skill(BaseModel):
    name: str
    type: str  # "technical" ou "soft"

class Degree(BaseModel):
    name: str
    level: str
    year: Optional[int] = None

class Experience(BaseModel):
    jobTitle: str
    company: str
    duration: int
    startYear: int
    endYear: int

class Candidate(BaseModel):
    id: str
    name: str
    email: str
    yearsOfExperience: int
    profile: Optional[str] = None
    skills: List[Skill]
    degree: Optional[Degree] = None
    experiences: List[Experience]

class SearchFilters(BaseModel):
    skills: Optional[List[str]] = []
    minExperience: Optional[int] = 0
    minDegreeLevel: Optional[str] = None
    profile: Optional[str] = None
    searchTerm: Optional[str] = ""