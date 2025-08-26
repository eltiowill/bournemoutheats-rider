import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Earnings() {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const response = await axios.get('http://localhost:8000/rider/earnings');
      setEarnings(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching earnings:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (!earnings) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Unable to load earnings data.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Earnings Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-blue-600">Total Earnings</div>
          <div className="text-2xl font-bold text-blue-900">£{earnings.total_earnings}</div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-sm font-medium text-green-600">This Week</div>
          <div className="text-2xl font-bold text-green-900">£{earnings.this_week}</div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="text-sm font-medium text-purple-600">This Month</div>
          <div className="text-2xl font-bold text-purple-900">£{earnings.this_month}</div>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="text-sm font-medium text-orange-600">Deliveries</div>
          <div className="text-2xl font-bold text-orange-900">{earnings.deliveries_completed}</div>
        </div>
      </div>
      
      <div className="mt-8">
        <h3 className="text-md font-medium text-gray-900 mb-4">Performance Insights</h3>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                £{(earnings.total_earnings / Math.max(earnings.deliveries_completed, 1)).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Average per Delivery</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                £{(earnings.this_week / 7).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Daily Average (Week)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                £{(earnings.this_month / 30).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Daily Average (Month)</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2">Payment Information</h3>
        <p className="text-sm text-blue-700">
          Your earnings are calculated based on completed deliveries. Payments are processed weekly on Fridays.
          Keep delivering to increase your earnings!
        </p>
      </div>
    </div>
  );
}

export default Earnings;
