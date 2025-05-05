// pages/shop/payments.js
import Layout from '../../components/Layout';
import ShopPage from '../../components/ShopPage';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function Payments() {
  return (
    <Layout title="Paiements">
      <ShopPage>
        <div className="text-center py-12">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
            <ExclamationTriangleIcon className="h-6 w-6 text-indigo-600" />
          </div>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Fonctionnalité à venir</h3>
          <p className="mt-1 text-gray-500">
            La gestion des paiements sera disponible prochainement.
          </p>
        </div>
      </ShopPage>
    </Layout>
  );
}