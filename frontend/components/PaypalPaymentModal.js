import { useState, useEffect } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export default function PaypalPaymentModal({ isOpen, onClose, plan, onSuccess }) {
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const { user } = useAuth();

  // Configuration PayPal
  const paypalOptions = {
    "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
    currency: "EUR",
    intent: "capture"
  };

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

  const createOrder = async () => {
    try {
      setProcessing(true);
      setError(null);
      
      // Créer une commande via notre API backend
      const response = await api.post('/api/payment/paypal/create-order', {
        plan_id: plan.id,
        amount: plan.totalAmountTTC,
        currency: plan.currency || 'EUR',
        duration: plan.durationInMonths,
        billing_address: plan.billingAddress
      });
      
      setProcessing(false);
      return response.data.id; // Retourne l'ID de commande PayPal
    } catch (err) {
      setProcessing(false);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la création de la commande');
      throw new Error(error);
    }
  };

  const onApprove = async (data) => {
    try {
      setProcessing(true);
      
      // Capturer le paiement via notre API backend
      const response = await api.post('/api/payment/paypal/capture-order', {
        orderID: data.orderID,
        plan_id: plan.id,
        duration: plan.durationInMonths,
        billing_address: plan.billingAddress
      });
      
      setProcessing(false);
      setPaymentSuccess(true);
      
      return response.data;
    } catch (err) {
      setProcessing(false);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la capture du paiement');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Paiement PayPal</h3>
        
        {!paymentSuccess ? (
          <>
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-1">Récapitulatif de votre commande</h4>
              <p className="text-sm text-gray-600 mb-2">Plan: {plan.name}</p>
              <p className="text-sm text-gray-600 mb-2">Durée: {plan.durationInMonths} mois</p>
              <p className="font-medium">Montant total: {plan.totalAmountTTC} €</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <div className="mb-6">
              <PayPalScriptProvider options={paypalOptions}>
                <PayPalButtons
                  createOrder={createOrder}
                  onApprove={onApprove}
                  onError={(err) => setError('Erreur PayPal: ' + err.message)}
                  disabled={processing}
                  style={{ 
                    layout: 'vertical',
                    color: 'blue',
                    shape: 'rect',
                    label: 'pay'
                  }}
                />
              </PayPalScriptProvider>
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
