import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

function PaymentReports() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedRider, setSelectedRider] = useState('all');
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [bonusData, setBonusData] = useState({
    rider_id: '',
    amount: '',
    reason: '',
    type: 'performance'
  });
  const [bonusLoading, setBonusLoading] = useState(false);

  useEffect(() => {
    fetchPaymentData();
    fetchRiders();
  }, [selectedPeriod, selectedRider]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8000/admin/payment-reports?period=${selectedPeriod}&rider_id=${selectedRider}`);
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRiders = async () => {
    try {
      const response = await axios.get('http://localhost:8000/admin/riders');
      setRiders(response.data);
    } catch (error) {
      console.error('Error fetching riders:', error);
    }
  };

  const handleBonusSubmit = async () => {
    if (!bonusData.rider_id || !bonusData.amount || !bonusData.reason) return;

    try {
      setBonusLoading(true);
      await axios.post('http://localhost:8000/admin/award-bonus', {
        rider_id: bonusData.rider_id,
        amount: parseFloat(bonusData.amount),
        reason: bonusData.reason,
        type: bonusData.type
      });
      
      // Refresh data
      await fetchPaymentData();
      setShowBonusModal(false);
      setBonusData({ rider_id: '', amount: '', reason: '', type: 'performance' });
      
    } catch (error) {
      console.error('Error awarding bonus:', error);
      alert('Failed to award bonus. Please try again.');
    } finally {
      setBonusLoading(false);
    }
  };

  const getPeriodLabel = (period) => {
    switch (period) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'quarter': return 'This Quarter';
      case 'year': return 'This Year';
      default: return 'All Time';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getBonusTypeColor = (type) => {
    switch (type) {
      case 'performance': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'referral': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'special': return 'bg-pink-100 text-pink-800 border-pink-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calculateTotals = () => {
    const total = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const bonuses = payments.filter(p => p.type === 'bonus').reduce((sum, p) => sum + (p.amount || 0), 0);
    const basePayments = payments.filter(p => p.type === 'base').reduce((sum, p) => sum + (p.amount || 0), 0);
    
    return { total, bonuses, basePayments };
  };

  const totals = calculateTotals();

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
        <h2 className="text-lg font-medium text-gray-900">Payment Reports & Bonus Management</h2>
        <button
          onClick={() => setShowBonusModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
        >
          Award Bonus
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Total Payments</div>
          <div className="text-2xl font-bold text-gray-900">£{totals.total.toFixed(2)}</div>
          <div className="text-xs text-gray-500">{getPeriodLabel(selectedPeriod)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Base Payments</div>
          <div className="text-2xl font-bold text-blue-600">£{totals.basePayments.toFixed(2)}</div>
          <div className="text-xs text-gray-500">Delivery fees</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Bonuses Awarded</div>
          <div className="text-2xl font-bold text-green-600">£{totals.bonuses.toFixed(2)}</div>
          <div className="text-xs text-gray-500">Performance bonuses</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Active Riders</div>
          <div className="text-2xl font-bold text-purple-600">
            {riders.filter(r => r.is_active).length}
          </div>
          <div className="text-xs text-gray-500">Eligible for bonuses</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Rider Filter</label>
            <select
              value={selectedRider}
              onChange={(e) => setSelectedRider(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Riders</option>
              {riders.map((rider) => (
                <option key={rider._id} value={rider._id}>
                  {rider.first_name} {rider.last_name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Actions</label>
            <button
              onClick={fetchPaymentData}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* High Efficiency Riders */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">High Efficiency Riders</h3>
          <p className="text-sm text-gray-600">Riders eligible for performance bonuses (70%+ efficiency)</p>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {riders
              .filter(rider => (rider.efficiency?.efficiency_percentage || 0) >= 70)
              .sort((a, b) => (b.efficiency?.efficiency_percentage || 0) - (a.efficiency?.efficiency_percentage || 0))
              .map((rider) => (
                <div key={rider._id} className="bg-gray-50 p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-gray-900">
                      {rider.first_name} {rider.last_name}
                    </div>
                    <span className="text-sm text-green-600 font-medium">
                      {rider.efficiency?.efficiency_percentage || 0}%
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Deliveries: {rider.efficiency?.accepted_orders || 0}</div>
                    <div>Points: {rider.efficiency?.total_points || 0}</div>
                    <div>Bonus: £{rider.efficiency?.bonus_amount_per_order || 0}/order</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Payment Details Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Payment Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 text-sm font-medium">
                            {payment.rider?.first_name?.charAt(0)}{payment.rider?.last_name?.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.rider?.first_name} {payment.rider?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{payment.rider?.email}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBonusTypeColor(payment.type)}`}>
                      {payment.type === 'bonus' ? '🎁 Bonus' : '💰 Base Payment'}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="font-medium">£{payment.amount?.toFixed(2)}</div>
                    {payment.type === 'bonus' && (
                      <div className="text-xs text-gray-500">{payment.reason}</div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(payment.created_at).toLocaleDateString()}
                  </td>
                  
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {payment.delivery_count && (
                      <div>Deliveries: {payment.delivery_count}</div>
                    )}
                    {payment.efficiency && (
                      <div>Efficiency: {payment.efficiency}%</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bonus Award Modal */}
      {showBonusModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Award Bonus to Rider</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Rider
                </label>
                <select
                  value={bonusData.rider_id}
                  onChange={(e) => setBonusData({...bonusData, rider_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a rider...</option>
                  {riders
                    .filter(rider => rider.is_active)
                    .map((rider) => (
                      <option key={rider._id} value={rider._id}>
                        {rider.first_name} {rider.last_name} - {rider.efficiency?.efficiency_percentage || 0}% efficiency
                      </option>
                    ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bonus Amount (£)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={bonusData.amount}
                  onChange={(e) => setBonusData({...bonusData, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bonus Type
                </label>
                <select
                  value={bonusData.type}
                  onChange={(e) => setBonusData({...bonusData, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="performance">Performance Bonus</option>
                  <option value="referral">Referral Bonus</option>
                  <option value="special">Special Achievement</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <textarea
                  value={bonusData.reason}
                  onChange={(e) => setBonusData({...bonusData, reason: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Explain why this bonus is being awarded..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowBonusModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBonusSubmit}
                  disabled={!bonusData.rider_id || !bonusData.amount || !bonusData.reason || bonusLoading}
                  className={`px-4 py-2 rounded-md text-white ${
                    !bonusData.rider_id || !bonusData.amount || !bonusData.reason || bonusLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {bonusLoading ? 'Awarding...' : 'Award Bonus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentReports;
