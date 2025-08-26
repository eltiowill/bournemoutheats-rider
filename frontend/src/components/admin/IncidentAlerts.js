import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

function IncidentAlerts() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [resolutionData, setResolutionData] = useState({
    action: '',
    notes: '',
    compensation: ''
  });
  const [resolutionLoading, setResolutionLoading] = useState(false);

  useEffect(() => {
    fetchIncidents();
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchIncidents, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/admin/incident-alerts');
      setIncidents(response.data);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveIncident = async () => {
    if (!selectedIncident || !resolutionData.action) return;

    try {
      setResolutionLoading(true);
      await axios.post(`http://localhost:8000/admin/resolve-incident/${selectedIncident._id}`, {
        action: resolutionData.action,
        notes: resolutionData.notes,
        compensation: resolutionData.compensation ? parseFloat(resolutionData.compensation) : 0,
        resolved_by: user._id,
        resolved_at: new Date().toISOString()
      });
      
      // Refresh incidents
      await fetchIncidents();
      setShowResolutionModal(false);
      setSelectedIncident(null);
      setResolutionData({ action: '', notes: '', compensation: '' });
      
    } catch (error) {
      console.error('Error resolving incident:', error);
      alert('Failed to resolve incident. Please try again.');
    } finally {
      setResolutionLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'late_order': return '⏰';
      case 'cancellation': return '❌';
      case 'rider_issue': return '🚴';
      case 'customer_complaint': return '😤';
      case 'system_error': return '💻';
      case 'payment_issue': return '💳';
      default: return '⚠️';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'late_order': return 'Late Order';
      case 'cancellation': return 'Order Cancellation';
      case 'rider_issue': return 'Rider Issue';
      case 'customer_complaint': return 'Customer Complaint';
      case 'system_error': return 'System Error';
      case 'payment_issue': return 'Payment Issue';
      default: return 'Unknown';
    }
  };

  const calculateTimeElapsed = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMins % 60}m ago`;
    }
    return `${diffMins}m ago`;
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesSeverity = selectedSeverity === 'all' || incident.severity === selectedSeverity;
    const matchesType = selectedType === 'all' || incident.type === selectedType;
    return matchesSeverity && matchesType;
  });

  const criticalIncidents = incidents.filter(i => i.severity === 'critical' && i.status === 'open');
  const highPriorityIncidents = incidents.filter(i => i.severity === 'high' && i.status === 'open');

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
        <h2 className="text-lg font-medium text-gray-900">Incident Alerts & Monitoring</h2>
        <button
          onClick={fetchIncidents}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
        >
          Refresh Alerts
        </button>
      </div>

      {/* Critical Alerts Banner */}
      {criticalIncidents.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {criticalIncidents.length} Critical Incident{criticalIncidents.length !== 1 ? 's' : ''} Require{criticalIncidents.length !== 1 ? '' : 's'} Immediate Attention
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>These incidents need immediate resolution to prevent customer dissatisfaction and potential revenue loss.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Incident Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Total Incidents</div>
          <div className="text-2xl font-bold text-gray-900">{incidents.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Open Incidents</div>
          <div className="text-2xl font-bold text-red-600">
            {incidents.filter(i => i.status === 'open').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Critical Priority</div>
          <div className="text-2xl font-bold text-red-600">{criticalIncidents.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-500">High Priority</div>
          <div className="text-2xl font-bold text-orange-600">{highPriorityIncidents.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Severity Filter</label>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Type Filter</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="late_order">Late Orders</option>
              <option value="cancellation">Cancellations</option>
              <option value="rider_issue">Rider Issues</option>
              <option value="customer_complaint">Customer Complaints</option>
              <option value="system_error">System Errors</option>
              <option value="payment_issue">Payment Issues</option>
            </select>
          </div>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Incident
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Elapsed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Affected Parties
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredIncidents.map((incident) => (
                <tr key={incident._id} className={`hover:bg-gray-50 ${
                  incident.severity === 'critical' ? 'bg-red-50' : 
                  incident.severity === 'high' ? 'bg-orange-50' : ''
                }`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-lg">{getTypeIcon(incident.type)}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {getTypeLabel(incident.type)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {incident.description}
                        </div>
                        {incident.order_id && (
                          <div className="text-xs text-gray-400">
                            Order: #{incident.order_id.slice(-6)}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(incident.severity)}`}>
                      {incident.severity}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      incident.status === 'open' 
                        ? 'bg-red-100 text-red-800 border-red-200' 
                        : 'bg-green-100 text-green-800 border-green-200'
                    }`}>
                      {incident.status === 'open' ? '🔴 Open' : '✅ Resolved'}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {calculateTimeElapsed(incident.created_at)}
                  </td>
                  
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>
                      {incident.rider && (
                        <div>Rider: {incident.rider.first_name} {incident.rider.last_name}</div>
                      )}
                      {incident.customer && (
                        <div>Customer: {incident.customer.email}</div>
                      )}
                      {incident.restaurant && (
                        <div>Restaurant: {incident.restaurant.name}</div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 text-sm font-medium">
                    {incident.status === 'open' && (
                      <button
                        onClick={() => {
                          setSelectedIncident(incident);
                          setShowResolutionModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md"
                      >
                        Resolve
                      </button>
                    )}
                    {incident.status === 'resolved' && (
                      <div className="text-sm text-gray-500">
                        <div>Resolved by: {incident.resolved_by?.first_name || 'Admin'}</div>
                        <div>{new Date(incident.resolved_at).toLocaleDateString()}</div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Modal */}
      {showResolutionModal && selectedIncident && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Resolve Incident - {getTypeLabel(selectedIncident.type)}
              </h3>
              
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Incident Details</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div><strong>Description:</strong> {selectedIncident.description}</div>
                  <div><strong>Severity:</strong> {selectedIncident.severity}</div>
                  <div><strong>Created:</strong> {new Date(selectedIncident.created_at).toLocaleString()}</div>
                  {selectedIncident.order_id && (
                    <div><strong>Order ID:</strong> {selectedIncident.order_id}</div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution Action
                </label>
                <select
                  value={resolutionData.action}
                  onChange={(e) => setResolutionData({...resolutionData, action: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select resolution action...</option>
                  <option value="compensated_customer">Compensated Customer</option>
                  <option value="reassigned_order">Reassigned Order</option>
                  <option value="refunded_payment">Refunded Payment</option>
                  <option value="contacted_rider">Contacted Rider</option>
                  <option value="system_fixed">System Issue Fixed</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution Notes
                </label>
                <textarea
                  value={resolutionData.notes}
                  onChange={(e) => setResolutionData({...resolutionData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Describe how the incident was resolved..."
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compensation Amount (£) - Optional
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={resolutionData.compensation}
                  onChange={(e) => setResolutionData({...resolutionData, compensation: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowResolutionModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolveIncident}
                  disabled={!resolutionData.action || resolutionLoading}
                  className={`px-4 py-2 rounded-md text-white ${
                    !resolutionData.action || resolutionLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {resolutionLoading ? 'Resolving...' : 'Resolve Incident'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IncidentAlerts;
