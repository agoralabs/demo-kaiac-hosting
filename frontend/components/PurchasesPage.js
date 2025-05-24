import { useRouter } from 'next/router';
import {
    HomeIcon,
    GlobeAltIcon,
    LinkIcon,
    EnvelopeIcon,
    ArrowPathIcon,  // Anciennement RefreshIcon
    CreditCardIcon,
    ShoppingBagIcon,
    ServerStackIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';

export default function PurchasesPage({ children, title = '' }) {
  const router = useRouter();
  const { user } = useAuth();

  const menuItems = [
    { name: 'Mon Tableau de bord', path: '/manage', icon: HomeIcon },
    { name: 'Mes formules', path: '/manage/hosting', icon: ShoppingBagIcon },
    { name: 'Mes noms de domaines', path: '/manage/domains', icon: LinkIcon },
    { name: 'Mes sites WordPress', path: '/manage/websites', icon: GlobeAltIcon },
    { name: 'Mes adresses e-mails', path: '/manage/emails', icon: EnvelopeIcon },
    { name: 'Mes paiements', path: '/manage/payments', icon: CreditCardIcon },
    { name: 'Mes factures', path: '/manage/invoices', icon: ArrowPathIcon }
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Menu latéral */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="w-64 flex flex-col border-r border-gray-200 bg-white">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900">Ma console </h2>
            <div className="w-12 h-1 bg-indigo-600 mt-2 rounded-full"></div>
          </div>
          
          <nav className="flex-1 px-4 pb-4 space-y-1">
            {menuItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className={`group flex items-center px-3 py-3 text-sm rounded-md font-medium transition-colors ${
                  router.pathname === item.path
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`flex-shrink-0 h-5 w-5 mr-3 ${
                    router.pathname === item.path
                      ? 'text-indigo-500'
                      : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {item.name}
                {router.pathname === item.path && (
                  <span className="ml-auto w-2 h-2 bg-indigo-500 rounded-full"></span>
                )}
              </a>
            ))}
          </nav>
          
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {title && <h1 className="text-2xl font-bold text-gray-900 mb-6">{title}</h1>}
          {children}
        </div>
      </div>
    </div>
  );
}