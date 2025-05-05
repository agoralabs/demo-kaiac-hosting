// pages/purchases/gitmanager.js
import Layout from '../../components/Layout';
import PurchasesPage from '../../components/PurchasesPage';
import { 
  useState, 
  useEffect 
} from 'react';
import { 
  ExclamationTriangleIcon, 
  ArrowPathIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  CodeBracketIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TrashIcon,
  XMarkIcon,
  PlusIcon,
  Cog6ToothIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';

export default function GitManager() {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRepo, setExpandedRepo] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [currentRepoId, setCurrentRepoId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    git_repo_url: '',
    git_branch: 'main',
    git_folder_path: '/var/www/',
    git_username: '',
    git_token: ''
  });
  const [syncStatus, setSyncStatus] = useState({});
  const [isSyncing, setIsSyncing] = useState(false);

  // États pour la modale de suppression
  const [repoToDelete, setRepoToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchRepositories = async () => {
      try {
        const response = await api.get('/api/website/all');
        setRepositories(response.data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchRepositories();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const toggleRepoExpand = (id) => {
    setExpandedRepo(expandedRepo === id ? null : id);
  };

  const handleCreateClick = () => {
    setShowCreateModal(true);
  };

  const handleSyncClick = (repoId) => {
    setCurrentRepoId(repoId);
    setShowSyncModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleCreateRepo = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/git/repositories', formData);
      
      setRepositories(prev => [...prev, response.data.data]);
      toast.success('Dépôt configuré avec succès');
      setShowCreateModal(false);
      setFormData({
        name: '',
        git_repo_url: '',
        git_branch: 'main',
        git_folder_path: '/var/www/',
        git_username: '',
        git_token: ''
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la configuration');
    }
  };

  const handleSyncRepo = async () => {
    if (!currentRepoId) return;
    
    setIsSyncing(true);
    try {
      const response = await api.post(`/api/git/repositories/${currentRepoId}/sync`);
      
      setSyncStatus(prev => ({
        ...prev,
        [currentRepoId]: {
          status: 'success',
          message: response.data.message,
          lastSync: new Date().toISOString()
        }
      }));
      
      toast.success('Synchronisation réussie');
      setShowSyncModal(false);
    } catch (err) {
      setSyncStatus(prev => ({
        ...prev,
        [currentRepoId]: {
          status: 'error',
          message: err.response?.data?.message || 'Erreur lors de la synchronisation',
          lastSync: new Date().toISOString()
        }
      }));
      toast.error('Erreur lors de la synchronisation');
    } finally {
      setIsSyncing(false);
    }
  };

  const openDeleteModal = (repo) => {
    setRepoToDelete(repo);
  };

  const closeDeleteModal = () => {
    setRepoToDelete(null);
  };

  const confirmDelete = async () => {
    if (!repoToDelete) return;
    
    setIsDeleting(true);
    try {
      await api.delete(`/api/git/repositories/${repoToDelete.id}`);
      
      setRepositories(prev => prev.filter(r => r.id !== repoToDelete.id));
      toast.success('Configuration supprimée');
      closeDeleteModal();
    } catch (err) {
      toast.error('Échec de la suppression');
      console.error('Erreur lors de la suppression', err);
    } finally {
      setIsDeleting(false);
    }
  };

  function getStatusIcon(status) {
    const iconProps = {
      className: "h-5 w-5 flex-shrink-0",
      'aria-hidden': true
    };
  
    switch (status) {
      case 'synced':
        return <CheckCircleIcon {...iconProps} className={`${iconProps.className} text-green-500`} />;
      case 'error':
        return <XCircleIcon {...iconProps} className={`${iconProps.className} text-red-500`} />;
      case 'syncing':
        return <ArrowPathIcon {...iconProps} className={`${iconProps.className} text-blue-500 animate-spin`} />;
      default:
        return <Cog6ToothIcon {...iconProps} className={`${iconProps.className} text-gray-500`} />;
    }
  }

  if (loading) {
    return (
      <Layout title="Git Manager">
        <PurchasesPage>
          <div className="flex justify-center items-center py-12">
            <ArrowPathIcon className="h-8 w-8 text-indigo-600 animate-spin" />
            <span className="ml-2 text-gray-700">Chargement...</span>
          </div>
        </PurchasesPage>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Git Manager">
        <PurchasesPage>
          <div className="text-center py-12">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Erreur</h3>
            <p className="mt-1 text-gray-500">{error}</p>
          </div>
        </PurchasesPage>
      </Layout>
    );
  }

  return (
    <Layout title="Git Manager">
      <PurchasesPage>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-xl font-semibold text-gray-900">Git Manager</h1>
              <p className="mt-2 text-sm text-gray-700">
                Gestion des dépôts Git synchronisés avec vos sites
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button
                onClick={handleCreateClick}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Ajouter un dépôt
              </button>
            </div>
          </div>
          
          <div className="mt-8 space-y-6">
            {repositories.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
                  <CodeBracketIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="mt-2 text-lg font-medium text-gray-900">Aucun dépôt configuré</h3>
                <p className="mt-1 text-gray-500">
                  Configurez votre premier dépôt Git pour commencer la synchronisation.
                </p>
              </div>
            ) : (
              repositories.map((repo) => (
                <div key={repo.id} className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                  <div className="bg-white px-4 py-5 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium leading-6 text-gray-900">
                          {repo.name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {repo.git_folder_path}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-500">Dernière synchro</p>
                          <p className="text-sm">
                            {syncStatus[repo.id]?.lastSync ? formatDate(syncStatus[repo.id].lastSync) : 'Jamais'}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleRepoExpand(repo.id)}
                          className="p-2 text-gray-400 hover:text-gray-500"
                        >
                          {expandedRepo === repo.id ? (
                            <ChevronUpIcon className="h-5 w-5" />
                          ) : (
                            <ChevronDownIcon className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {expandedRepo === repo.id && (
                    <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900">Détails</h4>
                        <div className="mt-2 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">URL du dépôt</p>
                            <p className="text-sm font-medium break-all">
                              {repo.git_repo_url}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Branche</p>
                            <p className="text-sm font-medium">
                              {repo.git_branch}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Statut</p>
                            <p className="flex items-center text-sm font-medium">
                              {getStatusIcon(syncStatus[repo.id]?.status || 'pending')}
                              <span className="ml-2 capitalize">
                                {syncStatus[repo.id]?.status || 'Non synchronisé'}
                              </span>
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Dernier message</p>
                            <p className="text-sm font-medium">
                              {syncStatus[repo.id]?.message || 'Aucune information'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end space-x-3">
                        <button
                          onClick={() => handleSyncClick(repo.id)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                          Synchroniser
                        </button>
                        <button
                          onClick={() => openDeleteModal(repo)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <TrashIcon className="h-4 w-4 mr-2" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modale de confirmation de suppression */}
        {repoToDelete && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <TrashIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Confirmer la suppression
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Êtes-vous sûr de vouloir supprimer la configuration pour <strong>{repoToDelete.name}</strong> ? Cette action est irréversible.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {isDeleting ? (
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    ) : (
                      'Supprimer'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={closeDeleteModal}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de création de dépôt */}
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
          <div className="relative p-6">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            
            <h2 className="text-lg font-medium text-gray-900 mb-4">Nouveau dépôt Git</h2>
            
            <form onSubmit={handleCreateRepo}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du dépôt (pour référence)
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="ex: Mon site WordPress"
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="git_repo_url" className="block text-sm font-medium text-gray-700 mb-1">
                  URL du dépôt Git
                </label>
                <input
                  type="text"
                  id="git_repo_url"
                  name="git_repo_url"
                  value={formData.git_repo_url}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://github.com/username/repository.git"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="git_branch" className="block text-sm font-medium text-gray-700 mb-1">
                    Branche
                  </label>
                  <input
                    type="text"
                    id="git_branch"
                    name="git_branch"
                    value={formData.git_branch}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="git_folder_path" className="block text-sm font-medium text-gray-700 mb-1">
                    Chemin du dossier
                  </label>
                  <input
                    type="text"
                    id="git_folder_path"
                    name="git_folder_path"
                    value={formData.git_folder_path}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="git_username" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom d'utilisateur Git (optionnel)
                </label>
                <input
                  type="text"
                  id="git_username"
                  name="git_username"
                  value={formData.git_username}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Pour les dépôts privés"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="git_token" className="block text-sm font-medium text-gray-700 mb-1">
                  Token d'accès (optionnel)
                </label>
                <input
                  type="password"
                  id="git_token"
                  name="git_token"
                  value={formData.git_token}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Pour les dépôts privés"
                />
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Modal de synchronisation */}
        <Modal isOpen={showSyncModal} onClose={() => setShowSyncModal(false)}>
          <div className="relative p-6">
            <button
              onClick={() => setShowSyncModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            
            <h2 className="text-lg font-medium text-gray-900 mb-4">Synchroniser le dépôt</h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                Vous êtes sur le point de synchroniser le dépôt avec votre serveur. Cette action va :
              </p>
              <ul className="mt-2 text-sm text-gray-700 list-disc pl-5 space-y-1">
                <li>Récupérer les derniers changements depuis la branche spécifiée</li>
                <li>Écraser les fichiers locaux avec ceux du dépôt</li>
                <li>Mettre à jour le statut de synchronisation</li>
              </ul>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowSyncModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSyncRepo}
                disabled={isSyncing}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${isSyncing ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {isSyncing ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Synchronisation en cours...
                  </>
                ) : (
                  'Confirmer la synchronisation'
                )}
              </button>
            </div>
          </div>
        </Modal>
      </PurchasesPage>
    </Layout>
  );
}