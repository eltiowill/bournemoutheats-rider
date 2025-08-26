import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

function Phase5Features() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('google-maps');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // Google Maps state
  const [googleMapsStatus, setGoogleMapsStatus] = useState(null);
  const [highDemandZones, setHighDemandZones] = useState([]);
  const [routeRequest, setRouteRequest] = useState({
    origin_lat: 50.7192,
    origin_lng: -1.8808,
    destination_lat: 50.7200,
    destination_lng: -1.8750,
    mode: 'driving'
  });
  const [routeResult, setRouteResult] = useState(null);

  // Notification service state
  const [notificationStatus, setNotificationStatus] = useState(null);
  const [testEmail, setTestEmail] = useState('');
  const [testSMS, setTestSMS] = useState('');

  // BournemouthEats API state
  const [apiStatus, setApiStatus] = useState(null);
  const [importStats, setImportStats] = useState(null);
  const [importSettings, setImportSettings] = useState({
    auto_import_enabled: false,
    import_interval_minutes: 5,
    max_orders_per_import: 50
  });

  // WebSocket service state
  const [websocketStatus, setWebsocketStatus] = useState(null);

  useEffect(() => {
    fetchAllStatuses();
  }, []);

  const fetchAllStatuses = async () => {
    try {
      setLoading(true);
      
      // Fetch Google Maps status
      const mapsResponse = await axios.get('http://localhost:8000/admin/google-maps/status');
      setGoogleMapsStatus(mapsResponse.data);
      
      // Fetch high demand zones
      const zonesResponse = await axios.get('http://localhost:8000/admin/google-maps/high-demand-zones');
      setHighDemandZones(zonesResponse.data.zones);
      
      // Fetch notification service status
      const notificationResponse = await axios.get('http://localhost:8000/admin/notification-service/status');
      setNotificationStatus(notificationResponse.data);
      
      // Fetch API status
      const apiResponse = await axios.get('http://localhost:8000/admin/bournemoutheats-api/status');
      setApiStatus(apiResponse.data);
      
      // Fetch import stats
      const statsResponse = await axios.get('http://localhost:8000/admin/bournemoutheats-api/import-stats');
      setImportStats(statsResponse.data);
      
      // Fetch WebSocket status
      const websocketResponse = await axios.get('http://localhost:8000/admin/websocket-service/status');
      setWebsocketStatus(websocketResponse.data);
      
    } catch (error) {
      console.error('Error fetching statuses:', error);
      setMessage('Error fetching service statuses');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateRoute = async () => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:8000/admin/google-maps/calculate-route', routeRequest);
      setRouteResult(response.data);
      setMessage('Route calculated successfully!');
      setMessageType('success');
    } catch (error) {
      setMessage(`Error calculating route: ${error.response?.data?.detail || error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:8000/admin/notification-service/test-email', {
        to_email: testEmail
      });
      
      if (response.data.success) {
        setMessage('Test email sent successfully!');
        setMessageType('success');
      } else {
        setMessage(`Email failed: ${response.data.error}`);
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`Error sending test email: ${error.response?.data?.detail || error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleTestSMS = async () => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:8000/admin/notification-service/test-sms', {
        to_number: testSMS
      });
      
      if (response.data.success) {
        setMessage('Test SMS sent successfully!');
        setMessageType('success');
      } else {
        setMessage(`SMS failed: ${response.data.error}`);
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`Error sending test SMS: ${error.response?.data?.detail || error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleImportOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:8000/admin/bournemoutheats-api/import-orders');
      
      if (response.data.success) {
        setMessage(`Successfully imported ${response.data.imported_count} orders!`);
        setMessageType('success');
        // Refresh import stats
        const statsResponse = await axios.get('http://localhost:8000/admin/bournemoutheats-api/import-stats');
        setImportStats(statsResponse.data);
      } else {
        setMessage(`Import failed: ${response.data.error}`);
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`Error importing orders: ${error.response?.data?.detail || error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateApiSettings = async () => {
    try {
      setLoading(true);
      await axios.put('http://localhost:8000/admin/bournemoutheats-api/settings', importSettings);
      setMessage('API settings updated successfully!');
      setMessageType('success');
    } catch (error) {
      setMessage(`Error updating API settings: ${error.response?.data?.detail || error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const clearMessage = () => {
    setMessage('');
    setMessageType('');
  };

  const tabs = [
    { id: 'google-maps', name: 'Google Maps' },
    { id: 'notifications', name: 'Notifications' },
    { id: 'api-integration', name: 'API Integration' },
    { id: 'websocket', name: 'WebSocket' }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Phase 5 - Advanced Features</h2>
        <div className="text-sm text-gray-500">
          Real-time communication & external integrations
        </div>
      </div>

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

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white shadow rounded-lg">
        {/* Google Maps Tab */}
        {activeTab === 'google-maps' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Google Maps Integration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Service Status */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Service Status</h4>
                
                {googleMapsStatus && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className="font-medium text-blue-900">{googleMapsStatus.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bournemouth Center:</span>
                        <span className="font-medium text-blue-900">
                          {googleMapsStatus.bournemouth_center[0].toFixed(4)}, {googleMapsStatus.bournemouth_center[1].toFixed(4)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>High Demand Zones:</span>
                        <span className="font-medium text-blue-900">{googleMapsStatus.high_demand_zones_count}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* High Demand Zones */}
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">High Demand Zones</h5>
                  <div className="space-y-2">
                    {highDemandZones.map((zone, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm">
                          <div className="font-medium">{zone.name}</div>
                          <div className="text-gray-600">
                            Demand: {zone.demand_level} | 
                            Peak: {zone.is_peak_hour ? 'Yes' : 'No'} | 
                            Wait: {zone.estimated_wait_time}min
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Route Calculator */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Route Calculator</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        step="0.0001"
                        placeholder="Latitude"
                        value={routeRequest.origin_lat}
                        onChange={(e) => setRouteRequest({
                          ...routeRequest,
                          origin_lat: parseFloat(e.target.value)
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        step="0.0001"
                        placeholder="Longitude"
                        value={routeRequest.origin_lng}
                        onChange={(e) => setRouteRequest({
                          ...routeRequest,
                          origin_lng: parseFloat(e.target.value)
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        step="0.0001"
                        placeholder="Latitude"
                        value={routeRequest.destination_lat}
                        onChange={(e) => setRouteRequest({
                          ...routeRequest,
                          destination_lat: parseFloat(e.target.value)
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        step="0.0001"
                        placeholder="Longitude"
                        value={routeRequest.destination_lng}
                        onChange={(e) => setRouteRequest({
                          ...routeRequest,
                          destination_lng: parseFloat(e.target.value)
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Travel Mode</label>
                    <select
                      value={routeRequest.mode}
                      onChange={(e) => setRouteRequest({
                        ...routeRequest,
                        mode: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="driving">Driving</option>
                      <option value="walking">Walking</option>
                      <option value="bicycling">Bicycling</option>
                      <option value="transit">Transit</option>
                    </select>
                  </div>

                  <button
                    onClick={handleCalculateRoute}
                    disabled={loading}
                    className={`w-full px-4 py-2 rounded-md text-white font-medium ${
                      loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {loading ? 'Calculating...' : 'Calculate Route'}
                  </button>
                </div>

                {/* Route Results */}
                {routeResult && !routeResult.error && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h5 className="font-medium text-green-900 mb-2">Route Results</h5>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Distance:</span>
                        <span className="font-medium">{routeResult.distance_text}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span className="font-medium">{routeResult.duration_text}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Start:</span>
                        <span className="font-medium">{routeResult.start_address}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>End:</span>
                        <span className="font-medium">{routeResult.end_address}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Services</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Service Status */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Service Status</h4>
                
                {notificationStatus && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span>SendGrid:</span>
                        <span className={`font-medium ${
                          notificationStatus.sendgrid_configured ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {notificationStatus.sendgrid_configured ? 'Configured' : 'Not Configured'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Twilio:</span>
                        <span className={`font-medium ${
                          notificationStatus.twilio_configured ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {notificationStatus.twilio_configured ? 'Configured' : 'Not Configured'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Test Email */}
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Test Email</h5>
                  <div className="space-y-2">
                    <input
                      type="email"
                      placeholder="Enter email address"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleTestEmail}
                      disabled={loading || !testEmail}
                      className={`w-full px-3 py-2 rounded-md text-white font-medium ${
                        loading || !testEmail
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {loading ? 'Sending...' : 'Send Test Email'}
                    </button>
                  </div>
                </div>

                {/* Test SMS */}
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Test SMS</h5>
                  <div className="space-y-2">
                    <input
                      type="tel"
                      placeholder="Enter phone number (+44...)"
                      value={testSMS}
                      onChange={(e) => setTestSMS(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleTestSMS}
                      disabled={loading || !testSMS}
                      className={`w-full px-3 py-2 rounded-md text-white font-medium ${
                        loading || !testSMS
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {loading ? 'Sending...' : 'Send Test SMS'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Configuration Info */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Configuration</h4>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm space-y-2">
                    <p>To configure notification services, set these environment variables:</p>
                    <div className="bg-gray-100 p-3 rounded font-mono text-xs">
                      <div>SENDGRID_API_KEY=your_api_key</div>
                      <div>SENDGRID_FROM_EMAIL=noreply@yourdomain.com</div>
                      <div>TWILIO_ACCOUNT_SID=your_account_sid</div>
                      <div>TWILIO_AUTH_TOKEN=your_auth_token</div>
                      <div>TWILIO_FROM_NUMBER=+1234567890</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* API Integration Tab */}
        {activeTab === 'api-integration' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">BournemouthEats API Integration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* API Status */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">API Status</h4>
                
                {apiStatus && (
                  <div className={`p-4 rounded-lg ${
                    apiStatus.status === 'connected' ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={`font-medium ${
                          apiStatus.status === 'connected' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {apiStatus.status}
                        </span>
                      </div>
                      {apiStatus.api_version && (
                        <div className="flex justify-between">
                          <span>API Version:</span>
                          <span className="font-medium">{apiStatus.api_version}</span>
                        </div>
                      )}
                      {apiStatus.error && (
                        <div className="text-red-600">
                          Error: {apiStatus.error}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Import Statistics */}
                {importStats && (
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Import Statistics</h5>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                          <span>Total Imported:</span>
                          <span className="font-medium">{importStats.total_imported}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Failed:</span>
                          <span className="font-medium">{importStats.total_failed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Auto Import:</span>
                          <span className="font-medium">{importStats.auto_import_enabled ? 'Enabled' : 'Disabled'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Import Interval:</span>
                          <span className="font-medium">{importStats.import_interval_minutes} minutes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Import Settings & Actions */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Import Settings</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={importSettings.auto_import_enabled}
                        onChange={(e) => setImportSettings({
                          ...importSettings,
                          auto_import_enabled: e.target.checked
                        })}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Enable Auto Import</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Import Interval (minutes)</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={importSettings.import_interval_minutes}
                      onChange={(e) => setImportSettings({
                        ...importSettings,
                        import_interval_minutes: parseInt(e.target.value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Orders per Import</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={importSettings.max_orders_per_import}
                      onChange={(e) => setImportSettings({
                        ...importSettings,
                        max_orders_per_import: parseInt(e.target.value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={handleUpdateApiSettings}
                      disabled={loading}
                      className={`w-full px-4 py-2 rounded-md text-white font-medium ${
                        loading
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {loading ? 'Updating...' : 'Update Settings'}
                    </button>

                    <button
                      onClick={handleImportOrders}
                      disabled={loading}
                      className={`w-full px-4 py-2 rounded-md text-white font-medium ${
                        loading
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {loading ? 'Importing...' : 'Import Orders Now'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WebSocket Tab */}
        {activeTab === 'websocket' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">WebSocket Service</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Service Status */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Service Status</h4>
                
                {websocketStatus && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span>Connected Riders:</span>
                        <span className="font-medium text-blue-900">{websocketStatus.connected_riders.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Connected Admins:</span>
                        <span className="font-medium text-blue-900">{websocketStatus.connected_admins_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className="font-medium text-green-600">Active</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Connected Riders */}
                {websocketStatus && websocketStatus.connected_riders.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Connected Riders</h5>
                    <div className="space-y-2">
                      {websocketStatus.connected_riders.map((riderId, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-sm">
                            <div className="font-medium">Rider ID: {riderId.slice(-6)}</div>
                            <div className="text-gray-600">Status: Online</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Real-time Features */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Real-time Features</h4>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm space-y-2">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span>Order Updates</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span>Rider Location Tracking</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span>Score Updates</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span>Push Notifications</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">WebSocket Events</h5>
                  <div className="text-xs space-y-1 text-blue-700">
                    <div>• order_update</div>
                    <div>• rider_update</div>
                    <div>• notification</div>
                    <div>• system_alert</div>
                    <div>• rider_location_updated</div>
                    <div>• order_status_updated</div>
                    <div>• rider_score_updated</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Phase5Features;
