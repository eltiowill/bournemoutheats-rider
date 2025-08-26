import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Efficiency() {
  const [efficiency, setEfficiency] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEfficiency();
  }, []);

  const fetchEfficiency = async () => {
    try {
      const response = await axios.get('http://localhost:8000/rider/efficiency');
      setEfficiency(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching efficiency:', error);
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

  if (!efficiency) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Unable to load efficiency data.</p>
      </div>
    );
  }

  const getEfficiencyColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEfficiencyBarColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Efficiency & Points</h2>
      
      {/* Points Display */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white mb-6">
        <div className="text-center">
          <div className="text-4xl font-bold mb-2">{efficiency.total_points}</div>
          <div className="text-lg">Total Points</div>
        </div>
      </div>

      {/* Efficiency Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-green-600">{efficiency.accepted_orders}</div>
          <div className="text-sm text-gray-600">Accepted Orders</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-red-600">{efficiency.rejected_orders}</div>
          <div className="text-sm text-gray-600">Total Rejections</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-orange-600">{efficiency.penalized_rejections}</div>
          <div className="text-sm text-gray-600">Penalized Rejections</div>
        </div>
      </div>

      {/* Efficiency Percentage */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Efficiency Score</h3>
          <div className={`text-2xl font-bold ${getEfficiencyColor(efficiency.efficiency_percentage)}`}>
            {efficiency.efficiency_percentage.toFixed(1)}%
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div 
            className={`h-3 rounded-full ${getEfficiencyBarColor(efficiency.efficiency_percentage)} transition-all duration-500`}
            style={{ width: `${Math.min(efficiency.efficiency_percentage, 100)}%` }}
          ></div>
        </div>
        
        <div className="text-sm text-gray-600">
          {efficiency.efficiency_percentage >= 70 
            ? "Excellent! You're maintaining high efficiency."
            : "Keep accepting orders to improve your efficiency score."
          }
        </div>
      </div>

      {/* Bonus Status */}
      <div className={`p-4 rounded-lg border-2 ${
        efficiency.bonus_eligible 
          ? 'border-green-200 bg-green-50' 
          : 'border-gray-200 bg-gray-50'
      }`}>
        <div className="flex items-center">
          <div className={`w-4 h-4 rounded-full mr-3 ${
            efficiency.bonus_eligible ? 'bg-green-500' : 'bg-gray-400'
          }`}></div>
          <div>
            <div className={`font-medium ${
              efficiency.bonus_eligible ? 'text-green-800' : 'text-gray-600'
            }`}>
              {efficiency.bonus_eligible ? 'Bonus Eligible' : 'Bonus Not Available'}
            </div>
            <div className="text-sm text-gray-600">
              {efficiency.bonus_eligible 
                ? `You earn £${efficiency.bonus_amount_per_order} bonus per order for maintaining high efficiency!`
                : 'Maintain 70%+ efficiency to become bonus eligible.'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">💡 Tips to Improve Efficiency</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Accept orders promptly to maintain high acceptance rate</li>
          <li>• Wait for the 10-minute preparation window before rejecting orders</li>
          <li>• Complete deliveries on time to build positive reputation</li>
          <li>• Stay above 70% efficiency to earn bonus rewards</li>
        </ul>
      </div>
    </div>
  );
}

export default Efficiency;
