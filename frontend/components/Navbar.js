import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/router';
import MobileMenu from './MobileMenu';

export default function Navbar() {
  const router = useRouter();
  const { isLoggedIn, logout } = useAuth();

  return (
    <nav className="bg-white shadow-lg fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="font-semibold text-xl text-gray-800">KaPress</span>
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition duration-150 ease-in-out ${
                router.pathname === "/" ? "bg-gray-50 text-gray-900" : ""
              }`}
            >
              Accueil
            </Link>
            {isLoggedIn && (
              <>
                <Link 
                  href="/shop"
                  className={`px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition duration-150 ease-in-out ${
                    router.pathname === "/shop" ? "bg-gray-50 text-gray-900" : ""
                  }`}
                >
                  Boutique
                </Link>
              </>
            )}
          {isLoggedIn && (
              <>
                <Link 
                  href="/purchases"
                  className={`px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition duration-150 ease-in-out ${
                    router.pathname === "/purchases" ? "bg-gray-50 text-gray-900" : ""
                  }`}
                >
                  Achats
                </Link>
              </>
            )}
          {isLoggedIn && (
              <>
                <Link 
                  href="/profile"
                  className={`px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition duration-150 ease-in-out ${
                    router.pathname === "/profile" ? "bg-gray-50 text-gray-900" : ""
                  }`}
                >
                  Profil
                </Link>
              </>
            )}
            <div className="flex items-center space-x-3">
              {isLoggedIn ? (
                <button
                  onClick={logout}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  Déconnexion
                </button>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 border-blue-600"
                  >
                    Inscription
                  </Link>
                </>
              )}
            </div>
          </div>
          <MobileMenu />
        </div>
      </div>
    </nav>
  );
}