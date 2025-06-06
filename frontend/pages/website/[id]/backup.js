// pages/website/[id]/backup.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../hooks/useAuth';
import Layout from '../../../components/Layout';
import WebSitePage from '../../../components/WebSitePage';
import BackupNoteModal from '../../../components/hosting/BackupNoteModal';
import DeleteBackupModal from '../../../components/hosting/DeleteBackupModal';
import BackupSettingsConfirmModal from '../../../components/hosting/BackupSettingsConfirmModal';
import RestoreBackupModal from '../../../components/hosting/RestoreBackupModal';
import RestoreSuccessModal from '../../../components/hosting/RestoreSuccessModal';
import { 
  ArrowPathIcon, 
  ExclamationCircleIcon,
  ArchiveBoxIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  PlusCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

export default function WebsiteBackup() {
  const router = useRouter();
  const { id } = router.query;
  const [website, setWebsite] = useState(null);
  const [backups, setBackups] = useState([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState(null);
  const [deletingBackup, setDeletingBackup] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [backupToRestore, setBackupToRestore] = useState(null);
  const [domains, setDomains] = useState([]);
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [isBackupNoteModalOpen, setIsBackupNoteModalOpen] = useState(false);
  const [isRestoreSuccessModalOpen, setIsRestoreSuccessModalOpen] = useState(false);
  const [restoredSite, setRestoredSite] = useState(null);
  // État pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  
  const perPageOptions = [5, 10, 20, 50];
  
  // Paramètres de sauvegarde
  const [backupFrequency, setBackupFrequency] = useState('');
  const [retentionPeriod, setRetentionPeriod] = useState('');
  const [maxBackups, setMaxBackups] = useState(10);
  const [includeDatabase, setIncludeDatabase] = useState(true);
  const [includeFiles, setIncludeFiles] = useState(true);
  const [backupTime, setBackupTime] = useState('02:00');
  const [dayOfWeek, setDayOfWeek] = useState('1'); // Lundi par défaut
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [notifyOnFailure, setNotifyOnFailure] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState('');
  
  
  useEffect(() => {
    // Only fetch data when id is available (after hydration)
    if (!id || !user) return;

    const fetchWebsiteAndBackups = async () => {
      try {
        setLoading(true);
        // Fetch website details
        const websiteResponse = await api.get(`/api/website/get-infos/${id}`);
        setWebsite(websiteResponse.data.data);
        
        // Fetch backups for this website with pagination
        const backupsResponse = await api.get(`/api/website/${id}/backups`, {
          params: {
            page: currentPage,
            per_page: perPage
          }
        });
        
        setBackups(backupsResponse.data.data || []);
        
        // Set pagination data if available in response
        if (backupsResponse.data.meta) {
          setTotalPages(backupsResponse.data.meta.last_page || 1);
          setTotalItems(backupsResponse.data.meta.total || 0);
        }
        
        // Fetch domains for restore modal
        const domainsResponse = await api.get('/api/user/domains');
        setDomains(domainsResponse.data.data || []);
        
        const websitesResponse = await api.get('/api/user/websites');
        const websitesData = websitesResponse.data.data || [];
        // Fetch user subscriptions for restore modal
        const subscriptionsResponse = await api.get('/api/user/subscriptions/hosting');
        const subscriptionsData = subscriptionsResponse.data.data || [];

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

        setUserSubscriptions(enrichedSubscriptions);
        
        // Fetch backup settings if available
        try {
          const settingsResponse = await api.get(`/api/website/${id}/backup-settings`);
          if (settingsResponse.data.data) {
            const settings = settingsResponse.data.data;
            setBackupFrequency(settings.frequency || '');
            setRetentionPeriod(settings.retention_period || '30');
            setMaxBackups(settings.max_backups || 10);
            setIncludeDatabase(settings.include_database !== false);
            setIncludeFiles(settings.include_files !== false);
            setBackupTime(settings.backup_time || '02:00');
            setDayOfWeek(settings.day_of_week || '1');
            setDayOfMonth(settings.day_of_month || '1');
            setNotifyOnFailure(settings.notify_on_failure !== false);
            setNotifyEmail(settings.notify_email || user?.email || '');
          } else {
            // Définir l'email de notification par défaut
            setNotifyEmail(user?.email || '');
          }
        } catch (settingsErr) {
          console.log('No backup settings found or error fetching them', settingsErr);
          // Définir l'email de notification par défaut même en cas d'erreur
          setNotifyEmail(user?.email || '');
        }
      } catch (err) {
        console.error('Failed to load website backups', err);
        setError('Impossible de charger les informations de sauvegarde');
      } finally {
        setLoading(false);
      }
    };

    fetchWebsiteAndBackups();
  }, [id, user, currentPage, perPage]);

  const saveBackupSettings = async () => {
    if (!id) return;
    
    try {
      setSavingSettings(true);
      await api.post(`/api/website/${id}/backup-settings`, {
        frequency: backupFrequency,
        retentionPeriod: parseInt(retentionPeriod),
        maxBackups: parseInt(maxBackups),
        includeDatabase,
        includeFiles,
        backupTime,
        dayOfWeek: backupFrequency === 'weekly' ? dayOfWeek : undefined,
        dayOfMonth: backupFrequency === 'monthly' ? dayOfMonth : undefined,
        notifyOnFailure,
        notifyEmail: notifyOnFailure ? notifyEmail : undefined
      });
      
      setIsConfirmModalOpen(false);
      // Optionally show a success message
      toast.success('Paramètres de sauvegarde enregistrés avec succès.');
    } catch (err) {
      console.error('Failed to save backup settings', err);
      toast.error('Impossible d\'enregistrer les paramètres de sauvegarde. Veuillez réessayer plus tard.');
    } finally {
      setSavingSettings(false);
    }
  
  };

  const openDeleteModal = (backup) => {
    setBackupToDelete(backup);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setBackupToDelete(null);
  };

  const confirmDeleteBackup = async () => {
    if (!backupToDelete || !id) return;
    
    try {
      setDeletingBackup(true);
      await api.delete(`/api/website/${id}/backups/${backupToDelete.id}`);
      
      // Refresh the backups list after deletion
      const backupsResponse = await api.get(`/api/website/${id}/backups`, {
        params: {
          page: currentPage,
          per_page: perPage
        }
      });
      
      // If current page is now empty (except for the last page), go to previous page
      if (backupsResponse.data.data.length === 0 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        setBackups(backupsResponse.data.data || []);
        
        if (backupsResponse.data.meta) {
          setTotalPages(backupsResponse.data.meta.last_page || 1);
          setTotalItems(backupsResponse.data.meta.total || 0);
        }
      }
      
      // Close the modal
      closeDeleteModal();
      toast.success('La sauvegarde a été supprimée avec succès.');
    } catch (err) {
      console.error('Failed to delete backup', err);
      toast.error('Impossible de supprimer la sauvegarde. Veuillez réessayer plus tard.');
    } finally {
      setDeletingBackup(false);
    }
  };

  const openConfirmModal = () => {
    setIsConfirmModalOpen(true);
  };

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
  };
  
  
  
  const openBackupNoteModal = () => {
    setIsBackupNoteModalOpen(true);
  };
  
  const closeBackupNoteModal = () => {
    setIsBackupNoteModalOpen(false);
  };
  
  const openRestoreModal = (backup) => {
    setBackupToRestore(backup);
    setIsRestoreModalOpen(true);
  };

  const closeRestoreModal = () => {
    setIsRestoreModalOpen(false);
    setBackupToRestore(null);
  };

  const handleRestoreSuccess = (site) => {
    // Rafraîchir les données après une restauration réussie
    if (id) {
      api.get(`/api/website/get-infos/${id}`)
        .then(response => {
          setWebsite(response.data.data);
          // Stocker le site restauré et ouvrir la modale de succès
          setRestoredSite(site);
          setIsRestoreSuccessModalOpen(true);
        })
        .catch(error => {
          console.error('Erreur lors du rafraîchissement des informations du site:', error);
        });
    }
  };  

  const createBackup = async (note = '') => {
    if (!id) return;
    
    try {
      setCreatingBackup(true);
      const response = await api.post(`/api/website/${id}/backups-manual`, { note });
      
      // Refresh the backups list after creating a new one
      const backupsResponse = await api.get(`/api/website/${id}/backups`, {
        params: {
          page: 1, // Return to first page after creating a new backup
          per_page: perPage
        }
      });
      
      setBackups(backupsResponse.data.data || []);
      setCurrentPage(1);
      
      if (backupsResponse.data.meta) {
        setTotalPages(backupsResponse.data.meta.last_page || 1);
        setTotalItems(backupsResponse.data.meta.total || 0);
      }
      
      // Close the modal if it was open
      closeBackupNoteModal();
      
    } catch (err) {
      console.error('Failed to create backup', err);
      toast.error('Impossible de créer la sauvegarde. Veuillez réessayer plus tard.');
    } finally {
      setCreatingBackup(false);
    }
  };

  const downloadBackup = async (backupId) => {
    try {
      const response = await api.get(`/api/website/${id}/backups/${backupId}/download`, {
        responseType: 'blob'
      });
      
      // Create a download link and trigger the download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup-${website?.name}-${backupId}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download backup', err);
      toast.error('Impossible de télécharger la sauvegarde. Veuillez réessayer plus tard.');
    }
  };

  const restoreBackup = async (backup) => {
    // Ouvrir la modal de restauration au lieu de faire une confirmation simple
    openRestoreModal(backup);
  };

  const deleteBackup = async (backupId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette sauvegarde ? Cette action est irréversible.')) {
      return;
    }
    
    try {
      await api.delete(`/api/website/${id}/backups/${backupId}`);
      
      // Refresh the backups list after deletion
      const backupsResponse = await api.get(`/api/website/${id}/backups`, {
        params: {
          page: currentPage,
          per_page: perPage
        }
      });
      
      // If current page is now empty (except for the last page), go to previous page
      if (backupsResponse.data.data.length === 0 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        setBackups(backupsResponse.data.data || []);
        
        if (backupsResponse.data.meta) {
          setTotalPages(backupsResponse.data.meta.last_page || 1);
          setTotalItems(backupsResponse.data.meta.total || 0);
        }
      }
    } catch (err) {
      console.error('Failed to delete backup', err);
      toast.error('Impossible de supprimer la sauvegarde. Veuillez réessayer plus tard.');
    }
  };
  
  const handlePerPageChange = (e) => {
    const newPerPage = Number(e.target.value);
    setPerPage(newPerPage);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  
  const Pagination = () => {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 bg-white rounded-lg shadow-sm border-t border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Éléments par page:</span>
          <select
            value={perPage}
            onChange={handlePerPageChange}
            className="rounded-md border-gray-300 py-1 pl-2 pr-8 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            {perPageOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>
            {totalItems > 0 ? `${(currentPage - 1) * perPage + 1} - ${Math.min(currentPage * perPage, totalItems)} sur ${totalItems}` : '0 élément'}
          </span>
        </div>
        
        <div className="flex gap-1">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`w-10 h-10 rounded-md text-sm font-medium ${currentPage === pageNum ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-md ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout title="Sauvegardes du site">
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
      <Layout title="Sauvegardes du site">
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
    <Layout title={`Sauvegardes: ${website?.name || 'Site'}`}>
      <WebSitePage>
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Sauvegardes</h1>
            <button
              onClick={openBackupNoteModal}
              disabled={creatingBackup}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {creatingBackup ? (
                <ArrowPathIcon className="mr-2 -ml-1 h-5 w-5 animate-spin" />
              ) : (
                <PlusCircleIcon className="mr-2 -ml-1 h-5 w-5" />
              )}
              Créer une sauvegarde
            </button>
          </div>

          {/* Backups list */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Sauvegardes disponibles
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Liste des sauvegardes pour l'environnement <strong>{website?.environment}</strong> de <strong>{website?.name}</strong>              </p>
            </div>
            
            {backups.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <ArchiveBoxIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune sauvegarde</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Vous n'avez pas encore créé de sauvegarde pour ce site.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date de création
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Taille
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {backups.map((backup) => (
                      <tr key={backup.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {backup.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                            {new Date(backup.created_at).toLocaleString('fr-FR')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {backup.size ? `${(backup.size / (1024 * 1024)).toFixed(2)} MB` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {backup.type || 'Complète'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => downloadBackup(backup.id)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              <ArrowDownTrayIcon className="mr-1 h-4 w-4" />
                              Télécharger
                            </button>
                            <button
                              onClick={() => restoreBackup(backup)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              Restaurer
                            </button>
                            <button
                              onClick={() => openDeleteModal(backup)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              <TrashIcon className="mr-1 h-4 w-4" />
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {backups.length > 0 && <Pagination />}
              </div>
            )}
          </div>

          {/* Backup information */}
          <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                À propos des sauvegardes
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="text-sm text-gray-600">
                <p className="mb-2">Les sauvegardes incluent :</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Tous les fichiers de votre site WordPress</li>
                  <li>La base de données complète</li>
                  <li>Les configurations personnalisées</li>
                </ul>
                <p className="mt-4">
                  Nous vous recommandons de créer une sauvegarde avant toute mise à jour majeure 
                  ou modification importante de votre site.
                </p>
                <p className="mt-2">
                  Les sauvegardes sont conservées pendant 30 jours. Vous pouvez télécharger vos sauvegardes
                  pour les conserver plus longtemps.
                </p>
              </div>
            </div>
          </div>

          {/* Backup schedule */}
          <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Planification des sauvegardes
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <form className="space-y-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="backup-frequency" className="block text-sm font-medium text-gray-700">
                      Fréquence des sauvegardes automatiques
                    </label>
                    <div className="mt-1">
                      <select
                        id="backup-frequency"
                        name="backup-frequency"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={backupFrequency}
                        onChange={(e) => setBackupFrequency(e.target.value)}
                      >
                        <option value="">Choisissez une fréquence</option>
                        <option value="hourly">Horaire</option>
                        <option value="daily">Quotidienne</option>
                        <option value="weekly">Hebdomadaire</option>
                        <option value="monthly">Mensuelle</option>
                        <option value="none">Désactivée</option>
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="retention-period" className="block text-sm font-medium text-gray-700">
                      Période de rétention
                    </label>
                    <div className="mt-1">
                      <select
                        id="retention-period"
                        name="retention-period"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={retentionPeriod}
                        onChange={(e) => setRetentionPeriod(e.target.value)}
                      >
                        <option value="">Choisissez une période de rétention</option>
                        <option value="3">3 jours</option>
                        <option value="7">7 jours</option>
                        <option value="14">14 jours</option>
                        <option value="30">30 jours</option>
                        <option value="90">90 jours</option>
                        <option value="180">6 mois</option>
                        <option value="365">1 an</option>
                      </select>
                    </div>
                  </div>
                </div>

                {backupFrequency && backupFrequency !== 'none' && (
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-2">
                      <label htmlFor="backup-time" className="block text-sm font-medium text-gray-700">
                        Heure de sauvegarde
                      </label>
                      <div className="mt-1">
                        <input
                          type="time"
                          id="backup-time"
                          name="backup-time"
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={backupTime}
                          onChange={(e) => setBackupTime(e.target.value)}
                        />
                      </div>
                    </div>

                    {backupFrequency === 'weekly' && (
                      <div className="sm:col-span-2">
                        <label htmlFor="day-of-week" className="block text-sm font-medium text-gray-700">
                          Jour de la semaine
                        </label>
                        <div className="mt-1">
                          <select
                            id="day-of-week"
                            name="day-of-week"
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            value={dayOfWeek}
                            onChange={(e) => setDayOfWeek(e.target.value)}
                          >
                            <option value="1">Lundi</option>
                            <option value="2">Mardi</option>
                            <option value="3">Mercredi</option>
                            <option value="4">Jeudi</option>
                            <option value="5">Vendredi</option>
                            <option value="6">Samedi</option>
                            <option value="0">Dimanche</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {backupFrequency === 'monthly' && (
                      <div className="sm:col-span-2">
                        <label htmlFor="day-of-month" className="block text-sm font-medium text-gray-700">
                          Jour du mois
                        </label>
                        <div className="mt-1">
                          <select
                            id="day-of-month"
                            name="day-of-month"
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            value={dayOfMonth}
                            onChange={(e) => setDayOfMonth(e.target.value)}
                          >
                            {[...Array(31)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {i + 1}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    <div className="sm:col-span-2">
                      <label htmlFor="max-backups" className="block text-sm font-medium text-gray-700">
                        Nombre maximum de sauvegardes
                      </label>
                      <div className="mt-1">
                        <input
                          type="number"
                          id="max-backups"
                          name="max-backups"
                          min="1"
                          max="100"
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={maxBackups}
                          onChange={(e) => setMaxBackups(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-6">
                  <fieldset>
                    <legend className="text-base font-medium text-gray-900">Contenu de la sauvegarde</legend>
                    <div className="mt-4 space-y-4">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="include-database"
                            name="include-database"
                            type="checkbox"
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                            checked={includeDatabase}
                            onChange={(e) => setIncludeDatabase(e.target.checked)}
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="include-database" className="font-medium text-gray-700">
                            Inclure la base de données
                          </label>
                          <p className="text-gray-500">Sauvegarde complète de la base de données MySQL</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="include-files"
                            name="include-files"
                            type="checkbox"
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                            checked={includeFiles}
                            onChange={(e) => setIncludeFiles(e.target.checked)}
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="include-files" className="font-medium text-gray-700">
                            Inclure les fichiers
                          </label>
                          <p className="text-gray-500">Sauvegarde des fichiers du site web</p>
                        </div>
                      </div>
                    </div>
                  </fieldset>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="notify-on-failure"
                        name="notify-on-failure"
                        type="checkbox"
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        checked={notifyOnFailure}
                        onChange={(e) => setNotifyOnFailure(e.target.checked)}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="notify-on-failure" className="font-medium text-gray-700">
                        Notifier en cas d'échec
                      </label>
                      <p className="text-gray-500">Recevoir un email si la sauvegarde échoue</p>
                    </div>
                  </div>

                  {notifyOnFailure && (
                    <div className="mt-4 sm:col-span-4">
                      <label htmlFor="notify-email" className="block text-sm font-medium text-gray-700">
                        Email de notification
                      </label>
                      <div className="mt-1">
                        <input
                          type="email"
                          id="notify-email"
                          name="notify-email"
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={notifyEmail}
                          onChange={(e) => setNotifyEmail(e.target.value)}
                          placeholder="exemple@domaine.com"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-5">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={openConfirmModal}
                      className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Enregistrer les paramètres
                    </button>
                  </div>
                </div>
              </form>
            </div>
          
          
          </div>
        </div>
      </WebSitePage>
      
      {/* Confirmation Modal */}
      <BackupSettingsConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={closeConfirmModal}
        onConfirm={saveBackupSettings}
        isLoading={savingSettings}
        settings={{
          backupFrequency,
          backupTime,
          dayOfWeek,
          dayOfMonth,
          retentionPeriod,
          maxBackups,
          includeDatabase,
          includeFiles,
          notifyOnFailure,
          notifyEmail
        }}
      />
      
      {/* Backup Note Modal */}
      <BackupNoteModal 
        isOpen={isBackupNoteModalOpen}
        onClose={closeBackupNoteModal}
        onConfirm={createBackup}
        isLoading={creatingBackup}
      />
      
      {/* Delete Confirmation Modal */}
      <DeleteBackupModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteBackup}
        backup={backupToDelete}
        isLoading={deletingBackup}
      />
      
      {/* Restore Backup Modal */}
      <RestoreBackupModal
        isOpen={isRestoreModalOpen}
        onClose={closeRestoreModal}
        backup={backupToRestore}
        domains={domains}
        subscriptions={userSubscriptions}
        websiteId={id}
        onSuccess={handleRestoreSuccess}
      />
      
      {/* Restore Success Modal */}
      <RestoreSuccessModal
        isOpen={isRestoreSuccessModalOpen}
        onClose={() => setIsRestoreSuccessModalOpen(false)}
        restoredSite={restoredSite}
      />
    </Layout>
  );
}
