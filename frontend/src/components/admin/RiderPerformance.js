import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

function RiderPerformance() {
  const { user } = useAuth();
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('efficiency');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRider, setSelectedRider] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [performanceData, setPerformanceData] = useState(null);

  useEffect(() => {
    fetchRiderPerformance();
  }, []);

  const fetchRiderPerformance = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/admin/rider-performance');
      setRiders(response.data);
    } catch (error) {
      console.error('Error fetching rider performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRiderDetails = async (riderId) => {
    try {
      const response = await axios.get(`http://localhost:8000/admin/rider-performance/${riderId}`);
      setPerformanceData(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching rider details:', error);
    }
  };

  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 90) return 'text-green-600 bg-green-100';
    if (efficiency >= 80) return 'text-blue-600 bg-blue-100';
    if (efficiency >= 70) return 'text-yellow-600 bg-yellow-100';
    if (efficiency >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getEfficiencyBadge = (efficiency) => {
    if (efficiency >= 90) return '🏆 Elite';
    if (efficiency >= 80) return '⭐ Excellent';
    if (efficiency >= 70) return '👍 Good';
    if (efficiency >= 60) return '⚠️ Fair';
    return '❌ Poor';
  };

  const getDistanceColor = (distance) => {
    if (distance >= 100) return 'text-blue-600 bg-blue-100';
    if (distance >= 50) return 'text-green-600 bg-green-100';
    if (distance >= 25) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const sortedRiders = [...riders].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'efficiency':
        aValue = a.efficiency?.efficiency_percentage || 0;
        bValue = b.efficiency?.efficiency_percentage || 0;
        break;
      case 'deliveries':
        aValue = a.efficiency?.accepted_orders || 0;
        bValue = b.efficiency?.accepted_orders || 0;
        break;
      case 'points':
        aValue = a.efficiency?.total_points || 0;
        bValue = b.efficiency?.total_points || 0;
        break;
      case 'distance':
        aValue = a.performance?.total_distance_km || 0;
        bValue = b.performance?.total_distance_km || 0;
        break;
      default:
        aValue = a.efficiency?.efficiency_percentage || 0;
        bValue = b.efficiency?.efficiency_percentage || 0;
    }
    
    if (sortOrder === 'asc') {
      return aValue - bValue;
    }
    return bValue - aValue;
  });

  const filteredRiders = sortedRiders.filter(rider =>
    rider.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rider.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rider.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Rider Performance Monitoring</h2>
        <button
          onClick={fetchRiderPerformance}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
        >
          Refresh Data
        </button>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Total Riders</div>
          <div className="text-2xl font-bold text-gray-900">{riders.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Elite Performers</div>
          <div className="text-2xl font-bold text-green-600">
            {riders.filter(r => (r.efficiency?.efficiency_percentage || 0) >= 90).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Average Efficiency</div>
          <div className="text-2xl font-bold text-blue-600">
            {Math.round(riders.reduce((acc, r) => acc + (r.efficiency?.efficiency_percentage || 0), 0) / Math.max(riders.length, 1))}%
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Total Deliveries</div>
          <div className="text-2xl font-bold text-purple-600">
            {riders.reduce((acc, r) => acc + (r.efficiency?.accepted_orders || 0), 0)}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="efficiency">Efficiency Score</option>
              <option value="deliveries">Total Deliveries</option>
              <option value="points">Total Points</option>
              <option value="distance">Distance Traveled</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">Highest First</option>
              <option value="asc">Lowest First</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Riders</label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Performance Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Efficiency Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deliveries
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Distance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRiders.map((rider) => (
                <tr key={rider._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {rider.first_name?.charAt(0)}{rider.last_name?.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {rider.first_name} {rider.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{rider.email}</div>
                        <div className="text-xs text-gray-400">
                          Joined: {new Date(rider.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEfficiencyColor(rider.efficiency?.efficiency_percentage || 0)}`}>
                        {rider.efficiency?.efficiency_percentage || 0}%
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        {getEfficiencyBadge(rider.efficiency?.efficiency_percentage || 0)}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="text-center">
                      <div className="font-medium">{rider.efficiency?.accepted_orders || 0}</div>
                      <div className="text-xs text-gray-500">
                        {rider.efficiency?.rejected_orders || 0} rejected
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="text-center">
                      <div className="font-medium">{rider.efficiency?.total_points || 0}</div>
                      <div className="text-xs text-gray-500">
                        {rider.efficiency?.bonus_eligible ? '🎯 Bonus Eligible' : 'No Bonus'}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="text-center">
                      <div className={`font-medium ${getDistanceColor(rider.performance?.total_distance_km || 0)}`}>
                        {rider.performance?.total_distance_km || 0} km
                      </div>
                      <div className="text-xs text-gray-500">
                        Avg: {rider.performance?.average_distance_per_delivery || 0} km
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        rider.is_active ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-sm text-gray-900">
                        {rider.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 text-sm font-medium">
                    <button
                      onClick={() => fetchRiderDetails(rider._id)}
                      className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Details Modal */}
      {showDetailsModal && performanceData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Performance Details - {performanceData.rider.first_name} {performanceData.rider.last_name}
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Efficiency Metrics */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Efficiency Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Efficiency Score:</span>
                      <span className="font-medium">{performanceData.efficiency?.efficiency_percentage || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Points:</span>
                      <span className="font-medium">{performanceData.efficiency?.total_points || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Accepted Orders:</span>
                      <span className="font-medium">{performanceData.efficiency?.accepted_orders || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Rejected Orders:</span>
                      <span className="font-medium">{performanceData.efficiency?.rejected_orders || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Bonus Eligible:</span>
                      <span className="font-medium">{performanceData.efficiency?.bonus_eligible ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
                
                {/* Performance Metrics */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Performance Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Distance:</span>
                      <span className="font-medium">{performanceData.performance?.total_distance_km || 0} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Average per Delivery:</span>
                      <span className="font-medium">{performanceData.performance?.average_distance_per_delivery || 0} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Earnings:</span>
                      <span className="font-medium">£{performanceData.performance?.total_earnings || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Bonus Earned:</span>
                      <span className="font-medium">£{performanceData.performance?.total_bonus || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Active Hours:</span>
                      <span className="font-medium">{performanceData.performance?.total_active_hours || 0} hrs</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Recent Activity */}
              {performanceData.recent_activity && performanceData.recent_activity.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Recent Activity</h4>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-48 overflow-y-auto">
                    <div className="space-y-2">
                      {performanceData.recent_activity.map((activity, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">{activity.action}</span>
                          <span className="text-gray-900">{new Date(activity.timestamp).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RiderPerformance;
