import useProcessingMonitor from '../../hooks/useProcessingMonitor';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export default function WebsiteStatus({ website}) {
    const { isProcessing } = useProcessingMonitor(website.id, website.is_processing_site);
  
    if (isProcessing) {
      return (
        <div className="flex items-center">
          <ArrowPathIcon className="h-4 w-4 text-blue-500 animate-spin" />
          <span className="ml-1 text-xs text-blue-600">Déploiement en cours</span>
        </div>
      );
    }
  
    return website.is_active ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Actif
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Inactif
      </span>
    );
  };