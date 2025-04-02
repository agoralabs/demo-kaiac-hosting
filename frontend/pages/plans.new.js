import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function Plans() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    console.log('Token:', token);
    if (!token) {
      router.push('/login');
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const plans = [
    {
      id: 'basic',
      name: 'BASIC',
      price: '9.99',
      features: ['1 WordPress Site', '10GB Storage', 'Basic Support']
    },
    {
      id: 'standard',
      name: 'STANDARD',
      price: '19.99',
      features: ['3 WordPress Sites', '30GB Storage', 'Priority Support']
    },
    {
      id: 'premium',
      name: 'PREMIUM',
      price: '39.99',
      features: ['10 WordPress Sites', '100GB Storage', '24/7 Premium Support']
    }
  ];

  const handleSubscription = async (planId) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: order } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`, { planId });
      const stripe = await stripePromise;
      
      const { error } = await stripe.redirectToCheckout({
        sessionId: order.sessionId
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-6xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 mb-8 animate-gradient-x">
          Choose Your Perfect Plan
        </h1>
        
        {error && (
          <div className="max-w-md mx-auto mb-8 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="mt-16 grid grid-cols-1 gap-y-8 sm:gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className="relative bg-white rounded-2xl shadow-xl p-8 flex flex-col hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              {plan.name === 'STANDARD' && (
                <div className="absolute top-0 right-6 transform -translate-y-1/2">
                  <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
                    Popular
                  </span>
                </div>
              )}
              <h2 className="text-2xl font-bold text-center mb-4">{plan.name}</h2>
              <p className="text-4xl font-bold text-center mb-6">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">${plan.price}</span>
                <span className="text-lg font-normal text-gray-500">/month</span>
              </p>
              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-600">
                    <svg className="h-5 w-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => handleSubscription(plan.id)}
                disabled={loading}
                className="w-full py-3 px-4 border border-transparent rounded-lg text-base font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 shadow-lg"
              >
                {loading ? 'Processing...' : 'Subscribe Now'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}