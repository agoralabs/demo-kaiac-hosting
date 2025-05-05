// pages/website/[id]/index.js
import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import WebSitePage from '../../../components/WebSitePage';
import WebsiteCredentialsModal from '../../../components/hosting/WebsiteCredentialsModal';
import GitRepositoryModal from '../../../components/hosting/GitRepositoryModal';
import { 
  ArrowPathIcon, 
  ExclamationCircleIcon,
  ServerIcon, 
  GlobeAltIcon, 
  EnvelopeIcon, 
  DocumentTextIcon,
  ArrowRightIcon,
  CodeBracketIcon,
  PencilIcon,
  CloudArrowUpIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

export default function Info() {
  const router = useRouter();
  const { id } = router.query;
  const [website, setWebsite] = useState(null);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [isGitModalOpen, setIsGitModalOpen] = useState(false);
  
  
  useEffect(() => {
    if (!user || !id) return;

    const fetchWebSiteInfos = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/website/get-infos/${id}`);
        const websiteFromDb = response.data.data;
        setWebsite(websiteFromDb);
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
        setError('Impossible de charger les informations sur le site');
      } finally {
        setLoading(false);
      }
    };

    fetchWebSiteInfos();
  }, [user, id]); // Removed website from dependencies
  
  const handleSaveCredentials = async (credentials) => {
    try {
      const response = await api.put(`/api/website/${id}/update-credentials`, credentials);
      if (response.data.success) {
        // Mettre à jour les données du site avec les nouvelles informations
        setWebsite(prev => ({
          ...prev,
          ...credentials
        }));
        setIsCredentialsModalOpen(false);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des identifiants:', error);
      toast.error('Une erreur est survenue lors de la mise à jour des identifiants.');
    }
  };
  
  const handleSaveGitRepository = async (gitData) => {
    try {
      const response = await api.put(`/api/website/${id}/update-git-infos`, gitData);
      if (response.data.success) {
        // Mettre à jour les données du site avec les nouvelles informations
        setWebsite(prev => ({
          ...prev,
          ...gitData
        }));
        setIsGitModalOpen(false);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des informations Git:', error);
      toast.error('Une erreur est survenue lors de la mise à jour des informations Git.');
    }
  };
  
  const toggleMaintenanceMode = async () => {
    try {
      const response = await api.put(`/api/website/${id}/toggle-maintenance`, {
        is_maintenance_mode_enabled: !website.is_maintenance_mode_enabled
      });
      if (response.data.success) {
        setWebsite(prev => ({
          ...prev,
          is_maintenance_mode_enabled: !prev.is_maintenance_mode_enabled
        }));
        toast.success(`Mode maintenance ${!website.is_maintenance_mode_enabled ? 'activé' : 'désactivé'}`);
      }
    } catch (error) {
      console.error('Erreur lors de la modification du mode maintenance:', error);
      toast.error('Une erreur est survenue lors de la modification du mode maintenance.');
    }
  };
  
  const toggleLSCache = async () => {
    try {
      const response = await api.put(`/api/website/${id}/toggle-lscache`, {
        is_lscache_enabled: !website.is_lscache_enabled
      });
      if (response.data.success) {
        setWebsite(prev => ({
          ...prev,
          is_lscache_enabled: !prev.is_lscache_enabled
        }));
        toast.success(`Cache OpenLiteSpeed ${!website.is_lscache_enabled ? 'activé' : 'désactivé'}`);
      }
    } catch (error) {
      console.error('Erreur lors de la modification du cache OpenLiteSpeed:', error);
      toast.error('Une erreur est survenue lors de la modification du cache OpenLiteSpeed.');
    }
  };


  if (loading) {
    return (
      <Layout title="Informations">
        <WebSitePage>
          <div className="flex justify-center items-center py-12">
            <ArrowPathIcon className="h-8 w-8 text-indigo-600 animate-spin" />
          </div>
        </WebSitePage>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Informations">
        <WebSitePage>
          <div className="text-center py-12">
            <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">{error}</h3>
            <div className="mt-4">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <ArrowPathIcon className="mr-2 -ml-1 h-5 w-5" />
                Réessayer
              </button>
            </div>
          </div>
        </WebSitePage>
      </Layout>
    );
  }

  return (
    <Layout title="Informations">
      <WebSitePage>
        <div className="px-4 py-6 sm:px-6 lg:px-8">


          {/* Section détails */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
                Détails du site {website?.name}
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">URL du site</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <a href={`https://${website?.record}.${website?.Domain?.domain_name}`} target="_blank" rel="noopener noreferrer" 
                       className="text-indigo-600 hover:text-indigo-500">
                      {`https://${website?.record}.${website?.Domain?.domain_name}`}
                    </a>
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Environnement</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {website?.environment || 'N/A'}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Statut</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      website?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {website?.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Mode maintenance</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 ${
                      website?.is_maintenance_mode_enabled ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {website?.is_maintenance_mode_enabled ? 'Activé' : 'Désactivé'}
                    </span>
                    <button
                      onClick={toggleMaintenanceMode}
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      {website?.is_maintenance_mode_enabled ? 'Désactiver' : 'Activer'}
                    </button>
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">En cours de traitement</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      website?.is_processing_site ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {website?.is_processing_site ? 'En cours' : 'Terminé'}
                    </span>
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Date de création</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {website?.created_at ? new Date(website.created_at).toLocaleString('fr-FR') : 'N/A'}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Dernier déploiement</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {website?.last_deployed_at ? new Date(website.last_deployed_at).toLocaleString('fr-FR') : 'N/A'}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Plan</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {website?.Subscription?.Plan?.name || 'N/A'}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Stockage utilisé</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {website?.used_storage_mb ? `${website.used_storage_mb} MB` : 'N/A'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Section base de données */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <ServerIcon className="h-5 w-5 text-gray-500 mr-2" />
                Base de données
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Hôte</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {process.env.NEXT_PUBLIC_WP_DB_HOST || 'N/A'}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Nom de la base</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {website?.wp_db_name || 'N/A'}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Utilisateur</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {website?.wp_db_user || 'N/A'}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Mot de passe</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {website?.wp_db_password ? '••••••••' : 'N/A'}
                    <button 
                      onClick={() => {
                        if (website?.wp_db_password) {
                          navigator.clipboard.writeText(website.wp_db_password);
                          toast.success('Mot de passe copié dans le presse-papier');
                        }
                      }}
                      className="ml-2 text-xs text-indigo-600 hover:text-indigo-500"
                    >
                      Copier
                    </button>
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">phpMyAdmin</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <a 
                      href={process.env.NEXT_PUBLIC_PHPMYADMIN_URL} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-500 flex items-center"
                    >
                      <ArrowRightIcon className="h-4 w-4 mr-1" />
                      Accéder à phpMyAdmin
                    </a>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Section WordPress */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <GlobeAltIcon className="h-5 w-5 text-gray-500 mr-2" />
                WordPress
              </h3>
              <button
                onClick={() => setIsCredentialsModalOpen(true)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                Modifier les accès
              </button>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Version</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {website?.wp_version || 'N/A'}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Admin URL</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <a href={`https://${website?.record}.${website?.Domain?.domain_name}/wp-admin`} target="_blank" rel="noopener noreferrer" 
                       className="text-indigo-600 hover:text-indigo-500 flex items-center">
                      <ArrowRightIcon className="h-4 w-4 mr-1" />
                      Accéder à l'administration
                    </a>
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Utilisateur admin</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {website?.wp_admin_user || 'N/A'}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Mot de passe admin</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {website?.wp_admin_user_pwd ? '••••••••' : 'N/A'}
                    <button 
                      onClick={() => {
                        if (website?.wp_admin_user_pwd) {
                          navigator.clipboard.writeText(website.wp_admin_user_pwd);
                          toast.success('Mot de passe copié dans le presse-papier');
                        }
                      }}
                      className="ml-2 text-xs text-indigo-600 hover:text-indigo-500"
                    >
                      Copier
                    </button>
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Mot de passe application</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {website?.wp_admin_user_app_pwd ? '••••••••' : 'N/A'}
                    <button 
                      onClick={() => {
                        if (website?.wp_admin_user_app_pwd) {
                          navigator.clipboard.writeText(website.wp_admin_user_app_pwd);
                          toast.success('Mot de passe application copié dans le presse-papier');
                        }
                      }}
                      className="ml-2 text-xs text-indigo-600 hover:text-indigo-500"
                    >
                      Copier
                    </button>
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Thème</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {website?.wordpress?.theme || 'N/A'}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Plugins actifs</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {website?.wordpress?.activePlugins || 'N/A'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Section Cache */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <ShieldCheckIcon className="h-5 w-5 text-gray-500 mr-2" />
                Cache
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Type de Cache</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    OpenLiteSpeed
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Statut du Cache</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 ${
                      website?.is_lscache_enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {website?.is_lscache_enabled ? 'Activé' : 'Désactivé'}
                    </span>
                    <button
                      onClick={toggleLSCache}
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      {website?.is_lscache_enabled ? 'Désactiver' : 'Activer'}
                    </button>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Section Serveur */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <ServerIcon className="h-5 w-5 text-gray-500 mr-2" />
                Serveur
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Type de serveur</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {website?.server?.type || 'OpenLiteSpeed'}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">PHP Version</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {website?.server?.phpVersion || '8.1'}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Espace disque utilisé</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {website?.server?.diskUsage ? `${website.server.diskUsage} MB` : 'N/A'}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Limite d'espace disque</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {website?.server?.diskLimit ? `${website.server.diskLimit} GB` : 'N/A'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Section SFTP */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <CloudArrowUpIcon className="h-5 w-5 text-gray-500 mr-2" />
                Accès SFTP/SSH
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Hôte</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {website?.ftp_host || 'N/A'}
                    <button 
                      onClick={() => {
                        if (website?.ftp_host) {
                          navigator.clipboard.writeText(website.ftp_host);
                          toast.success('Hôte copié dans le presse-papier');
                        }
                      }}
                      className="ml-2 text-xs text-indigo-600 hover:text-indigo-500"
                    >
                      Copier
                    </button>
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Port</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {website?.ftp_port || '22'}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Utilisateur</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {website?.ftp_user || 'N/A'}
                    <button 
                      onClick={() => {
                        if (website?.ftp_user) {
                          navigator.clipboard.writeText(website.ftp_user);
                          toast.success('Utilisateur copié dans le presse-papier');
                        }
                      }}
                      className="ml-2 text-xs text-indigo-600 hover:text-indigo-500"
                    >
                      Copier
                    </button>
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Mot de passe</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {website?.ftp_pwd ? '••••••••' : 'N/A'}
                    <button 
                      onClick={() => {
                        if (website?.ftp_pwd) {
                          navigator.clipboard.writeText(website.ftp_pwd);
                          toast.success('Mot de passe copié dans le presse-papier');
                        }
                      }}
                      className="ml-2 text-xs text-indigo-600 hover:text-indigo-500"
                    >
                      Copier
                    </button>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Section Git */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <CodeBracketIcon className="h-5 w-5 text-gray-500 mr-2" />
                Git
              </h3>
              <button
                onClick={() => setIsGitModalOpen(true)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                Modifier le dépôt
              </button>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">URL du dépôt</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {website?.git_repo_url || 'N/A'}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Branche</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {website?.git_branch || 'main'}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Nom d'utilisateur</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {website?.git_username || 'N/A'}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Token</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {website?.git_token ? '••••••••' : 'N/A'}
                    <button 
                      onClick={() => {
                        if (website?.git_token) {
                          navigator.clipboard.writeText(website.git_token);
                          toast.success('Token copié dans le presse-papier');
                        }
                      }}
                      className="ml-2 text-xs text-indigo-600 hover:text-indigo-500"
                    >
                      Copier
                    </button>
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Chemin du dossier</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {website?.git_folder_path || '/'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </WebSitePage>
      
      {/* Modal pour modifier les identifiants WordPress */}
      <WebsiteCredentialsModal
        isOpen={isCredentialsModalOpen}
        onClose={() => setIsCredentialsModalOpen(false)}
        onSave={handleSaveCredentials}
        website={website}
      />
      
      {/* Modal pour modifier les informations Git */}
      <GitRepositoryModal
        isOpen={isGitModalOpen}
        onClose={() => setIsGitModalOpen(false)}
        onSave={handleSaveGitRepository}
        website={website || {}}
      />
    </Layout>
  );
}
