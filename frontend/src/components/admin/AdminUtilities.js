import React, { useState } from 'react';
import axios from 'axios';

function AdminUtilities() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const generateSampleOrders = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await axios.post('http://localhost:8000/admin/generate-sample-orders');
      setMessage(`Successfully generated ${response.data.orders_created} sample orders!`);
      setMessageType('success');
    } catch (error) {
      setMessage(`Error generating sample orders: ${error.response?.data?.detail || error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const clearMessage = () => {
    setMessage('');
    setMessageType('');
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Admin Utilities</h2>
      
      {/* Message Display */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg border ${
          messageType === 'success' 
            ? 'border-green-200 bg-green-50 text-green-800' 
            : 'border-red-200 bg-red-50 text-red-800'
        }`}>
          <div className="flex justify-between items-center">
            <span>{message}</span>
            <button
              onClick={clearMessage}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Sample Data Generation */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sample Data Generation</h3>
        <p className="text-gray-600 mb-4">
          Generate sample orders to test the delivery system. This will create 10 test orders 
          that riders can see and accept/reject.
        </p>
        
        <button
          onClick={generateSampleOrders}
          disabled={loading}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
            loading
              ? 'bg-gray-400 cursor-not-allowed text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading ? 'Generating...' : 'Generate Sample Orders'}
        </button>
      </div>

      {/* System Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Environment:</span>
            <span className="ml-2 text-gray-600">Development</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">API Version:</span>
            <span className="ml-2 text-gray-600">1.0.0</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Database:</span>
            <span className="ml-2 text-gray-600">MongoDB</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">WebSocket:</span>
            <span className="ml-2 text-gray-600">Active</span>
          </div>
        </div>
      </div>

      {/* Testing Instructions */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-medium text-blue-900 mb-4">Testing Instructions</h3>
        <div className="text-blue-800 space-y-2">
          <p><strong>1. Generate Sample Orders:</strong> Use the button above to create test orders</p>
          <p><strong>2. Test Rider Flow:</strong> Log in as a rider to see delivery requests</p>
          <p><strong>3. Test Accept/Reject:</strong> Try accepting and rejecting orders within the timer</p>
          <p><strong>4. Monitor Efficiency:</strong> Check how efficiency scores change with actions</p>
          <p><strong>5. Test Notifications:</strong> Verify WebSocket notifications are working</p>
        </div>
      </div>
    </div>
  );
}

export default AdminUtilities;
