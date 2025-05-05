import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

export default function DuplicateWebsiteModal({ 
  isOpen, 
  onClose, 
  website,
  setSubscriptions,
  setWebsites,
  domains // Ajout des domains en props
}) {
  const [targetEnvironment, setTargetEnvironment] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [domainId, setDomainId] = useState('');
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Réinitialiser les champs quand la modale s'ouvre
  useEffect(() => {
    if (isOpen && website) {
      setTargetEnvironment('');
      setSubdomain('');
      setDomainId(domains.length > 0 ? domains[0].id : '');
    }
  }, [isOpen, website, domains]);

  const handleDuplicate = async () => {
    if (!targetEnvironment) {
      toast.error('Veuillez spécifier un environnement cible');
      return;
    }
    if (!subdomain) {
      toast.error('Veuillez spécifier un sous-domaine');
      return;
    }
    if (!domainId) {
      toast.error('Veuillez sélectionner un domaine');
      return;
    }

    try {
      setIsDuplicating(true);
      const response = await api.post(`/api/website/duplicate/${website.id}`, {
        target_environment: targetEnvironment,
        subdomain,
        domain_id: domainId
      });

      const newWebsite = response.data.data;
      setWebsites(prev => [...prev, newWebsite]);
      toast.success('Site dupliqué avec succès');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la duplication');
    } finally {
      setIsDuplicating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Dupliquer le site
        </h2>
        
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-1">
            Site source: <span className="font-medium">{website.record}.{website.Domain?.domain_name}</span>
          </p>
          <p className="text-sm text-gray-500">
            Environnement source: <span className="font-medium">{website.environment || 'N/A'}</span>
          </p>
        </div>

        <div className="mb-4">
          <label htmlFor="targetEnvironment" className="block text-sm font-medium text-gray-700 mb-1">
            Environnement cible *
          </label>
          <input
            type="text"
            id="targetEnvironment"
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
            placeholder="Ex: staging, dev, preprod"
            value={targetEnvironment}
            onChange={(e) => setTargetEnvironment(e.target.value)}
            disabled={isDuplicating}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700 mb-1">
            Sous-domaine *
          </label>
          <input
            type="text"
            id="subdomain"
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
            placeholder="ex: mon-site"
            value={subdomain}
            onChange={(e) => setSubdomain(e.target.value)}
            disabled={isDuplicating}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="domain_id" className="block text-sm font-medium text-gray-700 mb-1">
            Domaine principal *
          </label>
          <select
            id="domain_id"
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
            value={domainId}
            onChange={(e) => setDomainId(e.target.value)}
            disabled={isDuplicating || domains.length === 0}
          >
            <option value="">Sélectionnez un domaine</option>
            {domains.map(domain => (
              <option key={domain.id} value={domain.id}>
                {domain.domain_name}
              </option>
            ))}
          </select>
          {domains.length === 0 && (
            <p className="mt-1 text-xs text-red-500">
              Aucun domaine disponible
            </p>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={isDuplicating}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleDuplicate}
            className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={isDuplicating || !targetEnvironment || !subdomain || !domainId}
          >
            {isDuplicating ? 'Duplication en cours...' : 'Dupliquer'}
          </button>
        </div>
      </div>
    </div>
  );
}