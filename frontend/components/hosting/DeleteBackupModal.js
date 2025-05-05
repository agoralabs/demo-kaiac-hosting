import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Modal from '../Modal';

export default function DeleteBackupModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  backup, 
  isLoading 
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
          </div>
          <div className="mt-3 text-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Supprimer la sauvegarde
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Êtes-vous sûr de vouloir supprimer cette sauvegarde ? Cette action est irréversible.
              </p>
              {backup && (
                <div className="mt-4 bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-900">Détails de la sauvegarde</h4>
                  <ul className="mt-2 text-sm text-gray-500 space-y-2">
                    <li className="flex items-start">
                      <span className="font-medium mr-2">ID:</span>
                      <span>{backup.id}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">Date:</span>
                      <span>{new Date(backup.created_at).toLocaleString('fr-FR')}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">Taille:</span>
                      <span>{backup.size ? `${(backup.size / (1024 * 1024)).toFixed(2)} MB` : 'N/A'}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">Type:</span>
                      <span>{backup.type || 'Complète'}</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                Suppression...
              </>
            ) : (
              'Supprimer'
            )}
          </button>
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Annuler
          </button>
        </div>
      </div>
    </Modal>
  );
}
