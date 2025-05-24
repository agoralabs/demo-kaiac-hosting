import { useRouter } from 'next/router';
import Link from 'next/link';
import {
    HomeIcon,
    GlobeAltIcon,
    LinkIcon,
    EnvelopeIcon,
    ArrowPathIcon,
    CreditCardIcon,
    CodeBracketIcon,
    ServerStackIcon,
    DocumentTextIcon,
    ChartBarIcon,
    ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import { useState, useEffect } from 'react';

export default function WebSitePage({ children, title = '' }) {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [currentPath, setCurrentPath] = useState('');
  const [websiteName, setWebsiteName] = useState('Mon site');
  
  // Update current path when router is ready
  useEffect(() => {
    if (router.isReady) {
      setCurrentPath(router.pathname);
    }
  }, [router.isReady, router.pathname]);
  
  // Fetch website name if needed
  useEffect(() => {
    // This is where you could fetch the website name from your API
    // For now we'll just use a placeholder or the ID
    if (id) {
      setWebsiteName(`Site #${id}`);
    }
  }, [id]);

  const menuItems = [
    { name: 'Informations', path: `/website/[id]`, href: `/website/${id}`, icon: HomeIcon },
    { name: 'Sauvegardes', path: `/website/[id]/backup`, href: `/website/${id}/backup`, icon: ServerStackIcon },
    { name: 'Redirections', path: `/website/[id]/redirect`, href: `/website/${id}/redirect`, icon: GlobeAltIcon },
    { name: 'Logs', path: `/website/[id]/logs`, href: `/website/${id}/logs`, icon: DocumentTextIcon },
    { name: 'Performance', path: `/website/[id]/performance`, href: `/website/${id}/performance`, icon: ChartBarIcon },
    { name: 'Paramètres', path: `/website/[id]/settings`, href: `/website/${id}/settings`, icon: CreditCardIcon }
  ];

  // Check if a menu item is active
  const isActive = (itemPath) => {
    // For the main page, we need an exact match
    if (itemPath === '/website/[id]') {
      return currentPath === '/website/[id]' || currentPath === '/website/[id]/index';
    }
    // For other pages, we check if the current path starts with the item path
    return currentPath.startsWith(itemPath);
  };

  // Mobile menu toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-0 left-0 z-40 p-4">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
        >
          <span className="sr-only">Open menu</span>
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <span className="sr-only">Close menu</span>
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center">
                <Link href="/manage/websites" className="mr-2 p-1 rounded-full hover:bg-gray-100 transition-colors">
                  <ArrowLeftIcon className="h-5 w-5 text-gray-500 hover:text-indigo-600" />
                </Link>
                <h2 className="text-xl font-semibold text-gray-900">{websiteName}</h2>
              </div>
              <div className="w-12 h-1 bg-indigo-600 mt-2 rounded-full"></div>
            </div>
            <nav className="flex-1 px-4 pb-4 space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.href}
                  className={`group flex items-center px-3 py-3 text-sm rounded-md font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon
                    className={`flex-shrink-0 h-5 w-5 mr-3 ${
                      isActive(item.path)
                        ? 'text-indigo-500'
                        : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                  {isActive(item.path) && (
                    <span className="ml-auto w-2 h-2 bg-indigo-500 rounded-full"></span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop menu */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="w-64 flex flex-col border-r border-gray-200 bg-white">
          <div className="p-6">
            <div className="flex items-center">
              <Link href="/manage/websites" className="mr-2 p-1 rounded-full hover:bg-gray-100 transition-colors">
                <ArrowLeftIcon className="h-5 w-5 text-gray-500 hover:text-indigo-600" />
              </Link>
              <h2 className="text-xl font-semibold text-gray-900">{websiteName}</h2>
            </div>
            <div className="w-12 h-1 bg-indigo-600 mt-2 rounded-full"></div>
          </div>
          
          <nav className="flex-1 px-4 pb-4 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.href}
                className={`group flex items-center px-3 py-3 text-sm rounded-md font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`flex-shrink-0 h-5 w-5 mr-3 ${
                    isActive(item.path)
                      ? 'text-indigo-500'
                      : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {item.name}
                {isActive(item.path) && (
                  <span className="ml-auto w-2 h-2 bg-indigo-500 rounded-full"></span>
                )}
              </Link>
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
