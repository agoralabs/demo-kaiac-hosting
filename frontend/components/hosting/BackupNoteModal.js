// components/hosting/BackupNoteModal.js
import { useState } from 'react';
import Modal from '../Modal';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

/**
 * Composant de modale pour saisir une note lors de la création d'une sauvegarde manuelle
 * 
 * @param {boolean} isOpen - État d'ouverture de la modale
 * @param {function} onClose - Fonction appelée à la fermeture de la modale
 * @param {function} onConfirm - Fonction appelée à la confirmation avec la note en paramètre
 * @param {boolean} isLoading - État de chargement pendant la création de la sauvegarde
 */
export default function BackupNoteModal({ isOpen, onClose, onConfirm, isLoading = false }) {
  const [note, setNote] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(note);
  };

  const handleClose = () => {
    setNote(''); // Réinitialiser la note à la fermeture
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
          Créer une sauvegarde
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="backup-note" className="block text-sm font-medium text-gray-700 mb-1">
              Note (optionnelle)
            </label>
            <textarea
              id="backup-note"
              name="backup-note"
              rows="4"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Ajoutez une note pour identifier cette sauvegarde (ex: Avant mise à jour de plugins)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <p className="mt-1 text-sm text-gray-500">
              Cette note vous aidera à identifier la sauvegarde ultérieurement.
            </p>
          </div>
          
          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
            >
              {isLoading ? (
                <>
                  <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                  Création en cours...
                </>
              ) : (
                'Créer la sauvegarde'
              )}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
              onClick={handleClose}
              disabled={isLoading}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
