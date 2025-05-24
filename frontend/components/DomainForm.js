import { useState, useEffect } from 'react';

export default function DomainForm({ 
  domain, 
  price, 
  onRegister, 
  subscriptions,
  setSelectedSubscriptionId 
}) {

  const [duration, setDuration] = useState(1);

  const [totalPrice, setTotalPrice] = useState(0);
  const [formData, setFormData] = useState({
    subscription_id: '' // Sélection par défaut (subscriptions.length > 0 ? subscriptions[0].id : '')
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Calcul du prix total quand la durée change
  useEffect(() => {
    if (price) {
      setTotalPrice(price * duration);
    }

  }, [duration, price]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        onRegister(domain, duration);
    } catch (err) {
        console.error('Error searching domain:', err);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    setSelectedSubscriptionId(value);
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Enregistrement du domaine: <span className="text-indigo-600">{domain}</span>
      </h2>


      <form onSubmit={handleSubmit} className="space-y-6">

          {/* Nouveau champ pour sélectionner la souscription */}
          <div className="mb-4">
            <label htmlFor="subscription_id" className="block text-sm font-medium text-gray-700 mb-1">
              Souscription
            </label>
            <select
              id="subscription_id"
              name="subscription_id"
              value={formData.subscription_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
              disabled={isSubmitting || subscriptions.length === 0}
            >
              {subscriptions.length === 0 ? (
                <option value="">Aucune souscription disponible</option>
              ) : (
                <>
                <option value="">Sélectionnez une souscription</option>
                {subscriptions.map(sub => (
                  <option 
                    key={sub.id} 
                    value={sub.id}
                    disabled={sub.domains_count === sub.max_domains}
                  >
                    {sub.Plan?.name} (Domaines: {sub.domains_count}/{sub.max_domains})
                  </option>
                  
                ))}
                </>
              )}
            </select>
            {subscriptions.length === 0 && (
              <p className="mt-1 text-xs text-red-500">
                Vous n'avez aucune souscription active permettant de créer un domaine.
              </p>
            )}
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