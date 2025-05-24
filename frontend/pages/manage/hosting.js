import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/Layout';
import HostingList from '../../components/hosting/HostingList';
import HostingPlans from '../../components/hosting/HostingPlans';
import SubscriptionPaymentModal from '../../components/SubscriptionPaymentModal';
import PaypalPaymentModal from '../../components/PaypalPaymentModal';
import WavePaymentModal from '../../components/WavePaymentModal';
import MobileMoneyPaymentModal from '../../components/MobileMoneyPaymentModal';
import PaymentMethodModal from '../../components/PaymentMethodModal';
import BillingAddressModal from '../../components/BillingAddressModal';
import PurchasesPage from '../../components/PurchasesPage';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function ManageHosting() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { isLoggedIn, user, isLoading } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isSubscriptionPaymentModalOpen, setIsSubscriptionPaymentModalOpen] = useState(false);
  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [isBillingAddressModalOpen, setIsBillingAddressModalOpen] = useState(false);
  const [billingAddress, setBillingAddress] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subsResponse] = await Promise.all([
          api.get('/api/user/subscriptions/hosting')
        ]);

        const subscriptionsData = subsResponse.data.data || [];
        setSubscriptions(subscriptionsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isLoading, isLoggedIn, router]);

  const handlePlanSelection = (plan) => {
    setSelectedPlan(plan);
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

    // ouvrir la modale de paiement
    setIsSubscriptionPaymentModalOpen(true);

  };

  // Show loading state
  if (isLoading) {
    return (
      <Layout title="Gestion des formules d'hébergement">
        <PurchasesPage>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4" />
              <p>Chargement...</p>
            </div>
          </div>
        </PurchasesPage>
      </Layout>
    );
  }

  // Show message while redirecting if not logged in
  if (!isLoggedIn) {
    return (
      <Layout title="Gestion des formules d'hébergement">
        <PurchasesPage>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="mb-4">
                <p className="text-lg text-gray-600">Veuillez vous connecter pour gérer vos formules d'hébergement</p>
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

  // Déterminer si l'utilisateur a déjà des formules d'hébergement
  const hasSubscriptions = subscriptions && subscriptions.length > 0;

  return (
    <Layout title="Gestion des formules d'hébergement">
      <PurchasesPage>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Section des hébergements actuels */}
          <HostingList 
            subscriptions={subscriptions} 
            setSubscriptions={setSubscriptions}
          />

          {/* Section pour souscrire à de nouveaux hébergements */}
          <HostingPlans 
            title={hasSubscriptions 
              ? "Souscrire à une nouvelle formule d'hébergement" 
              : "Commencer avec une formule d'hébergement"
            }
            subtitle="Choisissez la formule qui correspond le mieux à vos besoins"
            onSelectPlan={handlePlanSelection}
            showBorder={hasSubscriptions}
            loading={loading}
            error={error}
          />
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
            />
          </Elements>
        )}
        {isSubscriptionPaymentModalOpen && selectedPlan && selectedPaymentMethod === 'paypal' && (
          <PaypalPaymentModal
            isOpen={isSubscriptionPaymentModalOpen}
            plan={{...selectedPlan, billingAddress, selectedPaymentMethod}}
            onClose={() => setIsSubscriptionPaymentModalOpen(false)}
            onSuccess={() => void(0)}
          />
        )}
        {isSubscriptionPaymentModalOpen && selectedPlan && selectedPaymentMethod === 'wave' && (
          <WavePaymentModal
            isOpen={isSubscriptionPaymentModalOpen}
            plan={{...selectedPlan, billingAddress, selectedPaymentMethod}}
            onClose={() => setIsSubscriptionPaymentModalOpen(false)}
            onSuccess={() => void(0)}
          />
        )}
        {isSubscriptionPaymentModalOpen && selectedPlan && selectedPaymentMethod === 'mobile_money' && (
          <MobileMoneyPaymentModal
            isOpen={isSubscriptionPaymentModalOpen}
            plan={{...selectedPlan, billingAddress, selectedPaymentMethod}}
            onClose={() => setIsSubscriptionPaymentModalOpen(false)}
            onSuccess={() => void(0)}
            userConnected={user}
          />
        )}
      </PurchasesPage>
    </Layout>
  );
}
