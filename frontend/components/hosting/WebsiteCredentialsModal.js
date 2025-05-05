import { useEffect, useState } from 'react';
import Modal from '../Modal';
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function WebsiteCredentialsModal({
  isOpen,
  onClose,
  onSave,
  website
}) {
  const [credentials, setCredentials] = useState({
    wp_admin_user: website?.wp_admin_user || 'admin',
    wp_admin_user_pwd: '',
    wp_admin_user_app_pwd: website?.wp_admin_user_app_pwd || ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialiser les credentials quand le website change
  useEffect(() => {
    if (website) {
      setCredentials({
        wp_admin_user: website.wp_admin_user || 'admin',
        wp_admin_user_pwd: '', // On ne pré-remplit pas le mot de passe pour des raisons de sécurité
        wp_admin_user_app_pwd: website.wp_admin_user_app_pwd || ''
      });
    }
  }, [website]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await onSave({
        wp_admin_user: credentials.wp_admin_user,
        ...(credentials.wp_admin_user_pwd && { 
          wp_admin_user_pwd: credentials.wp_admin_user_pwd 
        }),
        wp_admin_user_app_pwd: credentials.wp_admin_user_app_pwd
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 max-w-md">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <ExclamationCircleIcon className="h-5 w-5 text-blue-500 mr-2" />
          Gestion des accès WordPress
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Champ Utilisateur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Identifiant administrateur
              </label>
              <input
                type="text"
                name="wp_admin_user"
                value={credentials.wp_admin_user} // Utilisez credentials au lieu de website
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Champ Mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="wp_admin_user_pwd"
                  value={credentials.wp_admin_user_pwd} // Utilisez credentials
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Laisser vide pour ne pas modifier"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                >
                  {showPassword ? "👁️" : "👁️"}
                </button>
              </div>
            </div>

            {/* Champ Application Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Application Password
              </label>
              <input
                type="text"
                name="wp_admin_user_app_pwd"
                value={credentials.wp_admin_user_app_pwd} // Utilisez credentials
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="xxxx xxxx xxxx xxxx"
              />
              <p className="mt-1 text-xs text-gray-500">
                Utilisé pour l'API REST WordPress (optionnel)
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-1 inline animate-pulse" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}