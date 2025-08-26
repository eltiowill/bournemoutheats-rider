import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../common/Logo';
import LanguageSwitcher from '../common/LanguageSwitcher';
import NotificationBell from '../common/NotificationBell';
import DeliveryRequests from './DeliveryRequests';
import DeliveryHistory from './DeliveryHistory';
import Earnings from './Earnings';
import Efficiency from './Efficiency';
import DocumentUpload from './DocumentUpload';
import BankAccount from './BankAccount';

function RiderDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('requests');
  const [riderStatus, setRiderStatus] = useState({ orders_paused: false, is_active: true });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRiderStatus();
  }, []);

  const fetchRiderStatus = async () => {
    try {
      const response = await axios.get('http://localhost:8000/rider/status');
      setRiderStatus(response.data);
    } catch (error) {
      console.error('Error fetching rider status:', error);
    }
  };

  const handlePauseOrders = async () => {
    setLoading(true);
    try {
      await axios.post('http://localhost:8000/rider/pause-orders');
      await fetchRiderStatus();
    } catch (error) {
      console.error('Error pausing orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeOrders = async () => {
    setLoading(true);
    try {
      await axios.post('http://localhost:8000/rider/resume-orders');
      await fetchRiderStatus();
    } catch (error) {
      console.error('Error resuming orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'requests', name: 'Delivery Requests', component: <DeliveryRequests /> },
    { id: 'history', name: 'Delivery History', component: <DeliveryHistory /> },
    { id: 'earnings', name: 'Earnings', component: <Earnings /> },
    { id: 'efficiency', name: 'Efficiency Score', component: <Efficiency /> },
    { id: 'documents', name: 'Document Verification', component: <DocumentUpload /> },
    { id: 'bank', name: 'Bank Account', component: <BankAccount /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Logo className="h-8 w-auto" />
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <NotificationBell />
              
              {/* Rider Status Indicator */}
              <div className="flex items-center space-x-3">
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                  riderStatus.orders_paused 
                    ? 'bg-orange-100 text-orange-800 border border-orange-200' 
                    : 'bg-green-100 text-green-800 border border-green-200'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    riderStatus.orders_paused ? 'bg-orange-500' : 'bg-green-500'
                  }`}></div>
                  <span className="text-sm font-medium">
                    {riderStatus.orders_paused ? 'Orders Paused' : 'Active'}
                  </span>
                </div>
                
                {riderStatus.orders_paused ? (
                  <button
                    onClick={handleResumeOrders}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    {loading ? 'Resuming...' : 'Resume Orders'}
                  </button>
                ) : (
                  <button
                    onClick={handlePauseOrders}
                    disabled={loading}
                    className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    {loading ? 'Pausing...' : 'Pause Orders'}
                  </button>
                )}
              </div>
              
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  Welcome, {user?.first_name} {user?.last_name}
                </div>
                <div className="text-xs text-gray-500">Rider</div>
              </div>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Rider Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Manage your deliveries, track earnings, and view your performance
            </p>
          </div>

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
            {tabs.find(tab => tab.id === activeTab)?.component}
          </div>
        </div>
      </main>
    </div>
  );
}

export default RiderDashboard;
