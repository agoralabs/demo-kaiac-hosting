import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        const response = await fetch('/api/user/plan', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        setPlan(data.plan);
      } catch (error) {
        console.error('Error fetching user plan:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserPlan();
    }
  }, [user]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <p>Chargement...</p>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Tableau de bord</h1>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Votre abonnement</h2>
          
          {plan ? (
            <div>
              <p className="text-gray-600">Plan actuel : <span className="font-medium">{plan.name}</span></p>
              {/* Add more plan details here as needed */}
            </div>
          ) : (
            <div className="text-gray-600">
              <p>Vous n'avez pas encore souscrit à un plan.</p>
              <a href="/plans" className="text-blue-600 hover:text-blue-800 font-medium mt-2 inline-block">
                Voir les plans disponibles
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}