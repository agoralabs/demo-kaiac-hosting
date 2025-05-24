import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
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
const getStatusIcon = (status) => {
  switch (status) {
    case 'success':
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    case 'failed':
      return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
    case 'pending':
      return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    default:
      return null;
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

export default function RecentActivityList({ activities, limit = 5 }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500">Aucune activité récente</p>
      </div>
    );
  }
  
  // Limiter le nombre d'activités affichées
  const displayedActivities = activities.slice(0, limit);
  
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {displayedActivities.map((activity, activityIdx) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {activityIdx !== displayedActivities.length - 1 ? (
                <span
                  className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex items-start space-x-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                    {getActivityIcon(activity.method, activity.path)}
                  </div>
                  <span className="absolute -bottom-0.5 -right-1 rounded-tl bg-white px-0.5 py-px">
                    {getStatusIcon(activity.status)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">
                        {formatActivityDescription(activity)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {format(new Date(activity.createdAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                    </p>
                  </div>
                  <div className="mt-2 text-sm text-gray-700">
                    <p>{activity.path}</p>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      
      <div className="mt-6 text-center">
        <Link href="/profile/activity" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          Voir toutes les activités
        </Link>
      </div>
    </div>
  );
}
