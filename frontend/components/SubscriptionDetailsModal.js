// components/SubscriptionDetailsModal.js
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function SubscriptionDetailsModal({ isOpen, onClose, subscription }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold">Détails de l'abonnement</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-900">Informations générales</h3>
                <p className="mt-1 text-sm text-gray-600">
                  <span className="font-medium">Statut:</span> {subscription.status}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  <span className="font-medium">ID Stripe:</span> {subscription.stripe_subscription_id}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  <span className="font-medium">Paiement:</span> {subscription.payment_method}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-900">Période de facturation</h3>
                <p className="mt-1 text-sm text-gray-600">
                  <span className="font-medium">Type:</span> {subscription.billing_cycle === 'annual' ? 'Annuel' : 'Mensuel'}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  <span className="font-medium">Prochaine facture:</span> {new Date(subscription.next_billing_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900">Historique des paiements</h3>
              {subscription.payments?.length > 0 ? (
                <ul className="mt-2 divide-y divide-gray-200">
                  {subscription.payments.map(payment => (
                    <li key={payment.id} className="py-2">
                      <div className="flex justify-between">
                        <span>{new Date(payment.date).toLocaleDateString()}</span>
                        <span className="font-medium">{payment.amount}€</span>
                      </div>
                      <div className="text-sm text-gray-500">{payment.status}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-gray-600">Aucun paiement enregistré</p>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}