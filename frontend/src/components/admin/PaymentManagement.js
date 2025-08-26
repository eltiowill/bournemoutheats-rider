import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

function PaymentManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('calculator');
  const [paymentSettings, setPaymentSettings] = useState({
    base_delivery_rate: 3.50,
    distance_rate_per_km: 0.75,
    time_rate_per_minute: 0.15,
    efficiency_bonus_threshold: 70.0,
    efficiency_bonus_multiplier: 1.25,
    customer_base_fee: 2.99,
    customer_distance_rate: 0.50,
    customer_time_rate: 0.10,
    profit_margin_multiplier: 1.35,
    minimum_payout_amount: 25.00,
    payout_processing_fee: 1.50
  });
  const [calculationRequest, setCalculationRequest] = useState({
    pickup_lat: 50.7192,
    pickup_lng: -1.8808,
    delivery_lat: 50.7200,
    delivery_lng: -1.8750,
    efficiency_percentage: 75.0,
    order_value: 25.00,
    is_peak_hour: false,
    weather_conditions: "normal"
  });
  const [calculationResult, setCalculationResult] = useState(null);
  const [payoutReport, setPayoutReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    fetchPaymentSettings();
  }, []);

  const fetchPaymentSettings = async () => {
    try {
      const response = await axios.get('http://localhost:8000/admin/payment-settings');
      setPaymentSettings(response.data);
    } catch (error) {
      console.error('Error fetching payment settings:', error);
    }
  };

  const handleCalculatePayment = async () => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:8000/admin/calculate-payment', calculationRequest);
      setCalculationResult(response.data);
      setMessage('Payment calculated successfully!');
      setMessageType('success');
    } catch (error) {
      setMessage(`Error calculating payment: ${error.response?.data?.detail || error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      setLoading(true);
      await axios.put('http://localhost:8000/admin/payment-settings', paymentSettings);
      setMessage('Payment settings updated successfully!');
      setMessageType('success');
    } catch (error) {
      setMessage(`Error updating settings: ${error.response?.data?.detail || error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const generatePayoutReport = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/admin/weekly-payout-report');
      setPayoutReport(response.data);
      setMessage('Payout report generated successfully!');
      setMessageType('success');
    } catch (error) {
      setMessage(`Error generating payout report: ${error.response?.data?.detail || error.message}`);
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
    { id: 'calculator', name: 'Payment Calculator' },
    { id: 'settings', name: 'Payment Settings' },
    { id: 'payouts', name: 'Weekly Payouts' }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Payment Management</h2>
        <div className="text-sm text-gray-500">
          Dynamic payment calculation and payout management
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
        {/* Payment Calculator Tab */}
        {activeTab === 'calculator' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Calculator</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Input Form */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Delivery Details</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={calculationRequest.pickup_lat}
                      onChange={(e) => setCalculationRequest({
                        ...calculationRequest,
                        pickup_lat: parseFloat(e.target.value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={calculationRequest.pickup_lng}
                      onChange={(e) => setCalculationRequest({
                        ...calculationRequest,
                        pickup_lng: parseFloat(e.target.value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={calculationRequest.delivery_lat}
                      onChange={(e) => setCalculationRequest({
                        ...calculationRequest,
                        delivery_lat: parseFloat(e.target.value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={calculationRequest.delivery_lng}
                      onChange={(e) => setCalculationRequest({
                        ...calculationRequest,
                        delivery_lng: parseFloat(e.target.value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rider Efficiency (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={calculationRequest.efficiency_percentage}
                      onChange={(e) => setCalculationRequest({
                        ...calculationRequest,
                        efficiency_percentage: parseFloat(e.target.value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Order Value (£)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={calculationRequest.order_value}
                      onChange={(e) => setCalculationRequest({
                        ...calculationRequest,
                        order_value: parseFloat(e.target.value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={calculationRequest.is_peak_hour}
                        onChange={(e) => setCalculationRequest({
                          ...calculationRequest,
                          is_peak_hour: e.target.checked
                        })}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Peak Hour</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weather</label>
                    <select
                      value={calculationRequest.weather_conditions}
                      onChange={(e) => setCalculationRequest({
                        ...calculationRequest,
                        weather_conditions: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="rain">Rain</option>
                      <option value="snow">Snow</option>
                      <option value="storm">Storm</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleCalculatePayment}
                  disabled={loading}
                  className={`w-full px-4 py-2 rounded-md text-white font-medium ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loading ? 'Calculating...' : 'Calculate Payment'}
                </button>
              </div>

              {/* Results Display */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Calculation Results</h4>
                
                {calculationResult ? (
                  <div className="space-y-4">
                    {/* Rider Payment Breakdown */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h5 className="font-medium text-blue-900 mb-3">Rider Payment</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Base Payment:</span>
                          <span className="font-medium">£{calculationResult.rider_payment.base_payment}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Distance Payment:</span>
                          <span className="font-medium">£{calculationResult.rider_payment.distance_payment}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Time Payment:</span>
                          <span className="font-medium">£{calculationResult.rider_payment.time_payment}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Efficiency Bonus:</span>
                          <span className="font-medium text-green-600">£{calculationResult.rider_payment.efficiency_bonus}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Peak Hour Bonus:</span>
                          <span className="font-medium text-green-600">£{calculationResult.rider_payment.peak_hour_bonus}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Weather Bonus:</span>
                          <span className="font-medium text-green-600">£{calculationResult.rider_payment.weather_bonus}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Long Distance Bonus:</span>
                          <span className="font-medium text-green-600">£{calculationResult.rider_payment.long_distance_bonus}</span>
                        </div>
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between font-bold text-lg">
                            <span>Total Payment:</span>
                            <span className="text-blue-900">£{calculationResult.rider_payment.total_payment}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Customer Charge Breakdown */}
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h5 className="font-medium text-green-900 mb-3">Customer Charge</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Base Fee:</span>
                          <span className="font-medium">£{calculationResult.customer_charge.base_fee}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Distance Charge:</span>
                          <span className="font-medium">£{calculationResult.customer_charge.distance_charge}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Time Charge:</span>
                          <span className="font-medium">£{calculationResult.customer_charge.time_charge}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Peak Hour Surcharge:</span>
                          <span className="font-medium text-orange-600">£{calculationResult.customer_charge.peak_hour_surcharge}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Weather Surcharge:</span>
                          <span className="font-medium text-orange-600">£{calculationResult.customer_charge.weather_surcharge}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Long Distance Surcharge:</span>
                          <span className="font-medium text-orange-600">£{calculationResult.customer_charge.long_distance_surcharge}</span>
                        </div>
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between font-bold text-lg">
                            <span>Total Charge:</span>
                            <span className="text-green-900">£{calculationResult.customer_charge.total_charge}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Summary Info */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-3">Delivery Summary</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Distance:</span>
                          <span className="font-medium">{calculationResult.distance_km} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Estimated Time:</span>
                          <span className="font-medium">{calculationResult.estimated_delivery_time} minutes</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Peak Hour:</span>
                          <span className="font-medium">{calculationResult.is_peak_hour ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Weather:</span>
                          <span className="font-medium capitalize">{calculationResult.weather_conditions}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-8 rounded-lg text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500">Enter delivery details and click calculate to see payment breakdown</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment Settings Tab */}
        {activeTab === 'settings' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Rider Payment Rates */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Rider Payment Rates</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Delivery Rate (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentSettings.base_delivery_rate}
                    onChange={(e) => setPaymentSettings({
                      ...paymentSettings,
                      base_delivery_rate: parseFloat(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Distance Rate per KM (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentSettings.distance_rate_per_km}
                    onChange={(e) => setPaymentSettings({
                      ...paymentSettings,
                      distance_rate_per_km: parseFloat(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Rate per Minute (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentSettings.time_rate_per_minute}
                    onChange={(e) => setPaymentSettings({
                      ...paymentSettings,
                      time_rate_per_minute: parseFloat(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Efficiency Bonus Threshold (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={paymentSettings.efficiency_bonus_threshold}
                    onChange={(e) => setPaymentSettings({
                      ...paymentSettings,
                      efficiency_bonus_threshold: parseFloat(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Efficiency Bonus Multiplier</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={paymentSettings.efficiency_bonus_multiplier}
                    onChange={(e) => setPaymentSettings({
                      ...paymentSettings,
                      efficiency_bonus_multiplier: parseFloat(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Customer Charge Rates */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Customer Charge Rates</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Delivery Fee (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentSettings.customer_base_fee}
                    onChange={(e) => setPaymentSettings({
                      ...paymentSettings,
                      customer_base_fee: parseFloat(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Distance Rate per KM (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentSettings.customer_distance_rate}
                    onChange={(e) => setPaymentSettings({
                      ...paymentSettings,
                      customer_distance_rate: parseFloat(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Rate per Minute (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentSettings.customer_time_rate}
                    onChange={(e) => setPaymentSettings({
                      ...paymentSettings,
                      customer_time_rate: parseFloat(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profit Margin Multiplier</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={paymentSettings.profit_margin_multiplier}
                    onChange={(e) => setPaymentSettings({
                      ...paymentSettings,
                      profit_margin_multiplier: parseFloat(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Payout Amount (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentSettings.minimum_payout_amount}
                    onChange={(e) => setPaymentSettings({
                      ...paymentSettings,
                      minimum_payout_amount: parseFloat(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payout Processing Fee (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentSettings.payout_processing_fee}
                    onChange={(e) => setPaymentSettings({
                      ...paymentSettings,
                      payout_processing_fee: parseFloat(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleUpdateSettings}
                disabled={loading}
                className={`px-4 py-2 rounded-md text-white font-medium ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {loading ? 'Updating...' : 'Update Payment Settings'}
              </button>
            </div>
          </div>
        )}

        {/* Weekly Payouts Tab */}
        {activeTab === 'payouts' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Weekly Payout Reports</h3>
              <button
                onClick={generatePayoutReport}
                disabled={loading}
                className={`px-4 py-2 rounded-md text-white font-medium ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Generating...' : 'Generate Payout Report'}
              </button>
            </div>

            {payoutReport ? (
              <div className="space-y-6">
                {/* Report Summary */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-3">Payout Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-blue-600 font-medium">Total Riders:</span>
                      <div className="text-blue-900 font-bold">{payoutReport.total_riders}</div>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">Eligible Riders:</span>
                      <div className="text-blue-900 font-bold">{payoutReport.eligible_riders}</div>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">Total Payouts:</span>
                      <div className="text-blue-900 font-bold">£{payoutReport.total_payouts}</div>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">Processing Fees:</span>
                      <div className="text-blue-900 font-bold">£{payoutReport.processing_fees}</div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-blue-600">
                    Report Period: {payoutReport.report_period} | 
                    Minimum Payout: £{payoutReport.minimum_payout_threshold} | 
                    Generated: {new Date(payoutReport.generated_at).toLocaleString()}
                  </div>
                </div>

                {/* Payout Details Table */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="font-medium text-gray-900">Payout Details</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rider
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Bank Details
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Weekly Earnings
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Efficiency Bonus
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Payout Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {payoutReport.payout_details.map((detail, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">
                                {detail.rider_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {detail.rider_id.slice(-6)}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">
                                <div>{detail.bank_account.account_holder}</div>
                                <div className="text-xs text-gray-500">
                                  {detail.bank_account.bank_name} - {detail.bank_account.account_number}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              £{detail.weekly_earnings}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              £{detail.efficiency_bonus}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              £{detail.total_earnings}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              £{detail.payout_amount}
                            </td>
                            <td className="px-6 py-4">
                              {detail.is_eligible ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Eligible
                                </span>
                              ) : (
                                <div>
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Not Eligible
                                  </span>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {detail.reason}
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-8 rounded-lg text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500">Click "Generate Payout Report" to create the weekly payout report</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentManagement;
