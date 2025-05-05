import { useState, useEffect } from 'react';
import api from '../../lib/api';
import HostingItem from './HostingItem';

export default function HostingList({

}) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSubscription, setExpandedSubscription] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subsResponse, websitesResponse] = await Promise.all([
          api.get('/api/user/subscriptions/hosting'),
          api.get('/api/user/websites')
        ]);
        
        const subscriptionsData = subsResponse.data.data || [];
        const websitesData = websitesResponse.data.data || [];

        const enrichedSubscriptions = subscriptionsData.map(sub => ({
          ...sub,
          websites: websitesData.filter(web => web.subscription_id === sub.id),
          websites_count: websitesData.filter(web => web.subscription_id === sub.id).length,
          max_websites: sub.Plan?.included_sites || 1
        }));

        console.log('enrichedSubscriptions', enrichedSubscriptions);

        setSubscriptions(enrichedSubscriptions);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Mes Hébergements</h1>
          <p className="mt-2 text-sm text-gray-700">
            Liste de toutes les formules souscrites
          </p>
        </div>
      </div>
      
      <div className="mt-8 space-y-6">
        {subscriptions.map((subscription) => (
          <HostingItem
            key={subscription.id}
            subscription={subscription}
            expanded={expandedSubscription === subscription.id}
            onToggleExpand={() => setExpandedSubscription(
              expandedSubscription === subscription.id ? null : subscription.id
            )}
          />
        ))}
      </div>

    </div>
  );
}
