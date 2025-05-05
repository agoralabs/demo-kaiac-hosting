import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { 
  Elements, 
  useStripe, 
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement
} from '@stripe/react-stripe-js';
import api from '../lib/api';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Style personnalisé pour les éléments de carte
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

export default function PaymentModal({ isOpen, onClose, invoice }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [shouldReload, setShouldReload] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);
    
    try {
      // Ici vous ajouterez la logique de paiement
      // 1. Obtenir le clientSecret depuis votre backend
      const response = await api.post('/api/payment', {
        invoice_id: invoice.id,
      });

      const clientSecret = response.data.payment.stripe_payment_client_secret;

      // 2. Confirmer le paiement avec Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardNumberElement),
            billing_details: {
              name: invoice.reference,
            },
          }
        }
      );

      if (stripeError) {
        setError(stripeError.message);
      } else if (paymentIntent.status === 'succeeded') {
        setPaymentSuccess(true);
        // Lance le compte à rebours pour fermer automatiquement
        const timer = setInterval(() => {
          setCountdown((prev) => prev - 1);
        }, 1000);
        
        return () => clearInterval(timer);
      }

    } catch (error) {
      console.error('Erreur de paiement:', error);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (countdown === 0) {
      onClose();
      // Réinitialise les états pour la prochaine ouverture
      setPaymentSuccess(false);
      setCountdown(5);
      // Active le flag pour rafraîchir après la fermeture
      setShouldReload(true);
    }
  }, [countdown, onClose]);

  // Nouvel effet pour gérer le rafraîchissement
  useEffect(() => {
    if (!isOpen && shouldReload) {
      window.location.reload();
      setShouldReload(false); // Réinitialise le flag
    }
  }, [isOpen, shouldReload]);

  const handleManualClose = () => {
    onClose();
    setPaymentSuccess(false);
    window.location.reload(); // Rafraîchit aussi lors de la fermeture manuelle
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {paymentSuccess ? (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Paiement réussi !</h2>
            <p className="mb-4">Votre paiement de {invoice?.amount} {invoice?.currency} a été accepté.</p>
            <p className="text-sm text-gray-500 mb-6">
              La modale se fermera automatiquement dans {countdown} seconde{countdown > 1 ? 's' : ''}...
            </p>
            <button
              onClick={handleManualClose}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
            >
              Fermer maintenant
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-4">Paiement de la facture {invoice?.invoice_number}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de carte</label>
                  <div className="p-2 border border-gray-300 rounded-md">
                    <CardNumberElement options={cardElementOptions} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date d'expiration</label>
                    <div className="p-2 border border-gray-300 rounded-md">
                      <CardExpiryElement options={cardElementOptions} />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                    <div className="p-2 border border-gray-300 rounded-md">
                      <CardCvcElement options={cardElementOptions} />
                    </div>
                  </div>
                </div>
              </div>
              
              {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

              <div className="mb-4 p-4 bg-gray-50 rounded-md">
                <p className="font-semibold">Montant à payer: {invoice?.amount} {invoice?.currency}</p>
                <p className="text-sm text-gray-500">Date limite: {new Date(invoice?.due_date).toLocaleDateString('fr-FR')}</p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                  disabled={processing}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
                  disabled={processing || !stripe}
                >
                  {processing ? 'Traitement...' : 'Confirmer le paiement'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );

}