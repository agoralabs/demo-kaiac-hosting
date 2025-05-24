import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { formatDate, formatStorage, getStatusIcon } from './utils';

export default function HostingItem({
  subscription,
  expanded,
  onToggleExpand
}) {
  
  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
      <div className="bg-white px-4 py-5 sm:px-6">
        {/* Header du composant */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {subscription.Plan?.name}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {formatDate(subscription.start_date)} - {formatDate(subscription.end_date)}
            </p>
          </div>
          {/* ... reste du header ... */}
          <div className="flex items-center space-x-4">
            <div className="text-center">
            {true && (
              <>
              <p className="text-sm font-medium text-gray-500">Domaines</p>
              <p className="text-lg font-semibold">
                  {subscription.domains_count}/{subscription.max_domains}
              </p>
              </>
            )}
            </div>
            <div className="text-center">
            {true && (
              <>
              <p className="text-sm font-medium text-gray-500">Sites</p>
              <p className="text-lg font-semibold">
                  {subscription.websites_count}/{subscription.max_websites}
              </p>
              </>
            )}
            </div>
            <div className="text-center">
            {true && (
              <>
              <p className="text-sm font-medium text-gray-500">Emails</p>
              <p className="text-lg font-semibold">
                  {subscription.emails_count}/{subscription.max_emails}
              </p>
              </>
            )}
            </div>
            <button
              onClick={() => onToggleExpand()}
              className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none"
              aria-label={expanded ? 'Réduire' : 'Développer'}
            >
              {expanded ? (
                <ChevronUpIcon className="h-5 w-5" />
              ) : (
                <ChevronDownIcon className="h-5 w-5" />
              )}
            </button>
           </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          {/* Détails de l'abonnement */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900">Détails de l'hébergement</h4>
            {/* ... détails ... */}
            <div className="mt-2 grid grid-cols-2 gap-4">
                <div>
                    <p className="text-sm text-gray-500">Statut</p>
                    <p className="flex items-center text-sm font-medium">
                    {getStatusIcon(subscription.status)}
                    <span className="ml-2 capitalize">{subscription.status || 'inconnu'}</span>
                    </p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Référence</p>
                    <p className="text-sm font-medium">
                    {subscription.reference || 'N/A'}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Montant</p>
                    <p className="text-sm font-medium">
                    {subscription.amount ? `${subscription.amount} ${subscription.currency || ''}` : 'N/A'} / {subscription.billing_cycle || 'N/A'}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Prochain paiement</p>
                    <p className="text-sm font-medium">
                    {formatDate(subscription.next_payment_date)}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Stockage inclu</p>
                    <p className="text-sm font-medium">
                    {subscription.Plan?.included_storage_mb ? formatStorage(subscription.Plan.included_storage_mb) : 'N/A'}
                    </p>
                </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}