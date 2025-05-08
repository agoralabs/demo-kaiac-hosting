// pages/website/[id]/logs.js
import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import WebSitePage from '../../../components/WebSitePage';
import { 
  DocumentTextIcon, 
  ExclamationCircleIcon,
  ArrowPathIcon,
  CodeBracketIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

export default function Logs() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [website, setWebsite] = useState(null);
  
  // Log state
  const [activeTab, setActiveTab] = useState('access');
  const [logs, setLogs] = useState({
    access: { content: '', loading: false, error: null },
    error: { content: '', loading: false, error: null },
    wpDebug: { content: '', loading: false, error: null }
  });
  
  // WordPress debug settings
  const [wpDebugEnabled, setWpDebugEnabled] = useState(false);
  const [updatingDebugSetting, setUpdatingDebugSetting] = useState(false);
  
  // Pagination and filtering
  const [logLines, setLogLines] = useState(100);
  const [filterText, setFilterText] = useState('');
  
  useEffect(() => {
    if (!user || !id) return;

    const fetchWebsiteInfo = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/website/get-infos/${id}`);
        const websiteFromDb = response.data.data;
        setWebsite(websiteFromDb);
        
        // Check if WordPress debug is enabled
        if (websiteFromDb.wp_debug_enabled !== undefined) {
          setWpDebugEnabled(websiteFromDb.wp_debug_enabled);
        }
      } catch (err) {
        console.error('Failed to load website information', err);
        setError('Impossible de charger les informations du site');
      } finally {
        setLoading(false);
      }
    };

    fetchWebsiteInfo();
  }, [user, id]);
  
  // Fetch logs when tab changes or refresh is requested
  const fetchLogs = async (logType = activeTab) => {
    if (!id) return;
    
    // Update loading state for the specific log type
    setLogs(prev => ({
      ...prev,
      [logType]: { ...prev[logType], loading: true, error: null }
    }));
    
    try {
      const response = await api.get(`/api/website/${id}/logs/${logType}`, {
        params: { lines: logLines, filter: filterText }
      });
      
      setLogs(prev => ({
        ...prev,
        [logType]: { 
          content: response.data.content || 'Aucun log disponible', 
          loading: false, 
          error: null 
        }
      }));
    } catch (err) {
      console.error(`Failed to load ${logType} logs`, err);
      setLogs(prev => ({
        ...prev,
        [logType]: { 
          ...prev[logType], 
          loading: false, 
          error: 'Impossible de charger les logs' 
        }
      }));
      toast.error(`Erreur lors du chargement des logs ${logType}`);
    }
  };
  
  // Toggle WordPress debug mode
  const toggleWpDebug = async () => {
    if (!id) return;
    
    setUpdatingDebugSetting(true);
    try {
      const response = await api.put(`/api/website/${id}/wp-debug`, {
        enabled: !wpDebugEnabled
      });
      
      if (response.data.success) {
        setWpDebugEnabled(!wpDebugEnabled);
        toast.success(
          !wpDebugEnabled 
            ? 'Logs de debug WordPress activés' 
            : 'Logs de debug WordPress désactivés'
        );
      }
    } catch (err) {
      console.error('Failed to update WordPress debug setting', err);
      toast.error('Erreur lors de la mise à jour des paramètres de debug');
    } finally {
      setUpdatingDebugSetting(false);
    }
  };
  
  // Download logs
  const downloadLogs = async (logType) => {
    if (!id) return;
    
    try {
      const response = await api.get(`/api/website/${id}/logs/${logType}/download`, {
        responseType: 'blob'
      });
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${logType}-${new Date().toISOString().split('T')[0]}.log`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`Téléchargement du fichier ${logType}.log démarré`);
    } catch (err) {
      console.error(`Failed to download ${logType} logs`, err);
      toast.error(`Erreur lors du téléchargement des logs ${logType}`);
    }
  };
  
  // Load logs when tab changes
  useEffect(() => {
    if (id && user) {
      fetchLogs(activeTab);
    }
  }, [activeTab, id, user]);
  
  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  // Apply filter or change number of lines
  const applyFilter = () => {
    fetchLogs(activeTab);
  };
  
  if (loading) {
    return (
      <Layout>
        <WebSitePage title="Logs">
          <div className="flex items-center justify-center h-64">
            <ArrowPathIcon className="h-8 w-8 text-indigo-500 animate-spin" />
            <span className="ml-2 text-gray-600">Chargement...</span>
          </div>
        </WebSitePage>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <WebSitePage title="Logs">
          <div className="flex items-center justify-center h-64">
            <ExclamationCircleIcon className="h-8 w-8 text-red-500" />
            <span className="ml-2 text-gray-600">{error}</span>
          </div>
        </WebSitePage>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <WebSitePage title="Logs">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-indigo-500" />
            Logs du site
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Consultez les logs d'accès, d'erreurs et de debug de votre site WordPress.
          </p>
        </div>
        
        {/* WordPress Debug Toggle */}
        <div className="px-4 sm:px-6 mb-6">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                    <CodeBracketIcon className="h-5 w-5 mr-2 text-indigo-500" />
                    Logs de debug WordPress
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {wpDebugEnabled 
                      ? 'Les logs de debug WordPress sont activés. Cela peut affecter les performances du site en production.'
                      : 'Les logs de debug WordPress sont désactivés. Activez-les pour déboguer les problèmes.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleWpDebug}
                  disabled={updatingDebugSetting}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${
                    wpDebugEnabled
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                  {updatingDebugSetting ? (
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  ) : wpDebugEnabled ? (
                    <EyeSlashIcon className="h-4 w-4 mr-2" />
                  ) : (
                    <EyeIcon className="h-4 w-4 mr-2" />
                  )}
                  {wpDebugEnabled ? 'Désactiver' : 'Activer'}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Log Controls */}
        <div className="px-4 sm:px-6 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex space-x-1">
              <button
                onClick={() => handleTabChange('access')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'access'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                Access Log
              </button>
              <button
                onClick={() => handleTabChange('error')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'error'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                Error Log
              </button>
              <button
                onClick={() => handleTabChange('wpDebug')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'wpDebug'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                WP Debug Log
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <label htmlFor="lines" className="mr-2 text-sm text-gray-500">
                  Lignes:
                </label>
                <select
                  id="lines"
                  value={logLines}
                  onChange={(e) => setLogLines(Number(e.target.value))}
                  className="block w-20 pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={500}>500</option>
                  <option value={1000}>1000</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="Filtrer..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="block w-32 sm:w-auto pl-3 pr-3 py-1 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                />
              </div>
              
              <button
                onClick={applyFilter}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Appliquer
              </button>
              
              <button
                onClick={() => fetchLogs(activeTab)}
                className="inline-flex items-center px-2 py-1 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                title="Rafraîchir"
              >
                <ArrowPathIcon className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => downloadLogs(activeTab)}
                className="inline-flex items-center px-2 py-1 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                title="Télécharger"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Log Content */}
        <div className="px-4 sm:px-6">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-0">
              {logs[activeTab].loading ? (
                <div className="flex items-center justify-center h-64">
                  <ArrowPathIcon className="h-8 w-8 text-indigo-500 animate-spin" />
                  <span className="ml-2 text-gray-600">Chargement des logs...</span>
                </div>
              ) : logs[activeTab].error ? (
                <div className="flex items-center justify-center h-64">
                  <ExclamationCircleIcon className="h-8 w-8 text-red-500" />
                  <span className="ml-2 text-gray-600">{logs[activeTab].error}</span>
                </div>
              ) : (
                <pre className="p-4 overflow-x-auto text-xs font-mono bg-gray-50 h-[500px] overflow-y-auto">
                  {logs[activeTab].content || 'Aucun log disponible'}
                </pre>
              )}
            </div>
          </div>
        </div>
        
        {/* Help Text */}
        <div className="px-4 sm:px-6 mt-6">
          <div className="rounded-md bg-blue-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">À propos des logs</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Access Log</strong> - Enregistre toutes les requêtes HTTP reçues par le serveur web.</li>
                    <li><strong>Error Log</strong> - Contient les erreurs générées par le serveur web Apache.</li>
                    <li><strong>WP Debug Log</strong> - Contient les messages de debug de WordPress (nécessite l'activation du mode debug).</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </WebSitePage>
    </Layout>
  );
}
