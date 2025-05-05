import Layout from '../../components/Layout';
import PurchasesPage from '../../components/PurchasesPage';
import HostingList from '../../components/hosting/HostingList';

export default function Hosting() {

  return (
    <Layout title="Mes formules souscrites">
      <PurchasesPage>
        <HostingList />
      </PurchasesPage>
    </Layout>
  );
}