import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { BellAlertIcon } from '@heroicons/react/24/outline';

// Components
import ProfilePage from '../../components/ProfilePage';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

// Custom hooks and API
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';

export default function NotificationSettings() {
  const router = useRouter();
  const { user, isLoading, isLoggedIn } = useAuth();
  
  const [isSaving, setIsSaving] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState([]);
  const [defaultSettings] = useState([
    {
      notify_by_email: true,
      notify_in_app: true,
      notify_by_sms: false,
      category: "subscription",
      label: "Abonnements et paiements",
      description: "Notifications concernant vos abonnements, factures, paiements et renouvellements."
    },
    {
      notify_by_email: true,
      notify_in_app: true,
      notify_by_sms: false,
      category: "account",
      label: "Problèmes de compte",
      description: "Notifications concernant les problèmes de sécurité, connexions suspectes ou problèmes avec votre compte."
    },
    {
      notify_by_email: true,
      notify_in_app: true,
      notify_by_sms: false,
      category: "platform",
      label: "Perturbations de la plateforme",
      description: "Notifications concernant les interruptions de service, maintenance planifiée ou problèmes techniques."
    },
    {
      notify_by_email: true,
      notify_in_app: true,
      notify_by_sms: false,
      category: "updates",
      label: "Mises à jour",
      description: "Notifications concernant les nouvelles fonctionnalités, améliorations et mises à jour de la plateforme."
    },
    {
      notify_by_email: true,
      notify_in_app: true,
      notify_by_sms: false,
      category: "offers",
      label: "Offres spéciales",
      description: "Notifications concernant les promotions, remises et offres spéciales."
    }
  ]);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login?redirect=/profile/notifications');
    }
    
    // Fetch user notification settings
    const fetchNotificationSettings = async () => {
      try {
        const response = await api.get('/api/user/notification-settings');
        const settings = response.data.data;
        if (settings && Array.isArray(settings)) {
          setNotificationSettings(settings);
        } else {
          // Fallback to default settings if API doesn't return expected format
          setNotificationSettings(defaultSettings);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des paramètres de notification:', error);
        // Keep default settings if fetch fails
        setNotificationSettings(defaultSettings);
      }
    };
    
    if (isLoggedIn) {
      fetchNotificationSettings();
    }
  }, [isLoading, isLoggedIn, router, defaultSettings]);

  const handleToggle = (category, field) => {
    setNotificationSettings(prev => 
      prev.map(setting => 
        setting.category === category 
          ? { ...setting, [field]: !setting[field] }
          : setting
      )
    );
  };

  const saveSettings = async () => {
    setIsSaving(true);
    
    try {
      await api.put('/api/user/notification-settings', notificationSettings);
      toast.success('Paramètres de notification mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres de notification:', error);
      toast.error(error.response?.data?.message || 'Échec de la mise à jour des paramètres');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <ProfilePage>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </ProfilePage>
    );
  }

  return (
    <ProfilePage title="Paramètres de notifications">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <BellAlertIcon className="h-8 w-8 text-blue-500 mr-3" />
              <h2 className="text-xl font-semibold">Préférences de notifications</h2>
            </div>
            <p className="mt-2 text-gray-600">
              Configurez comment et quand vous souhaitez recevoir des notifications de notre part.
            </p>
          </div>
          
          <div className="p-6">
            <div className="space-y-8">
              {notificationSettings.map((setting, index) => (
                <div key={index}>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{setting.label}</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {setting.description}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`${setting.category}_email`}
                        checked={setting.notify_by_email}
                        onChange={() => handleToggle(setting.category, 'notify_by_email')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`${setting.category}_email`} className="ml-2 block text-sm text-gray-700">
                        Email
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`${setting.category}_app`}
                        checked={setting.notify_in_app}
                        onChange={() => handleToggle(setting.category, 'notify_in_app')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`${setting.category}_app`} className="ml-2 block text-sm text-gray-700">
                        Application
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`${setting.category}_sms`}
                        checked={setting.notify_by_sms}
                        onChange={() => handleToggle(setting.category, 'notify_by_sms')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`${setting.category}_sms`} className="ml-2 block text-sm text-gray-700">
                        SMS
                      </label>
                    </div>
                  </div>
                  
                  <hr className="mt-6" />
                </div>
              ))}
            </div>
            
            <div className="mt-8">
              <button
                onClick={saveSettings}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {isSaving ? 'Enregistrement...' : 'Enregistrer les préférences'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Fréquence des notifications</h2>
          </div>
          
          <div className="p-6">
            <p className="text-gray-600 mb-4">
              Les notifications critiques concernant votre compte, la sécurité et les paiements seront toujours envoyées immédiatement.
            </p>
            
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                <strong>Email:</strong> Les emails sont envoyés immédiatement pour les notifications importantes. Les mises à jour et offres spéciales sont regroupées dans un résumé hebdomadaire si vous les avez activées.
              </p>
              
              <p className="text-sm text-gray-500 mt-2">
                <strong>Application:</strong> Les notifications dans l'application apparaissent dans votre centre de notifications et sont mises à jour en temps réel.
              </p>
              
              <p className="text-sm text-gray-500 mt-2">
                <strong>SMS:</strong> Les SMS sont uniquement utilisés pour les notifications urgentes et importantes concernant votre compte ou service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProfilePage>
  );
}
