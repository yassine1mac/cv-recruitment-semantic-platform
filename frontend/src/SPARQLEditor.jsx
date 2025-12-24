import { useState, useEffect } from 'react';
import { Play, BookOpen, Copy, Download, AlertCircle, CheckCircle, Code2, Sparkles, X, ArrowLeft } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

function SPARQLEditor({ onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [examples, setExamples] = useState([]);
  const [showExamples, setShowExamples] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadExamples();
  }, []);

  const loadExamples = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/sparql/examples`);
      setExamples(response.data.examples);
      if (response.data.examples.length > 0) {
        setQuery(response.data.examples[0].query);
      }
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const executeQuery = async () => {
    if (!query.trim()) {
      setError('Veuillez entrer une requête SPARQL');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_BASE_URL}/sparql/execute`, {
        query: query
      });

      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'exécution');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const loadExample = (example) => {
    setQuery(example.query);
    setResults(null);
    setError(null);
  };

  const copyQuery = () => {
    navigator.clipboard.writeText(query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadResults = () => {
    if (!results || !results.results) return;
    
    const dataStr = JSON.stringify(results.results, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'sparql_results.json');
    linkElement.click();
  };

  const handleKeyPress = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      executeQuery();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex flex-col">
      {/* Header Design TOP */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 shadow-2xl">
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
                  Éditeur SPARQL Interactif
                </h1>
                <p className="text-purple-200 text-sm">
                  Testez vos requêtes SPARQL en temps réel
                </p>
              </div>
            </div>
            
            {onClose && (
              <button
                onClick={onClose}
                className="p-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all text-white"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 flex-1">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Exemples */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
              <button
                onClick={() => setShowExamples(!showExamples)}
                className="w-full flex items-center justify-between mb-4 text-lg font-bold text-gray-800 hover:text-purple-600 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Exemples ({examples.length})
                </span>
                <span className="text-sm">{showExamples ? '▼' : '▶'}</span>
              </button>

              {showExamples && (
                <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
                  {examples.map((example, idx) => (
                    <div
                      key={idx}
                      onClick={() => loadExample(example)}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 cursor-pointer transition-all group"
                    >
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5 group-hover:animate-pulse" />
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800 group-hover:text-purple-700 transition-colors">
                            {example.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {example.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Éditeur et résultats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Éditeur */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Code2 className="w-6 h-6 text-purple-600" />
                  Requête SPARQL
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={copyQuery}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                      copied
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Copié !
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copier
                      </>
                    )}
                  </button>
                  <button
                    onClick={executeQuery}
                    disabled={loading}
                    className={`px-6 py-2 rounded-lg flex items-center gap-2 font-medium transition-all ${
                      loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700 hover:shadow-lg'
                    } text-white`}
                  >
                    <Play className={`w-5 h-5 ${loading ? 'animate-pulse' : ''}`} />
                    {loading ? 'Exécution...' : 'Exécuter (Ctrl+Enter)'}
                  </button>
                </div>
              </div>

              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Entrez votre requête SPARQL ici..."
                className="w-full h-64 p-4 font-mono text-sm border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none resize-none bg-gray-50"
              />

              <div className="mt-3 text-sm text-gray-600 flex items-center gap-4">
                <span>💡 Astuce: Utilisez Ctrl+Enter pour exécuter</span>
                <span>📝 {query.split('\n').length} lignes</span>
              </div>
            </div>

            {/* Messages d'erreur */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3 animate-shake">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-red-800 mb-1">Erreur</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Messages de succès */}
            {results && results.success && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-bold text-green-800 mb-1">Succès !</h3>
                  <p className="text-green-700 text-sm">{results.message}</p>
                </div>
                {results.count > 0 && (
                  <button
                    onClick={downloadResults}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger JSON
                  </button>
                )}
              </div>
            )}

            {/* Résultats */}
            {results && results.results && results.results.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  Résultats ({results.count})
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-purple-100">
                        <th className="border border-purple-300 px-4 py-3 text-left font-semibold text-purple-900">
                          #
                        </th>
                        {results.columns && results.columns.map((col, idx) => (
                          <th
                            key={idx}
                            className="border border-purple-300 px-4 py-3 text-left font-semibold text-purple-900"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.results.map((row, rowIdx) => (
                        <tr
                          key={rowIdx}
                          className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        >
                          <td className="border border-gray-300 px-4 py-3 text-gray-600 font-medium">
                            {rowIdx + 1}
                          </td>
                          {results.columns && results.columns.map((col, colIdx) => (
                            <td
                              key={colIdx}
                              className="border border-gray-300 px-4 py-3 text-gray-800"
                            >
                              {row[col] || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {results.count > 10 && (
                  <div className="mt-4 text-center text-sm text-gray-600">
                    Affichage de {results.count} résultats
                  </div>
                )}
              </div>
            )}

            {/* Aucun résultat */}
            {results && results.results && results.results.length === 0 && (
              <div className="bg-gray-50 rounded-lg p-12 text-center">
                <Code2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun résultat</h3>
                <p className="text-gray-600">La requête n'a retourné aucune donnée.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SPARQLEditor;