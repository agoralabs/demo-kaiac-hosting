import Link from 'next/link';
import { useState } from 'react';
import PaymentModal from './PaymentModal';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
// Composant Table Cell (Td)
const Td = ({ children, className = '' }) => (
  <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${className}`}>
    {children}
  </td>
);

// Composant Badge de statut
const StatusBadge = ({ status }) => {
  const statusClasses = {
    paid: 'bg-green-100 text-green-800',
    issued: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
    draft: 'bg-gray-100 text-gray-800',
    overdue: 'bg-red-100 text-red-800'
  };

  const statusText = {
    paid: 'Payée',
    issued: 'Émise',
    cancelled: 'Annulée',
    draft: 'Brouillon',
    overdue: 'En retard'
  };

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status]}`}>
      {statusText[status]}
    </span>
  );
};




// Composant principal InvoicesTable
export default function InvoicesTable({ invoices = [], minimalView = false }) {

    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    const handlePayClick = (invoice) => {
        setSelectedInvoice(invoice);
        setIsPaymentModalOpen(true);
      };

    // Composant Actions
    const Actions = ({ invoice }) => (
        <div className="flex space-x-2">
            <a
            href={invoice.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-900"
            >
            Afficher
            </a>
        
            {invoice.status === 'issued' && (
            <button
                onClick={() => handlePayClick(invoice)}
                className="text-green-600 hover:text-green-900"
            >
                Payer
            </button>
            )}
        </div>
    );
  return (
    <div className="overflow-x-auto">
      {/* Modal de paiement */}
      <Elements stripe={stripePromise}>
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        invoice={selectedInvoice}
      />
    </Elements>

    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <Th>Numéro</Th>
          {!minimalView && <Th>Date</Th>}
          <Th>Montant</Th>
          <Th>Date émission</Th>
          <Th>Abonnement</Th>
          <Th>Statut</Th>
          <Th>Actions</Th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {invoices.map((invoice) => (
          <tr key={invoice.id} className="hover:bg-gray-50">
            <Td className="font-medium text-gray-900">{invoice.invoice_number}</Td>
            {!minimalView && <Td>{new Date(invoice.issue_date).toLocaleDateString('fr-FR')}</Td>}
            <Td>{invoice.amount} {invoice.currency}</Td>
            <Td>{invoice.issued_at}</Td>
            <Td>{invoice.Subscription.reference}</Td>
            <Td><StatusBadge status={invoice.status} /></Td>
            <Td><Actions invoice={invoice} /></Td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}

// Composant Table Header (Th)
const Th = ({ children }) => (
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
    {children}
  </th>
);