// components/DomainAddModal.js
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function DomainAddModal({ 
  isOpen, 
  onClose, 
  domainName, 
  expiresAt, 
  onDomainNameChange, 
  onExpiresAtChange, 
  onSubmit, 
  isSubmitting, 
  error 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed z-30 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={onSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                  <PlusIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Ajouter un nouveau domaine
                  </h3>
                  <div className="mt-4 space-y-4">
                    {error && (
                      <p className="text-red-500 text-sm">{error}</p>
                    )}
                    <div>
                      <label htmlFor="domain_name" className="block text-sm font-medium text-gray-700">
                        Nom de domaine
                      </label>
                      <input
                        type="text"
                        id="domain_name"
                        required
                        value={domainName}
                        onChange={onDomainNameChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="example.com"
                      />
                    </div>
                    <div>
                      <label htmlFor="expires_at" className="block text-sm font-medium text-gray-700">
                        Date d'expiration
                      </label>
                      <input
                        type="date"
                        id="expires_at"
                        required
                        value={expiresAt}
                        onChange={onExpiresAtChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                {isSubmitting ? (
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                ) : (
                  'Ajouter'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}