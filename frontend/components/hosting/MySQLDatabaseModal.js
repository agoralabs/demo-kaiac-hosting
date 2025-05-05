import { useState } from 'react';
import { ExclamationTriangleIcon, CheckCircleIcon, CircleStackIcon } from '@heroicons/react/24/outline';

export default function MySQLDatabaseModal({ 
  isOpen, 
  onClose, 
  dbCredentials 
}) {
  if (!isOpen) return null;

  const [isCopiedDb, setIsCopiedDb] = useState(false);
  const [isCopiedUser, setIsCopiedUser] = useState(false);
  const [isCopiedPwd, setIsCopiedPwd] = useState(false);

  const copyToClipboard = (text, setIsCopied) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePhpMyAdmin = (url) => {
    // Logique pour ouvrir phpMyAdmin
    // Par exemple, ouvrir dans un nouvel onglet
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <CircleStackIcon className="h-5 w-5 text-blue-500 mr-2" />
          Accès à la base de données MySQL
        </h3>

        <div className="space-y-4">
        <div>
            <label className="block text-sm font-medium text-gray-700">Base de données</label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                readOnly
                value={dbCredentials?.wp_db_name}
                className="flex-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 p-2"
              />
              <button
                onClick={() => copyToClipboard(dbCredentials?.wp_db_name, setIsCopiedDb)}
                className="ml-2 inline-flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {isCopiedDb ? <CheckCircleIcon className="h-4 w-4 text-green-500" /> : 'Copier'}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nom d'utilisateur</label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                readOnly
                value={dbCredentials?.wp_db_user}
                className="flex-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 p-2"
              />
              <button
                onClick={() => copyToClipboard(dbCredentials?.wp_db_user, setIsCopiedUser)}
                className="ml-2 inline-flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {isCopiedUser ? <CheckCircleIcon className="h-4 w-4 text-green-500" /> : 'Copier'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="password"
                readOnly
                value={dbCredentials?.wp_db_password}
                className="flex-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 p-2"
              />
              <button
                onClick={() => copyToClipboard(dbCredentials?.wp_db_password, setIsCopiedPwd)}
                className="ml-2 inline-flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {isCopiedPwd ? <CheckCircleIcon className="h-4 w-4 text-green-500" /> : 'Copier'}
              </button>
            </div>
          </div>

          <div className="flex items-center text-sm text-yellow-600">
            <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
            Conservez ces informations en lieu sûr
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Fermer
          </button>
          <button
            onClick={() => handlePhpMyAdmin(dbCredentials?.phpmyadmin_url)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Ouvrir phpMyAdmin
          </button>
        </div>
      </div>
    </div>
  );
}