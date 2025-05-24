// pages/purchases/emails.js
import Layout from '../../components/Layout';
import PurchasesPage from '../../components/PurchasesPage';
import { 
  useState, 
  useEffect 
} from 'react';
import { 
  ExclamationTriangleIcon, 
  ArrowPathIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  PauseCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  GlobeAltIcon,
  LinkIcon,
  EyeIcon,
  TrashIcon,
  XMarkIcon,
  PlusIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/router';

export default function Emails() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [error, setError] = useState(null);
  const [expandedSubscription, setExpandedSubscription] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentSubscriptionId, setCurrentSubscriptionId] = useState(null);
  const [formData, setFormData] = useState({
    local_part: '', // Partie avant @
    domain_id: '',  // ID du domaine sélectionné
    password: '',
    subscription_id: ''
  });
  const [domains, setDomains] = useState([]);

  // États pour la modale de suppression
  const [emailToDelete, setEmailToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [emails, setEmails] = useState([]);

  useEffect(() => {

    const fetchData = async () => {
      try {
        const [subsResponse, domainsResponse, emailsResponse] = await Promise.all([
          api.get('/api/user/subscriptions/hosting'),
          api.get('/api/user/domains/emails-activated'),
          api.get('/api/user/emails')
        ]);
        const subscriptionsData = subsResponse.data.data || [];
        const emailsData = emailsResponse.data.data || [];

        // Fusionnez les données
        const enrichedSubscriptions = subscriptionsData.map(sub => {
          const subscriptionEmails = emailsData.filter(email => email.subscription_id === sub.id);
          return {
            ...sub,
            emails: subscriptionEmails,
            emails_count: subscriptionEmails.length
          };
        });

        setSubscriptions(enrichedSubscriptions);
        setEmails(emailsData);
        setDomains(domainsResponse.data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const toggleSubscriptionExpand = (id) => {
    setExpandedSubscription(expandedSubscription === id ? null : id);
  };

  const handleCreateClick = (subscriptionId) => {
    setCurrentSubscriptionId(subscriptionId);
    setShowCreateModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleCreateEmail = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/domains/create-mailcow-mailbox', {
        ...formData,
        subscription_id: currentSubscriptionId
      });

      // Mise à jour de l'état local
      setSubscriptions(prev => prev.map(sub => {
        if (sub.id === currentSubscriptionId) {
          return {
            ...sub,
            emails: [...(sub.emails || []), response.data.data],
            emails_count: (sub.emails_count || 0) + 1
          };
        }
        return sub;
      }));

      toast.success('Email créé avec succès');
      setShowCreateModal(false);
      setFormData({
        local_part: '',
        domain_id: '',
        password: '',
        subscription_id: currentSubscriptionId
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const openDeleteModal = (emailToDel) => {
    setEmailToDelete(emailToDel);
  };

  const closeDeleteModal = () => {
    setEmailToDelete(null);
  };

  const confirmDelete = async () => {
    if (!emailToDelete) return;
    
    setIsDeleting(true);
    try {
      await api.delete(`/api/domains/delete-mailcow-mailbox/${emailToDelete.id}`);
      
      // Mise à jour de l'état emails
      const filteredEmails = emails.filter(email => email.id !== emailToDelete.id);
      setEmails(filteredEmails);
      
    // Mise à jour de l'état subscriptions - SEULEMENT pour la subscription concernée
    setSubscriptions(prev => prev.map(sub => {
      // Vérifie si l'email appartient à cette subscription
      if (sub.emails?.some(e => e.id === emailToDelete.id)) {
        return {
          ...sub,
          emails: sub.emails.filter(e => e.id !== emailToDelete.id),
          emails_count: sub.emails_count - 1
        };
      }
      return sub;
    }));
      
      toast.success('Email supprimé');
      closeDeleteModal();
    } catch (err) {
      toast.error('Échec de la suppression');
      console.error('Erreur lors de la suppression', err);
    } finally {
      setIsDeleting(false);
    }
  };

  function getStatusIcon(status) {
    const iconProps = {
      className: "h-5 w-5 flex-shrink-0",
      'aria-hidden': true
    };
  
    switch (status) {
      case 'active':
        return <CheckCircleIcon {...iconProps} className={`${iconProps.className} text-green-500`} />;
      case 'pending':
        return <ClockIcon {...iconProps} className={`${iconProps.className} text-yellow-500`} />;
      case 'suspended':
        return <PauseCircleIcon {...iconProps} className={`${iconProps.className} text-orange-500`} />;
      case 'cancelled':
        return <XCircleIcon {...iconProps} className={`${iconProps.className} text-red-500`} />;
      default:
        return <ClockIcon {...iconProps} className={`${iconProps.className} text-gray-500`} />;
    }
  }

  if (loading) {
    return (
      <Layout title="Mes Adresses E-mails">
        <PurchasesPage>
          <div className="flex justify-center items-center py-12">
            <ArrowPathIcon className="h-8 w-8 text-indigo-600 animate-spin" />
            <span className="ml-2 text-gray-700">Chargement...</span>
          </div>
        </PurchasesPage>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Mes Adresses E-mails">
        <PurchasesPage>
          <div className="text-center py-12">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Erreur</h3>
            <p className="mt-1 text-gray-500">{error}</p>
          </div>
        </PurchasesPage>
      </Layout>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <Layout title="Mes Emails">
        <PurchasesPage>
          <div className="text-center py-12">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
              <ExclamationTriangleIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Aucun abonnement email</h3>
            <p className="mt-1 text-gray-500">
              Vous n'avez pas d'abonnement email actif.
            </p>
          </div>
        </PurchasesPage>
      </Layout>
    );
  }

  return (
    <Layout title="Mes Emails">
      <PurchasesPage>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-xl font-semibold text-gray-900">Mes Emails</h1>
              <p className="mt-2 text-sm text-gray-700">
                Gestion de vos adresses email professionnelles
              </p>
            </div>
          </div>
          
          <div className="mt-8 space-y-6">
            {subscriptions.map((subscription) => (
              <div key={subscription.id} className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <div className="bg-white px-4 py-5 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium leading-6 text-gray-900">
                        {subscription.Plan?.name || 'Abonnement Email'}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {formatDate(subscription.start_date)} - {formatDate(subscription.end_date)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-500">Emails</p>
                        <p className="text-lg font-semibold">
                          {subscription.emails_count || 0}/{subscription.Plan?.included_emails || 0}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleSubscriptionExpand(subscription.id)}
                        className="p-2 text-gray-400 hover:text-gray-500"
                      >
                        {expandedSubscription === subscription.id ? (
                          <ChevronUpIcon className="h-5 w-5" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {expandedSubscription === subscription.id && (
                  <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900">Détails</h4>
                      <div className="mt-2 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Statut</p>
                          <p className="flex items-center text-sm font-medium">
                            {getStatusIcon(subscription.status)}
                            <span className="ml-2 capitalize">{subscription.status}</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Nombre de domaines autorisés</p>
                          <p className="text-sm font-medium">
                            {subscription.Plan?.included_domains || 1}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Stockage max total</p>
                          <p className="text-sm font-medium">
                            {subscription.Plan?.included_storage_mb || 0} Mo
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                    {(subscription.emails_count || 0) < (subscription.Plan?.included_emails || 0) && (
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => handleCreateClick(subscription.id)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Ajouter un email
                        </button>
                      </div>
                    )}
                      <h4 className="text-sm font-medium text-gray-900">
                        Adresses email ({subscription.emails_count || 0})
                      </h4>
                      {subscription.emails?.length > 0 ? (
                        <div className="mt-4 space-y-3">
                          {subscription.emails.map((email) => (
                            <div key={email.id} className="rounded-lg border border-gray-200 p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <EnvelopeIcon className="h-5 w-5 text-indigo-500 mr-2" />
                                  <p className="font-medium">
                                    {email.address}
                                  </p>
                                </div>

                                {email.is_updating_email ? (
                                  <>
                                  <button onClick={() => void(0)}
                                  className='inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200'>
                                    <ArrowPathIcon className="h-5 w-5 animate-spin text-red-500" /> Processing...
                                  </button>
                                  </>
                              ) : (<></>)}

                                <button
                                  onClick={() => openDeleteModal(email)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Supprimer"
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                              </div>

                              <div className="flex items-center">
                                  {email.is_active ? (
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
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-gray-500">
                          Aucune adresse email créée.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modale de confirmation de suppression */}
        {emailToDelete && (
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
                          Êtes-vous sûr de vouloir supprimer l'adresse e-mail <strong>{emailToDelete.address}</strong> ? Cette action est irréversible.
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

        {/* Modal de création d'email */}
          <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
          <div className="relative p-6">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            
            <h2 className="text-lg font-medium text-gray-900 mb-4">Nouvelle adresse email</h2>
            
            <form onSubmit={handleCreateEmail}>
              <div className="mb-4">
                <label htmlFor="local_part" className="block text-sm font-medium text-gray-700 mb-1">
                  Identifiant
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    id="local_part"
                    name="local_part"
                    value={formData.local_part}
                    onChange={handleInputChange}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="ex: contact"
                    required
                  />
                  <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500">
                    @
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="domain_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Domaine
                </label>
                <select
                  id="domain_id"
                  name="domain_id"
                  value={formData.domain_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
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
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  minLength="8"
                  placeholder="Au moins 8 caractères"
                />
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Créer l'email
                </button>
              </div>
            </form>
          </div>
        </Modal>
      </PurchasesPage>
    </Layout>
  );
}