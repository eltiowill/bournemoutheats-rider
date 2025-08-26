import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../common/Logo';
import LanguageSwitcher from '../common/LanguageSwitcher';
import RidersManagement from './RidersManagement';
import DeliveriesOverview from './DeliveriesOverview';
import Statistics from './Statistics';
import DocumentVerification from './DocumentVerification';
import AdminUtilities from './AdminUtilities';
import RealTimeMap from './RealTimeMap';
import OrderManagement from './OrderManagement';
import RiderPerformance from './RiderPerformance';
import PaymentReports from './PaymentReports';
import IncidentAlerts from './IncidentAlerts';
import PaymentManagement from './PaymentManagement';
import Phase5Features from './Phase5Features';

function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('map');

  const tabs = [
    { id: 'map', name: 'Real-time Map', component: <RealTimeMap /> },
    { id: 'orders', name: 'Order Management', component: <OrderManagement /> },
    { id: 'performance', name: 'Rider Performance', component: <RiderPerformance /> },
    { id: 'payments', name: 'Payment Reports', component: <PaymentReports /> },
    { id: 'payment-management', name: 'Payment Management', component: <PaymentManagement /> },
    { id: 'phase5', name: 'Phase 5 Features', component: <Phase5Features /> },
    { id: 'alerts', name: 'Incident Alerts', component: <IncidentAlerts /> },
    { id: 'verification', name: 'Document Verification', component: <DocumentVerification /> },
    { id: 'riders', name: 'Riders Management', component: <RidersManagement /> },
    { id: 'deliveries', name: 'Deliveries Overview', component: <DeliveriesOverview /> },
    { id: 'statistics', name: 'Statistics', component: <Statistics /> },
    { id: 'utilities', name: 'Admin Utilities', component: <AdminUtilities /> }
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
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  Welcome, {user?.first_name} {user?.last_name}
                </div>
                <div className="text-xs text-gray-500">Administrator</div>
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
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Monitor operations, manage riders, and track system performance
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 whitespace-nowrap ${
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

export default AdminDashboard;
