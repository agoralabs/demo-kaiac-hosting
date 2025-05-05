import { useState, useEffect } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import Modal from '../Modal';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Liste des versions de WordPress disponibles
const WORDPRESS_VERSIONS = [
  'latest',
  '6.5',
  '6.4',
  '6.3',
  '6.2',
  '6.1',
  '6.0',
  '5.9'
];

const INSTALLATION_METHODS = {
  STANDARD: 'standard',
  GIT: 'git',
  ZIP_AND_SQL: 'zip_and_sql'
};

export default function CreateWebsiteModal({
    isOpen,
    onClose,
    domains,
    setWebsites,
    subscriptions
}) {
  const [formData, setFormData] = useState({
    subscription_id: '', // Sélection par défaut (subscriptions.length > 0 ? subscriptions[0].id : '')
    name: '',
    environment: '',
    subdomain: '',
    domain_id: '',
    wordpress_version: 'latest', // Valeur par défaut
    installation_method: INSTALLATION_METHODS.STANDARD,
    git_repo_url: '',
    git_branch: 'main',
    git_username: '',
    git_token: '',
    wordpress_zip: null, // Nouveau champ pour le fichier ZIP
    database_dump: null, // Nouveau champ pour le dump SQL,
    wp_source_domain: '' // Nouveau champ pour l'ancien domaine WordPress'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wpVersionsLoading, setWpVersionsLoading] = useState(false);
  const [availableWpVersions, setAvailableWpVersions] = useState(WORDPRESS_VERSIONS);

  // Option: Charger les versions disponibles depuis une API
  useEffect(() => {
    if (isOpen) {
      setWpVersionsLoading(true);
      api.get('/api/website/wordpress/versions')
        .then(response => {
          setAvailableWpVersions(response.data.data || WORDPRESS_VERSIONS);
        })
        .catch(() => {
          setAvailableWpVersions(WORDPRESS_VERSIONS); // Fallback
        })
        .finally(() => setWpVersionsLoading(false));

              // Réinitialiser la sélection de souscription à l'ouverture
              //subscription_id: subscriptions.length > 0 ? subscriptions[0].id : ''
      setFormData(prev => ({
        ...prev,
        subscription_id: ''
      }));
    }
  }, [isOpen, subscriptions]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files[0] // On prend le premier fichier sélectionné
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
        const payload = new FormData(); // Utilisation de FormData pour gérer les fichiers
        // Ajout des champs communs
        payload.append('name', formData.name);
        payload.append('environment', formData.environment);
        payload.append('subdomain', formData.subdomain);
        payload.append('domain_id', formData.domain_id);
        payload.append('subscription_id', formData.subscription_id);
        payload.append('installation_method', formData.installation_method);

        if (formData.installation_method === INSTALLATION_METHODS.STANDARD) {
            payload.append('wordpress_version', formData.wordpress_version);
        } else if (formData.installation_method === INSTALLATION_METHODS.GIT) {
            payload.append('git_repo_url', formData.git_repo_url);
            payload.append('git_branch', formData.git_branch);
            payload.append('git_username', formData.git_username);
            payload.append('git_token', formData.git_token);
        } else if (formData.installation_method === INSTALLATION_METHODS.ZIP_AND_SQL) {
            if (!formData.wordpress_zip || !formData.database_dump) {
                throw new Error('Les fichiers ZIP et SQL sont requis');
            }
            payload.append('wordpress_zip', formData.wordpress_zip);
            payload.append('database_dump', formData.database_dump);
            payload.append('wp_source_domain', formData.wp_source_domain);
        }

        const response = await api.post('/api/website/deploy-wordpress', payload, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
        });

      const createdWebsite = response.data.data;
      setWebsites(prev => [...prev, createdWebsite]);

      let successMessage = '';
      switch(formData.installation_method) {
        case INSTALLATION_METHODS.STANDARD:
          successMessage = `Site WordPress ${formData.wordpress_version} créé avec succès!`;
          break;
        case INSTALLATION_METHODS.GIT:
          successMessage = 'Site WordPress initialisé depuis le dépôt Git avec succès!';
          break;
        case INSTALLATION_METHODS.ZIP_AND_SQL:
          successMessage = 'Site WordPress déployé à partir des fichiers avec succès!';
          break;
      }

      toast.success(successMessage, {
        duration: 3000,
        position: 'top-center'
      });

      setFormData({
        subscription_id: subscriptions.length > 0 ? subscriptions[0].id : '',
        name: '',
        environment: '',
        subdomain: '',
        domain_id: '',
        wordpress_version: 'latest',
        installation_method: INSTALLATION_METHODS.STANDARD,
        git_repo_url: '',
        git_branch: 'main',
        git_username: '',
        git_token: '',
        wordpress_zip: null,
        database_dump: null
      });
      onClose();
    } catch (err) {
        console.error('Error creating website:', err);
        toast.error(err.response?.data?.message || 'Erreur lors de la création du site');
    } finally {
        setIsSubmitting(false);
    }
  };

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
        
        <h2 className="text-lg font-medium text-gray-900 mb-4">Créer un nouveau site WordPress</h2>
        
        <form onSubmit={handleSubmit}>

          {/* Nouveau champ pour sélectionner la souscription */}
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
            {subscriptions.length === 0 && (
              <p className="mt-1 text-xs text-red-500">
                Vous n'avez aucune souscription active permettant de créer un site.
              </p>
            )}
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
              disabled={isSubmitting || subscriptions.length === 0}
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
              disabled={isSubmitting || subscriptions.length === 0}
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
              disabled={isSubmitting || domains.length === 0 || subscriptions.length === 0}
            >
              <option value="">Sélectionnez un domaine</option>
              {domains.map(domain => (
                <option key={domain.id} value={domain.id}>
                  {domain.domain_name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Méthode d'installation</label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="installation_method"
                  value={INSTALLATION_METHODS.STANDARD}
                  checked={formData.installation_method === INSTALLATION_METHODS.STANDARD}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                  disabled={isSubmitting}
                />
                <span className="ml-2 text-sm text-gray-700">Installation standard</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="installation_method"
                  value={INSTALLATION_METHODS.GIT}
                  checked={formData.installation_method === INSTALLATION_METHODS.GIT}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                  disabled={isSubmitting}
                />
                <span className="ml-2 text-sm text-gray-700">Depuis un dépôt Git</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="installation_method"
                  value={INSTALLATION_METHODS.ZIP_AND_SQL}
                  checked={formData.installation_method === INSTALLATION_METHODS.ZIP_AND_SQL}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                  disabled={isSubmitting}
                />
                <span className="ml-2 text-sm text-gray-700">Depuis fichiers (ZIP + SQL)</span>
              </label>
            </div>
          </div>

          {formData.installation_method === INSTALLATION_METHODS.STANDARD ? (
            <div className="mb-4">
                {/* ... (le contenu pour l'installation standard) ... */}
              <label htmlFor="wordpress_version" className="block text-sm font-medium text-gray-700 mb-1">
                Version de WordPress
              </label>
              <select
                id="wordpress_version"
                name="wordpress_version"
                value={formData.wordpress_version}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isSubmitting || wpVersionsLoading}
              >
                {wpVersionsLoading ? (
                  <option>Chargement des versions...</option>
                ) : (
                  availableWpVersions.map(version => (
                    <option key={version} value={version}>
                      {version === 'latest' ? 'Dernière version stable' : `WordPress ${version}`}
                    </option>
                  ))
                )}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {formData.wordpress_version === 'latest' 
                  ? 'La dernière version stable sera installée'
                  : `Version ${formData.wordpress_version} sera installée`}
              </p>
            </div>
          ) : formData.installation_method === INSTALLATION_METHODS.GIT ? (
            <>
                {/* ... (le contenu pour l'installation Git) ... */}
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
                  placeholder="https://github.com/votre-utilisateur/votre-depot.git"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="mb-4">
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
                  placeholder="main"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="mb-4">
                <label htmlFor="git_username" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom d'utilisateur Git
                </label>
                <input
                  type="text"
                  id="git_username"
                  name="git_username"
                  value={formData.git_username}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="votre-utilisateur"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="mb-4">
                <label htmlFor="git_token" className="block text-sm font-medium text-gray-700 mb-1">
                  Token d'accès Git
                </label>
                <input
                  type="password"
                  id="git_token"
                  name="git_token"
                  value={formData.git_token}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="votre-token-d-acces"
                  required
                  disabled={isSubmitting}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Le token doit avoir les permissions de lecture sur le dépôt
                </p>
              </div>
            </>
          ) : (
            <>
            {/* ... (le contenu pour l'installation zip et sql) ... */}
            <div className="mb-4">
            <label htmlFor="wp_source_domain" className="block text-sm font-medium text-gray-700 mb-1">
              Nom du domaine WordPress (ancien)
            </label>
            <input
              type="text"
              id="wp_source_domain"
              name="wp_source_domain"
              value={formData.wp_source_domain}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
              disabled={isSubmitting}
            />
          </div>
            <div className="mb-4">
                <label htmlFor="wordpress_zip" className="block text-sm font-medium text-gray-700 mb-1">
                  Archive WordPress (ZIP)
                </label>
                <input
                  type="file"
                  id="wordpress_zip"
                  name="wordpress_zip"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  accept=".zip"
                  required
                  disabled={isSubmitting}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Archive ZIP contenant les fichiers WordPress (dossier wp-content, etc.)
                </p>
              </div>

              <div className="mb-4">
                <label htmlFor="database_dump" className="block text-sm font-medium text-gray-700 mb-1">
                  Dump de la base de données (SQL)
                </label>
                <input
                  type="file"
                  id="database_dump"
                  name="database_dump"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  accept=".sql,.gz,.zip"
                  required
                  disabled={isSubmitting}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Fichier SQL contenant les données de la base de données WordPress
                </p>
              </div>
            </>
          )}

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
              disabled={isSubmitting || domains.length === 0}
            >
              {isSubmitting ? 'Création en cours...' : 'Créer le site'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}