import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useRouter } from 'next/router';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../hooks/useAuth';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function Plans() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { isLoggedIn, user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      console.log('Auth state updated:', { isLoggedIn });
      if (!isLoggedIn) {
        console.log('Redirecting to login...');
        router.push('/login');
      }
    }
  }, [isLoading, isLoggedIn, router]);

  const plans = [
    {
      name: 'Basic Plan',
      price: '9.99',
      features: ['Feature 1', 'Feature 2', 'Feature 3'],
    },
    {
      name: 'Pro Plan',
      price: '19.99',
      features: ['All Basic Features', 'Feature 4', 'Feature 5', 'Feature 6'],
    },
    {
      name: 'Enterprise Plan',
      price: '29.99',
      features: [
        'All Pro Features',
        'Feature 7',
        'Feature 8',
        'Feature 9',
        'Priority Support',
      ],
    },
  ];

  const handleSubscription = async (planId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/api/subscriptions', { planId });
      const stripe = await stripePromise;
      
      const { error } = await stripe.redirectToCheckout({
        sessionId: response.data.sessionId,
      });
      
      if (error) {
        console.error('Stripe error:', error);
        setError(error.message);
      }
    } catch (err) {
      console.error('Subscription error:', err);
      setError(err.message || 'Failed to process subscription');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4" />
          <p>Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  // Show message while redirecting if not logged in
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <p className="text-lg text-gray-600">Please log in to view subscription plans</p>
            <p className="text-sm text-gray-500 mt-2">Redirecting to login page...</p>
          </div>
          <button 
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Subscription Plans
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Choose the plan that best suits your needs
          </p>
          {user && (
            <p className="mt-2 text-sm text-gray-600">
              Logged in as: {user.email}
            </p>
          )}
        </div>

        {error && (
          <div className="mt-8 text-center text-red-600 bg-red-50 p-4 rounded-md">
            {error}
          </div>
        )}

        <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className="bg-white rounded-lg shadow-lg overflow-hidden"
            >
              <div className="px-6 py-8">
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <p className="mt-4 text-4xl font-extrabold text-gray-900">
                  ${plan.price}
                  <span className="text-base font-medium text-gray-500">/month</span>
                </p>
                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-6 w-6 text-green-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <p className="ml-3 text-base text-gray-700">{feature}</p>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscription(index + 1)}
                  disabled={loading}
                  className="mt-8 block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Subscribe Now'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}