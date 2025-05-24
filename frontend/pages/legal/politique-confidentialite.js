import Layout from '../../components/Layout';
import Link from 'next/link';

export default function PolitiqueConfidentialite() {
  return (
    <Layout title="Politique de confidentialité - KaiaC Hosting">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
            Politique de confidentialité
          </h1>

          <div className="prose prose-indigo max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                1. Collecte des données
              </h2>
              <p className="text-gray-600 mb-4">
                Nous collectons les informations suivantes :
              </p>
              <ul className="list-disc pl-5 text-gray-600 mb-4">
                <li>Nom et prénom</li>
                <li>Adresse email</li>
                <li>Numéro de téléphone</li>
                <li>Adresse de facturation</li>
                <li>Informations de paiement (traitées de manière sécurisée par nos prestataires de paiement)</li>
                <li>Données techniques liées à l'hébergement WordPress</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                2. Utilisation des données
              </h2>
              <p className="text-gray-600 mb-4">
                Les données collectées sont utilisées pour :
              </p>
              <ul className="list-disc pl-5 text-gray-600 mb-4">
                <li>Gérer votre compte et vos services d'hébergement</li>
                <li>Traiter vos paiements</li>
                <li>Vous fournir un support technique</li>
                <li>Vous informer sur nos services et mises à jour</li>
                <li>Assurer la sécurité de nos services</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                3. Protection des données
              </h2>
              <p className="text-gray-600 mb-4">
                Nous mettons en œuvre les mesures suivantes pour protéger vos données :
              </p>
              <ul className="list-disc pl-5 text-gray-600 mb-4">
                <li>Chiffrement SSL/TLS pour toutes les communications</li>
                <li>Stockage sécurisé des mots de passe (hachage)</li>
                <li>Accès restreint aux données personnelles</li>
                <li>Sauvegardes régulières et sécurisées</li>
                <li>Surveillance continue de la sécurité</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                4. Partage des données
              </h2>
              <p className="text-gray-600 mb-4">
                Nous partageons vos données uniquement avec :
              </p>
              <ul className="list-disc pl-5 text-gray-600 mb-4">
                <li>Nos prestataires de paiement sécurisés (Stripe, PayPal, CinetPay, Wave)</li>
                <li>Nos fournisseurs d'infrastructure cloud</li>
                <li>Les autorités compétentes sur demande légale</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                5. Vos droits
              </h2>
              <p className="text-gray-600 mb-4">
                Vous disposez des droits suivants concernant vos données :
              </p>
              <ul className="list-disc pl-5 text-gray-600 mb-4">
                <li>Droit d'accès à vos données</li>
                <li>Droit de rectification</li>
                <li>Droit à l'effacement</li>
                <li>Droit à la portabilité</li>
                <li>Droit d'opposition au traitement</li>
              </ul>
              <p className="text-gray-600 mb-4">
                Pour exercer ces droits, contactez-nous à privacy@kaiac-hosting.com
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                6. Cookies
              </h2>
              <p className="text-gray-600 mb-4">
                Notre site utilise des cookies pour :
              </p>
              <ul className="list-disc pl-5 text-gray-600 mb-4">
                <li>Maintenir votre session</li>
                <li>Mémoriser vos préférences</li>
                <li>Analyser l'utilisation du site</li>
                <li>Sécuriser votre compte</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                7. Conservation des données
              </h2>
              <p className="text-gray-600 mb-4">
                Nous conservons vos données :
              </p>
              <ul className="list-disc pl-5 text-gray-600 mb-4">
                <li>Pendant toute la durée de votre abonnement actif</li>
                <li>Jusqu'à 12 mois après la fin de votre abonnement</li>
                <li>Les données de facturation sont conservées selon les obligations légales</li>
              </ul>
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
