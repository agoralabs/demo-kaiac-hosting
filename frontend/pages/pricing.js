import { useState } from 'react';
import { useRouter } from 'next/router';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';
import HostingPlans from '../components/hosting/HostingPlans';
import SubscriptionPaymentModal from '../components/SubscriptionPaymentModal';
import PaypalPaymentModal from '../components/PaypalPaymentModal';
import WavePaymentModal from '../components/WavePaymentModal';
import MobileMoneyPaymentModal from '../components/MobileMoneyPaymentModal';
import PaymentMethodModal from '../components/PaymentMethodModal';
import BillingAddressModal from '../components/BillingAddressModal';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function PricingPage() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isSubscriptionPaymentModalOpen, setIsSubscriptionPaymentModalOpen] = useState(false);
  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [isBillingAddressModalOpen, setIsBillingAddressModalOpen] = useState(false);
  const [billingAddress, setBillingAddress] = useState(null);

  const handlePlanSelection = (plan) => {
    if (!isLoggedIn) {
      // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
      router.push({
        pathname: '/login',
        query: { redirect: '/pricing', plan: plan.id }
      });
      return;
    }

    setSelectedPlan(plan);
    setIsBillingAddressModalOpen(true);
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
    
    // ouvrir la modale de paiement
    setIsSubscriptionPaymentModalOpen(true);
  };

  return (
    <Layout title="Tarifs d'hébergement WordPress">
      <div className="bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
              Hébergement WordPress simple et performant
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
              Des formules adaptées à tous vos besoins, avec un support technique de qualité
            </p>
          </div>

          <HostingPlans 
            title="Nos formules d'hébergement"
            subtitle="Tous nos plans incluent : SSL gratuit, CDN, sauvegardes automatiques et support technique"
            onSelectPlan={handlePlanSelection}
            loading={loading}
            buttonText={isLoggedIn ? "Souscrire maintenant" : "Commencer"}
            className="mt-8"
          />

          <div className="mt-16 bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions fréquentes</h2>
            <dl className="space-y-8">
              <div>
                <dt className="text-lg font-medium text-gray-900">Puis-je migrer mon site WordPress existant ?</dt>
                <dd className="mt-2 text-base text-gray-500">Oui, tous nos plans incluent une migration gratuite de votre site WordPress existant.</dd>
              </div>
              <div>
                <dt className="text-lg font-medium text-gray-900">Comment fonctionne la facturation ?</dt>
                <dd className="mt-2 text-base text-gray-500">Vous êtes facturé mensuellement ou annuellement selon la durée choisie. Vous pouvez annuler à tout moment.</dd>
              </div>
              <div>
                <dt className="text-lg font-medium text-gray-900">Quelles sont les performances de vos serveurs ?</dt>
                <dd className="mt-2 text-base text-gray-500">Nos serveurs sont optimisés pour WordPress avec des SSD rapides, un cache avancé et une architecture moderne pour des temps de chargement optimaux.</dd>
              </div>
              <div>
                <dt className="text-lg font-medium text-gray-900">Comment fonctionne le support technique ?</dt>
                <dd className="mt-2 text-base text-gray-500">Notre équipe de support est disponible par chat et email. Les plans Premium bénéficient d'un support prioritaire 24/7.</dd>
              </div>
            </dl>
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
            onSuccess={() => router.push('/manage/hosting')}
          />
        </Elements>
      )}
      {isSubscriptionPaymentModalOpen && selectedPlan && selectedPaymentMethod === 'paypal' && (
        <PaypalPaymentModal
          isOpen={isSubscriptionPaymentModalOpen}
          plan={{...selectedPlan, billingAddress, selectedPaymentMethod}}
          onClose={() => setIsSubscriptionPaymentModalOpen(false)}
          onSuccess={() => router.push('/manage/hosting')}
        />
      )}
      {isSubscriptionPaymentModalOpen && selectedPlan && selectedPaymentMethod === 'wave' && (
        <WavePaymentModal
          isOpen={isSubscriptionPaymentModalOpen}
          plan={{...selectedPlan, billingAddress, selectedPaymentMethod}}
          onClose={() => setIsSubscriptionPaymentModalOpen(false)}
          onSuccess={() => router.push('/manage/hosting')}
        />
      )}
      {isSubscriptionPaymentModalOpen && selectedPlan && selectedPaymentMethod === 'mobile_money' && (
        <MobileMoneyPaymentModal
          isOpen={isSubscriptionPaymentModalOpen}
          plan={{...selectedPlan, billingAddress, selectedPaymentMethod}}
          onClose={() => setIsSubscriptionPaymentModalOpen(false)}
          onSuccess={() => router.push('/manage/hosting')}
        />
      )}
    </Layout>
  );
}
