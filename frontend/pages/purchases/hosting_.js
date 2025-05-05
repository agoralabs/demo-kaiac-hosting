// pages/purchases/hosting.js
import Layout from '../../components/Layout';
import PurchasesPage from '../../components/PurchasesPage';
import { useState, useEffect } from 'react';
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
  XMarkIcon
} from '@heroicons/react/24/outline';
import api from '../../lib/api';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal'; // Assurez-vous d'avoir un composant Modal

export default function Hosting() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSubscription, setExpandedSubscription] = useState(null);
  const [deletingSites, setDeletingSites] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentSubscriptionId, setCurrentSubscriptionId] = useState(null);
  const [domains, setDomains] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    domain_id: ''
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [websiteToDelete, setWebsiteToDelete] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subsResponse, websitesResponse] = await Promise.all([
          api.get('/api/user/subscriptions/hosting'),
          api.get('/api/user/websites')
        ]);
        
        // setSubscriptions(subsResponse.data.data || []);

        const subscriptionsData = subsResponse.data.data || [];
        const websitesData = websitesResponse.data.data || [];

        // Enrichir les abonnements avec les sites web et les infos du plan
        const enrichedSubscriptions = subscriptionsData.map(sub => {
          const websites = websitesData.filter(web => web.subscription_id === sub.id);
          return {
            ...sub,
            websites,
            websites_count: websites.length,
            // Supposons que le plan contient un champ max_websites
            max_websites: sub.Plan?.included_sites || 1
          };
        });

        console.log('Enriched Subscriptions:', enrichedSubscriptions);
        setSubscriptions(enrichedSubscriptions);
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

  const formatStorage = (mb) => {
    if (mb >= 1000) return `${(mb / 1000).toFixed(1)} GB`;
    return `${mb} MB`;
  };

  const toggleSubscriptionExpand = (id) => {
    setExpandedSubscription(expandedSubscription === id ? null : id);
  };

  // ... (keep the previous getStatusIcon, loading and error states)

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

  const fetchDomains = async () => {
    try {
      const response = await api.get('/api/user/domains');
      setDomains(response.data.data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des domaines');
    }
  };

  const handleCreateClick = (subscriptionId) => {
    setCurrentSubscriptionId(subscriptionId);
    fetchDomains();
    setShowCreateModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/website/deploy-wordpress', {
        ...formData,
        subscription_id: currentSubscriptionId
      });

      const createdWebsite = response.data.data;
      console.log('Site créé avec succès:', createdWebsite);
      // Mettre à jour l'état local
      setSubscriptions(prev => prev.map(sub => {
        console.log('Subscription:', sub);
        if (sub.id === currentSubscriptionId) {
          return {
            ...sub,
            websites: [...sub.websites, createdWebsite],
            websites_count: sub.websites_count + 1
          };
        }
        return sub;
      }));

      // Notification de succès
      toast.success('Site créé avec succès - déploiement en cours!', {
        duration: 3000, // 3 secondes
        position: 'top-center',
        icon: '🎉',
        style: {
          background: '#4BB543',
          color: '#fff',
        }
      });

      console.log('Site créé avec succès');
      setShowCreateModal(false);
      setFormData({
        name: '',
        subdomain: '',
        domain_id: ''
      });
    } catch (err) {
      console.error('Erreur lors de la création du site :', err);
      toast.error(err.response?.data?.message || 'Erreur lors de la création du site', {
        duration: 4000,
        position: 'top-center'
      });
    }
  };


  const handleDeleteSite = (id) => {
    setWebsiteToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!websiteToDelete) return;
  
    setDeletingSites(prev => [...prev, websiteToDelete]);
    
    try {
      await api.delete(`/api/website/delete-wordpress/${websiteToDelete}`);
      
      setSubscriptions(prev => prev.map(sub => ({
        ...sub,
        websites: sub.websites.filter(web => web.id !== websiteToDelete),
        websites_count: sub.websites.filter(web => web.id !== websiteToDelete).length
      })));
  
      toast.success('Site supprimé avec succès');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setDeletingSites(prev => prev.filter(id => id !== websiteToDelete));
      setDeleteModalOpen(false);
      setWebsiteToDelete(null);
    }
  };

  const handleViewSite = (website) => {
    if (!website) {
      toast.error('Aucun domaine spécifié');
      return;
    }

    const domain = website.record + "." + website.Domain?.name;
    try {
      const url = new URL(
        domain.startsWith('http') ? domain : `https://${domain}`
      );
      window.open(url.toString(), '_blank', 'noopener,noreferrer');
    } catch (e) {
      toast.error('Le domaine semble invalide');
    }
  };
  
  return (
    <Layout title="Mes Hébergements de sites WordPress">
      <PurchasesPage>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-xl font-semibold text-gray-900">Mes Hébergements de sites WordPress</h1>
              <p className="mt-2 text-sm text-gray-700">
                Liste de tous vos hébergements et sites web WordPress associés
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
                        {subscription.Plan?.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {formatDate(subscription.start_date)} - {formatDate(subscription.end_date)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-500">Sites</p>
                        <p className="text-lg font-semibold">
                          {subscription.websites_count}/{subscription.max_websites}
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
                      <h4 className="text-sm font-medium text-gray-900">Détails de l'hébergement</h4>
                      <div className="mt-2 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Statut</p>
                          <p className="flex items-center text-sm font-medium">
                            {getStatusIcon(subscription.status)}
                            <span className="ml-2 capitalize">{subscription.status}</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Référence</p>
                          <p className="text-sm font-medium">
                            {subscription.reference}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Montant</p>
                          <p className="text-sm font-medium">
                            {subscription.amount} {subscription.currency} / {subscription.billing_cycle}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Prochain paiement</p>
                          <p className="text-sm font-medium">
                            {formatDate(subscription.next_payment_date)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Stockage inclu</p>
                          <p className="text-sm font-medium">
                            {subscription.Plan?.included_storage_mb} Mo
                          </p>
                        </div>
                      </div>
                    </div>
                    {subscription.websites_count < subscription.max_websites && (
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => handleCreateClick(subscription.id)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Créer un nouveau site
                        </button>
                      </div>
                      )}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Sites web ({subscription.websites_count})</h4>
                      {subscription.websites_count > 0 ? (
                        <div className="mt-4 space-y-4">
                          {subscription.websites.map((website) => (
                            <div key={website.id} className="rounded-lg border border-gray-200 p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium flex items-center">
                                    <GlobeAltIcon className="h-5 w-5 text-indigo-500 mr-2" />
                                    {website.name}
                                  </p>
                                  <p className="text-sm text-gray-500 mt-1 flex items-center">
                                    <LinkIcon className="h-4 w-4 mr-1" />
                                    <a 
                                      href={`https://${website.record}.${website.Domain?.domain_name}/`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-indigo-600 hover:text-indigo-800"
                                    >
                                      https://{website.record}.{website.Domain?.domain_name}/
                                    </a>
                                  </p>
                                  <div className="flex items-center">
                                  {website.is_active ? (
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
                                <div className="text-right">
                                  <p className="text-sm">
                                    <span className="font-medium">{formatStorage(website.used_storage_mb)}</span> utilisés
                                  </p>

                                  {/* Boutons d'actions - déplacés à droite */}
                                  <div className="ml-4 flex-shrink-0 flex space-x-3">

                                    {website.is_processing_site ? (
                                      <>
                                      <button onClick={() => void(0)}
                                      className='inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200'>
                                        <ArrowPathIcon className="h-5 w-5 animate-spin text-red-500" /> Processing...
                                      </button>
                                      </>
                                    ) : (<></>)}

                                    <button
                                      onClick={() => handleViewSite(website)}
                                      className="text-indigo-600 hover:text-indigo-900"
                                      title="Voir le site"
                                    >
                                      <EyeIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSite(website.id)}
                                      className="text-red-600 hover:text-red-900"
                                      title="Supprimer le site"
                                      disabled={deletingSites.includes(website.id)}
                                    >
                                      {deletingSites.includes(website.id) ? (
                                        <ArrowPathIcon className="h-5 w-5 animate-spin" />
                                      ) : (
                                        <TrashIcon className="h-5 w-5" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                              {website.last_deployed_at && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Dernier déploiement: {formatDate(website.last_deployed_at)}
                                </p>
                              )}

                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-gray-500">
                          Aucun site web créé pour cet abonnement.
                        </p>
                      )}
                    </div>

                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modal de création */}
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
          <div className="relative p-6">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            
            <h2 className="text-lg font-medium text-gray-900 mb-4">Créer un nouveau site</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du site
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700 mb-1">
                  Sous-domaine
                </label>
                <input
                  type="text"
                  id="subdomain"
                  name="subdomain"
                  value={formData.subdomain}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="ex: mon-site"
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="domain_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Domaine principal
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
                  Créer le site
                </button>
              </div>
            </form>
          </div>
        </Modal>
        {/* Modale de confirmation de suppression */}
        <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
          <div className="relative p-6">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-base font-semibold leading-6 text-gray-900">
                  Confirmer la suppression
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Êtes-vous sûr de vouloir supprimer ce site ? Cette action est irréversible.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                onClick={confirmDelete}
                className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
              >
                Supprimer
              </button>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              >
                Annuler
              </button>
            </div>
          </div>
        </Modal>
      </PurchasesPage>
    </Layout>
  );
}