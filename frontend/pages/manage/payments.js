// pages/purchases/payments.js
import Layout from '../../components/Layout';
import PurchasesPage from '../../components/PurchasesPage';
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { ArrowPathIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // État pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);

  const perPageOptions = [5, 10, 20, 50];

  useEffect(() => {
    if (!user) return;
    fetchPayments();
  }, [user, currentPage, perPage]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/user/payments`, {
        params: {
          page: currentPage,
          per_page: perPage
        }
      });
      setPayments(response.data.data);
      setTotalPages(response.data.meta.last_page || 1);
      setTotalItems(response.data.meta.total || 0);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des paiements');
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const handlePerPageChange = (e) => {
    const newPerPage = Number(e.target.value);
    setPerPage(newPerPage);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const Pagination = () => {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Éléments par page:</span>
          <select
            value={perPage}
            onChange={handlePerPageChange}
            className="rounded-md border-gray-300 py-1 pl-2 pr-8 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            {perPageOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>
            {(currentPage - 1) * perPage + 1} - {Math.min(currentPage * perPage, totalItems)} sur {totalItems}
          </span>
        </div>
        
        <div className="flex gap-1">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`w-10 h-10 rounded-md text-sm font-medium ${currentPage === pageNum ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-md ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <Layout title="Mes Paiements">
      <PurchasesPage>
        <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Historique des paiements</h1>
              <p className="mt-1 text-sm text-gray-500">
                Consultez l'ensemble de vos transactions
              </p>
            </div>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ArrowPathIcon className="h-12 w-12 text-indigo-600 animate-spin" />
              <p className="mt-4 text-lg font-medium text-gray-900">Chargement en cours</p>
              <p className="mt-1 text-sm text-gray-500">Veuillez patienter...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ExclamationCircleIcon className="h-12 w-12 text-red-500" />
              <p className="mt-4 text-lg font-medium text-gray-900">Une erreur est survenue</p>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
              <button
                onClick={fetchPayments}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Réessayer
              </button>
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-4 text-lg font-medium text-gray-900">Aucun paiement trouvé</p>
              <p className="mt-1 text-sm text-gray-500">Vous n'avez effectué aucun paiement pour le moment.</p>
            </div>
          ) : (
            <>
              <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Référence
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Montant
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Méthode
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {payment.payment_reference || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {formatAmount(payment.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              {payment.method === 'card' ? (
                                <>
                                  <svg className="h-5 w-5 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                                  </svg>
                                  Carte
                                </>
                              ) : payment.method === 'bank_transfer' ? (
                                <>
                                  <svg className="h-5 w-5 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 4a1 1 0 00-1 1v1h14V5a1 1 0 00-1-1H5zM4 8h16v7a2 2 0 01-2 2H6a2 2 0 01-2-2V8zm6 3a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
                                  </svg>
                                  Virement
                                </>
                              ) : payment.method === 'paypal' ? (
                                <>
                                  <svg className="h-5 w-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 00-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 00-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 00.554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 01.923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" />
                                  </svg>
                                  PayPal
                                </>
                              ) : payment.method === 'stripe' ? (
                                <>
                                  <svg className="h-5 w-5 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 3.508 5.487 6.687 6.374 2.531.755 3.243 1.278 3.243 2.146 0 .928-.881 1.418-2.358 1.418-1.537 0-3.868-.415-5.693-1.277l-.9 5.555c1.699.789 4.276 1.516 7.303 1.516 2.482 0 4.829-.624 6.36-1.862 1.545-1.239 2.279-3.091 2.279-5.285-.009-4.911-3.843-5.59-7.19-6.402z" />
                                  </svg>
                                  Stripe
                                </>
                              ) : (
                                'Autre'
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.payment_type === 'initial' ? 'Initial' : 
                             payment.payment_type === 'recurring' ? 'Récurrent' : 
                             payment.payment_type === 'renewal' ? 'Renouvellement' : 'Autre'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(payment.payment_date)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination />
              </div>
            </>
          )}
        </div>
      </PurchasesPage>
    </Layout>
  );
}