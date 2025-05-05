import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import Modal from '../Modal';
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function RestoreBackupModal({
    isOpen,
    onClose,
    backup,
    domains,
    subscriptions,
    websiteId,
    onSuccess
}) {
  const [formData, setFormData] = useState({
    subscription_id: '',
    name: '',
    environment: '',
    subdomain: '',
    domain_id: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentWebsite, setCurrentWebsite] = useState(null);

  // Charger les informations du site actuel lors de l'ouverture de la modal
  useEffect(() => {
    if (isOpen && websiteId) {
      setIsLoading(true);
      api.get(`/api/website/get-infos/${websiteId}`)
        .then(response => {
          const website = response.data.data;
          setCurrentWebsite(website);
          
          // Pré-remplir le formulaire avec les informations du site actuel
          setFormData({
            subscription_id: '',
            name: website.name || '',
            environment: '',
            subdomain: '',
            domain_id: website.domain_id || ''
          });
        })
        .catch(error => {
          console.error('Erreur lors du chargement des informations du site:', error);
          toast.error('Impossible de charger les informations du site');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, websiteId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Appel API pour restaurer la sauvegarde avec les paramètres spécifiés
      const response = await api.post(`/api/website/${websiteId}/backups/${backup.id}/restore`, {
        subscription_id: formData.subscription_id,
        name: formData.name,
        environment: formData.environment,
        subdomain: formData.subdomain,
        domain_id: formData.domain_id
      });

      toast.success('La sauvegarde a été restaurée avec succès!', {
        duration: 3000,
        position: 'top-center'
      });

      const createdWebsite = response.data.data;
      console.log('Réponse de l\'API:', createdWebsite);
      // Appeler la fonction de callback si elle est fournie
      if (onSuccess && typeof onSuccess === 'function') {
        console.log('Appel de onSuccess avec les données:', createdWebsite);
        onSuccess(createdWebsite);
      }

      onClose();
    } catch (err) {
      console.error('Erreur lors de la restauration de la sauvegarde:', err);
      toast.error(err.response?.data?.message || 'Erreur lors de la restauration de la sauvegarde');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="p-6 flex flex-col items-center justify-center">
          <ArrowPathIcon className="h-8 w-8 text-indigo-600 animate-spin mb-4" />
          <p className="text-gray-700">Chargement des informations...</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="relative p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
          disabled={isSubmitting}
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        
        <h2 className="text-lg font-medium text-gray-900 mb-4">Restaurer la sauvegarde</h2>
        
        {backup && (
          <div className="mb-4 bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Détails de la sauvegarde</h3>
            <ul className="text-sm text-gray-500 space-y-1">
              <li><span className="font-medium">ID:</span> {backup.id}</li>
              <li><span className="font-medium">Date:</span> {new Date(backup.created_at).toLocaleString('fr-FR')}</li>
              <li><span className="font-medium">Taille:</span> {backup.size ? `${(backup.size / (1024 * 1024)).toFixed(2)} MB` : 'N/A'}</li>
              <li><span className="font-medium">Type:</span> {backup.type || 'Complète'}</li>
            </ul>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="subscription_id" className="block text-sm font-medium text-gray-700 mb-1">
              Souscription
            </label>
            <select
              id="subscription_id"
              name="subscription_id"
              value={formData.subscription_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
              disabled={isSubmitting || subscriptions.length === 0}
            >
              {subscriptions.length === 0 ? (
                <option value="">Aucune souscription disponible</option>
              ) : (
                <>
                <option value="">Sélectionnez une souscription</option>
                {subscriptions.map(sub => (
                  <option 
                    key={sub.id} 
                    value={sub.id}
                    disabled={sub.websites_count === sub.max_websites}
                  >
                    {sub.Plan?.name} (Sites: {sub.websites_count}/{sub.max_websites})
                  </option>
                ))}
                </>
              )}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nom du site
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="environment" className="block text-sm font-medium text-gray-700 mb-1">
              Environnement du site
            </label>
            <input
              type="text"
              id="environment"
              name="environment"
              value={formData.environment}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700 mb-1">
              Sous-domaine
            </label>
            <input
              type="text"
              id="subdomain"
              name="subdomain"
              value={formData.subdomain}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="ex: mon-site"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="domain_id" className="block text-sm font-medium text-gray-700 mb-1">
              Domaine principal
            </label>
            <select
              id="domain_id"
              name="domain_id"
              value={formData.domain_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
              disabled={isSubmitting || domains.length === 0}
            >
              <option value="">Sélectionnez un domaine</option>
              {domains.map(domain => (
                <option key={domain.id} value={domain.id}>
                  {domain.domain_name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              disabled={isSubmitting || domains.length === 0 || subscriptions.length === 0}
            >
              {isSubmitting ? (
                <>
                  <ArrowPathIcon className="inline-block h-4 w-4 mr-2 animate-spin" />
                  Restauration en cours...
                </>
              ) : (
                'Restaurer la sauvegarde'
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
