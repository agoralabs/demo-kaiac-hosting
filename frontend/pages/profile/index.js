import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/Layout';
import ProfilePage from '../../components/ProfilePage';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import api from '../../lib/api';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        const userRes = await api.get('/api/user/profile');

        setUserInfo(userRes.data || {});
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);



  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500 p-4">Erreur: {error}</div>;

  return (
    <Layout title="Mon compte">
      <ProfilePage title="Informations du compte">
        {/* Section Données personnelles (Nom, Prénom, Adresse de facturation) */}
        
        {/* Section Paramètres du compte (Email, Mot de passe, Date de création) */}

        {/* Section Supprimer le compte */}

      </ProfilePage>
    </Layout>
  );
}