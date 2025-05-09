// pages/website/[id]/performance.js
import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import WebSitePage from '../../../components/WebSitePage';
import { 
  ChartBarIcon, 
  ExclamationCircleIcon,
  ArrowPathIcon,
  CogIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTopRightOnSquareIcon,
  BoltIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

export default function Performance() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [website, setWebsite] = useState(null);
  
  // Query Monitor plugin state
  const [queryMonitorInstalled, setQueryMonitorInstalled] = useState(false);
  const [queryMonitorActive, setQueryMonitorActive] = useState(false);
  const [installingPlugin, setInstallingPlugin] = useState(false);
  const [togglingPlugin, setTogglingPlugin] = useState(false);
  
  useEffect(() => {
    if (!user || !id) return;

    const fetchWebsiteInfo = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/website/get-infos/${id}`);
        const websiteFromDb = response.data.data;
        setWebsite(websiteFromDb);

        setQueryMonitorInstalled(websiteFromDb.is_wp_query_monitor_installed);
        setQueryMonitorActive(websiteFromDb.is_wp_query_monitor_enabled);
        
      } catch (err) {
        console.error('Failed to load website information', err);
        setError('Impossible de charger les informations du site');
      } finally {
        setLoading(false);
      }
    };

    fetchWebsiteInfo();
  }, [user, id]);
  
  
  // Install Query Monitor plugin
  const installQueryMonitor = async () => {
    if (!id) return;
    
    setInstallingPlugin(true);
    try {
      const response = await api.post(`/api/website/${id}/plugins/install-query-monitor`);
      
      if (response.data.success) {
        setQueryMonitorInstalled(true);
        setQueryMonitorActive(true);
        toast.success('Plugin Query Monitor installé et activé avec succès');
      }
    } catch (err) {
      console.error('Failed to install Query Monitor plugin', err);
      toast.error('Erreur lors de l\'installation du plugin Query Monitor');
    } finally {
      setInstallingPlugin(false);
    }
  };
  
  // Toggle Query Monitor plugin (activate/deactivate)
  const toggleQueryMonitor = async () => {
    if (!id || !queryMonitorInstalled) return;
    
    setTogglingPlugin(true);
    try {
      const response = await api.post(`/api/website/${id}/toggle-plugin-query-monitor`);
      
      if (response.data.success) {
        setQueryMonitorActive(!queryMonitorActive);
        toast.success(
          queryMonitorActive 
            ? 'Plugin Query Monitor désactivé' 
            : 'Plugin Query Monitor activé'
        );
      }
    } catch (err) {
      console.error('Failed to toggle Query Monitor plugin', err);
      toast.error('Erreur lors de la modification du statut du plugin Query Monitor');
    } finally {
      setTogglingPlugin(false);
    }
  };
  
  // Open Query Monitor in WordPress admin
  const openQueryMonitor = () => {
    const admin_url = `https://${website?.record}.${website?.Domain?.domain_name}/wp-admin`;

    // Query Monitor typically adds its output to the admin bar
    window.open(`${admin_url}`, '_blank');
  };
  
  // Open PageSpeed Insights analysis
  const openPageSpeedInsights = () => {
    const website_url = `https://${website?.record}.${website?.Domain?.domain_name}`;
    
    window.open(`https://pagespeed.web.dev/report?url=${encodeURIComponent(website_url)}`, '_blank');
  };
  
  // Open WebPageTest analysis
  const openWebPageTest = () => {
    const website_url = `https://${website?.record}.${website?.Domain?.domain_name}`;
    
    window.open(`https://www.webpagetest.org/result/?url=${encodeURIComponent(website_url)}`, '_blank');
  };
  
  if (loading) {
    return (
      <Layout>
        <WebSitePage title="Performance">
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
        <WebSitePage title="Performance">
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
      <WebSitePage title="Performance">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-indigo-500" />
            Performance du site {website?.name || 'Website'} - {website?.environment || ''}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Analysez et optimisez les performances de votre site WordPress.
          </p>
        </div>
        
        {/* Query Monitor Plugin Section */}
        <div className="px-4 sm:px-6 mb-6">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                    <CogIcon className="h-5 w-5 mr-2 text-indigo-500" />
                    Plugin Query Monitor
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {queryMonitorInstalled 
                      ? 'Query Monitor est installé. Ce plugin vous permet de déboguer et d\'analyser les performances de votre site WordPress.'
                      : 'Query Monitor n\'est pas installé. Ce plugin vous permet de déboguer et d\'analyser les performances de votre site WordPress.'}
                  </p>
                  {queryMonitorInstalled && (
                    <p className="mt-1 text-sm text-gray-500 flex items-center">
                      Statut: 
                      {queryMonitorActive ? (
                        <span className="ml-1 flex items-center text-green-600">
                          <CheckCircleIcon className="h-4 w-4 mr-1" /> Actif
                        </span>
                      ) : (
                        <span className="ml-1 flex items-center text-red-600">
                          <XCircleIcon className="h-4 w-4 mr-1" /> Inactif
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div className="flex space-x-3">
                  {!queryMonitorInstalled ? (
                    <button
                      type="button"
                      onClick={installQueryMonitor}
                      disabled={installingPlugin}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      {installingPlugin ? (
                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CogIcon className="h-4 w-4 mr-2" />
                      )}
                      Installer Query Monitor
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={toggleQueryMonitor}
                        disabled={togglingPlugin}
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${
                          queryMonitorActive
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                      >
                        {togglingPlugin ? (
                          <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                        ) : queryMonitorActive ? (
                          <XCircleIcon className="h-4 w-4 mr-2" />
                        ) : (
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                        )}
                        {queryMonitorActive ? 'Désactiver' : 'Activer'}
                      </button>
                      
                      <button
                        type="button"
                        onClick={openQueryMonitor}
                        disabled={!queryMonitorActive}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-2" />
                        Ouvrir Query Monitor
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* External Performance Tools */}
        <div className="px-4 sm:px-6 mb-6">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <BoltIcon className="h-5 w-5 mr-2 text-indigo-500" />
                Outils d'analyse de performance
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Utilisez ces outils externes pour analyser et optimiser les performances de votre site WordPress.
              </p>
              
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* PageSpeed Insights Card */}
                <div className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                  <div className="flex-shrink-0">
                    <BoltIcon className="h-10 w-10 text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={openPageSpeedInsights}
                      className="focus:outline-none w-full text-left"
                    >
                      <span className="absolute inset-0" aria-hidden="true" />
                      <p className="text-sm font-medium text-gray-900">PageSpeed Insights</p>
                      <p className="text-sm text-gray-500 truncate">
                        Analysez les performances de votre site avec l'outil de Google
                      </p>
                    </button>
                  </div>
                </div>
                
                {/* WebPageTest Card */}
                <div className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                  <div className="flex-shrink-0">
                    <ClockIcon className="h-10 w-10 text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={openWebPageTest}
                      className="focus:outline-none w-full text-left"
                    >
                      <span className="absolute inset-0" aria-hidden="true" />
                      <p className="text-sm font-medium text-gray-900">WebPageTest</p>
                      <p className="text-sm text-gray-500 truncate">
                        Testez votre site avec des analyses détaillées et des recommandations
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Performance Tips */}
        <div className="px-4 sm:px-6 mt-6">
          <div className="rounded-md bg-blue-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <BoltIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Conseils d'optimisation</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Query Monitor</strong> - Identifiez les requêtes SQL lentes et les hooks WordPress inefficaces.</li>
                    <li><strong>Mise en cache</strong> - Utilisez un plugin de cache comme WP Rocket ou W3 Total Cache.</li>
                    <li><strong>Images</strong> - Optimisez vos images et utilisez des formats modernes comme WebP.</li>
                    <li><strong>Plugins</strong> - Limitez le nombre de plugins et désactivez ceux qui ne sont pas essentiels.</li>
                    <li><strong>Thème</strong> - Utilisez un thème léger et optimisé pour les performances.</li>
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
