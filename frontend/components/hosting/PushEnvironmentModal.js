import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function PushEnvironmentModal({ 
  isOpen, 
  onClose, 
  groupName, 
  environments,
  onPush 
}) {
  const [sourceEnv, setSourceEnv] = useState('');
  const [targetEnv, setTargetEnv] = useState('');
  const [fileSelectionMode, setFileSelectionMode] = useState('all');
  const [selectedFiles, setSelectedFiles] = useState({
    'wp-content/themes': true,
    'wp-content/plugins': true,
    'wp-content/uploads': true,
    'wp-config.php': false
  });
  const [customFiles, setCustomFiles] = useState('');
  const [databaseSelectionMode, setDatabaseSelectionMode] = useState('all');
  const [selectedTables, setSelectedTables] = useState([]);
  const [customTables, setCustomTables] = useState('');
  const [performSearchReplace, setPerformSearchReplace] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Process custom files
    const customFilesArray = customFiles
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    // Process custom tables
    const customTablesArray = customTables
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    onPush({
      groupName,
      sourceEnv,
      targetEnv,
      fileSelection: fileSelectionMode === 'all' ? 'all' : 'pick',
      selectedFiles: fileSelectionMode === 'all' ?
         [] 
        : [
            ...Object.keys(selectedFiles).filter(file => selectedFiles[file]),
            ...customFilesArray
          ],
      databaseSelection: databaseSelectionMode === 'all' ? 'all' : 'pick',
      selectedTables:  databaseSelectionMode === 'all' ? 
        []
        : [
            ...selectedTables,
            ...customTablesArray
          ],
      performSearchReplace
    });
    onClose();
  };

  if (!isOpen) return null;

  const databaseTables = [
    'wp_options',
    'wp_posts',
    'wp_users',
    'wp_comments',
    'wp_terms'
  ];

  const toggleTableSelection = (table) => {
    setSelectedTables(prev => 
      prev.includes(table) 
        ? prev.filter(t => t !== table) 
        : [...prev, table]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white z-10">
          <h3 className="text-lg font-medium">Pousser vers un environnement</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Groupe: <span className="font-semibold">{groupName}</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sourceEnv" className="block text-sm font-medium text-gray-700">
                Environnement source
              </label>
              <select
                id="sourceEnv"
                value={sourceEnv}
                onChange={(e) => setSourceEnv(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                required
              >
                <option value="">Sélectionner</option>
                {environments.map(env => (
                  <option key={`source-${env}`} value={env}>{env}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="targetEnv" className="block text-sm font-medium text-gray-700">
                Environnement cible
              </label>
              <select
                id="targetEnv"
                value={targetEnv}
                onChange={(e) => setTargetEnv(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                required
              >
                <option value="">Sélectionner</option>
                {environments
                  .filter(env => env !== sourceEnv)
                  .map(env => (
                    <option key={`target-${env}`} value={env}>{env}</option>
                  ))}
              </select>
            </div>
          </div>

          {/* Files Section */}
          <div className="border-t pt-4">
            <h4 className="text-md font-medium text-gray-900 mb-3">Options des fichiers</h4>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="file-all"
                  name="fileSelection"
                  checked={fileSelectionMode === 'all'}
                  onChange={() => setFileSelectionMode('all')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <label htmlFor="file-all" className="ml-2 block text-sm text-gray-700">
                  Tous les fichiers et dossiers WordPress
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="radio"
                  id="file-specific"
                  name="fileSelection"
                  checked={fileSelectionMode === 'specific'}
                  onChange={() => setFileSelectionMode('specific')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <label htmlFor="file-specific" className="ml-2 block text-sm text-gray-700">
                  Fichiers et dossiers spécifiques
                </label>
              </div>
              
              {fileSelectionMode === 'specific' && (
                <div className="ml-6 space-y-4">
                  <div className="space-y-2 border-l pl-4">
                    {Object.keys(selectedFiles).map(file => (
                      <div key={file} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`file-${file}`}
                          checked={selectedFiles[file]}
                          onChange={() => setSelectedFiles(prev => ({
                            ...prev,
                            [file]: !prev[file]
                          }))}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`file-${file}`} className="ml-2 block text-sm text-gray-700">
                          {file}
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="border-l pl-4">
                    <label htmlFor="customFiles" className="block text-sm font-medium text-gray-700 mb-1">
                      Fichiers/dossiers supplémentaires (séparés par des virgules)
                    </label>
                    <textarea
                      id="customFiles"
                      value={customFiles}
                      onChange={(e) => setCustomFiles(e.target.value)}
                      placeholder="Ex: wp-content/languages, wp-content/custom-folder/file.txt"
                      className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                      rows={3}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Indiquez les chemins relatifs depuis la racine WordPress
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Database Section */}
          <div className="border-t pt-4">
            <h4 className="text-md font-medium text-gray-900 mb-3">Options de la base de données</h4>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="db-all"
                  name="dbSelection"
                  checked={databaseSelectionMode === 'all'}
                  onChange={() => setDatabaseSelectionMode('all')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <label htmlFor="db-all" className="ml-2 block text-sm text-gray-700">
                  Toutes les tables de la base de données
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="radio"
                  id="db-specific"
                  name="dbSelection"
                  checked={databaseSelectionMode === 'specific'}
                  onChange={() => setDatabaseSelectionMode('specific')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <label htmlFor="db-specific" className="ml-2 block text-sm text-gray-700">
                  Tables spécifiques
                </label>
              </div>
              
              {databaseSelectionMode === 'specific' && (
                <div className="ml-6 space-y-4">
                  <div className="space-y-2 border-l pl-4">
                    {databaseTables.map(table => (
                      <div key={table} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`table-${table}`}
                          checked={selectedTables.includes(table)}
                          onChange={() => toggleTableSelection(table)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`table-${table}`} className="ml-2 block text-sm text-gray-700">
                          {table}
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="border-l pl-4">
                    <label htmlFor="customTables" className="block text-sm font-medium text-gray-700 mb-1">
                      Tables supplémentaires (séparées par des virgules)
                    </label>
                    <textarea
                      id="customTables"
                      value={customTables}
                      onChange={(e) => setCustomTables(e.target.value)}
                      placeholder="Ex: wp_custom_table, wp_another_table"
                      className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                      rows={3}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Indiquez les noms complets des tables
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search & Replace Section */}
          <div className="border-t pt-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="searchReplace"
                checked={performSearchReplace}
                onChange={() => setPerformSearchReplace(!performSearchReplace)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="searchReplace" className="ml-2 block text-sm text-gray-700">
                Exécuter la recherche et le remplacement (remplace les URLs dans la base de données)
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Pousser les modifications
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}