import Layout from '../../components/Layout';
import Link from 'next/link';

export default function MentionsLegales() {
  return (
    <Layout title="Mentions légales - KaiaC Hosting">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
            Mentions légales
          </h1>

          <div className="prose prose-indigo max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                1. Informations légales
              </h2>
              <p className="text-gray-600 mb-4">
                Le site KaiaC Hosting est édité par :
              </p>
              <ul className="list-disc pl-5 text-gray-600 mb-4">
                <li>Société : KaiaC Hosting</li>
                <li>Forme juridique : SARL</li>
                <li>Capital social : 1 000 000 FCFA</li>
                <li>Siège social : Douala, Cameroun</li>
                <li>Email : contact@kaiac-hosting.com</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                2. Hébergement
              </h2>
              <p className="text-gray-600 mb-4">
                Le site est hébergé sur nos propres serveurs sécurisés, gérés par KaiaC Hosting.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                3. Propriété intellectuelle
              </h2>
              <p className="text-gray-600 mb-4">
                L'ensemble du contenu de ce site (textes, images, vidéos, etc.) est protégé par le droit d'auteur. 
                Toute reproduction ou représentation, totale ou partielle, de ce site ou de son contenu est interdite 
                sans l'autorisation expresse de KaiaC Hosting.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                4. Données personnelles
              </h2>
              <p className="text-gray-600 mb-4">
                Les informations concernant la collecte et le traitement des données personnelles sont détaillées 
                dans notre{' '}
                <Link href="/legal/politique-confidentialite" className="text-indigo-600 hover:text-indigo-800">
                  Politique de confidentialité
                </Link>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                5. Moyens de paiement
              </h2>
              <p className="text-gray-600 mb-4">
                KaiaC Hosting propose plusieurs moyens de paiement sécurisés :
              </p>
              <ul className="list-disc pl-5 text-gray-600 mb-4">
                <li>Cartes bancaires (via Stripe)</li>
                <li>PayPal</li>
                <li>Mobile Money (via CinetPay)</li>
                <li>Wave</li>
              </ul>
              <p className="text-gray-600 mb-4">
                Tous les paiements sont sécurisés et traités par des prestataires certifiés.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                6. Loi applicable
              </h2>
              <p className="text-gray-600 mb-4">
                Les présentes mentions légales sont soumises au droit camerounais. En cas de litige, 
                les tribunaux camerounais seront seuls compétents.
              </p>
            </section>
          </div>

          <div className="mt-12 border-t border-gray-200 pt-8">
            <p className="text-sm text-gray-500">
              Dernière mise à jour : {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
