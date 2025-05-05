import { useRouter } from 'next/router';
import Modal from '../Modal';
import { XMarkIcon, CheckCircleIcon, LinkIcon } from '@heroicons/react/24/outline';

export default function RestoreSuccessModal({
  isOpen,
  onClose,
  restoredSite
}) {
  const router = useRouter();

  const handleViewSite = () => {
    if (restoredSite && restoredSite.id) {
      router.push(`/website/${restoredSite.id}`);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="relative p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        
        <div className="flex flex-col items-center text-center">
          <CheckCircleIcon className="h-12 w-12 text-green-500 mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Restauration réussie</h2>
          
          <p className="text-sm text-gray-500 mb-6">
            La sauvegarde a été restaurée avec succès. Vous pouvez maintenant accéder au site restauré.
          </p>
          
          {restoredSite && (
            <div className="mb-6 bg-gray-50 p-4 rounded-md w-full">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Détails du site restauré</h3>
              <ul className="text-sm text-gray-500 space-y-1 text-left">
                <li><span className="font-medium">Nom:</span> {restoredSite.name}</li>
                <li><span className="font-medium">Environnement:</span> {restoredSite.environment}</li>
                <li><span className="font-medium">URL:</span> 
                
                <a href={`https://${restoredSite.record}.${restoredSite.Domain.domain_name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                        >
                          <LinkIcon className="h-4 w-4 mr-1" />
                          {restoredSite.record}.{restoredSite.Domain.domain_name}
                </a>
                
                </li>
              </ul>
            </div>
          )}
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={handleViewSite}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Afficher les détails du site
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
