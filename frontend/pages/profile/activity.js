import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../../lib/api';
import Layout from '../../components/Layout';
import ProfilePage from '../../components/ProfilePage';
import ActivityTable from '../../components/ActivityTable';
import Pagination from '../../components/ui/Pagination';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function ActivityPage() {
  const router = useRouter();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const perPage = 10;

  useEffect(() => {
    // Récupérer la page depuis l'URL si elle existe
    const page = router.query.page ? parseInt(router.query.page) : 1;
    setCurrentPage(page);
    
    fetchActivities(page);
  }, [router.query.page]);

  const fetchActivities = async (page) => {
    setLoading(true);
    try {
      const response = await api.get('/api/user/activities', {
        params: {
          page: page,
          per_page: perPage
        }
      });
      
      setActivities(response.data.activities);
      setTotalPages(response.data.pagination.pages);
      setTotalItems(response.data.pagination.total);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors de la récupération des activités:', err);
      setError('Impossible de charger vos activités. Veuillez réessayer plus tard.');
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    // Mettre à jour l'URL avec le numéro de page
    router.push({
      pathname: router.pathname,
      query: { ...router.query, page }
    }, undefined, { shallow: true });
  };

  return (
    <Layout title="Historique d'activité">
      <ProfilePage>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-base font-semibold leading-6 text-gray-900">Historique d'activité</h1>
              <p className="mt-2 text-sm text-gray-700">
                Consultez l'historique de vos actions et activités sur la plateforme.
              </p>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          ) : (
            <div className="mt-8 flow-root">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <ActivityTable activities={activities} />
                  
                  {totalPages > 1 && (
                    <Pagination 
                      currentPage={currentPage} 
                      totalPages={totalPages} 
                      onPageChange={handlePageChange} 
                    />
                  )}
                  
                  <div className="mt-4 text-sm text-gray-500 text-center">
                    Affichage de {activities.length} activités sur {totalItems}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ProfilePage>
    </Layout>
  );
}
