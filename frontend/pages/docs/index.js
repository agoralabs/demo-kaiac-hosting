import Layout from '../../components/Layout';
import Link from 'next/link';
import { 
  BookOpenIcon, 
  ServerIcon, 
  ShieldCheckIcon, 
  CogIcon,
  CommandLineIcon,
  CloudArrowUpIcon,
  WrenchScrewdriverIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';

export default function Documentation() {
  const categories = [
    {
      title: 'Démarrage rapide',
      icon: <BookOpenIcon className="h-6 w-6" />,
      description: 'Apprenez à créer votre premier site WordPress',
      link: '/docs/getting-started'
    },
    {
      title: 'Hébergement WordPress',
      icon: <ServerIcon className="h-6 w-6" />,
      description: 'Gérez vos sites WordPress et vos ressources',
      link: '/docs/wordpress-hosting'
    },
    {
      title: 'Sécurité',
      icon: <ShieldCheckIcon className="h-6 w-6" />,
      description: 'Sécurisez vos sites et vos données',
      link: '/docs/security'
    },
    {
      title: 'Configuration',
      icon: <CogIcon className="h-6 w-6" />,
      description: 'Configurez vos sites et vos services',
      link: '/docs/configuration'
    },
    {
      title: 'Ligne de commande',
      icon: <CommandLineIcon className="h-6 w-6" />,
      description: 'Utilisez notre CLI pour automatiser vos tâches',
      link: '/docs/cli'
    },
    {
      title: 'Déploiement',
      icon: <CloudArrowUpIcon className="h-6 w-6" />,
      description: 'Déployez vos sites et applications',
      link: '/docs/deployment'
    },
    {
      title: 'Maintenance',
      icon: <WrenchScrewdriverIcon className="h-6 w-6" />,
      description: 'Maintenez vos sites à jour et performants',
      link: '/docs/maintenance'
    },
    {
      title: 'FAQ',
      icon: <QuestionMarkCircleIcon className="h-6 w-6" />,
      description: 'Trouvez des réponses à vos questions',
      link: '/docs/faq'
    }
  ];

  return (
    <Layout title="Documentation - KaiaC Hosting">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Documentation
          </h1>
          <p className="mt-4 text-xl text-gray-500">
            Tout ce dont vous avez besoin pour réussir avec KaiaC Hosting
          </p>
          <div className="mt-8">
            <div className="rounded-md shadow">
              <input
                type="search"
                placeholder="Rechercher dans la documentation..."
                className="w-full max-w-xl px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link 
              key={category.title} 
              href={category.link}
              className="relative group"
            >
              <div className="h-full flex flex-col bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center space-x-3 text-indigo-600 mb-4">
                  {category.icon}
                  <h3 className="text-lg font-semibold">{category.title}</h3>
                </div>
                <p className="text-gray-600 flex-grow">
                  {category.description}
                </p>
                <div className="mt-4 flex items-center text-indigo-600 text-sm font-medium">
                  En savoir plus
                  <svg className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Support Section */}
        <div className="mt-16 bg-indigo-50 rounded-2xl p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-indigo-900">
              Besoin d'aide supplémentaire ?
            </h2>
            <p className="mt-4 text-indigo-700">
              Notre équipe de support est disponible 24/7 pour vous aider.
            </p>
            <div className="mt-6">
              <Link
                href="/contact"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Contactez le support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
