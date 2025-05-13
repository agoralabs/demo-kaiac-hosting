import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import ShopPage from '../../components/ShopPage';
import DomainSearch from '../../components/DomainSearch';
import DomainRegistrationForm from '../../components/DomainRegistrationForm';
import { 
  CheckCircleIcon, EnvelopeIcon, ListBulletIcon,
  XCircleIcon, ArrowPathIcon, BeakerIcon, TrashIcon, 
  ExclamationTriangleIcon, ShoppingBagIcon, MegaphoneIcon } from '@heroicons/react/24/outline';
import api from '../../lib/api';
import { useRouter } from 'next/router';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../../hooks/useAuth';
import BillingAddressModal from '../../components/BillingAddressModal';
import PaymentMethodModal from '../../components/PaymentMethodModal';
import SubscriptionPaymentModal from '../../components/SubscriptionPaymentModal';
import DomainAddModal from '../../components/hosting/DomainAddModal';

import { Elements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function Domains() {
  const [domain, setDomain] = useState('');
  const [domainData, setDomainData] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { isLoggedIn, user, isLoading } = useAuth();
  const [error, setError] = useState(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(null);
  const [isMockMode, setIsMockMode] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isBillingAddressModalOpen, setIsBillingAddressModalOpen] = useState(false);
  const [billingAddress, setBillingAddress] = useState(null);
  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState('1'); // Par défaut 1 mois
  const [selectedDurationInYears, setSelectedDurationInYears] = useState('1'); // Par défaut 1 an
  const [totalAmount, setTotalAmount] = useState(0); // Par défaut 1 mois
  const [isSubscriptionPaymentModalOpen, setIsSubscriptionPaymentModalOpen] = useState(false);
  
  // Nouvelles variables d'état pour la modal d'ajout de domaine
  const [isDomainAddModalOpen, setIsDomainAddModalOpen] = useState(false);
  const [newDomainName, setNewDomainName] = useState('');
  const [newDomainExpiresAt, setNewDomainExpiresAt] = useState('');
  const [isSubmittingDomain, setIsSubmittingDomain] = useState(false);
  const [domainAddError, setDomainAddError] = useState(null);
  const [isAwsDomain, setIsAwsDomain] = useState(false);
  const [awsAccessKeyId, setAwsAccessKeyId] = useState('');
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState('');

  // États pour la modale de suppression
  const [domainToDelete, setDomainToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Onglet domaines
  const [domains, setDomains] = useState([]);
  
  
  // État pour gérer les onglets
  const [activeTab, setActiveTab] = useState('purchase');

  // Chargez la config au montage du composant
  useEffect(() => {
    if (!isLoading) {
      console.log('Auth state updated:', { isLoggedIn });
      if (!isLoggedIn) {
        console.log('Redirecting to login...');
        router.push('/login');
      }
    }
    // Convertit la string en booléen
    const shouldMock = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
    setIsMockMode(shouldMock);
    
    // Optionnel : log pour débogage
    console.log(`Mode mock initialisé à: ${shouldMock}`);
  }, [isLoading, isLoggedIn, router]); // Tableau vide = exécuté une fois au montage

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
          price: data.prices.registration || null ,
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

  const handleBillingAddressSelection = (domainName, durationInYears) => {
    const durationInMonths = 12 * durationInYears;
    const yearlyPrice = domainData.price;
    const monthlyPrice = yearlyPrice / 12;
    const totalAmount = monthlyPrice * durationInMonths;
    const taxRate = 0.2;
    const totalAmountTax = totalAmount * taxRate;
    const totalAmountTTC = totalAmount + totalAmountTax;

    setSelectedDurationInYears(durationInYears)
    setSelectedDuration(12 * durationInYears);
    setSelectedPlan({
      id: '4',
      plan_type: 'domain',
      name: 'ROUTE53',
      taxRate: taxRate,
      monthlyPrice: monthlyPrice,
      totalAmount: totalAmount,
      totalAmountTax: totalAmountTax,
      totalAmountTTC: totalAmountTTC,
      durationInMonths: durationInMonths,
      durationInYears: durationInYears,
      currency: domainData.currency || 'EUR'
    });
    setIsBillingAddressModalOpen(true); // Ouvrir d'abord la modale de saisie d'adresse de facturation
  };

  // Gérer la confirmation de l'adresse de facturation
  const handleBillingAddressConfirm = (address) => {
    setBillingAddress(address);
    setIsBillingAddressModalOpen(false); //on ferme la modale de choix d'adresse
    setIsPaymentMethodModalOpen(true); //on ouvre la modale de choix du mode de paiement
  };

  // Gérer la sélection du mode de paiement
  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
    setIsPaymentMethodModalOpen(false);
    
    // Mettez à jour le plan avec l'adresse
    const completePlan = {
      ...selectedPlan,
      billingAddress,
      paymentMethod: method
    };

    // Seul le paiement par carte est implémenté pour l'instant
    if (method === 'card') {
      // Ouvrir la modale Stripe
      setIsSubscriptionPaymentModalOpen(true);
    }
  };

  const handleRegister = async (domainName, durationInYears) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/api/domains/register', { 
        domainName, 
        durationInYears,
        domainData,
        mock: isMockMode 
      });

      const data = response.data;
      setRegistrationSuccess({
        domain: domainName,
        operationId: data.operationId,
        price: domainData.price * durationInYears,
        duration: durationInYears
      });

    } catch (err) {
      setError(err.message || 'Échec de l\'enregistrement');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour basculer entre mode réel et mock
  const toggleMockMode = () => {
    setIsMockMode(!isMockMode);
    resetSearch();
  };

  const resetSearch = () => {
    setDomain('');
    setDomainData(null);
    setError(null);
  };

  // Nouvelles fonctions pour gérer l'ajout manuel de domaine
  const openDomainAddModal = () => {
    // Initialiser la date d'expiration à un an à partir d'aujourd'hui
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    const formattedDate = oneYearFromNow.toISOString().split('T')[0]; // Format YYYY-MM-DD
    
    setNewDomainName('');
    setNewDomainExpiresAt(formattedDate);
    setDomainAddError(null);
    setIsDomainAddModalOpen(true);
  };

  const handleDomainNameChange = (e) => {
    setNewDomainName(e.target.value);
  };

  const handleExpiresAtChange = (e) => {
    setNewDomainExpiresAt(e.target.value);
  };

  const handleAwsDomainChange = (e) => {
    setIsAwsDomain(e.target.checked);
    // Réinitialiser les champs AWS si la case est décochée
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
      setIsDomainAddModalOpen(false);
      setRegistrationSuccess({
        domain: newDomainName,
        operationId: response.data.operationId || 'DOM-' + Date.now(),
        price: 0, // Pas de coût pour la déclaration
        duration: 'N/A'
      });
      toast.success('Domaine déclaré avec succès');
    } catch (err) {
      setDomainAddError(err.message || 'Échec de la déclaration du domaine');
      console.error('Domain declaration error:', err);
      toast.error('Échec de la déclaration du domaine');
    } finally {
      setIsSubmittingDomain(false);
    }
  };


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

  // Contenu des onglets
  const renderTabContent = () => {
    switch (activeTab) {
      case 'purchase':
        return (
          <>
            {/* Search Section */}
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Rechercher un domaine</h2>
              <DomainSearch 
                onSearch={handleSearch} 
                initialValue={domain}
                disabled={loading}
              />
            </div>

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
              <div className="rounded-md bg-red-50 p-4 mb-8">
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
              <div className="space-y-6">
                <div className="bg-white shadow rounded-lg p-6">
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
                            <p className="text-sm text-gray-500">À partir de</p>
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
                  <DomainRegistrationForm 
                    domain={domain} 
                    price={domainData.price}
                    currency={domainData.currency}
                    onRegister={handleBillingAddressSelection} 
                  />
                )}
              </div>
            )}

            {/* Registration Success */}
            {registrationSuccess && (
              <div className="rounded-md bg-green-50 p-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-lg font-medium text-green-800">Enregistrement réussi !</h3>
                    <div className="mt-2 text-sm text-green-700 space-y-2">
                      <p>
                        Votre domaine <strong>{registrationSuccess.domain}</strong> a été {registrationSuccess.price > 0 ? 'enregistré' : 'déclaré'} {registrationSuccess.duration !== 'N/A' ? `pour ${selectedDurationInYears} an(s)` : ''}.
                      </p>
                      {registrationSuccess.price > 0 && (
                        <p>
                          Montant: <strong>{selectedPlan.totalAmount} €</strong>
                        </p>
                      )}
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
          </>
        );
      case 'declare':
        return (
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
        );
      case 'list':
        return (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Vos noms de domaine</h2>
            <p className="text-gray-600 mb-6">
              Liste de tous vos noms de domaine enregistrés ou déclarés sur notre plateforme.
            </p>
            
            {/* Ici, vous pourriez ajouter une requête API pour récupérer la liste des domaines de l'utilisateur */}
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

                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
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

          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout title="Noms de domaine">
      <ShopPage>
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Gestion des noms de domaine</h1>
          </div>
          
          <button
            onClick={toggleMockMode}
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-6 ${
              isMockMode 
                ? 'bg-purple-100 text-purple-800' 
                : 'bg-green-100 text-green-800'
            }`}
          >
            <BeakerIcon className="h-4 w-4 mr-1" />
            {isMockMode ? 'Mode Simulation' : 'Mode Réel'}
          </button>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('purchase')}
                className={`${
                  activeTab === 'purchase'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Achat de noms de domaines
              </button>
              <button
                onClick={() => setActiveTab('declare')}
                className={`${
                  activeTab === 'declare'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Déclaration d'un nom de domaine
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`${
                  activeTab === 'list'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Vos noms de domaines
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {renderTabContent()}

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

        {/* Modal adresse de facturation */}
        {isBillingAddressModalOpen && selectedPlan && (
          <BillingAddressModal
            isOpen={isBillingAddressModalOpen}
            onClose={() => setIsBillingAddressModalOpen(false)}
            onConfirm={handleBillingAddressConfirm}
          />
        )}
        {/* Modal méthode de paiement */}
        {isPaymentMethodModalOpen && selectedPlan && (
          <PaymentMethodModal
            isOpen={isPaymentMethodModalOpen}
            onClose={() => setIsPaymentMethodModalOpen(false)}
            onSelect={handlePaymentMethodSelect}
            plan={{...selectedPlan, billingAddress, selectedPaymentMethod}}
          />
        )}
        {/* Modal de paiement */}
        {isSubscriptionPaymentModalOpen && selectedPlan && selectedPaymentMethod === 'card' && (
              <Elements stripe={stripePromise}>
              <SubscriptionPaymentModal
                isOpen={isSubscriptionPaymentModalOpen}
                plan={{...selectedPlan, billingAddress, selectedPaymentMethod}}
                onClose={() => setIsSubscriptionPaymentModalOpen(false)}
                onSuccess={() => handleRegister(domain, selectedDuration)}
              /></Elements>
            )}
        
        {/* Modal d'ajout de domaine */}
        <DomainAddModal
          isOpen={isDomainAddModalOpen}
          onClose={() => setIsDomainAddModalOpen(false)}
          domainName={newDomainName}
          expiresAt={newDomainExpiresAt}
          onDomainNameChange={handleDomainNameChange}
          onExpiresAtChange={handleExpiresAtChange}
          onSubmit={handleDomainAddSubmit}
          isSubmitting={isSubmittingDomain}
          error={domainAddError}
        />
      </ShopPage>
    </Layout>
  );
}
