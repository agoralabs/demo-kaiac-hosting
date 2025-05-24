import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/router';
import MobileMenu from './MobileMenu';
import { 
  UserCircleIcon, 
  BellIcon, 
  ChevronDownIcon,
  ServerIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  CommandLineIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

export default function Navbar() {
  const router = useRouter();
  const { isLoggedIn, logout, user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Effet pour détecter le défilement et changer l'apparence de la navbar
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownOpen && !event.target.closest('.profile-dropdown')) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  // Fermer le dropdown quand on change de page
  useEffect(() => {
    setProfileDropdownOpen(false);
  }, [router.pathname]);

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
  };

  const handleLogout = () => {
    setProfileDropdownOpen(false);
    logout();
  };

  const isActive = (path) => {
    if (path === '/') {
      return router.pathname === '/';
    }
    return router.pathname.startsWith(path);
  };

  return (
    <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white shadow-md' : 'bg-white/95 backdrop-blur-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo et nom */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-blue-500 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
                KaPress
              </span>
            </Link>
          </div>

          {/* Navigation principale - Desktop */}
          <div className="hidden md:flex items-center space-x-1">
            <Link 
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 transition duration-150 ease-in-out ${
                isActive("/") 
                  ? "bg-indigo-50 text-indigo-700" 
                  : "text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
              }`}
            >
              <HomeIcon className="h-4 w-4" />
              <span>Accueil</span>
            </Link>

            {isLoggedIn && (
              <Link 
                href="/manage"
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 transition duration-150 ease-in-out ${
                  isActive("/manage") 
                    ? "bg-indigo-50 text-indigo-700" 
                    : "text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
                }`}
              >
                <CommandLineIcon className="h-4 w-4" />
                <span>Console</span>
              </Link>
            )}

            <Link 
              href="/pricing"
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 transition duration-150 ease-in-out ${
                isActive("/pricing") 
                  ? "bg-indigo-50 text-indigo-700" 
                  : "text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
              }`}
            >
              <ServerIcon className="h-4 w-4" />
              <span>Tarifs</span>
            </Link>

            <Link 
              href="/docs"
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 transition duration-150 ease-in-out ${
                isActive("/docs") 
                  ? "bg-indigo-50 text-indigo-700" 
                  : "text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
              }`}
            >
              <BookOpenIcon className="h-4 w-4" />
              <span>Documentation</span>
            </Link>

            <Link 
              href="/contact"
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 transition duration-150 ease-in-out ${
                isActive("/contact") 
                  ? "bg-indigo-50 text-indigo-700" 
                  : "text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
              }`}
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4" />
              <span>Contactez-nous</span>
            </Link>
          </div>

          {/* Boutons d'authentification et profil - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn ? (
              <div className="relative profile-dropdown">
                <div className="flex items-center space-x-3">
                  {/* Icône de notification */}
                  <button className="p-1 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 focus:outline-none">
                    <BellIcon className="h-6 w-6" />
                  </button>
                  
                  {/* Bouton de profil */}
                  <button 
                    onClick={toggleProfileDropdown}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      profileDropdownOpen ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                      {user?.firstname ? user.firstname.charAt(0).toUpperCase() : <UserCircleIcon className="h-6 w-6" />}
                    </div>
                    <span className="hidden lg:inline-block">{user?.firstname || 'Mon compte'}</span>
                    <ChevronDownIcon className={`h-4 w-4 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Dropdown menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 ring-1 ring-black ring-opacity-5">
                    <Link 
                      href="/profile" 
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      <UserCircleIcon className="h-5 w-5 mr-2" />
                      Mon profil
                    </Link>
                    <Link 
                      href="/profile/notifications" 
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      <Cog6ToothIcon className="h-5 w-5 mr-2" />
                      Paramètres
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button 
                      onClick={handleLogout}
                      className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Connexion
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center px-4 py-2 border border-indigo-600 text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 transition-colors"
                >
                  Inscription
                </Link>
              </>
            )}
          </div>

          {/* Menu mobile */}
          <div className="md:hidden">
            <MobileMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}
