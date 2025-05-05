// pages/shop/domains.js
import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import ShopPage from '../../components/ShopPage';
import DomainSearch from '../../components/DomainSearch';
import DomainRegistrationForm from '../../components/DomainRegistrationForm';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon, BeakerIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import api from '../../lib/api';
import { useRouter } from 'next/router';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../../hooks/useAuth';
import BillingAddressModal from '../../components/BillingAddressModal';
import PaymentMethodModal from '../../components/PaymentMethodModal';
import SubscriptionPaymentModal from '../../components/SubscriptionPaymentModal';

import { Elements } from '@stripe/react-stripe-js';

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

  return (
    <Layout title="Noms de domaine">
      <ShopPage>
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Achats de noms de domaine</h1>
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
                      Votre domaine <strong>{registrationSuccess.domain}</strong> a été enregistré pour {selectedDurationInYears} an(s).
                    </p>
                    <p>
                      Montant: <strong>{selectedPlan.totalAmount} €</strong>
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
      </ShopPage>
    </Layout>
  );
}