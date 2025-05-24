import { useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

const defaultPlans = [
  {
    id: '1',
    plan_type: 'hosting',
    name: 'BASIC',
    price_1_month: '7.99',
    price_12_months: '6.99',
    price_24_months: '5.99',
    currency: 'EUR',
    tax_rate: '0.20',
    features: ['25 WordPress Sites', '1 nom de domaine', '50 adresses mails', '10 GB SSD Storage', 'Automatic website migration', 'SSL', 'CDN', 'Weekly backups', 'Unlimited bandwidth', 'Basic Support']
  },
  {
    id: '2',
    plan_type: 'hosting',
    name: 'STANDARD',
    popular: true,
    price_1_month: '9.99',
    price_12_months: '8.99',
    price_24_months: '7.99',
    currency: 'EUR',
    tax_rate: '0.20',
    features: ['50 WordPress Sites', '2 noms de domaine', '100 adresses mails', '50 GB SSD Storage', 'Automatic website migration', 'SSL', 'CDN', 'Daily and on-demand backups', 'Unlimited bandwidth', 'Priority Support']
  },
  {
    id: '3',
    plan_type: 'hosting',
    name: 'PREMIUM',
    price_1_month: '12.99',
    price_12_months: '11.99',
    price_24_months: '10.99',
    currency: 'EUR',
    tax_rate: '0.20',
    features: ['100 WordPress Sites', '5 noms de domaine', '200 adresses mails', '100 GB SSD Storage', 'Automatic website migration', 'SSL', 'CDN', 'Daily and on-demand backups', 'Unlimited bandwidth', '24/7 Premium Support']
  }
];

export default function HostingPlans({ 
  title = "Nos formules d'hébergement",
  subtitle = "Choisissez la formule qui correspond le mieux à vos besoins",
  plans = defaultPlans,
  onSelectPlan,
  showBorder = false,
  loading = false,
  error = null,
  buttonText = "Souscrire maintenant",
  className = ""
}) {
  const [selectedDuration, setSelectedDuration] = useState('1'); // Par défaut 1 mois

  const getPriceForDuration = (plan, duration) => {
    switch(duration) {
      case '12':
        return plan.price_12_months;
      case '24':
        return plan.price_24_months;
      default:
        return plan.price_1_month;
    }
  };

  const getAllAmount = (plan, duration) => {
    const monthlyPrice = parseFloat(getPriceForDuration(plan, duration));
    const durationInMonths = parseInt(duration);
    const totalAmount = monthlyPrice * durationInMonths;
    const taxRate = parseFloat(plan.tax_rate);
    const totalAmountTax = totalAmount * taxRate;
    const totalAmountTTC = totalAmount + totalAmountTax;
    return {
      monthlyPrice: monthlyPrice.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      totalAmountTax: totalAmountTax.toFixed(2),
      totalAmountTTC: totalAmountTTC.toFixed(2),
      durationInMonths: durationInMonths,
      durationInYears: durationInMonths/12,
      taxRate: taxRate.toFixed(2)
    };
  };

  const getTotalPrice = (plan, duration) => {
    const allAmounts = getAllAmount(plan, duration);
    return allAmounts.totalAmountTTC;
  };

  const handlePlanSelection = (plan) => {
    if (onSelectPlan) {
      const allAmounts = getAllAmount(plan, selectedDuration);
      onSelectPlan({
        id: plan.id,
        name: plan.name,
        taxRate: plan.tax_rate,
        monthlyPrice: allAmounts.monthlyPrice,
        totalAmount: allAmounts.totalAmount,
        totalAmountTax: allAmounts.totalAmountTax,
        totalAmountTTC: allAmounts.totalAmountTTC,
        durationInMonths: allAmounts.durationInMonths,
        durationInYears: allAmounts.durationInYears,
        currency: plan.currency || 'EUR'
      });
    }
  };

  return (
    <div className={`${className} ${showBorder ? 'mt-16 pt-10 border-t border-gray-200' : ''}`}>
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          {title}
        </h2>
        <p className="mt-4 text-lg text-gray-500">
          {subtitle}
        </p>
      </div>

      {error && (
        <div className="mt-8 text-center text-red-600 bg-red-50 p-4 rounded-md">
          {error}
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            onClick={() => setSelectedDuration('1')}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${selectedDuration === '1' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            1 mois
          </button>
          <button
            onClick={() => setSelectedDuration('12')}
            className={`px-4 py-2 text-sm font-medium ${selectedDuration === '12' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            12 mois
          </button>
          <button
            onClick={() => setSelectedDuration('24')}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${selectedDuration === '24' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            24 mois
          </button>
        </div>
      </div>

      <div className="mt-12 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-8">
        {plans.map((plan) => (
          <div 
            key={plan.name} 
            className={`relative p-8 bg-white border rounded-2xl shadow-sm transform transition-all duration-300 hover:shadow-xl ${
              plan.popular ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-gray-200'
            }`}
          >
            {plan.popular && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 py-1.5 px-4 bg-indigo-500 rounded-full text-xs font-semibold uppercase tracking-wide text-white">
                Le plus populaire
              </div>
            )}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
              <div className="mt-4">
                <div className="flex items-baseline">
                  <span className="text-4xl font-extrabold text-gray-900">
                    {getPriceForDuration(plan, selectedDuration)} €
                  </span>
                  <span className="ml-1 text-xl font-medium text-gray-500">
                    /mois
                  </span>
                </div>
                {selectedDuration !== '1' && (
                  <p className="mt-2 text-sm text-gray-500">
                    Engagement de {selectedDuration} mois
                  </p>
                )}
                <p className="mt-1 text-sm font-semibold text-gray-700">
                  Total TTC : {getTotalPrice(plan, selectedDuration)} €
                </p>
              </div>
            </div>
            <ul className="space-y-3">
              {plan.features.map((feature, index) => (
                <li key={feature} className="flex items-start">
                  <div className="flex-shrink-0">
                    <CheckIcon className={`h-5 w-5 ${plan.popular ? 'text-indigo-600' : 'text-green-500'}`} />
                  </div>
                  <span className={`ml-3 text-sm ${index < 3 ? 'font-bold' : 'font-normal'} text-gray-700`}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handlePlanSelection(plan)}
              disabled={loading}
              className={`mt-8 w-full block py-3 px-6 border rounded-md text-center font-medium transition-colors ${
                plan.popular
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  : 'bg-white text-indigo-600 hover:bg-indigo-50 border-indigo-600 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              } disabled:opacity-50`}
            >
              {loading ? 'Chargement...' : buttonText}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
