// pages/purchases/domains.js
import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import PurchasesPage from '../../components/PurchasesPage';
import { 
  TrashIcon, 
  ListBulletIcon, 
  ArrowPathIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  GlobeAltIcon, 
  PlusIcon, 
  ShoppingBagIcon, 
  MegaphoneIcon,
  ExclamationTriangleIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function Domains() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // États pour la modale de suppression
  const [domainToDelete, setDomainToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // États pour la modale des sites
  const [sitesModal, setSitesModal] = useState({
    open: false,
    domain: null,
    sites: [],
    loading: false,
    error: null
  });

  // États pour la modale d'ajout
  const [addModal, setAddModal] = useState({
    open: false,
    domain_name: '',
    expires_at: '',
    submitting: false,
    error: null
  });

  // États pour la modale de confirmation email
  const [emailConfirmModal, setEmailConfirmModal] = useState({
    open: false,
    domain: null,
    isUpdating: false
  });

  const fetchDomains = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/user/domains');
      setDomains(response.data.data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des domaines', err);
      setError('Impossible de charger les domaines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const getDomainStatus = (expiresAt) => {
    if (!expiresAt) return 'unknown';
    
    const now = new Date();
    const expirationDate = new Date(expiresAt);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    if (expirationDate < now) {
      return 'expired';
    } else if (expirationDate <= thirtyDaysFromNow) {
      return 'expiring-soon';
    }
    return 'active';
  };

  const getStatusBadge = (expiresAt) => {
    const status = getDomainStatus(expiresAt);
    
    switch (status) {
      case 'expired':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
            Expiré
          </span>
        );
      case 'expiring-soon':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
            Expire bientôt
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Actif
          </span>
        );
    }
  };

  const openEmailConfirmModal = (domain) => {
    setEmailConfirmModal({
      open: true,
      domain,
      isUpdating: false
    });
  };

  const closeEmailConfirmModal = () => {
    setEmailConfirmModal({
      open: false,
      domain: null,
      isUpdating: false
    });
  };

  const confirmToggleEmailDomain = async () => {
    const { domain } = emailConfirmModal;
    console.log('domain', domain);
    if (!domain) return;

    try {
      setEmailConfirmModal(prev => ({ ...prev, isUpdating: true }));
      
      const updatedDomains = domains.map(d => {
        if (d.id === domain.id) {
          return { ...d, is_updating_email: true };
        }
        return d;
      });
      setDomains(updatedDomains);

      
      const payload = {
        domain: domain.domain_name
      };
      // check if the domain is already activated
      const response = (domain.is_emails_domain) ? 
        await api.post('/api/domains/deactivate-emails', payload) : 
        await api.post('/api/domains/activate-emails', payload);

      const toastMessage = (domain.is_emails_domain) ? 
        'Emails désactivé avec succès pour le domaine' : 
        'Emails activé avec succès pour le domaine';

      const updatedDomain = response.data.data;

      setDomains(domains.map(d => {
        if (d.id === domain.id) {
          return { ...d, is_emails_domain: updatedDomain.is_emails_domain, is_updating_email: true };
        }
        return d;
      }));

      closeEmailConfirmModal();
      toast.success(toastMessage);
    } catch (err) {
      console.error('Erreur lors de la mise à jour du domaine', err);
      toast.error(err.response?.data?.message || 'Échec de la mise à jour');
      setDomains(domains.map(d => {
        if (d.id === domain.id) {
          return { ...d, is_updating_email: true };
        }
        return d;
      }));
      closeEmailConfirmModal();
    }
  };

  const openDeleteModal = (domain) => {
    setDomainToDelete(domain);
  };

  const closeDeleteModal = () => {
    setDomainToDelete(null);
  };

  const confirmDelete = async () => {
    if (!domainToDelete) return;
    
    setIsDeleting(true);
    try {
      await api.delete(`/api/user/domains/${domainToDelete.id}`);
      setDomains(domains.filter(domain => domain.id !== domainToDelete.id));
      closeDeleteModal();
    } catch (err) {
      console.error('Erreur lors de la suppression', err);
      alert('Échec de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShowSites = async (domain) => {
    try {
      setSitesModal({
        open: true,
        domain,
        sites: [],
        loading: true,
        error: null
      });

      const response = await api.get(`/api/user/domains/${domain.id}/websites`);
      
      setSitesModal(prev => ({
        ...prev,
        sites: response.data.data || [],
        loading: false
      }));
    } catch (err) {
      console.error('Erreur lors du chargement des sites', err);
      setSitesModal(prev => ({
        ...prev,
        error: 'Impossible de charger les sites',
        loading: false
      }));
    }
  };

  const closeSitesModal = () => {
    setSitesModal({
      open: false,
      domain: null,
      sites: [],
      loading: false,
      error: null
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const openAddModal = () => {
    setAddModal({
      open: true,
      domain_name: '',
      expires_at: '',
      submitting: false,
      error: null
    });
  };

  const closeAddModal = () => {
    setAddModal({
      open: false,
      domain_name: '',
      expires_at: '',
      submitting: false,
      error: null
    });
  };

  const handleAddDomain = async (e) => {
    e.preventDefault();
    
    try {
      setAddModal(prev => ({ ...prev, submitting: true, error: null }));
      
      const response = await api.post('/api/user/domains', {
        domain_name: addModal.domain_name,
        expires_at: addModal.expires_at,
        category: 'declared'
      });
      
      setDomains([...domains, response.data.data]);
      closeAddModal();
    } catch (err) {
      console.error('Erreur lors de l\'ajout du domaine', err);
      setAddModal(prev => ({ 
        ...prev, 
        submitting: false, 
        error: err.response?.data?.message || 'Erreur lors de l\'ajout du domaine' 
      }));
    }
  };

  if (loading) {
    return (
      <Layout title="Mes domaines">
        <PurchasesPage>
          <div className="flex justify-center items-center py-12">
            <ArrowPathIcon className="h-8 w-8 text-indigo-600 animate-spin" />
          </div>
        </PurchasesPage>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Mes domaines">
        <PurchasesPage>
          <div className="text-center py-12 text-red-500">
            <p>{error}</p>
            <button
              onClick={fetchDomains}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Réessayer
            </button>
          </div>
        </PurchasesPage>
      </Layout>
    );
  }

  return (
    <Layout title="Mes domaines">
      <PurchasesPage>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-xl font-semibold text-gray-900">Mes domaines</h1>
              <p className="mt-2 text-sm text-gray-700">
                Liste de tous vos domaines enregistrés
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-3">
              <button
                onClick={openAddModal}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Déclarer un domaine
              </button>
              <button
                onClick={fetchDomains}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Actualiser
              </button>
            </div>
          </div>
          
          {addModal.open && (
            <div className="fixed z-30 inset-0 overflow-y-auto">
              <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                  <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                  <form onSubmit={handleAddDomain}>
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
                            {addModal.error && (
                              <p className="text-red-500 text-sm">{addModal.error}</p>
                            )}
                            <div>
                              <label htmlFor="domain_name" className="block text-sm font-medium text-gray-700">
                                Nom de domaine
                              </label>
                              <input
                                type="text"
                                id="domain_name"
                                required
                                value={addModal.domain_name}
                                onChange={(e) => setAddModal({...addModal, domain_name: e.target.value})}
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
                                value={addModal.expires_at}
                                onChange={(e) => setAddModal({...addModal, expires_at: e.target.value})}
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
                        disabled={addModal.submitting}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                      >
                        {addModal.submitting ? (
                          <ArrowPathIcon className="h-5 w-5 animate-spin" />
                        ) : (
                          'Ajouter'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={closeAddModal}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col">
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                {domains.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Aucun domaine enregistré</p>
                  </div>
                ) : (
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                            Nom de domaine
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Catégorie
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Expire le
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Statut
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Emails
                          </th>
                          <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {domains.map((domain) => (
                          <tr key={domain.id} className={getDomainStatus(domain.expires_at) === 'expired' ? 'bg-red-50' : ''}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                              {domain.domain_name}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                {domain.category === 'buyed' ? (
                                  <>
                                    <ShoppingBagIcon className="h-4 w-4 text-indigo-500 mr-2" />
                                    <span>Acheté</span>
                                  </>
                                ) : (
                                  <>
                                    <MegaphoneIcon className="h-4 w-4 text-green-500 mr-2" />
                                    <span>Déclaré</span>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {formatDate(domain.expires_at)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              {getStatusBadge(domain.expires_at)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              {domain.is_updating_email ? (
                                <>
                                <button onClick={() => void(0)}
                                  className='inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200'>
                                <ArrowPathIcon className="h-5 w-5 animate-spin text-red-500" /> Processing...
                                </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => openEmailConfirmModal(domain)}
                                  className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                                    domain.is_emails_domain 
                                      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                  }`}
                                  title={domain.is_emails_domain ? "Désactiver pour les emails" : "Activer pour les emails"}
                                >
                                  <EnvelopeIcon className="h-4 w-4 mr-1" />
                                  {domain.is_emails_domain ? 'Activé' : 'Désactivé'}
                                </button>
                              )}
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              <button
                                onClick={() => handleShowSites(domain)}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                title="Liste des sites"
                              >
                                <ListBulletIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => domain.category !== 'buyed' && openDeleteModal(domain)}
                                className={`${domain.category === 'buyed' ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-900'}`}
                                title={domain.category === 'buyed' ? "Impossible de supprimer un domaine acheté" : "Supprimer"}
                                disabled={domain.category === 'buyed'}
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modale de confirmation pour l'activation/désactivation des emails */}
        {emailConfirmModal.open && (
          <div className="fixed z-20 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                      <EnvelopeIcon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {emailConfirmModal.domain?.is_emails_domain ? 'Désactiver' : 'Activer'} le domaine pour les emails
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Êtes-vous sûr de vouloir {emailConfirmModal.domain?.is_emails_domain ? 'désactiver' : 'activer'} le domaine <strong>{emailConfirmModal.domain?.domain_name}</strong> pour les emails ?
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={confirmToggleEmailDomain}
                    disabled={emailConfirmModal.isUpdating}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {emailConfirmModal.isUpdating ? (
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    ) : (
                      emailConfirmModal.domain?.is_emails_domain ? 'Désactiver' : 'Activer'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={closeEmailConfirmModal}
                    disabled={emailConfirmModal.isUpdating}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {domainToDelete && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <TrashIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Confirmer la suppression
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Êtes-vous sûr de vouloir supprimer le domaine <strong>{domainToDelete.domain_name}</strong> ? Cette action est irréversible.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {isDeleting ? (
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    ) : (
                      'Supprimer'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={closeDeleteModal}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {sitesModal.open && (
          <div className="fixed z-20 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                      <GlobeAltIcon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Sites associés à {sitesModal.domain?.domain_name}
                      </h3>
                      <div className="mt-4">
                        {sitesModal.loading ? (
                          <div className="flex justify-center py-8">
                            <ArrowPathIcon className="h-8 w-8 text-indigo-600 animate-spin" />
                          </div>
                        ) : sitesModal.error ? (
                          <p className="text-red-500">{sitesModal.error}</p>
                        ) : sitesModal.sites.length === 0 ? (
                          <p className="text-gray-500">Aucun site associé à ce domaine</p>
                        ) : (
                          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                    Nom du site
                                  </th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                    URL
                                  </th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                    Statut
                                  </th>
                                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                    Créé le
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 bg-white">
                                {sitesModal.sites.map((site) => (
                                  <tr key={site.id}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                      {site.name}
                                    </td>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                      <a 
                                        href={`${site.record}.${site.Domain.domain_name}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-indigo-600 hover:text-indigo-800"
                                      >
                                        ${site.record}.${site.Domain.domain_name}
                                      </a>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`}>
                                          {site.is_active ? (
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
                                      </span>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                      {formatDate(site.created_at)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={closeSitesModal}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </PurchasesPage>
    </Layout>
  );
}