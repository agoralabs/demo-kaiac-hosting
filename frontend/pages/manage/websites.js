import Layout from '../../components/Layout';
import PurchasesPage from '../../components/PurchasesPage';
import HostingTable from '../../components/hosting/HostingTable';

export default function Hosting() {
  return (
    <Layout title="Mes Hébergements de sites WordPress">
      <PurchasesPage>
        <HostingTable />
      </PurchasesPage>
    </Layout>
  );
}