import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Statistics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:8000/admin/statistics');
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching statistics:', error);
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

  if (!stats) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Unable to load statistics.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">System Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-blue-600">Total Riders</div>
          <div className="text-2xl font-bold text-blue-900">{stats.total_riders}</div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-sm font-medium text-green-600">Active Riders</div>
          <div className="text-2xl font-bold text-green-900">{stats.active_riders}</div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="text-sm font-medium text-purple-600">Today's Deliveries</div>
          <div className="text-2xl font-bold text-purple-900">{stats.total_deliveries_today}</div>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="text-sm font-medium text-orange-600">Today's Earnings</div>
          <div className="text-2xl font-bold text-orange-900">£{stats.total_earnings_today}</div>
        </div>
      </div>
      
      <div className="mt-8">
        <h3 className="text-md font-medium text-gray-900 mb-4">Performance Metrics</h3>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {Math.round((stats.active_riders / stats.total_riders) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Rider Activity Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                £{Math.round(stats.total_earnings_today / Math.max(stats.total_deliveries_today, 1) * 100) / 100}
              </div>
              <div className="text-sm text-gray-600">Average per Delivery</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(stats.total_deliveries_today / Math.max(stats.active_riders, 1) * 10) / 10}
              </div>
              <div className="text-sm text-gray-600">Deliveries per Active Rider</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Statistics;
