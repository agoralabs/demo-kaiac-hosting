import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';
import DomainSearch from '../../components/DomainSearch';
import DomainForm from '../../components/DomainForm';
import { loadStripe } from '@stripe/stripe-js';

import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ArrowPathIcon, 
  ExclamationTriangleIcon,
  PlusIcon,
  TrashIcon,
  ShoppingBagIcon,
  MegaphoneIcon,
  ShieldExclamationIcon,
  BeakerIcon,
  EnvelopeIcon,
  NoSymbolIcon,
  ArrowDownTrayIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import PurchasesPage from '../../components/PurchasesPage';
import HostingList from '../../components/hosting/HostingList';

export default function ManageDomains() {
  // États généraux
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { isLoggedIn, user, isLoading } = useAuth();
  const [domains, setDomains] = useState([]);
  const [activeTab, setActiveTab] = useState('list');
  const [isMockMode, setIsMockMode] = useState(true);
  
  // États pour la recherche et l'achat de domaine
  const [domain, setDomain] = useState('');
  const [domainData, setDomainData] = useState(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(null);

  // États pour la modale d'ajout de domaine
  const [newDomainName, setNewDomainName] = useState('');
  const [newDomainExpiresAt, setNewDomainExpiresAt] = useState('');
  const [isSubmittingDomain, setIsSubmittingDomain] = useState(false);
  const [domainAddError, setDomainAddError] = useState(null);
  const [isAwsDomain, setIsAwsDomain] = useState(false);
  const [awsAccessKeyId, setAwsAccessKeyId] = useState('');
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState('');
  
  // États pour la suppression
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
  
  // États pour la modale de confirmation email
  const [emailConfirmModal, setEmailConfirmModal] = useState({
    open: false,
    domain: null,
    isUpdating: false
  });

  const [subscriptions, setSubscriptions] = useState([]);

  const [domainToRegister, setDomainToRegister] = useState(null);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState(null);
  // Fonctions pour l'enregistrement de domaine
  const openDomainRegisterModal = (domain) => {
    setDomainToRegister(domain);
  };

  const closeDomainRegisterModal = () => {
    setDomainToRegister(null);
  };

  const confirmRegistration = async () => {
    if (!domainToRegister) return;
    
    setIsDeleting(true);
    try {
      await api.post(`/api/domains/register-domain`, {
        domainName: domainToRegister,
        subscription_id: selectedSubscriptionId,
        domainData
      });
      const response = await api.get('/api/user/domains');
      setDomains(response.data.data || []);
      closeDomainRegisterModal();
      toast.success('Domaine enregistré avec succès');
    } catch (err) {
      console.error("Erreur lors de l'enregistrement", err);
      toast.error("Erreur de l'enregistrement");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn) {
        router.push('/login');
      } else {
        fetchDomains();
      }
    }
    
    // Initialiser le mode mock
    const shouldMock = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
    setIsMockMode(shouldMock);

    const fetchData = async () => {
      try {
        const [subsResponse, domainsResponse] = await Promise.all([
          api.get('/api/user/subscriptions/hosting'),
          api.get('/api/user/domains')
        ]);

        const subscriptionsData = subsResponse.data.data || [];

        const domainsData = domainsResponse.data.data || [];

        const enrichedSubscriptions = subscriptionsData.map(sub => ({
          ...sub,
          domains: domainsData.filter(dom => dom.subscription_id === sub.id),
          domains_count: domainsData.filter(dom => dom.subscription_id === sub.id).length,
          max_domains: sub.Plan?.included_domains || 1
        }));

        setSubscriptions(enrichedSubscriptions);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

  }, [isLoading, isLoggedIn, router]);

  // Fonctions pour la gestion des domaines existants
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
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };
  
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
  
  // Fonctions pour la suppression de domaine
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
      toast.success('Domaine supprimé avec succès');
    } catch (err) {
      console.error('Erreur lors de la suppression', err);
      toast.error('Échec de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Fonctions pour la recherche et l'achat de domaine
  const handleSearch = async (domainName) => {
    if (!domainName) return;
    
    setLoading(true);
    setError(null);
    setDomain(domainName);
    setDomainData(null);

    try {
      const response = await api.post('/api/domains/check', { 
        domainName,
        mock: isMockMode
      });

      const data = response.data;
      
      if (data.fromDatabase) {
        // Domaine trouvé en base de données
        setDomainData({
          available: data.available,
          currency: 'EUR',
          tld: domainName.split('.').pop()
        });
        setError(`Ce domaine est déjà enregistré (statut: ${data.registeredData.status})`);
      } else {
        // Résultat standard du registrar
        setDomainData({
          available: data.available,
          price: data.prices.registration || null,
          currency: data.prices.currency || 'EUR',
          tld: domainName.split('.').pop()
        });
      }

    } catch (err) {
      setError(err.message || 'Une erreur est survenue');
      console.error('Domain check error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const resetSearch = () => {
    setDomain('');
    setDomainData(null);
    setError(null);
    setRegistrationSuccess(null);
  };
  
  const handleDomainNameChange = (e) => {
    setNewDomainName(e.target.value);
  };

  const handleExpiresAtChange = (e) => {
    setNewDomainExpiresAt(e.target.value);
  };

  const handleAwsDomainChange = (e) => {
    setIsAwsDomain(e.target.checked);
    if (!e.target.checked) {
      setAwsAccessKeyId('');
      setAwsSecretAccessKey('');
    }
  };

  const handleAwsAccessKeyIdChange = (e) => {
    setAwsAccessKeyId(e.target.value);
  };

  const handleAwsSecretAccessKeyChange = (e) => {
    setAwsSecretAccessKey(e.target.value);
  };

  const handleDomainAddSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingDomain(true);
    setDomainAddError(null);

    try {
      // Appel API pour déclarer un domaine existant
      const response = await api.post('/api/domains/declare', {
        domainName: newDomainName,
        expiresAt: newDomainExpiresAt,
        isAwsDomain: isAwsDomain,
        awsAccessKeyId: isAwsDomain ? awsAccessKeyId : undefined,
        awsSecretAccessKey: isAwsDomain ? awsSecretAccessKey : undefined,
        mock: isMockMode
      });

      // Fermer la modal et afficher un message de succès
      toast.success('Domaine déclaré avec succès');
      
      // Rafraîchir la liste des domaines
      fetchDomains();
    } catch (err) {
      setDomainAddError(err.message || 'Échec de la déclaration du domaine');
      console.error('Domain declaration error:', err);
    } finally {
      setIsSubmittingDomain(false);
    }
  };
  
  // Fonction pour basculer entre mode réel et mock
  const toggleMockMode = () => {
    setIsMockMode(!isMockMode);
    resetSearch();
  };

  // Fonctions pour la gestion des emails
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
      
      const response = await api.post('/api/domains/toggle-emails-activation', payload);

      const updatedDomain = response.data.data;

      setDomains(domains.map(d => {
        if (d.id === domain.id) {
          return { ...d, is_emails_domain: updatedDomain.is_emails_domain, is_updating_email: false };
        }
        return d;
      }));

      const toastMessage = (domain.is_emails_domain) ? 
        'Emails désactivé avec succès pour le domaine' : 
        'Emails activé avec succès pour le domaine';

      closeEmailConfirmModal();
      toast.success(toastMessage);
    } catch (err) {
      console.error('Erreur lors de la mise à jour du domaine', err);
      toast.error(err.response?.data?.message || 'Échec de la mise à jour');

      closeEmailConfirmModal();
    }
  };
  
  // Fonction pour télécharger les informations DNS
  const downloadDnsInfo = async (domainId) => {
    try {
      const response = await api.get(`/api/domains/get-dns-info/${domainId}`);
      
      // Créer un URL pour le blob
      const url = window.URL.createObjectURL(new Blob([response.data.data]));
      
      // Créer un élément a temporaire
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `dns-info-${domainId}.txt`);
      
      // Ajouter au DOM, cliquer et supprimer
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Informations DNS téléchargées avec succès");
    } catch (err) {
      console.error("Erreur lors du téléchargement des informations DNS", err);
      toast.error("Impossible de télécharger les informations DNS");
    }
  };
  
  // Fonctions pour la gestion des sites associés
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

  // Show loading state
  if (isLoading || loading) {
    return (
      <Layout title="Gestion des domaines">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4" />
            <p>Chargement...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show message while redirecting if not logged in
  if (!isLoggedIn) {
    return (
      <Layout title="Gestion des domaines">
        <PurchasesPage>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="mb-4">
              <p className="text-lg text-gray-600">Veuillez vous connecter pour gérer vos domaines</p>
              <p className="text-sm text-gray-500 mt-2">Redirection vers la page de connexion...</p>
            </div>
            <button 
              onClick={() => router.push('/login')}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Connectez-vous
            </button>
          </div>
        </div>
        </PurchasesPage>
      </Layout>
    );
  }

  return (
    <Layout title="Gestion des domaines">
      
      <PurchasesPage>
      {/* Section des hébergements actuels */}
      <HostingList 
          subscriptions={subscriptions}
          setSubscriptions={setSubscriptions}
      />

      {/* Section Gestion des domaines */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestion des noms de domaines</h1>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('list')}
              className={`${
                activeTab === 'list'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Mes noms de domaines
            </button>
            <button
              onClick={() => setActiveTab('purchase')}
              className={`${
                activeTab === 'purchase'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Créer un nom de domaine
            </button>
            <button
              onClick={() => setActiveTab('declare')}
              className={`${
                activeTab === 'declare'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Déclarer un nom de domaine
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'list' && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="sm:flex sm:items-center mb-6">
              <div className="sm:flex-auto">
                <h2 className="text-lg font-medium text-gray-900">Mes domaines</h2>
                <p className="mt-2 text-sm text-gray-700">
                  Liste de tous vos domaines enregistrés
                </p>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-3">
                <button
                  onClick={fetchDomains}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Actualiser
                </button>
              </div>
            </div>
            
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
                                  ) : (domain.category === 'declared' ? (
                                    <>
                                      <MegaphoneIcon className="h-4 w-4 text-indigo-500 mr-2" />
                                      <span>Déclaré</span>
                                    </>
                                  ) : (
                                    <>
                                      <ShieldExclamationIcon className="h-4 w-4 text-green-500 mr-2" />
                                      <span>Système</span>
                                    </>
                                  ))}
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
                                  <button onClick={() => void(0)}
                                    className='inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200'>
                                    <ArrowPathIcon className="h-5 w-5 animate-spin text-red-500" /> Processing...
                                  </button>
                                ) : (domain.category == 'system' ? 
                                  <>
                                  <button disabled="true">
                                    <NoSymbolIcon className="h-4 w-4 mr-1" />
                                  </button>
                                  </> 
                                  : (
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
                                  ))}
                              </td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                <button
                                  onClick={() => domain.is_emails_domain && domain.category != 'buyed' ? downloadDnsInfo(domain.id) : null}
                                  className={`mr-4 ${domain.is_emails_domain && domain.category != 'buyed' ? "text-indigo-600 hover:text-indigo-900" : "text-gray-400 cursor-not-allowed"}`}
                                  title={domain.is_emails_domain && domain.category != 'buyed' ? "Télécharger les informations DNS" : "Activez les emails pour ce domaine pour télécharger les informations DNS"}
                                  disabled={!domain.is_emails_domain || domain.category == 'buyed'}
                                >
                                  <ArrowDownTrayIcon className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleShowSites(domain)}
                                  title="Liste des sites"
                                  className="text-indigo-600 hover:text-indigo-900 mr-4"
                                >
                                  <ListBulletIcon className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => domain.category !== 'buyed' && domain.category !== 'system' && openDeleteModal(domain)}
                                  className={`${(domain.category === 'buyed' || domain.category === 'system') ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-900'}`}
                                  title={(domain.category === 'buyed' || domain.category === 'system') ? "Impossible de supprimer un domaine acheté" : "Supprimer"}
                                  disabled={domain.category === 'buyed' || domain.category === 'system'}
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
        )}
        
        {activeTab === 'purchase' && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">Saisissez le nom de domaine que vous souhaitez créer</h2>
              <button
                onClick={toggleMockMode}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  isMockMode 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-green-100 text-green-800'
                }`}
              >
                <BeakerIcon className="h-4 w-4 mr-1" />
                {isMockMode ? 'Mode Simulation' : 'Mode Réel'}
              </button>
            </div>
            
            <DomainSearch onSearch={handleSearch} initialValue={domain} disabled={loading} />
            
            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="inline-flex items-center">
                  <ArrowPathIcon className="h-5 w-5 text-indigo-600 animate-spin mr-2" />
                  <span className="text-gray-600">Chargement en cours...</span>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="rounded-md bg-red-50 p-4 mt-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <XCircleIcon className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                    <div className="mt-4">
                      <button
                        type="button"
                        className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none"
                        onClick={resetSearch}
                      >
                        Réessayer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Domain Availability Result */}
            {domainData && !registrationSuccess && (
              <div className="space-y-6 mt-6">
                <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {domainData.available ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-lg font-medium text-gray-900">
                            {domain} est {domainData.available ? 'disponible' : 'indisponible'}
                          </h2>
                          <p className="mt-1 text-sm text-gray-500">
                            Extension: .{domainData.tld}
                          </p>
                        </div>
                        {domainData.available && domainData.price && (
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Domaine d'une valeur de</p>
                            <p className="text-2xl font-bold text-indigo-600">
                              {domainData.price.toFixed(2)} {domainData.currency}
                              <span className="text-sm font-normal">/an</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Registration Form (only if available) */}
                {domainData.available && (
                  <DomainForm 
                    domain={domain} 
                    price={domainData.price}
                    currency={domainData.currency}
                    onRegister={() => openDomainRegisterModal(domain)}
                    subscriptions={subscriptions}
                    setSelectedSubscriptionId={setSelectedSubscriptionId}
                  />
                )}
              </div>
            )}

            {/* Registration Success */}
            {registrationSuccess && (
              <div className="rounded-md bg-green-50 p-6 mt-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-lg font-medium text-green-800">Enregistrement réussi !</h3>
                    <div className="mt-2 text-sm text-green-700 space-y-2">
                      <p>
                        Votre domaine <strong>{registrationSuccess.domain}</strong> a été enregistré.
                      </p>
                      <p>
                        Référence: <code className="bg-green-100 px-1.5 py-0.5 rounded">{registrationSuccess.operationId}</code>
                      </p>
                    </div>
                    <div className="mt-6">
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        onClick={resetSearch}
                      >
                        Enregistrer un autre domaine
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {isMockMode && (
              <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Mode simulation activé</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        Vous utilisez actuellement le mode simulation. Aucun achat réel ne sera effectué.
                        Les données sont générées aléatoirement.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'declare' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Déclarer un nom de domaine existant</h2>
            <p className="text-gray-600 mb-6">
              Utilisez ce formulaire pour déclarer un nom de domaine que vous possédez déjà chez un autre registrar.
              Cela vous permettra de le gérer dans votre espace client sans transférer sa propriété.
            </p>
            
            <form onSubmit={handleDomainAddSubmit} className="space-y-4">
              <div>
                <label htmlFor="domainName" className="block text-sm font-medium text-gray-700">
                  Nom de domaine
                </label>
                <input
                  type="text"
                  id="domainName"
                  name="domainName"
                  value={newDomainName}
                  onChange={handleDomainNameChange}
                  placeholder="exemple.com"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700">
                  Date d'expiration
                </label>
                <input
                  type="date"
                  id="expiresAt"
                  name="expiresAt"
                  value={newDomainExpiresAt}
                  onChange={handleExpiresAtChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>
              
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="isAwsDomain"
                    name="isAwsDomain"
                    type="checkbox"
                    checked={isAwsDomain}
                    onChange={handleAwsDomainChange}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="isAwsDomain" className="font-medium text-gray-700">
                    Est-ce un domaine AWS ?
                  </label>
                  <p className="text-gray-500">Cochez cette case si votre domaine est géré par Amazon Route 53</p>
                </div>
              </div>
              
              {isAwsDomain && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                  <div>
                    <label htmlFor="awsAccessKeyId" className="block text-sm font-medium text-gray-700">
                      AWS Access Key ID
                    </label>
                    <input
                      type="text"
                      id="awsAccessKeyId"
                      name="awsAccessKeyId"
                      value={awsAccessKeyId}
                      onChange={handleAwsAccessKeyIdChange}
                      placeholder="AKIAIOSFODNN7EXAMPLE"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required={isAwsDomain}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="awsSecretAccessKey" className="block text-sm font-medium text-gray-700">
                      AWS Secret Access Key
                    </label>
                    <input
                      type="password"
                      id="awsSecretAccessKey"
                      name="awsSecretAccessKey"
                      value={awsSecretAccessKey}
                      onChange={handleAwsSecretAccessKeyChange}
                      placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      required={isAwsDomain}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Ces informations sont utilisées uniquement pour vérifier votre domaine et ne sont pas stockées sur nos serveurs.
                    </p>
                  </div>
                </div>
              )}
              
              {domainAddError && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <XCircleIcon className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{domainAddError}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmittingDomain}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                >
                  {isSubmittingDomain ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Traitement en cours...
                    </>
                  ) : (
                    'Déclarer ce domaine'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>


      {/* Modales */}

      {/* Modal de confirmation de suppression */}
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

      {/* Modal de confirmation d'enregistrement du domaine */}
      {domainToRegister && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ShoppingBagIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Confirmer l'enregistrement
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Êtes-vous sûr de vouloir enregistrer le domaine <strong>{domainToRegister}</strong> ? Cette action est irréversible.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmRegistration}
                  disabled={isDeleting}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {isDeleting ? (
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  ) : (
                    'Enregistrer'
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeDomainRegisterModal}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modale des sites associés */}
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
                    <ListBulletIcon className="h-6 w-6 text-indigo-600" />
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
                                      href={`https://${site.record}.${site.Domain.domain_name}/`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-indigo-600 hover:text-indigo-800"
                                    >
                                      https://{site.record}.{site.Domain.domain_name}/
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



