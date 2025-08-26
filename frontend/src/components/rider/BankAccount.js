import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Logo from '../common/Logo';

function BankAccount() {
  const [bankAccount, setBankAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    account_holder_name: '',
    account_number: '',
    sort_code: '',
    bank_name: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchBankAccount();
  }, []);

  const fetchBankAccount = async () => {
    try {
      const response = await axios.get('http://localhost:8000/rider/bank-account');
      setBankAccount(response.data);
      setFormData({
        account_holder_name: response.data.account_holder_name || '',
        account_number: response.data.account_number || '',
        sort_code: response.data.sort_code || '',
        bank_name: response.data.bank_name || ''
      });
      setLoading(false);
    } catch (error) {
      if (error.response?.status === 404) {
        // No bank account exists yet
        setBankAccount(null);
        setLoading(false);
      } else {
        console.error('Error fetching bank account:', error);
        setError('Error loading bank account information');
        setLoading(false);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Format sort code (XX-XX-XX)
    if (name === 'sort_code') {
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length <= 6) {
        const formatted = cleaned.replace(/(\d{2})(\d{2})(\d{2})/, '$1-$2-$3');
        setFormData(prev => ({ ...prev, [name]: formatted }));
      }
      return;
    }
    
    // Format account number (8 digits)
    if (name === 'account_number') {
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length <= 8) {
        setFormData(prev => ({ ...prev, [name]: cleaned }));
      }
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.account_holder_name.trim()) {
      setError('Account holder name is required');
      return;
    }
    if (formData.account_number.length !== 8) {
      setError('Account number must be 8 digits');
      return;
    }
    if (formData.sort_code.replace(/\D/g, '').length !== 6) {
      setError('Sort code must be 6 digits');
      return;
    }
    if (!formData.bank_name.trim()) {
      setError('Bank name is required');
      return;
    }

    try {
      await axios.post('http://localhost:8000/rider/bank-account', formData);
      setSuccess('Bank account information saved successfully!');
      setEditing(false);
      await fetchBankAccount();
    } catch (error) {
      console.error('Error saving bank account:', error);
      setError('Error saving bank account information. Please try again.');
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setEditing(false);
    setError('');
    setSuccess('');
    // Reset form to current values
    if (bankAccount) {
      setFormData({
        account_holder_name: bankAccount.account_holder_name,
        account_number: bankAccount.account_number,
        sort_code: bankAccount.sort_code,
        bank_name: bankAccount.bank_name
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Bank Account</h2>
            <p className="text-gray-600">Manage your payment information</p>
          </div>
          <Logo className="h-12 w-auto" showText={false} />
        </div>
      </div>

      {/* Information Box */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Secure Payment Processing
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              Your bank account information is encrypted and stored securely. We only use this information to process your earnings payments.
            </p>
          </div>
        </div>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Bank Account Form/Display */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {!editing ? (
          // Display Mode
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Bank Account Details</h3>
              <button
                onClick={handleEdit}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Edit Information
              </button>
            </div>

            {bankAccount ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name</label>
                  <div className="text-gray-900 font-medium">{bankAccount.account_holder_name}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                  <div className="text-gray-900 font-medium">{bankAccount.bank_name}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                  <div className="text-gray-900 font-medium">{bankAccount.account_number}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort Code</label>
                  <div className="text-gray-900 font-medium">{bankAccount.sort_code}</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Bank Account Added</h3>
                <p className="text-gray-500 mb-4">Add your bank account information to receive payments for your deliveries.</p>
                <button
                  onClick={handleEdit}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Add Bank Account
                </button>
              </div>
            )}
          </div>
        ) : (
          // Edit Mode
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {bankAccount ? 'Edit Bank Account' : 'Add Bank Account'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="account_holder_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Account Holder Name *
                  </label>
                  <input
                    type="text"
                    id="account_holder_name"
                    name="account_holder_name"
                    value={formData.account_holder_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter account holder name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="bank_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    id="bank_name"
                    name="bank_name"
                    value={formData.bank_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Barclays, HSBC, Lloyds"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="account_number" className="block text-sm font-medium text-gray-700 mb-2">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    id="account_number"
                    name="account_number"
                    value={formData.account_number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="8 digits"
                    maxLength="8"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">8-digit account number</p>
                </div>

                <div>
                  <label htmlFor="sort_code" className="block text-sm font-medium text-gray-700 mb-2">
                    Sort Code *
                  </label>
                  <input
                    type="text"
                    id="sort_code"
                    name="sort_code"
                    value={formData.sort_code}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="XX-XX-XX"
                    maxLength="8"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">6-digit sort code (e.g., 12-34-56)</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  {bankAccount ? 'Update Account' : 'Save Account'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Security Information */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Security & Privacy</h3>
        
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start space-x-3">
            <svg className="h-5 w-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>All data is encrypted using industry-standard SSL/TLS encryption</span>
          </div>
          
          <div className="flex items-start space-x-3">
            <svg className="h-5 w-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Bank account information is stored securely and never shared with third parties</span>
          </div>
          
          <div className="flex items-start space-x-3">
            <svg className="h-5 w-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Payments are processed through secure banking channels</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BankAccount;
