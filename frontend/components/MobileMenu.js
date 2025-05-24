import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { 
  HomeIcon,
  ServerIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { isLoggedIn, logout, user } = useAuth();

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  const isActive = (path) => {
    if (path === '/') {
      return router.pathname === '/';
    }
    return router.pathname.startsWith(path);
  };

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
      >
        <span className="sr-only">Ouvrir le menu</span>
        {!isOpen ? (
          <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        ) : (
          <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-16 inset-x-0 p-2 transition transform origin-top-right md:hidden">
          <div className="rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 overflow-hidden">
            {isLoggedIn && (
              <div className="px-5 pt-4 pb-2 border-b border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      {user?.firstname ? (
                        <span className="text-indigo-600 font-semibold text-lg">
                          {user.firstname.charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <UserCircleIcon className="h-6 w-6 text-indigo-600" />
                      )}
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">
                      {user?.firstname ? `${user.firstname} ${user.lastname}` : 'Mon compte'}
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                      {user?.email}
                    </div>
                  </div>
                  <button className="ml-auto flex-shrink-0 bg-white p-1 rounded-full text-gray-400 hover:text-gray-500">
                    <BellIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
            )}

            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href="/"
                className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                  isActive("/")
                    ? "text-indigo-700 bg-indigo-50"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                }`}
                onClick={() => setIsOpen(false)}
              >
                <HomeIcon className="h-5 w-5 mr-3" />
                Accueil
              </Link>

              {isLoggedIn && (
                <Link
                  href="/manage"
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                    isActive("/manage")
                      ? "text-indigo-700 bg-indigo-50"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <CommandLineIcon className="h-5 w-5 mr-3" />
                  Console
                </Link>
              )}

              <Link
                href="/pricing"
                className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                  isActive("/pricing")
                    ? "text-indigo-700 bg-indigo-50"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                }`}
                onClick={() => setIsOpen(false)}
              >
                <ServerIcon className="h-5 w-5 mr-3" />
                Tarifs
              </Link>

              <Link
                href="/docs"
                className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                  isActive("/docs")
                    ? "text-indigo-700 bg-indigo-50"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                }`}
                onClick={() => setIsOpen(false)}
              >
                <BookOpenIcon className="h-5 w-5 mr-3" />
                Documentation
              </Link>

              <Link
                href="/contact"
                className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                  isActive("/contact")
                    ? "text-indigo-700 bg-indigo-50"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                }`}
                onClick={() => setIsOpen(false)}
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5 mr-3" />
                Contactez-nous
              </Link>
            </div>

            {isLoggedIn ? (
              <div className="pt-4 pb-2 border-t border-gray-200">
                <div className="px-2 space-y-1">
                  <Link
                    href="/profile"
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <UserCircleIcon className="h-5 w-5 mr-3" />
                    Mon profil
                  </Link>
                  <Link
                    href="/profile/settings"
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <Cog6ToothIcon className="h-5 w-5 mr-3" />
                    Paramètres
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                    Déconnexion
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-4 pb-2 border-t border-gray-200">
                <div className="px-2 space-y-1">
                  <Link
                    href="/login"
                    className="block px-3 py-2 rounded-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 text-center"
                    onClick={() => setIsOpen(false)}
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/signup"
                    className="block px-3 py-2 rounded-md text-base font-medium text-indigo-600 bg-white border border-indigo-600 hover:bg-indigo-50 text-center"
                    onClick={() => setIsOpen(false)}
                  >
                    Inscription
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
