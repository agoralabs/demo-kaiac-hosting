import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { PlusIcon, TrashIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';
import Layout from '../../../components/Layout';
import WebSitePage from '../../../components/WebSitePage';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
// Redirect types
const RULE_TYPES = {
  redirect: 'Redirection',
  rewrite: 'Réécriture'
};


export default function WebsiteRedirect() {
  const router = useRouter();
  const { id } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [website, setWebsite] = useState(null);
  const [redirects, setRedirects] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // New redirect form state
  const [newRedirect, setNewRedirect] = useState({
    type: 'redirect',
    name: '',
    source: '',
    destination: '',
    status_code: '301',
    condition: '',
    rewrite_rule: '',
    priority: 10,
    is_active: true
  });

  useEffect(() => {
    if (!id) return;
    
    // Fetch website details and existing redirects
    const fetchData = async () => {
      try {
        setLoading(true);
        const [websiteRes, redirectsRes] = await Promise.all([
          api.get(`/api/website/get-infos/${id}`),
          api.get(`/api/website/redirects/${id}`)
        ]);
        
        setWebsite(websiteRes.data.data);
        setRedirects(redirectsRes.data?.data || []);
      } catch (err) {
        setError('Failed to load website data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  // Generate OpenLiteSpeed rewrite rule based on redirect type
  const generateRewriteRule = (redirect) => {
    const { type, source, destination, status_code, condition } = redirect;
    
    // Si une règle personnalisée est fournie, l'utiliser
    if (redirect.rewrite_rule) {
      return redirect.rewrite_rule;
    }
    
    // Construire la règle avec la condition si elle existe
    let rule = '';
    if (condition) {
      rule += `${condition}\n`;
    }
    
    if (type === 'rewrite') {
      // Pour les réécritures, pas de status_code de redirection
      rule += `RewriteRule ^${source}$ ${destination} [L]`;
      return rule;
    } else {
      // Pour les redirections, inclure le status_code
      rule += `RewriteRule ^/?${source}$ ${destination} [L,R=${status_code}]`;
      return rule;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Si on change le type, mettre à jour les valeurs par défaut
    if (name === 'type') {
      if (value === 'rewrite') {
        setNewRedirect(prev => ({ 
          ...prev, 
          [name]: value,
          status_code: '', // Pas de status_code pour les réécritures
        }));
      } else {
        setNewRedirect(prev => ({ 
          ...prev, 
          [name]: value,
          status_code: '301', // status_code par défaut pour les redirections
        }));
      }
    } else {
      setNewRedirect(prev => ({ ...prev, [name]: value }));
    }
  };

  const addRedirect = async (e) => {
    e.preventDefault();
    
    if (!newRedirect.source || !newRedirect.destination) {
      setError('Source and destination are required');
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      
      // Generate the rewrite rule if not provided
      const rewriteRule = newRedirect.rewrite_rule || generateRewriteRule(newRedirect);
      
      // Save to backend
      await api.post(`/api/website/${id}/redirects`, {
        ...newRedirect,
        rewrite_rule: rewriteRule
      });
      
      // Update local state
      setRedirects([...redirects, { ...newRedirect, rewrite_rule: rewriteRule }]);
      
      // Reset form
      setNewRedirect({
        type: 'redirect',
        name: '',
        source: '',
        destination: '',
        status_code: '301',
        condition: '',
        rewrite_rule: '',
        priority: 10,
        is_active: true
      });
      
      setSuccess('Redirect added successfully');
      toast.success('Redirect added successfully');
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to add redirect');
      toast.error('Failed to add redirect');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const deleteRedirect = async (index) => {
    try {
      setSaving(true);
      
      // Delete from backend
      await api.delete(`/api/website/${id}/redirects/${redirects[index].id}`);
      
      // Update local state
      const updatedRedirects = [...redirects];
      updatedRedirects.splice(index, 1);
      setRedirects(updatedRedirects);
      
      setSuccess('Redirect deleted successfully');
      toast.success('Redirect deleted successfully');
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete redirect');
      toast.error('Failed to delete redirect');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };
  
  const updatePriority = async (index, newPriority) => {
    try {
      setSaving(true);
      
      const updatedRedirect = { 
        ...redirects[index], 
        priority: newPriority 
      };
      
      // Update on backend
      await api.put(`/api/website/${id}/redirects/${redirects[index].id}`, updatedRedirect);
      
      // Update local state
      const updatedRedirects = [...redirects];
      updatedRedirects[index] = updatedRedirect;
      
      // Sort by priority
      updatedRedirects.sort((a, b) => a.priority - b.priority);
      
      setRedirects(updatedRedirects);
      setSuccess('Priority updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update priority');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Redirections">
        <WebSitePage>
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        </WebSitePage>
      </Layout>
    );
  }

  return (
    <Layout title="Redirections">
      <WebSitePage>
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">
              Redirections pour {website?.name || 'Website'} - {website?.environment || ''}
            </h1>
            <p className="text-gray-500 mt-1">
              Configurez les redirections pour votre site
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          {/* Add new redirect form */}
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Ajouter une règle</h2>
            <form onSubmit={addRedirect}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de règle
                  </label>
                  <select
                    name="type"
                    value={newRedirect.type}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    {Object.entries(RULE_TYPES).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priorité
                  </label>
                  <input
                    type="number"
                    name="priority"
                    value={newRedirect.priority}
                    onChange={handleInputChange}
                    min="1"
                    max="100"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Plus petit = plus prioritaire (1-100)
                  </p>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la règle
                </label>
                <input
                  type="text"
                  name="name"
                  value={newRedirect.name}
                  onChange={handleInputChange}
                  placeholder="Force HTTPS, SEO-friendly URLs, etc."
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div className="mb-4">
                {newRedirect.type === 'redirect' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code de redirection
                    </label>
                    <select
                      name="status_code"
                      value={newRedirect.status_code}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="301">301 - Permanent</option>
                      <option value="302">302 - Temporaire</option>
                      <option value="307">307 - Temporaire (Strict)</option>
                      <option value="308">308 - Permanent (Strict)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condition (optionnel)
                </label>
                <input
                  type="text"
                  name="condition"
                  value={newRedirect.condition}
                  onChange={handleInputChange}
                  placeholder="RewriteCond %{HTTPS} !=on"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  { true ? 'Condition préalable à la règle de réécriture (ex: RewriteCond %{HTTPS} !=on)' : ''}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source
                </label>
                <input
                  type="text"
                  name="source"
                  value={newRedirect.source}
                  onChange={handleInputChange}
                  placeholder="old-page ou pattern"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Vous pouvez utiliser des expressions régulières pour des correspondances avancées
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destination
                </label>
                <input
                  type="text"
                  name="destination"
                  value={newRedirect.destination}
                  onChange={handleInputChange}
                  placeholder="new-page ou URL complète"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Règle personnalisée (optionnel)
                </label>
                <input
                  type="text"
                  name="rewrite_rule"
                  value={newRedirect.rewrite_rule}
                  onChange={handleInputChange}
                  placeholder="RewriteRule ^custom-pattern$ destination [flags]"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Si renseigné, cette règle sera utilisée telle quelle au lieu de la règle générée
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Règle générée
                </label>
                <div className="bg-gray-100 p-3 rounded font-mono text-sm">
                  {generateRewriteRule(newRedirect) || 'Complétez le formulaire pour générer une règle'}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-indigo-300"
              >
                {saving ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <>
                    <PlusIcon className="h-5 w-5 mr-1" />
                    Ajouter la règle
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Existing redirects */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Règles existantes</h2>
            
            {redirects.length === 0 ? (
              <p className="text-gray-500">Aucune règle configurée.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nom
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Destination
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priorité
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {redirects.map((redirect, index) => (
                      <tr key={index} className={!redirect.is_active ? 'bg-gray-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {RULE_TYPES[redirect.type] || redirect.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {redirect.name || 'Règle sans nom'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {redirect.source}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {redirect.destination}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {redirect.status_code || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <input
                              type="number"
                              value={redirect.priority || 10}
                              min="1"
                              max="100"
                              className="w-16 border border-gray-300 rounded-md px-2 py-1 mr-2"
                              onChange={(e) => updatePriority(index, parseInt(e.target.value))}
                            />
                            <ArrowsUpDownIcon className="h-4 w-4 text-gray-400" />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => deleteRedirect(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Configuration</h3>
              <div className="bg-gray-100 p-4 rounded-md">
                <pre className="whitespace-pre-wrap font-mono text-sm">
                  {redirects
                    .filter(redirect => redirect.is_active)
                    .sort((a, b) => (a.priority || 10) - (b.priority || 10))
                    .map(redirect => redirect.rewrite_rule || generateRewriteRule(redirect))
                    .join('\n')}
                </pre>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Ces règles seront automatiquement appliquées à votre configuration.
              </p>
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">Exemple d'URL propre</h4>
                <p className="text-sm text-yellow-700">
                  <code className="bg-yellow-100 px-1 py-0.5 rounded">RewriteRule ^index-(.+)-(\d{2})-(\d{2})-(\d{4})\.html$ index.php/$4/$3/$2/$1/ [L]</code>
                </p>
                <p className="text-xs text-yellow-600 mt-2">
                  Cette règle transforme une URL comme <code className="bg-yellow-100 px-1 py-0.5 rounded">index-article-01-05-2025.html</code> en <code className="bg-yellow-100 px-1 py-0.5 rounded">index.php/2025/05/01/article/</code> sans redirection visible pour l'utilisateur.
                </p>
              </div>
            </div>
          </div>
        </div>
      </WebSitePage>
    </Layout>
  );
}
