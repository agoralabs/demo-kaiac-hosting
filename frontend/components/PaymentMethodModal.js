// components/PaymentMethodModal.js
import { useState } from 'react';

export default function PaymentMethodModal({ 
  isOpen, 
  onClose, 
  onSelect,
  plan
}) {
  const [selectedMethod, setSelectedMethod] = useState('card');

  const methods = [
    { id: 'card', name: 'Carte bancaire', icon: '💳', available: true },
    { id: 'paypal', name: 'PayPal', icon: '🔵', available: false },
    { id: 'mobile_money', name: 'Mobile Money', icon: '📱', available: false }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Méthode de paiement</h3>
        
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-1">Montant TTC à régler</h4>
          <p>{plan.totalAmountTTC} €</p>
        </div>

        <div className="space-y-3 mb-6">
          {methods.map((method) => (
            <div 
              key={method.id}
              onClick={() => method.available && setSelectedMethod(method.id)}
              className={`p-4 border rounded-lg cursor-pointer ${selectedMethod === method.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} ${!method.available ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">{method.icon}</span>
                <div>
                  <p className="font-medium">{method.name}</p>
                  {!method.available && (
                    <p className="text-xs text-gray-500">Bientôt disponible</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Retour
          </button>
          <button
            onClick={() => onSelect(selectedMethod)}
            disabled={!methods.find(m => m.id === selectedMethod)?.available}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            Payer maintenant
          </button>
        </div>
      </div>
    </div>
  );
}