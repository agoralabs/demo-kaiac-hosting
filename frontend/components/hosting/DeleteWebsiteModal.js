import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import Modal from '../Modal';
import { useState } from 'react';

export default function DeleteWebsiteModal({
  isOpen,
  onClose,
  websiteToDelete,
  setWebsites,
  setSubscriptions
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!websiteToDelete) return;
    
    setIsDeleting(true);
    // Supprimer le site de la liste des sites
    setWebsites(prev => prev.filter(web => web.id !== websiteToDelete.id));
    
    try {
      await api.delete(`/api/website/delete-wordpress/${websiteToDelete.id}`);

      // Mettre à jour l'état global
      setSubscriptions(prev => prev.map(sub => ({
        ...sub,
        websites: sub.websites.filter(web => web.id !== websiteToDelete.id),
        websites_count: sub.websites.filter(web => web.id !== websiteToDelete.id).length
      })));
  
      // Notification de succès
      toast.success('Site supprimé avec succès', {
        duration: 3000,
        position: 'top-center'
      });
    } catch (err) {
      // Notification d'erreur
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression', {
        duration: 4000,
        position: 'top-center'
      });
    } finally {
      setIsDeleting(false);
      setWebsites(prev => prev.filter(web => web.id !== websiteToDelete.id));
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="relative p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
          disabled={isDeleting}
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        
        <div className="sm:flex sm:items-start">
          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          </div>
          <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              Confirmer la suppression
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Êtes-vous sûr de vouloir supprimer le site {websiteToDelete.name} ? 
                Cette action est irréversible et toutes les données associées seront perdues.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            onClick={confirmDelete}
            className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isDeleting}
          >
            {isDeleting ? 'Suppression en cours...' : 'Supprimer'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto disabled:opacity-50"
            disabled={isDeleting}
          >
            Annuler
          </button>
        </div>
      </div>
    </Modal>
  );
}