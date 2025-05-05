// pages/shop/emails.js
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import Layout from '../../components/Layout';
import ShopPage from '../../components/ShopPage';
import { CheckIcon, EnvelopeIcon, ShieldCheckIcon, ServerIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../../hooks/useAuth';
import SubscriptionPaymentModal from '../../components/SubscriptionPaymentModal';
import PaymentMethodModal from '../../components/PaymentMethodModal';
import BillingAddressModal from '../../components/BillingAddressModal';
import { Elements } from '@stripe/react-stripe-js';
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function Emails() {
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
      id: '5',
      plan_type: 'email',
      name: 'Starter',
      price_1_month: '4.99',
      price_12_month: '53.88', // 4.99 * 12 * 0.9 (10% de réduction)
      price_24_month: '95.76', // 4.99 * 24 * 0.8 (20% de réduction)
      included_domains: 1,
      included_emails: 5,
      currency: 'EUR',
      tax_rate: '0.20',
      description: 'Parfait pour les particuliers et freelances',
      features: [
        '1 domaine inclus',
        '5 boîtes mail (5Go chacune)',
        'Antispam & antivirus',
        'Webmail avec calendrier',
        'Support par email'
      ],
      popular: false
    },
    {
      id: '6',
      plan_type: 'email',
      name: 'Professionnel',
      price_1_month: '11.99',
      price_12_month: '129.49', // 11.99 * 12 * 0.9
      price_24_month: '230.21', // 11.99 * 24 * 0.8
      included_domains: 3,
      included_emails: 20,
      currency: 'EUR',
      tax_rate: '0.20',
      description: 'Optimisé pour les petites entreprises',
      features: [
        '3 domaines inclus',
        '20 boîtes mail (10Go)',
        'Alias illimités',
        'Synchronisation mobile',
        'Sauvegarde 14 jours'
      ],
      popular: true
    },
    {
      id: '7',
      plan_type: 'email',
      name: 'Business',
      price_1_month: '23.99',
      price_12_month: '259.09', // 23.99 * 12 * 0.9
      price_24_month: '460.61', // 23.99 * 24 * 0.8
      included_domains: 5,
      included_emails: 50,
      currency: 'EUR',
      tax_rate: '0.20',
      description: 'Solution complète pour les entreprises',
      features: [
        '5 domaines inclus',
        '50 boîtes mail (20Go)',
        'Support 24/7',
        'Audit de sécurité',
        'Sauvegarde 30 jours'
      ],
      popular: false
    }
  ];

  const getPriceForDuration = (plan, duration) => {
    switch(duration) {
      case '12':
        return plan.price_12_month;
      case '24':
        return plan.price_24_month;
      default: // 1 mois par défaut
        return plan.price_1_month;
    }
  };

  const getAllAmount = (plan, duration) => {
    const totalAmount = parseFloat(getPriceForDuration(plan, duration));
    const durationInMonths = parseInt(duration);
    const monthlyPrice = totalAmount / durationInMonths;
    const taxRate = parseFloat(plan.tax_rate);
    const totalAmountTax = totalAmount * taxRate;
    const totalAmountTTC = totalAmount + totalAmountTax;
    return {
      monthlyPrice: monthlyPrice.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      totalAmountTax: totalAmountTax.toFixed(2),
      totalAmountTTC: totalAmountTTC.toFixed(2),
      durationInMonths: durationInMonths,
      durationInYears: durationInMonths/12,
      taxRate: taxRate.toFixed(2)
    };
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

  return (
    <Layout title="Hébergement Email Professionnel">
      <ShopPage>
        <div className="bg-white py-12 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Hébergement Email Professionnel
            </h1>
            <p className="mt-4 text-xl text-gray-500">
              Des emails sécurisés. Contrôlez totalement vos communications.
            </p>
          </div>

          {/* Durée d'abonnement */}
          <div className="mt-8 max-w-md mx-auto">
            <div className="flex justify-center space-x-4">
              {['1', '12', '24'].map((duration) => (
                <button
                  key={duration}
                  type="button"
                  onClick={() => setSelectedDuration(duration)}
                  className={`px-4 py-2 rounded-md font-medium ${
                    selectedDuration === duration
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {duration === '1' ? '1 mois' : duration === '12' ? '12 mois (-10%)' : '24 mois (-20%)'}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing plans */}
          <div className="mt-12 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-8">
            {plans.map((plan) => (
              <div 
                key={plan.name} 
                className={`relative p-8 bg-white border rounded-2xl shadow-sm ${
                  plan.popular ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 py-1.5 px-4 bg-indigo-500 rounded-full text-xs font-semibold uppercase tracking-wide text-white transform -translate-y-1/2">
                    Le plus populaire
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                  <p className="mt-2 text-gray-600">{plan.description}</p>
                  <div className="mt-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-extrabold text-gray-900">
                        {selectedDuration === '1' 
                          ? plan.price_1_month 
                          : selectedDuration === '12' 
                            ? plan.price_12_month 
                            : plan.price_24_month} €
                      </span>
                      <span className="ml-1 text-xl font-semibold text-gray-500">
                        {selectedDuration === '1' 
                          ? '/mois' 
                          : `pour ${selectedDuration} mois`}
                      </span>
                    </div>
                    {selectedDuration !== '1' && (
                      <p className="mt-2 text-sm text-gray-500">
                        Soit {(getAllAmount(plan, selectedDuration).monthlyPrice)} €/mois
                      </p>
                    )}
                  </div>
                </div>
                <ul className="space-y-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckIcon className="flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
                      <span className="ml-3 text-base text-gray-500">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => handlePlanSelection(plan)}
                  className={`mt-8 w-full block py-3 px-6 border rounded-md text-center font-medium ${
                    plan.popular
                      ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                      : 'bg-white text-indigo-500 hover:bg-gray-50 border-indigo-500'
                  }`}
                >
                  Souscrivez maintenant <ArrowRightIcon className="inline-block h-4 w-4 ml-1" />
                </button>
              </div>
            ))}
          </div>

          {/* CTA section */}
          <div className="mt-24 bg-indigo-50 rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900">Besoin d'une solution sur mesure ?</h3>
            <p className="mt-4 text-lg text-gray-600">
              Nous pouvons créer un plan personnalisé adapté à votre entreprise.
            </p>
            <button
              type="button"
              className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Contactez notre équipe
            </button>
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