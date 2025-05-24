// pages/purchases/index.js
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/Layout';
import PurchasesPage from '../../components/PurchasesPage';
import RecentActivityList from '../../components/RecentActivityList';
import { 
  ArrowPathIcon, 
  ExclamationCircleIcon,
  ServerIcon, 
  GlobeAltIcon, 
  EnvelopeIcon, 
  DocumentTextIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import api from '../../lib/api';
import { useRouter } from 'next/router';

export default function Dashboard() {
  const { isLoggedIn, user } = useAuth();
  const [stats, setStats] = useState({
    hosting: 0,
    domains: 0,
    emails: 0,
    invoices: 0,
    activeHosting: 0,
    expiringDomains: 0,
    unpaidInvoices: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activitiesError, setActivitiesError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/user/dashboard-stats');
        setStats(response.data.data);
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
        setError('Impossible de charger les statistiques');
      } finally {
        setLoading(false);
      }
    };

    const fetchRecentActivities = async () => {
      try {
        setActivitiesLoading(true);
        const response = await api.get('/api/user/activities', {
          params: {
            page: 1,
            per_page: 5
          }
        });
        setRecentActivities(response.data.activities);
      } catch (err) {
        console.error('Failed to load recent activities', err);
        setActivitiesError('Impossible de charger les activités récentes');
      } finally {
        setActivitiesLoading(false);
      }
    };

    fetchStats();
    fetchRecentActivities();
  }, [user]);

  const StatCard = ({ icon: Icon, title, value, link, subValue, subTitle }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">
                {value}
              </div>
              {subValue > 0 && (
                <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                  {subValue} {subTitle}
                </div>
              )}
            </dd>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <a
            href={link}
            className="font-medium text-indigo-700 hover:text-indigo-900 flex items-center"
          >
            Voir détails <ArrowRightIcon className="ml-1 h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout title="Tableau de bord">
        <PurchasesPage>
          <div className="flex justify-center items-center py-12">
            <ArrowPathIcon className="h-8 w-8 text-indigo-600 animate-spin" />
          </div>
        </PurchasesPage>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Tableau de bord">
        <PurchasesPage>
          <div className="text-center py-12">
            <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">{error}</h3>
            <div className="mt-4">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <ArrowPathIcon className="mr-2 -ml-1 h-5 w-5" />
                Réessayer
              </button>
            </div>
          </div>
        </PurchasesPage>
      </Layout>
    );
  }

  return (
    <Layout title="Tableau de bord">
      <PurchasesPage>
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
              <p className="mt-1 text-sm text-gray-500">
                Aperçu de vos services et consommations
              </p>
            </div>
          </div>

          {/* Grille de statistiques */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatCard 
              icon={ServerIcon} 
              title="Sites" 
              value={stats.hosting} 
              subValue={stats.activeHosting} 
              subTitle="actifs"
              link="/manage/hosting" 
            />
            <StatCard 
              icon={GlobeAltIcon} 
              title="Noms de domaine" 
              value={stats.domains} 
              subValue={stats.expiringDomains > 0 ? stats.expiringDomains : null} 
              subTitle="expirent bientôt"
              link="/manage/domains" 
            />
            <StatCard 
              icon={EnvelopeIcon} 
              title="Adresses e-mail" 
              value={stats.emails} 
              link="/manage/emails" 
            />
            <StatCard 
              icon={DocumentTextIcon} 
              title="Factures" 
              value={stats.invoices} 
              subValue={stats.unpaidInvoices} 
              subTitle="impayées"
              link="/manage/invoices" 
            />
          </div>

          {/* Section d'activité récente */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Activité récente
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Vos dernières actions et notifications
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              {activitiesLoading ? (
                <div className="flex justify-center items-center py-6">
                  <ArrowPathIcon className="h-6 w-6 text-indigo-600 animate-spin" />
                </div>
              ) : activitiesError ? (
                <div className="text-center text-red-500">
                  <p>{activitiesError}</p>
                </div>
              ) : (
                <RecentActivityList activities={recentActivities} limit={5} />
              )}
            </div>
          </div>

          {/* Section d'actions rapides */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Actions rapides
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <a
                href="/manage/hosting"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Nouvel hébergement
              </a>
              <a
                href="/manage/domains"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Enregistrer un domaine
              </a>
              <a
                href="/manage/emails"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Créer une adresse e-mail
              </a>
              <a
                href="/support"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
              >
                Contacter le support
              </a>
            </div>
          </div>
        </div>
      </PurchasesPage>
    </Layout>
  );
}
