import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  const plans = [
    {
      name: 'BASIC',
      price: '9.99',
      features: ['1 Site WordPress', '10GB Stockage', 'Support Basic']
    },
    {
      name: 'STANDARD',
      price: '19.99',
      features: ['3 Sites WordPress', '30GB Stockage', 'Support Prioritaire']
    },
    {
      name: 'PREMIUM',
      price: '39.99',
      features: ['10 Sites WordPress', '100GB Stockage', 'Support Premium 24/7']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Head>
        <title>Hébergement WordPress - Accueil</title>
        <meta name="description" content="Professional WordPress hosting solutions" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 mb-6 animate-gradient-x">
            Hébergement WordPress Professionnel
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Solutions d'hébergement rapides, sécurisées et fiables pour vos sites WordPress. Commencez dès aujourd'hui avec nos formules flexibles.
          </p>
          <Link href="/shop/hosting" className="inline-flex items-center px-8 py-3 rounded-lg text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200">
            Découvrez nos formules
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        {/* Plans Preview Section */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          {plans.map((plan) => (
            <div key={plan.name} className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{plan.name}</h2>
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-6">
                {plan.price}€
                <span className="text-lg text-gray-500">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-700">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/shop/hosting" className="block w-full text-center bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                Plus d'informations
              </Link>
            </div>
          ))}
        </div>

        {/* Features Section */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Rapide</h3>
            <p className="text-gray-600">Serveurs optimisés pour des performances WordPress maximales</p>
          </div>
          <div className="text-center p-6 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="bg-gradient-to-r from-purple-400 to-purple-600 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Sécurisé</h3>
            <p className="text-gray-600">Fonctionnalités de sécurité de niveau entreprise incluses</p>
          </div>
          <div className="text-center p-6 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="bg-gradient-to-r from-pink-400 to-pink-600 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Support 24h/24 et 7j/7</h3>
            <p className="text-gray-600">Une équipe toujours prête à vous aider</p>
          </div>
        </div>
      </main>
    </div>
  );
}