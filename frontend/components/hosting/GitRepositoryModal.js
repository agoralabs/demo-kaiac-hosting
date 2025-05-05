import { useState, useEffect } from 'react';
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Modal from '../Modal';

export default function GitRepositoryModal({ 
  isOpen, 
  onClose, 
  onSave,
  website
}) {
  const [formData, setFormData] = useState({
    git_repo_url: website.git_repo_url || '',
    git_branch: website.git_branch || 'main',
    git_username: website.git_username || '',
    git_token: website.git_token || ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when opening/closing modal
  useEffect(() => {
    setIsLoading(true);
    if (isOpen) {
        setFormData(formData);
    }
    setIsLoading(false);
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    setIsSubmitting(true);
    e.preventDefault();
    onSave(formData);
    setIsSubmitting(false);
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
        
        <h2 className="text-lg font-medium text-gray-900 mb-4">Configuration du dépôt Git</h2>
        
        <form onSubmit={handleSubmit}>
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
              required
            />
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
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
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