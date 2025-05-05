import { ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Modal from '../Modal';

export default function BackupSettingsConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isLoading,
  settings
}) {
  const { 
    backupFrequency, 
    backupTime, 
    dayOfWeek, 
    dayOfMonth, 
    retentionPeriod, 
    maxBackups, 
    includeDatabase, 
    includeFiles, 
    notifyOnFailure, 
    notifyEmail 
  } = settings;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <CheckCircleIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
          </div>
          <div className="mt-3 text-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Confirmer les paramètres de sauvegarde
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Êtes-vous sûr de vouloir enregistrer ces paramètres de sauvegarde ? 
              </p>
              <div className="mt-4 bg-gray-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-gray-900">Résumé des paramètres</h4>
                <ul className="mt-2 text-sm text-gray-500 space-y-2">
                  <li className="flex items-start">
                    <span className="font-medium mr-2">Fréquence:</span>
                    <span>
                      {backupFrequency === 'hourly' ? 'Toutes les heures' : 
                       backupFrequency === 'daily' ? 'Tous les jours' : 
                       backupFrequency === 'weekly' ? 'Toutes les semaines' : 
                       backupFrequency === 'monthly' ? 'Tous les mois' : 
                       backupFrequency === 'none' ? 'Désactivée' : 'Non définie'}
                    </span>
                  </li>
                  {backupFrequency && backupFrequency !== 'none' && (
                    <li className="flex items-start">
                      <span className="font-medium mr-2">Heure:</span>
                      <span>{backupTime}</span>
                    </li>
                  )}
                  {backupFrequency === 'weekly' && (
                    <li className="flex items-start">
                      <span className="font-medium mr-2">Jour:</span>
                      <span>
                        {dayOfWeek === '0' ? 'Dimanche' :
                         dayOfWeek === '1' ? 'Lundi' :
                         dayOfWeek === '2' ? 'Mardi' :
                         dayOfWeek === '3' ? 'Mercredi' :
                         dayOfWeek === '4' ? 'Jeudi' :
                         dayOfWeek === '5' ? 'Vendredi' : 'Samedi'}
                      </span>
                    </li>
                  )}
                  {backupFrequency === 'monthly' && (
                    <li className="flex items-start">
                      <span className="font-medium mr-2">Jour du mois:</span>
                      <span>{dayOfMonth}</span>
                    </li>
                  )}
                  <li className="flex items-start">
                    <span className="font-medium mr-2">Rétention:</span>
                    <span>{retentionPeriod} jours</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-2">Maximum:</span>
                    <span>{maxBackups} sauvegardes</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-2">Contenu:</span>
                    <span>
                      {includeDatabase && includeFiles ? 'Base de données et fichiers' : 
                       includeDatabase ? 'Base de données uniquement' : 
                       includeFiles ? 'Fichiers uniquement' : 'Aucun contenu sélectionné'}
                    </span>
                  </li>
                  {notifyOnFailure && (
                    <li className="flex items-start">
                      <span className="font-medium mr-2">Notification:</span>
                      <span>{notifyEmail}</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                Enregistrement...
              </>
            ) : (
              'Confirmer'
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
