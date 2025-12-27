import { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Users, Award, Briefcase, ArrowLeft, Download } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];

function Visualizations({ onClose }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [skillsData, setSkillsData] = useState([]);
  const [profilesData, setProfilesData] = useState([]);
  const [experienceData, setExperienceData] = useState([]);
  const [degreeData, setDegreeData] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [statsRes, candidatesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/stats`),
        axios.get(`${API_BASE_URL}/candidates`)
      ]);

      const statsData = statsRes.data;
      const candidatesData = candidatesRes.data;

      setStats(statsData);
      setCandidates(candidatesData);

      // Préparer les données pour les graphiques
      
      // 1. Compétences les plus demandées
      const skillsChart = statsData.most_common_skills.map(item => ({
        name: item.skill,
        count: item.count,
        percentage: ((item.count / statsData.total_candidates) * 100).toFixed(1)
      }));
      setSkillsData(skillsChart);

      // 2. Distribution des profils (calculée depuis les candidats)
      const profileDistribution = {};
      candidatesData.forEach(c => {
        const p =
          c.profile?.name ??      // si profile est un objet {name: "..."}
          c.profile ??            // si profile est juste une string
          'Non défini';

        profileDistribution[p] = (profileDistribution[p] || 0) + 1;
      });

      const profiles = Object.entries(profileDistribution).map(([name, count]) => ({
        name,
        value: count,
        percentage: ((count / statsData.total_candidates) * 100).toFixed(1)
      }));

      setProfilesData(profiles);

      // 3. Distribution par années d'expérience
      const expDistribution = {};
      candidatesData.forEach(c => {
        const years = c.yearsOfExperience;
        const range = years < 2 ? '0-2 ans' : 
                     years < 5 ? '2-5 ans' : 
                     years < 8 ? '5-8 ans' : '8+ ans';
        expDistribution[range] = (expDistribution[range] || 0) + 1;
      });
      
      const expData = Object.entries(expDistribution).map(([range, count]) => ({
        range,
        count,
        percentage: ((count / statsData.total_candidates) * 100).toFixed(1)
      }));
      setExperienceData(expData);

      // 4. Distribution par niveau de diplôme
      const degreeDistribution = {};
      candidatesData.forEach(c => {
        if (c.degree) {
          const level = c.degree.level;
          degreeDistribution[level] = (degreeDistribution[level] || 0) + 1;
        }
      });
      
      const degData = Object.entries(degreeDistribution)
        .map(([level, count]) => ({
          level,
          count,
          percentage: ((count / statsData.total_candidates) * 100).toFixed(1)
        }))
        .sort((a, b) => {
          const order = { "Bac+2": 1, "Bac+3": 2, "Bac+5": 3, "Doctorat": 4 };
          return order[a.level] - order[b.level];
        });
      setDegreeData(degData);

    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border-2 border-indigo-200 rounded-lg shadow-lg">
          <p className="font-bold text-gray-800">{label || payload[0].name}</p>
          <p className="text-indigo-600">
            {payload[0].value} candidat{payload[0].value > 1 ? 's' : ''}
            {payload[0].payload.percentage && ` (${payload[0].payload.percentage}%)`}
          </p>
        </div>
      );
    }
    return null;
  };

  const downloadChart = (chartName) => {
    alert(`Fonctionnalité d'export "${chartName}" - À implémenter avec html2canvas`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-700">Chargement des graphiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex flex-col">
      {/* Header Design TOP */}
      <div className="bg-gradient-to-r from-green-900 via-teal-900 to-green-900 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 blur-xl rounded-full"></div>
                <img 
                  src="/LOGOENSA.jpeg" 
                  alt="ENSA Agadir" 
                  className="relative h-20 w-auto rounded-xl shadow-2xl border-4 border-white/30"
                />
              </div>
              
              <button
                onClick={onClose}
                className="p-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all text-white"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              
              <div className="border-l-2 border-white/30 pl-6">
                <h1 className="text-3xl font-black text-white mb-1">
                  Visualisations & Analytiques
                </h1>
                <p className="text-green-200 text-sm">
                  Analyse graphique des données de l'ontologie
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 flex-1">

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-3 rounded-lg">
                <Users className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Candidats</p>
                <p className="text-3xl font-bold text-indigo-600">{stats?.total_candidates}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <Award className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Compétences</p>
                <p className="text-3xl font-bold text-green-600">{stats?.total_skills}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Briefcase className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Profils</p>
                <p className="text-3xl font-bold text-purple-600">{stats?.total_profiles}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-3 rounded-lg">
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Exp. Moyenne</p>
                <p className="text-3xl font-bold text-orange-600">{stats?.average_experience} ans</p>
              </div>
            </div>
          </div>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Compétences les plus demandées */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">📊 Compétences les Plus Demandées</h2>
              <button
                onClick={() => downloadChart('competences')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Télécharger le graphique"
              >
                <Download className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={skillsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]}>
                  {skillsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-sm text-gray-600 mt-4 text-center">
              Top {skillsData.length} compétences techniques par nombre de candidats
            </p>
          </div>

          {/* Distribution des profils */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">🥧 Distribution des Profils</h2>
              <button
                onClick={() => downloadChart('profils')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Download className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={profilesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {profilesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4">
              <div className="grid grid-cols-2 gap-2">
                {profilesData.map((profile, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    ></div>
                    <span className="text-sm text-gray-700">
                      {profile.name}: {profile.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Distribution par expérience */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">📈 Répartition par Expérience</h2>
              <button
                onClick={() => downloadChart('experience')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Download className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={experienceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="range" type="category" width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#10b981" radius={[0, 8, 8, 0]}>
                  {experienceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-sm text-gray-600 mt-4 text-center">
              Distribution des candidats par années d'expérience
            </p>
          </div>

          {/* Distribution par diplôme */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">🎓 Répartition par Diplôme</h2>
              <button
                onClick={() => downloadChart('diplomes')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Download className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={degreeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="level" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-sm text-gray-600 mt-4 text-center">
              Évolution du nombre de candidats par niveau de diplôme
            </p>
          </div>
        </div>

        {/* Timeline des candidats */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">⏱️ Timeline des Expériences</h2>
          <div className="space-y-4">
            {candidates.slice(0, 5).map((candidate, idx) => (
              <div key={idx} className="border-l-4 border-indigo-500 pl-4 pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-indigo-100 p-2 rounded-full">
                    <Users className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{candidate.name}</h3>
                    <p className="text-sm text-gray-600">{candidate.yearsOfExperience} ans d'expérience</p>
                  </div>
                </div>
                {candidate.experiences && candidate.experiences.length > 0 && (
                  <div className="ml-10 space-y-2">
                    {candidate.experiences.map((exp, expIdx) => (
                      <div key={expIdx} className="flex items-start gap-3 text-sm">
                        <div className="bg-purple-100 px-3 py-1 rounded-full text-purple-700 font-medium whitespace-nowrap">
                          {exp.startYear} - {exp.endYear}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{exp.jobTitle}</p>
                          <p className="text-gray-600">{exp.company} • {exp.duration} mois</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <h3 className="text-lg font-bold mb-2">💡 Insight #1</h3>
            <p className="text-blue-100">
              {skillsData[0]?.name} est la compétence la plus recherchée avec {skillsData[0]?.count} candidats ({skillsData[0]?.percentage}%)
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <h3 className="text-lg font-bold mb-2">💡 Insight #2</h3>
            <p className="text-purple-100">
              Le profil le plus représenté est "{profilesData[0]?.name}" avec {profilesData[0]?.value} candidat(s)
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <h3 className="text-lg font-bold mb-2">💡 Insight #3</h3>
            <p className="text-green-100">
              L'expérience moyenne est de {stats?.average_experience} ans, indiquant un niveau de séniorité élevé
            </p>
          </div>
        </div>
      </div>

      {/* Signature LYMZ */}
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

export default Visualizations;