import { useState, useEffect } from 'react';

export default function DomainRegistrationForm({ domain, price, onRegister }) {

  const [duration, setDuration] = useState(1);

  const handleSubmit = (e) => {
    e.preventDefault();
    onRegister(domain, duration);
  };

  const [totalPrice, setTotalPrice] = useState(0);

  // Calcul du prix total quand la durée change
  useEffect(() => {
    if (price) {
      setTotalPrice(price * duration);
    }
  }, [duration, price]);

  return (
    <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Enregistrement du domaine: <span className="text-indigo-600">{domain}</span>
      </h2>

      {/* Ajout de l'affichage du prix */}
      {price && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">Prix pour {duration} an(s):</span>
            <span className="text-2xl font-bold text-indigo-600">
              {totalPrice.toFixed(2)} €
            </span>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {price.toFixed(2)} € par an
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Section Durée d'enregistrement */}
        <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
            Options d'enregistrement
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                Durée d'enregistrement *
                </label>
                <select
                id="duration"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                >
                <option value="1">1 an - {price?.toFixed(2)} €</option>
                <option value="2">2 ans - {(price * 2)?.toFixed(2)} €</option>
                <option value="3">3 ans - {(price * 3)?.toFixed(2)} €</option>
                <option value="5">5 ans - {(price * 5)?.toFixed(2)} €</option>
                <option value="10">10 ans - {(price * 10)?.toFixed(2)} €</option>
                </select>
            </div>
            </div>
        </div>

        {/* Bouton de soumission */}
        <div className="pt-4">
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Enregistrer le domaine
          </button>
        </div>
      </form>
    </div>
  );
}