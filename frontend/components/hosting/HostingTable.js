import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { LinkIcon, EyeIcon, TrashIcon, NewspaperIcon, CodeBracketSquareIcon, 
    CircleStackIcon, PlusIcon, ArrowPathRoundedSquareIcon, ArrowPathIcon,
    ChevronDownIcon, ChevronRightIcon, ArrowUpTrayIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import CreateWebsiteModal from './CreateWebsiteModal';
import DeleteWebsiteModal from './DeleteWebsiteModal';
import MySQLDatabaseModal from './MySQLDatabaseModal';
import WebsiteStatus from './WebsiteStatus';
import SyncGitModal from './SyncGitModal';
import PushEnvironmentModal from './PushEnvironmentModal';
import DuplicateWebsiteModal from './DuplicateWebsiteModal';

export default function HostingTable() {
  const router = useRouter();
  const [websites, setWebsites] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]); // Nouvel état pour les souscriptions
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [websiteToDelete, setWebsiteToDelete] = useState(null);
  const [showMySQLModal, setShowMySQLModal] = useState(false);
  const [dbCredentials, setDbCredentials] = useState(null);
  const [domains, setDomains] = useState([]);
  const [websiteToSyncGit, setWebsiteToSyncGit] = useState(null);
  const [syncGitModalOpen, setSyncGitModalOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [pushModalOpen, setPushModalOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [websiteToDuplicate, setWebsiteToDuplicate] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Charger les sites et les souscriptions en parallèle
        const [websitesResponse, subscriptionsResponse, domainsResponse] = await Promise.all([
            api.get('/api/user/websites'),
            api.get('/api/user/subscriptions/hosting'),
            api.get('/api/user/domains')
          ]);
  
          const subscriptionsData = subscriptionsResponse.data.data || [];
          const websitesData = websitesResponse.data.data || [];
          const domainsData = domainsResponse.data.data || [];
        // Enrichir les abonnements avec les sites web et les infos du plan
        const enrichedSubscriptions = subscriptionsData.map(sub => {
            const websites = websitesData.filter(web => web.subscription_id === sub.id);
            return {
              ...sub,
              websites,
              websites_count: websites.length,
              // Supposons que le plan contient un champ max_websites
              max_websites: sub.Plan?.included_sites || 1
            };
          });

          setWebsites(websitesData);
          setSubscriptions(enrichedSubscriptions);
          setDomains(domainsData);

        // Initialiser les groupes dépliés
        const grouped = websitesData.reduce((acc, website) => {
            const groupName = website.name || 'Sans groupe';
            if (!acc[groupName]) acc[groupName] = [];
            acc[groupName].push(website);
            return acc;
        }, {});

        const initialExpandedState = {};
        Object.keys(grouped).forEach(group => {
            initialExpandedState[group] = true;
        });
        setExpandedGroups(initialExpandedState);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchDomains = async () => {
    try {
      const response = await api.get('/api/user/domains');
      setDomains(response.data.data || []);
    } catch (err) {
      console.error('Error loading domains');
    }
  };

  const handleViewSiteDetails = (website) => {
    if (!website) {
      toast.error('Aucun site spécifié');
      return;
    }

    try {
      router.push(`/website/${website.id}`)
    } catch (e) {
      toast.error('Le site semble invalide');
    }
  };

  const handleDeleteClick = (websiteToDelete) => {
    setWebsiteToDelete(websiteToDelete);
    setDeleteModalOpen(true);
  };

  const handleDbAccessClick = async (website) => {
    try {
      const response = await api.get(`/api/website/database-credentials/${website.id}`);
      setDbCredentials(response.data.data);
      setShowMySQLModal(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la récupération');
    }
  };
  
  const handleSyncGitClick = async (website) => {
    setWebsiteToSyncGit(website);
    setSyncGitModalOpen(true);
  };
  
  const handlePushToEnvironment = async (pushData) => {
    try {
      // Ici vous implémenterez l'appel API pour pousser les modifications

      const response = await api.post(`/api/website/push-env`, pushData);
      const website = response.data.data;
      setWebsites(prev => prev.map(w => 
        w.id === website.id ? { ...w, ...website } : w
      ));
      
      console.log('Push data:', pushData);

      toast.success(`Environnement ${pushData.sourceEnv} poussé vers ${pushData.targetEnv} avec succès`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  // Grouper les sites par leur groupe
  const groupedWebsites = websites.reduce((acc, website) => {
    const groupName = website.name || 'Sans groupe';
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(website);
    return acc;
  }, {});

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Mes Sites WordPress</h1>
          <p className="mt-2 text-sm text-gray-700">
            Liste de tous vos sites web WordPress
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => {
              fetchDomains();
              setShowCreateModal(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Ajouter un site
          </button>
        </div>
      </div>

      <div className="mt-8 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                &nbsp;
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                URL
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Environnement
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Statut
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Hébergement
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Stockage
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Dernier déploiement
              </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {Object.entries(groupedWebsites).map(([groupName, groupWebsites]) => (
              <>
                {/* Ligne du groupe */}
                <tr key={`group-${groupName}`} className="bg-gray-50 hover:bg-gray-100">
                    <td colSpan="8" className="py-2 pl-4 text-sm font-semibold text-gray-900 sm:pl-6">
                        <div className="flex items-center justify-between">
                        <div 
                            className="flex items-center cursor-pointer"
                            onClick={() => toggleGroup(groupName)}
                        >
                            {expandedGroups[groupName] ? (
                            <ChevronDownIcon className="h-4 w-4 mr-2" />
                            ) : (
                            <ChevronRightIcon className="h-4 w-4 mr-2" />
                            )}
                            {groupName}
                            <span className="ml-2 text-gray-500 font-normal">
                            ({groupWebsites.length} environnement{groupWebsites.length > 1 ? 's' : ''})
                            </span>
                        </div>
                        
                        {groupWebsites.length > 1 && (
                            <button
                                onClick={(e) => {
                                e.stopPropagation();
                                setCurrentGroup(groupName);
                                setPushModalOpen(true);
                                }}
                                className="flex items-center text-sm text-indigo-600 hover:text-indigo-900 mr-2"
                                title="Pousser vers un environnement"
                            >
                                <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
                                Push
                            </button>
                        )}                        
                        </div>
                    </td>
                </tr>
                
                {/* Lignes des sites du groupe (seulement si le groupe est déplié) */}
                {expandedGroups[groupName] && groupWebsites.map((website) => (
                  <tr key={website.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap py-4 pl-8 pr-3 text-sm font-medium text-gray-900 sm:pl-10">
                      <div className="flex items-center">
                        <div className="ml-2">&nbsp;</div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {website.Domain && (
                        <a
                          href={`https://${website.record}.${website.Domain.domain_name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                        >
                          <LinkIcon className="h-4 w-4 mr-1" />
                          {website.record}.{website.Domain.domain_name}
                        </a>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {website.environment || 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <WebsiteStatus website={website} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {website.Subscription?.Plan.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {website.used_storage_mb ? `${(website.used_storage_mb / 1024).toFixed(2)} GB` : 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {website.last_deployed_at ? new Date(website.last_deployed_at).toLocaleString('fr-FR') : 'N/A'}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <div className="flex space-x-2 justify-end">
                        <button
                            onClick={() => setWebsiteToDuplicate(website)}
                            className="text-teal-600 hover:text-teal-900 p-1 rounded-full hover:bg-teal-50"
                            title="Dupliquer le site"
                            >
                            <DocumentDuplicateIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleSyncGitClick(website)}
                          className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50"
                          title="Synchroniser avec le dépot Git"
                        >
                          <ArrowPathRoundedSquareIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDbAccessClick(website)}
                          className="text-purple-600 hover:text-purple-900 p-1 rounded-full hover:bg-purple-50"
                          title="Afficher les accès à la base de données"
                        >
                          <CircleStackIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleViewSiteDetails(website)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50"
                          title="Afficher les détails du site"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(website)}
                          className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                          title="Supprimer le site"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <CreateWebsiteModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        domains={domains}
        setWebsites={setWebsites}
        subscriptions={subscriptions}
      />
    {websiteToDelete && (
      <DeleteWebsiteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)} 
        websiteToDelete={websiteToDelete}
        setWebsites={setWebsites}
        setSubscriptions={setSubscriptions}
      />
    )}
    
    <MySQLDatabaseModal
        isOpen={showMySQLModal}
        onClose={() => setShowMySQLModal(false)}
        dbCredentials={dbCredentials}
      />

    {websiteToSyncGit && (
        <SyncGitModal
            isOpen={syncGitModalOpen}
            onClose={() => setSyncGitModalOpen(false)} 
            website={websiteToSyncGit}
            setWebsites={setWebsites}
        />
        )}

    <PushEnvironmentModal
    isOpen={pushModalOpen}
    onClose={() => setPushModalOpen(false)}
    groupName={currentGroup}
    environments={Array.from(new Set(
        groupedWebsites[currentGroup]?.map(site => site.environment) || []
    ))}
    onPush={handlePushToEnvironment}
    />

    {websiteToDuplicate && (
    <DuplicateWebsiteModal
        isOpen={!!websiteToDuplicate}
        onClose={() => setWebsiteToDuplicate(null)}
        website={websiteToDuplicate}
        setSubscriptions={setSubscriptions}
        setWebsites={setWebsites}
        domains={domains} // Ajout des domains
    />
    )}

    </div>
  );
}
