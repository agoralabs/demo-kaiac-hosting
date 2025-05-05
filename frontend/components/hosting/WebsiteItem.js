import { useState, useEffect } from 'react';
import { 
  GlobeAltIcon, 
  LinkIcon, 
  EyeIcon, 
  TrashIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowPathIcon,
  PencilIcon,
  NewspaperIcon,
  CodeBracketSquareIcon,
  CircleStackIcon
} from '@heroicons/react/24/outline';
import { formatStorage } from './utils';
import WebsiteCredentialsModal from './WebsiteCredentialsModal';
import GitRepositoryModal from './GitRepositoryModal';
import useProcessingMonitor from '../../hooks/useProcessingMonitor'; // Importez le hook
import MySQLDatabaseModal from './MySQLDatabaseModal';

export default function WebsiteItem({ 
  website, 
  isDeleting, 
  onDelete,
  onView,
  onUpdateCredentials,
  onUpdateStorage,
  onManageGit,
  onFetchDbCredentials
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showGitModal, setShowGitModal] = useState(false);
  const [isGitSubmitting, setIsGitSubmitting] = useState(false);
  const [showMySQLModal, setShowMySQLModal] = useState(false);
  const [dbCredentials, setDbCredentials] = useState(null);
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [dbError, setDbError] = useState(null);

    // Ajoutez cette fonction pour gérer les credentials MySQL
    const handleDbAccessClick = async () => {
        if (!onFetchDbCredentials) return;
        
        setIsLoadingDb(true);
        setDbError(null);
        
        try {
        const credentials = await onFetchDbCredentials(website.id);  // Doit retourner { wp_db_name, wp_db_user, wp_db_password, phpmyadmin_url }
        console.log("Credentials received:", credentials);
        setDbCredentials(credentials);
        setShowMySQLModal(true);
        } catch (error) {
        setDbError(error.message || "Erreur lors de la récupération des identifiants");
        } finally {
        setIsLoadingDb(false);
        }
    };

  // Utilisation du hook personnalisé
  const { isProcessing, isLoading: isStatusLoading, error: statusError } = 
    useProcessingMonitor(website.id, website.is_processing_site);

  const handleSaveCredentials = async (credentials) => {
    try {
      await onUpdateCredentials(website.id, credentials);
      setIsEditing(false);
    } catch (error) {
      console.error("Erreur lors de la mise à jour", error);
    }
  };

  const handleUpdateStorageUpdating = async (websiteId) => {
    setIsUpdating(true);
    try {
      await onUpdateStorage(websiteId);
    } catch (error) {
      console.error("Erreur lors de la mise à jour", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveGitConfig = async (gitConfig) => {
    setIsGitSubmitting(true);
    try {
      await onManageGit(website.id, gitConfig);
      setShowGitModal(false);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la configuration Git", error);
    } finally {
      setIsGitSubmitting(false);
    }
  };

  const getFullUrl = () => {
    if (!website.Domain) return null;
    return `https://${website.record}.${website.Domain.domain_name}`;
  };

  const fullUrl = getFullUrl();

  return (
    <div className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        {/* Colonne de gauche - Infos du site */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <GlobeAltIcon className="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0" />
            <p className="font-medium truncate" title={website.name}>
              {website.name}
            </p>
          </div>

          {fullUrl && (
            <p className="text-sm text-gray-500 mt-1 flex items-center">
              <LinkIcon className="h-4 w-4 mr-1 flex-shrink-0" />
              <a
                href={fullUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 truncate"
                title={fullUrl}
              >
                {fullUrl}
              </a>
            </p>
          )}

          <div className="flex items-center mt-1">
            {isProcessing ? (
              <>
                <ArrowPathIcon className="h-4 w-4 text-blue-500 animate-spin" />
                <span className="ml-1 text-xs text-blue-600">Déploiement en cours</span>
              </>
            ) : website.is_active ? (
              <>
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                <span className="ml-1 text-xs text-green-600">Actif</span>
              </>
            ) : (
              <>
                <XCircleIcon className="h-4 w-4 text-red-400" />
                <span className="ml-1 text-xs text-red-500">Inactif</span>
              </>
            )}
          </div>
        </div>

        {/* Colonne de droite - Stockage et actions */}
        <div className="ml-4 flex flex-col items-end">
          <p className="text-sm">
            <span className="font-medium">{formatStorage(website.used_storage_mb)}</span>
            <span className="text-gray-500"> utilisés</span>
            <button
              onClick={() => handleUpdateStorageUpdating(website.id)}
              className="text-gray-600 hover:text-gray-900 p-1 rounded-full hover:bg-gray-50"
              title="Mettre à jour le stockage utilisé"
              disabled={isUpdating}
            >
              <ArrowPathIcon className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
            </button>
            {isUpdating && <span className="text-xs text-gray-500 ml-1">Mise à jour...</span>}
          </p>

          {website.last_deployed_at && (
            <p className="text-xs text-gray-500 mt-1">
              Dernier déploiement: {new Date(website.last_deployed_at).toLocaleDateString('fr-FR')}
            </p>
          )}

          <div className="mt-2 flex space-x-3">
            <button
                onClick={handleDbAccessClick}
                className="text-purple-600 hover:text-purple-900 p-1 rounded-full hover:bg-purple-50"
                title="Accès à la base de données"
                disabled={isDeleting || website.is_processing_site || isLoadingDb}
            >
                <CircleStackIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowGitModal(true)}
              className="text-orange-600 hover:text-orange-900 p-1 rounded-full hover:bg-orange-50"
              title="Gérer les accès à Git"
              disabled={isDeleting || website.is_processing_site}
            >
              <CodeBracketSquareIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
              title="Gérer les accès à wordpress"
            >
              <NewspaperIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => onView(website)}
              className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50"
              title="Voir le site"
              disabled={isDeleting || website.is_processing_site}
            >
              <EyeIcon className="h-5 w-5" />
            </button>
            <button
              onClick={onDelete}
              className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
              title="Supprimer le site"
              disabled={isDeleting || website.is_processing_site}
            >
              {isDeleting ? (
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
              ) : (
                <TrashIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <MySQLDatabaseModal
            isOpen={showMySQLModal}
            onClose={() => setShowMySQLModal(false)}
            dbCredentials={dbCredentials}
            error={dbError}
            isLoading={isLoadingDb}
        />

        <WebsiteCredentialsModal
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          initialCredentials={{
            wp_admin_user: website.wp_admin_user || 'admin',
            wp_admin_user_pwd: website.wp_admin_user_pwd || '',
            wp_admin_user_app_pwd: website.wp_admin_user_app_pwd || ''
          }}
          onSave={handleSaveCredentials}
        />
        <GitRepositoryModal
          isOpen={showGitModal}
          onClose={() => setShowGitModal(false)}
          initialData={website.git_config || {
            git_repo_url: website.git_repo_url,
            git_branch: website.git_branch || 'main',
            git_username: website.git_username || '',
            git_token: website.git_token || ''
          }}
          onSubmit={handleSaveGitConfig}
          isSubmitting={isGitSubmitting}
        />
      </div>
    </div>
  );
}