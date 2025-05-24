import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export default function WavePaymentModal({ isOpen, onClose, plan, onSuccess, userConnected }) {
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [checkoutSessionId, setCheckoutSessionId] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && plan) {
      initializePayment();
    }
  }, [isOpen, plan]);

  useEffect(() => {
    let timer;
    if (paymentSuccess) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            if (onSuccess) onSuccess();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [paymentSuccess, onSuccess]);

  const initializePayment = async () => {
    try {
      setProcessing(true);
      setError(null);
      
    if (!user) {
      setError("Vous devez être connecté pour effectuer un paiement");
      return;
    }

      const response = await api.post('/api/payment/wave/initialize', {
        plan_id: plan.id,
        amount: plan.totalAmountTTC,
        currency: plan.currency || 'XOF',
        duration: plan.durationInMonths,
        billing_address: plan.billingAddress,
        customer_name: `${userConnected.firstname} ${userConnected.lastname}`,
        customer_email: userConnected.email
      });
      
      setPaymentUrl(response.data.payment_url);
      setCheckoutSessionId(response.data.session_id);
      setProcessing(false);
      
      // Ouvrir la fenêtre de paiement Wave
      window.open(response.data.payment_url, '_blank', 'width=500,height=600');
      
      // Commencer à vérifier le statut du paiement
      checkPaymentStatus(response.data.session_id);
    } catch (err) {
      setProcessing(false);
      setError(err.response?.data?.message || "Une erreur est survenue lors de l'initialisation du paiement");
    }
  };

  const checkPaymentStatus = async (sessionId) => {
    try {
      // Vérifier le statut toutes les 5 secondes
      const checkInterval = setInterval(async () => {
        const response = await api.get(`/api/payment/wave/status/${sessionId}`);
        
        if (response.data.status === 'success') {
          clearInterval(checkInterval);
          setPaymentSuccess(true);
        } else if (response.data.status === 'failed') {
          clearInterval(checkInterval);
          setError('Le paiement a échoué. Veuillez réessayer.');
        }
      }, 5000);
      
      // Arrêter de vérifier après 10 minutes
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!paymentSuccess) {
          setError('Le délai de paiement a expiré. Veuillez réessayer.');
        }
      }, 10 * 60 * 1000);
    } catch (err) {
      setError('Erreur lors de la vérification du statut du paiement');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Paiement Wave</h3>
        
        {!paymentSuccess ? (
          <>
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-1">Récapitulatif de votre commande</h4>
              <p className="text-sm text-gray-600 mb-2">Plan: {plan.name}</p>
              <p className="text-sm text-gray-600 mb-2">Durée: {plan.durationInMonths} mois</p>
              <p className="font-medium">Montant total: {plan.totalAmountTTC} {plan.currency}</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <div className="mb-6 text-center">
              {processing ? (
                <div className="flex justify-center items-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <p className="ml-2">Initialisation du paiement...</p>
                </div>
              ) : paymentUrl ? (
                <div>
                  <p className="mb-4">Une fenêtre de paiement Wave a été ouverte. Veuillez suivre les instructions pour compléter votre paiement.</p>
                  <button
                    onClick={() => window.open(paymentUrl, '_blank', 'width=500,height=600')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Rouvrir la fenêtre de paiement
                  </button>
                </div>
              ) : (
                <p>Préparation du paiement...</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={onClose}
                disabled={processing}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Paiement réussi !</h3>
            <p className="text-sm text-gray-500 mb-4">
              Merci pour votre achat. Votre abonnement est maintenant actif.
            </p>
            <p className="text-xs text-gray-400">
              Redirection automatique dans {countdown} secondes...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
