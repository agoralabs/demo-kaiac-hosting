import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/Layout';
import ShopPage from '../../components/ShopPage';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../lib/api';
import { GlobeAltIcon, CheckIcon, EnvelopeIcon, ShieldCheckIcon, ServerIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';

export default function Shop() {
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState(null);
  const [error, setError] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [subscriptionsRes, invoicesRes] = await Promise.all([
          api.get('/api/user/subscriptions'),
          api.get('/api/invoice')
        ]);

        setSubscriptions(subscriptionsRes.data.data || []);
        setInvoices(invoicesRes.data.data || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleStatusChange = (updatedSubscription) => {
    setSubscriptions(prev => 
      prev.map(sub => 
        sub.id === updatedSubscription.id ? { ...sub, ...updatedSubscription } : sub
      )
    );
  };

  const handleFeatureSelection = (featureRoute) => {
    router.push(featureRoute);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500 p-4">Erreur: {error}</div>;

  return (
    <Layout title="La Boutique">
      <ShopPage title="Découvrez toutes nos offres">
        {/* Section soon */}
        <section className="mb-10">
          {/* Features grid */}
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                route: '/shop/hosting',
                icon: ServerIcon,
                title: 'Hébergement WordPress',
                description: 'Serveurs éco-responsables conformes RGPD'
              },
              {
                route: '/shop/domains',
                icon: GlobeAltIcon,
                title: 'Noms de domaine',
                description: 'Achats de noms de domaine pour tous vos besoins'
              },
              {
                route: '/shop/emails',
                icon: EnvelopeIcon,
                title: 'Emails',
                description: 'Chiffrement TLS, Protection avec antivirus, Webmail complet'
              }
            ].map((feature, idx) => (
              <div key={idx} className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8 h-full">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg">
                        <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">{feature.title}</h3>
                    <p className="mt-5 text-base text-gray-500">{feature.description}</p>
                    <button
                  type="button"
                  onClick={() => handleFeatureSelection(feature.route)}
                  className={`mt-8 w-full block py-3 px-6 border rounded-md text-center font-medium bg-white text-indigo-500 hover:bg-gray-50 border-indigo-500`}
                >
                  Découvrez <ArrowRightIcon className="inline-block h-4 w-4 ml-1" />
                </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </ShopPage>
    </Layout>
  );
}