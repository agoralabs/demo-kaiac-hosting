import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  ClockIcon,
  DocumentTextIcon,
  CreditCardIcon,
  UserIcon,
  GlobeAltIcon,
  ServerIcon
} from '@heroicons/react/24/outline';

// Fonction pour déterminer l'icône en fonction du type d'activité
const getActivityIcon = (method, path) => {
  if (path.includes('invoice')) {
    return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
  } else if (path.includes('payment') || path.includes('subscription')) {
    return <CreditCardIcon className="h-5 w-5 text-blue-500" />;
  } else if (path.includes('user') || path.includes('auth')) {
    return <UserIcon className="h-5 w-5 text-indigo-500" />;
  } else if (path.includes('website')) {
    return <GlobeAltIcon className="h-5 w-5 text-green-500" />;
  } else if (path.includes('domain')) {
    return <ServerIcon className="h-5 w-5 text-purple-500" />;
  }
  
  return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
};

// Fonction pour obtenir le statut avec icône
const getStatusBadge = (status) => {
  switch (status) {
    case 'success':
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
          <CheckCircleIcon className="mr-1 h-4 w-4" />
          Succès
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
          <ExclamationCircleIcon className="mr-1 h-4 w-4" />
          Échec
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
          <ClockIcon className="mr-1 h-4 w-4" />
          En attente
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
          {status}
        </span>
      );
  }
};

// Fonction pour formater la description de l'activité
const formatActivityDescription = (activity) => {
  const { method, path, target, target_id } = activity;
  
  // Formatage basé sur le type d'activité
  if (method === 'GET') {
    return `Consultation ${target || path}`;
  } else if (method === 'POST') {
    return `Création ${target || path}${target_id ? ` #${target_id}` : ''}`;
  } else if (method === 'PUT' || method === 'PATCH') {
    return `Modification ${target || path}${target_id ? ` #${target_id}` : ''}`;
  } else if (method === 'DELETE') {
    return `Suppression ${target || path}${target_id ? ` #${target_id}` : ''}`;
  }
  
  return `${method} ${path}`;
};

export default function ActivityTable({ activities }) {
  const [expandedActivity, setExpandedActivity] = useState(null);
  
  const toggleDetails = (id) => {
    if (expandedActivity === id) {
      setExpandedActivity(null);
    } else {
      setExpandedActivity(id);
    }
  };
  
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500">Aucune activité à afficher</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
              Action
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Date
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Statut
            </th>
            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">Détails</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {activities.map((activity) => (
            <>
              <tr key={activity.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center">
                      {getActivityIcon(activity.method, activity.path)}
                    </div>
                    <div className="ml-4">
                      <div className="font-medium text-gray-900">{formatActivityDescription(activity)}</div>
                      <div className="text-gray-500">{activity.path}</div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {format(new Date(activity.createdAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {getStatusBadge(activity.status)}
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <button
                    onClick={() => toggleDetails(activity.id)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    {expandedActivity === activity.id ? 'Masquer' : 'Détails'}
                  </button>
                </td>
              </tr>
              {expandedActivity === activity.id && (
                <tr key={`details-${activity.id}`} className="bg-gray-50">
                  <td colSpan="4" className="px-6 py-4">
                    <div className="text-sm">
                      <h4 className="font-medium text-gray-900 mb-2">Informations détaillées</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-500">
                            <span className="font-medium">Méthode:</span> {activity.method}
                          </p>
                          <p className="text-gray-500">
                            <span className="font-medium">Chemin:</span> {activity.path}
                          </p>
                          {activity.target && (
                            <p className="text-gray-500">
                              <span className="font-medium">Cible:</span> {activity.target}
                              {activity.target_id && ` #${activity.target_id}`}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-gray-500">
                            <span className="font-medium">Adresse IP:</span> {activity.ip_address}
                          </p>
                          {activity.error_message && (
                            <p className="text-red-500">
                              <span className="font-medium">Erreur:</span> {activity.error_message}
                            </p>
                          )}
                        </div>
                      </div>
                      {activity.details && (
                        <div className="mt-2">
                          <h5 className="font-medium text-gray-900">Détails</h5>
                          <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                            {JSON.stringify(activity.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
