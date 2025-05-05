import { ArrowDownTrayIcon, XMarkIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import Modal from '../Modal';
import { useState } from 'react';

export default function SyncGitModal({
  isOpen,
  onClose,
  website,
  setWebsites
}) {
  const [isSynchronizing, setIsSynchronizing] = useState(false);

  const confirmSyncGit = async () => {
    if (!website) return;
    
    setIsSynchronizing(true);
    
    try {
      const webSiteUpdated = await api.put(`/api/website/sync-git/${website.id}`);

      //update website in websites
      setWebsites(prev => prev.map(w => w.id === website.id ? webSiteUpdated : w));
  
      // Notification de succès
      toast.success('Site synchronisé avec succès', {
        duration: 3000,
        position: 'top-center'
      });
    } catch (err) {
      // Notification d'erreur
      toast.error(err.response?.data?.message || 'Erreur lors de la synchronisation', {
        duration: 4000,
        position: 'top-center'
      });
    } finally {
      setIsSynchronizing(false);
      setWebsites(prev => prev.filter(id => id !== website.id));
      onClose();
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

  function getStatusLabel(status) {
    const iconProps = {
      className: "h-5 w-5 flex-shrink-0",
      'aria-hidden': true
    };
  
    switch (status) {
      case 'synced':
        return 'Synchronisé';
      case 'error':
        return 'En erreur';
      case 'syncing':
        return 'Synchronisation en cours';
      default:
        return 'Non synchronisé';
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="relative p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
          disabled={isSynchronizing}
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <h2 className="text-lg font-medium text-gray-900 mb-4">Synchroniser avec votre dépôt Git</h2>

        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900">Informations sur le dépôt Git</h4>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">URL du dépôt</p>
              <p className="text-sm font-medium break-all">
                {website.git_repo_url}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Branche</p>
              <p className="text-sm font-medium">
                {website.git_branch}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Statut</p>
              <p className="flex items-center text-sm font-medium">
                {getStatusIcon(website.git_sync_status)}
                <span className="ml-2 capitalize">
                {getStatusLabel(website.git_sync_status)}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Dernier message</p>
              <p className="text-sm font-medium">
              {website.git_sync_message}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            onClick={confirmSyncGit}
            className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSynchronizing}
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            {isSynchronizing ? 'Synchronisation en cours...' : 'Synchroniser'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto disabled:opacity-50"
            disabled={isSynchronizing}
          >
            Annuler
          </button>
        </div>
      </div>
    </Modal>
  );
}