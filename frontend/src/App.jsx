import { useState, useEffect } from 'react';
import { Search, Users, Award, Briefcase, Code, Filter, ChevronDown, ChevronUp, Mail, Calendar, Building, BarChart, Code2, TrendingUp } from 'lucide-react';
import axios from 'axios';
import SPARQLEditor from './SPARQLEditor';
import Visualizations from './Visualizations';

const API_BASE_URL = 'http://localhost:8000/api';

const api = {
  getAllCandidates: () => axios.get(`${API_BASE_URL}/candidates`),
  searchCandidates: (filters) => axios.post(`${API_BASE_URL}/candidates/search`, filters),
  getSkills: () => axios.get(`${API_BASE_URL}/skills`),
  getProfiles: () => axios.get(`${API_BASE_URL}/profiles`),
  getStats: () => axios.get(`${API_BASE_URL}/stats`)
};

function App() {
  const [candidates, setCandidates] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSPARQL, setShowSPARQL] = useState(false);
  const [showVisualizations, setShowVisualizations] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [minExperience, setMinExperience] = useState(0);
  const [minDegreeLevel, setMinDegreeLevel] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('');
  
  const [expandedCandidate, setExpandedCandidate] = useState(null);
  const [showFilters, setShowFilters] = useState(true);
  const [showStats, setShowStats] = useState(false);

  const degreeLevels = ["Bac+2", "Bac+3", "Bac+5", "Doctorat"];

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [candidatesRes, skillsRes, profilesRes, statsRes] = await Promise.all([
        api.getAllCandidates(),
        api.getSkills(),
        api.getProfiles(),
        api.getStats()
      ]);
      
      setCandidates(candidatesRes.data);
      setAllSkills(skillsRes.data.technical || []);
      setAllProfiles(profilesRes.data.profiles || []);
      setStats(statsRes.data);
      
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur de connexion. Vérifiez que le backend tourne sur http://localhost:8000');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const filters = { searchTerm, skills: selectedSkills, minExperience, minDegreeLevel, profile: selectedProfile };
      const response = await api.searchCandidates(filters);
      setCandidates(response.data);
    } catch (err) {
      console.error('Erreur de recherche:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && candidates.length >= 0) {
      const timer = setTimeout(() => handleSearch(), 300);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, selectedSkills, minExperience, minDegreeLevel, selectedProfile]);

  const toggleSkill = (skill) => {
    setSelectedSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const resetFilters = async () => {
    setSearchTerm('');
    setSelectedSkills([]);
    setMinExperience(0);
    setMinDegreeLevel('');
    setSelectedProfile('');
    await loadInitialData();
  };

  // Si on affiche l'éditeur SPARQL, on affiche uniquement celui-ci
  if (showSPARQL) {
    return <SPARQLEditor onClose={() => setShowSPARQL(false)} />;
  }

  // Si on affiche les visualisations, on affiche uniquement celles-ci
  if (showVisualizations) {
    return <Visualizations onClose={() => setShowVisualizations(false)} />;
  }

  if (loading && candidates.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-700">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error && candidates.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Erreur</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={loadInitialData} className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header Design TOP - Version claire */}
      <div className="bg-white shadow-xl border-b-4 border-indigo-500">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            {/* Partie gauche - Logo et titre */}
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-indigo-200 blur-2xl opacity-50 group-hover:opacity-70 transition-opacity rounded-full"></div>
                <img 
                  src="/LOGOENSA.jpeg" 
                  alt="ENSA Agadir" 
                  className="relative h-20 w-auto rounded-xl shadow-lg hover:shadow-2xl transition-all border-2 border-indigo-100"
                />
              </div>
              
              <div className="border-l-4 border-indigo-500 pl-6">
                <h1 className="text-3xl font-black text-gray-800 mb-1 tracking-tight">
                  Recrutement Sémantique
                </h1>
                <p className="text-indigo-600 text-sm font-semibold">
                  Ontologie de CV & Sélection Intelligente de Candidats
                </p>
                <div className="flex gap-2 mt-2">
                  <span className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full text-xs font-bold shadow-md">
                    BDIA3
                  </span>
                  <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-xs font-bold shadow-md">
                    Web Sémantique
                  </span>
                </div>
              </div>
            </div>

            {/* Partie droite - Actions */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowVisualizations(true)} 
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-xl hover:scale-105 font-semibold"
              >
                <TrendingUp className="w-5 h-5" />
                Visualisations
              </button>
              
              <button 
                onClick={() => setShowSPARQL(true)} 
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all shadow-md hover:shadow-xl hover:scale-105 font-semibold"
              >
                <Code2 className="w-5 h-5" />
                SPARQL
              </button>
              
              <button 
                onClick={() => setShowStats(!showStats)} 
                className="flex items-center gap-2 px-5 py-3 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 transition-all shadow-md font-semibold"
              >
                <BarChart className="w-5 h-5" />
                Stats
              </button>
              
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl px-6 py-3 shadow-lg">
                <p className="text-xs text-indigo-100 font-medium">Candidats trouvés</p>
                <p className="text-3xl font-black text-white">{candidates.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showStats && stats && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">📊 Statistiques</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Candidats</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.total_candidates}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Compétences</p>
                <p className="text-2xl font-bold text-green-600">{stats.total_skills}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Profils</p>
                <p className="text-2xl font-bold text-purple-600">{stats.total_profiles}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Exp. moyenne</p>
                <p className="text-2xl font-bold text-orange-600">{stats.average_experience} ans</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtres
                </h2>
                <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden">
                  {showFilters ? <ChevronUp /> : <ChevronDown />}
                </button>
              </div>

              <div className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                <div>
                  <label className="block text-sm font-medium mb-2">Recherche</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Nom..."
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Profil</label>
                  <select value={selectedProfile} onChange={(e) => setSelectedProfile(e.target.value)} className="w-full px-4 py-2 border rounded-lg">
                    <option value="">Tous</option>
                    {allProfiles.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Compétences ({selectedSkills.length})</label>
                  <div className="max-h-64 overflow-y-auto border rounded-lg p-2">
                    {allSkills.map(skill => (
                      <label key={skill.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSkills.includes(skill.name)}
                          onChange={() => toggleSkill(skill.name)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{skill.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Expérience: {minExperience} ans</label>
                  <input type="range" min="0" max="10" value={minExperience} onChange={(e) => setMinExperience(Number(e.target.value))} className="w-full" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Diplôme minimum</label>
                  <select value={minDegreeLevel} onChange={(e) => setMinDegreeLevel(e.target.value)} className="w-full px-4 py-2 border rounded-lg">
                    <option value="">Aucun</option>
                    {degreeLevels.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>

                <button onClick={resetFilters} className="w-full bg-gray-200 py-2 rounded-lg hover:bg-gray-300">
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {loading && (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p>Recherche...</p>
              </div>
            )}

            {!loading && candidates.length === 0 && (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Aucun candidat</h3>
                <button onClick={resetFilters} className="bg-indigo-600 text-white px-6 py-2 rounded-lg mt-4">
                  Réinitialiser
                </button>
              </div>
            )}

            {!loading && candidates.length > 0 && (
              <div className="space-y-4">
                {candidates.map(candidate => (
                  <div key={candidate.id} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6">
                    <div className="flex justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="bg-indigo-100 p-3 rounded-full">
                            <Users className="w-6 h-6 text-indigo-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">{candidate.name}</h3>
                            {candidate.profile && <p className="text-indigo-600 font-medium">{candidate.profile}</p>}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span className="text-sm">{candidate.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">{candidate.yearsOfExperience} ans</span>
                          </div>
                          {candidate.degree && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Award className="w-4 h-4" />
                              <span className="text-sm">{candidate.degree.level}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-gray-600">
                            <Briefcase className="w-4 h-4" />
                            <span className="text-sm">{candidate.experiences?.length || 0} exp.</span>
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">Compétences:</p>
                          <div className="flex flex-wrap gap-2">
                            {candidate.skills?.filter(s => s.type === 'technical').map((skill, idx) => (
                              <span
                                key={idx}
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  selectedSkills.includes(skill.name) ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'
                                }`}
                              >
                                {skill.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button onClick={() => setExpandedCandidate(expandedCandidate === candidate.id ? null : candidate.id)} className="ml-4 text-indigo-600">
                        {expandedCandidate === candidate.id ? <ChevronUp /> : <ChevronDown />}
                      </button>
                    </div>

                    {expandedCandidate === candidate.id && (
                      <div className="mt-6 pt-6 border-t space-y-4">
                        {candidate.degree && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                              <Award className="w-4 h-4" />
                              Diplôme
                            </h4>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="font-medium">{candidate.degree.name}</p>
                              <p className="text-sm text-gray-600">
                                {candidate.degree.level}{candidate.degree.year && ` • ${candidate.degree.year}`}
                              </p>
                            </div>
                          </div>
                        )}

                        {candidate.experiences && candidate.experiences.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                              <Briefcase className="w-4 h-4" />
                              Expériences
                            </h4>
                            {candidate.experiences.map((exp, idx) => (
                              <div key={idx} className="bg-gray-50 p-3 rounded-lg mb-2">
                                <p className="font-medium">{exp.jobTitle}</p>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Building className="w-3 h-3" />
                                  <span>{exp.company} • {exp.startYear}-{exp.endYear} • {exp.duration} mois</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {candidate.skills?.filter(s => s.type === 'soft').length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                              <Code className="w-4 h-4" />
                              Soft Skills
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {candidate.skills.filter(s => s.type === 'soft').map((skill, idx) => (
                                <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                  {skill.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3 mt-4">
                          <button className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700">
                            Contacter
                          </button>
                          <button className="flex-1 border-2 border-indigo-600 text-indigo-600 py-2 rounded-lg hover:bg-indigo-50">
                            Voir CV
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Signature LYMZ en bas */}
      <div className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-24 bg-gradient-to-r from-transparent to-gray-300"></div>
            <div className="signature text-6xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 tracking-wider">
              LYMZ
            </div>
            <div className="h-px w-24 bg-gradient-to-l from-transparent to-gray-300"></div>
          </div>
          <p className="text-center text-gray-500 text-sm mt-3 font-medium">
            ENSA Tetouan • 2025-2026
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;