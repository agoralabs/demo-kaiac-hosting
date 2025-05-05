import Badge from './ui/Badge';
import { useState } from 'react';
import SubscriptionDetailsModal from './SubscriptionDetailsModal'; 
import ActivationFormModal from './ActivationFormModal';

export default function SubscriptionCard({ subscription }) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isActivationFormOpen, setIsActivationFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState({
    activate: false,
    suspend: false,
    cancel: false
  });
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    suspended: 'bg-yellow-100 text-yellow-800',
    pending: 'bg-gray-100 text-gray-800'
  };

  const statusText = {
    active: 'Actif',
    cancelled: 'Annulé',
    suspended: 'En pause',
    pending: 'En attente'
  };

  const price = subscription.amount;
  const cycle = subscription.duration_months;
  const currency = "€"
  const pricePerCycle = price +currency+" pour "+cycle+" mois";

  const handleAction = async (action) => {
    setIsLoading(prev => ({ ...prev, [action]: true }));
    
    try {
      const response = await fetch(`/api/subscriptions/${subscription.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Action failed');

      const updatedSubscription = await response.json();
      onStatusChange(updatedSubscription);
    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
    } finally {
      setIsLoading(prev => ({ ...prev, [action]: false }));
    }
  };

  const handleActivation = async (userDetails) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/subscriptions/${subscription.id}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          userDetails
        })
      });

      if (!response.ok) throw new Error('Activation failed');

      const { subscription: updatedSub, user } = await response.json();
      onStatusChange(updatedSub);
      setIsActivationFormOpen(false);
    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium">{subscription.Plan.name}</h3>
          <Badge className={statusColors[subscription.status]}>
            {statusText[subscription.status]}
          </Badge>
        </div>

        <div className="mt-4 space-y-2">
        <p className="text-sm text-gray-600">
            <span className="font-medium">Référence:</span> {subscription.reference}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Prix:</span> {pricePerCycle}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Début:</span> {new Date(subscription.start_date).toLocaleDateString()}
          </p>
          {subscription.end_date && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Fin:</span> {new Date(subscription.end_date).toLocaleDateString()}
            </p>
          )}
          {subscription.Plan.plan_type === 'hosting' && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Nombre de sites inclus:</span> {subscription.Plan.included_sites}
            </p>
          )}
          {subscription.Plan.plan_type === 'hosting' && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Stockage inclu:</span> {subscription.Plan.included_storage_mb} Mo
            </p>
          )}
          {subscription.Plan.plan_type === 'domain' && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Nom de domaine:</span> {"TODO"}
            </p>
          )}
          {subscription.Plan.plan_type === 'domain' && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Renouvellement:</span> {new Date(subscription.next_payment_date).toLocaleDateString()}
            </p>
          )}
          {subscription.Plan.plan_type === 'email' && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Nombre d'Emails:</span> {subscription.Plan.included_emails}
            </p>
          )}
          {subscription.Plan.plan_type === 'email' && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Nombre de domaines:</span> {subscription.Plan.included_domains}
            </p>
          )}
        </div>

        <div className="mt-4 flex space-x-2">
            <button onClick={() => setIsDetailsOpen(true)}
                className="text-sm text-blue-600 hover:text-blue-800">
                Détails
            </button>
          {subscription.status !== 'active' && (
            <button 
              onClick={() => setIsActivationFormOpen(true)}
              className="text-sm text-green-600 hover:text-green-800">
              Activer
            </button>
          )}
          {subscription.status !== 'suspended' && subscription.status !== 'cancelled' && (
            <button 
            onClick={() => handleAction('suspend')}
            disabled={isLoading.suspend}
            className="text-sm text-yellow-600 hover:text-yellow-800 disabled:opacity-50">
            {isLoading.suspend ? 'Traitement...' : 'Suspendre'}
          </button>
          )}
          {subscription.status !== 'cancelled' && (
              <button 
              onClick={() => handleAction('cancel')}
              disabled={isLoading.cancel}
              className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50">
              {isLoading.cancel ? 'Traitement...' : 'Annuler'}
            </button>
          )}

        </div>
      </div>
    </div>

    <SubscriptionDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        subscription={subscription}
      />

    <ActivationFormModal
      isOpen={isActivationFormOpen}
      onClose={() => setIsActivationFormOpen(false)}
      onSubmit={handleActivation}
      isLoading={isLoading}
    />

    </>
  );
}