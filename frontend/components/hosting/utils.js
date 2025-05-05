import { CheckCircleIcon, ClockIcon, PauseCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };
  
  export const formatStorage = (mb) => {
    if (mb >= 1000) return `${(mb / 1000).toFixed(1)} GB`;
    return `${mb} MB`;
  };
  
  export const getStatusIcon = (status) => {
    const iconProps = {
        className: "h-5 w-5 flex-shrink-0",
        'aria-hidden': true
      };
    
    switch (status) {
        case 'active':
            return <CheckCircleIcon {...iconProps} className={`${iconProps.className} text-green-500`} />;
        case 'pending':
            return <ClockIcon {...iconProps} className={`${iconProps.className} text-yellow-500`} />;
        case 'suspended':
            return <PauseCircleIcon {...iconProps} className={`${iconProps.className} text-orange-500`} />;
        case 'cancelled':
            return <XCircleIcon {...iconProps} className={`${iconProps.className} text-red-500`} />;
        default:
            return <ClockIcon {...iconProps} className={`${iconProps.className} text-gray-500`} />;
    }
  };