// pages/dashboard/hosting.js
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useRouter } from 'next/router';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/Layout';
import ShopPage from '../../components/ShopPage';
import SubscriptionPaymentModal from '../../components/SubscriptionPaymentModal';
import PaymentMethodModal from '../../components/PaymentMethodModal';
import BillingAddressModal from '../../components/BillingAddressModal';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function Hosting() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedDuration, setSelectedDuration] = useState('1'); // Par défaut 1 mois
    const router = useRouter();
    const { isLoggedIn, user, isLoading } = useAuth();
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [isSubscriptionPaymentModalOpen, setIsSubscriptionPaymentModalOpen] = useState(false);
    const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
    const [isBillingAddressModalOpen, setIsBillingAddressModalOpen] = useState(false);
    const [billingAddress, setBillingAddress] = useState(null);

    useEffect(() => {
        if (!isLoading) {
          console.log('Auth state updated:', { isLoggedIn });
          if (!isLoggedIn) {
            console.log('Redirecting to login...');
            router.push('/login');
          }
        }
      }, [isLoading, isLoggedIn, router]);
    
      const plans = [
        {
          id: '1',
          plan_type: 'hosting',
          name: 'BASIC',
          price_1_month: '7.99',
          price_12_months: '6.99',
          price_24_months: '5.99',
          currency: 'EUR',
          tax_rate: '0.20',
          features: ['1 WordPress Site', '10GB Storage', 'Basic Support']
        },
        {
          id: '2',
          plan_type: 'hosting',
          name: 'STANDARD',
          price_1_month: '9.99',
          price_12_months: '8.99',
          price_24_months: '7.99',
          currency: 'EUR',
          tax_rate: '0.20',
          features: ['25 WordPress Sites', '30GB Storage', 'Priority Support']
        },
        {
          id: '3',
          plan_type: 'hosting',
          name: 'PREMIUM',
          price_1_month: '12.99',
          price_12_months: '11.99',
          price_24_months: '10.99',
          currency: 'EUR',
          tax_rate: '0.20',
          features: ['50 WordPress Sites', '100GB Storage', '24/7 Premium Support']
        }
      ];

      const getPriceForDuration = (plan, duration) => {
        switch(duration) {
          case '12':
            return plan.price_12_months;
          case '24':
            return plan.price_24_months;
          default:
            return plan.price_1_month;
        }
      };

      const getAllAmount = (plan, duration) => {
        const monthlyPrice = parseFloat(getPriceForDuration(plan, duration));
        const durationInMonths = parseInt(duration);
        const totalAmount = monthlyPrice * durationInMonths;
        const taxRate = parseFloat(plan.tax_rate);
        const totalAmountTax = totalAmount * taxRate;
        const totalAmountTTC = totalAmount + totalAmountTax;
        return {
          monthlyPrice : monthlyPrice.toFixed(2),
          totalAmount : totalAmount.toFixed(2),
          totalAmountTax : totalAmountTax.toFixed(2),
          totalAmountTTC : totalAmountTTC.toFixed(2),
          durationInMonths : durationInMonths,
          durationInYears : durationInMonths/12,
          taxRate: taxRate.toFixed(2)
        };
      };

      const getTotalPrice = (plan, duration) => {
        const allAmounts = getAllAmount(plan, selectedDuration);
        return allAmounts.totalAmountTTC;
      };

      const handlePlanSelection = (plan) => {
        const allAmounts = getAllAmount(plan, selectedDuration);
        setSelectedPlan({
          id: plan.id,
          name: plan.name,
          taxRate: plan.tax_rate,
          monthlyPrice: allAmounts.monthlyPrice,
          totalAmount: allAmounts.totalAmount,
          totalAmountTax: allAmounts.totalAmountTax,
          totalAmountTTC: allAmounts.totalAmountTTC,
          durationInMonths: allAmounts.durationInMonths,
          durationInYears: allAmounts.durationInYears,
          currency: plan.currency || 'EUR'        
        });
        setIsBillingAddressModalOpen(true); // Ouvrir d'abord la modale de saisie d'adresse de facturation
      };

    // Gérer la confirmation de l'adresse de facturation
    const handleBillingAddressConfirm = (address) => {
      setBillingAddress(address);
      setIsBillingAddressModalOpen(false);
      setIsPaymentMethodModalOpen(true);
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

  // Show loading state
  if (isLoading) {
    return (
        <Layout title="Sites Web">
        <ShopPage>
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4" />
                <p>Chargement des formules d'abonnement...</p>
                </div>
            </div>
        </ShopPage>
        </Layout>
    );
  }

  // Show message while redirecting if not logged in
  if (!isLoggedIn) {
    return (
        <Layout title="Sites Web">
        <ShopPage>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <p className="text-lg text-gray-600">Veuillez vous connecter pour voir les formules d'abonnement</p>
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
      </ShopPage>
        </Layout>
    );
  }
    return (
        <Layout title="Sites Web">

        <ShopPage>
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center">
                <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                    Nos formules d'hébergement
                </h2>
                <p className="mt-4 text-lg text-gray-500">
                Choisissez la formule qui correspond le mieux à vos besoins
                </p>
                {user && (
                    <p className="mt-2 text-sm text-gray-600">
                    Vous êtes connecté en tant que : {user.email}
                    </p>
                )}
                </div>

                {error && (
                <div className="mt-8 text-center text-red-600 bg-red-50 p-4 rounded-md">
                    {error}
                </div>
                )}

                <div className="mt-8 flex justify-center">
                  <div className="inline-flex rounded-md shadow-sm">
                    <button
                      onClick={() => setSelectedDuration('1')}
                      className={`px-4 py-2 text-sm font-medium rounded-l-lg ${selectedDuration === '1' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      1 mois
                    </button>
                    <button
                      onClick={() => setSelectedDuration('12')}
                      className={`px-4 py-2 text-sm font-medium ${selectedDuration === '12' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      12 mois
                    </button>
                    <button
                      onClick={() => setSelectedDuration('24')}
                      className={`px-4 py-2 text-sm font-medium rounded-r-lg ${selectedDuration === '24' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      24 mois
                    </button>
                  </div>
                </div>

                <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => (
                    <div
                    key={plan.name}
                    className="bg-white rounded-lg shadow-lg overflow-hidden"
                    >
                    <div className="px-6 py-8">
                        <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                        <p className="mt-4 text-4xl font-extrabold text-gray-900">
                        {getPriceForDuration(plan, selectedDuration)} €
                        <span className="text-base font-medium text-gray-500">/mois</span>
                        </p>
                        {selectedDuration == '1' && (
                          <div className="mt-1">
                            <p className="text-sm font-semibold text-gray-700">
                              Total TTC : {getTotalPrice(plan, selectedDuration)} €
                            </p>
                          </div>
                        )}
                        {selectedDuration !== '1' && (
                          <div className="mt-1">
                            <p className="text-sm text-gray-500">
                              Engagement de {selectedDuration} mois
                            </p>
                            <p className="text-sm font-semibold text-gray-700">
                              Total TTC : {getTotalPrice(plan, selectedDuration)} €
                            </p>
                          </div>
                        )}
                        <ul className="mt-6 space-y-4">
                        {plan.features.map((feature) => (
                            <li key={feature} className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg
                                className="h-6 w-6 text-green-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5 13l4 4L19 7"
                                />
                                </svg>
                            </div>
                            <p className="ml-3 text-base text-gray-700">{feature}</p>
                            </li>
                        ))}
                        </ul>
                        <button
                        onClick={() => handlePlanSelection(plan)}
                        disabled={loading}
                        className="mt-8 block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                        {loading ? 'Chargement...' : 'Souscrivez maintenant'}
                        </button>
                    </div>
                    </div>
                ))}
                </div>
            </div>
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
                onSuccess={() => void(0)}
              /></Elements>
            )}
        </ShopPage>
        </Layout>
    );
}
