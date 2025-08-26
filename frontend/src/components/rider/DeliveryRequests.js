import React, { useState, useEffect } from 'react';
import axios from 'axios';

function DeliveryRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [countdowns, setCountdowns] = useState({});

  useEffect(() => {
    fetchRequests();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdowns(prevCountdowns => {
        const newCountdowns = {};
        let hasActiveCountdowns = false;
        
        requests.forEach(request => {
          const currentCountdown = prevCountdowns[request.id] || request.expires_in;
          if (currentCountdown > 0) {
            newCountdowns[request.id] = currentCountdown - 1;
            hasActiveCountdowns = true;
          } else {
            newCountdowns[request.id] = 0;
          }
        });
        
        return newCountdowns;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [requests]);

  // Remove expired requests
  useEffect(() => {
    const expiredRequests = requests.filter(request => 
      (countdowns[request.id] || 0) <= 0
    );
    
    if (expiredRequests.length > 0) {
      setRequests(prevRequests => 
        prevRequests.filter(request => 
          (countdowns[request.id] || 0) > 0
        )
      );
    }
  }, [countdowns, requests]);

  const fetchRequests = async () => {
    try {
      const response = await axios.get('http://localhost:8000/rider/delivery-requests');
      const requestsData = response.data;
      setRequests(requestsData);
      
      // Initialize countdowns for each request
      const initialCountdowns = {};
      requestsData.forEach(request => {
        initialCountdowns[request.id] = request.expires_in;
      });
      setCountdowns(initialCountdowns);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await axios.post(`http://localhost:8000/rider/accept-delivery/${requestId}`);
      // Remove accepted request from list
      setRequests(requests.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Error accepting delivery:', error);
    }
  };

  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setShowRejectionModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedRequest) return;

    try {
      const response = await axios.post(`http://localhost:8000/rider/reject-delivery/${selectedRequest.id}`, null, {
        params: { preparation_start_time: selectedRequest.preparation_start_time }
      });
      
      // Remove rejected request from list
      setRequests(requests.filter(req => req.id !== selectedRequest.id));
      
      // Show feedback about penalty
      if (response.data.penalty_applied) {
        alert('Order rejected. Note: This rejection will affect your efficiency score and points.');
      } else {
        alert('Order rejected. No penalty applied as you waited for the preparation window to end.');
      }
      
      setShowRejectionModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting delivery:', error);
      alert('Error rejecting delivery. Please try again.');
    }
  };

  const handleRejectCancel = () => {
    setShowRejectionModal(false);
    setSelectedRequest(null);
    setRejectionReason('');
  };

  const isWithinPenaltyWindow = (preparationStartTime) => {
    if (!preparationStartTime) return true;
    
    const prepTime = new Date(preparationStartTime);
    const now = new Date();
    const gracePeriodEnd = new Date(prepTime.getTime() + (10 * 60 * 1000)); // 10 minutes
    
    return now < gracePeriodEnd;
  };

  const getTimeRemaining = (preparationStartTime) => {
    if (!preparationStartTime) return null;
    
    const prepTime = new Date(preparationStartTime);
    const now = new Date();
    const gracePeriodEnd = new Date(prepTime.getTime() + (10 * 60 * 1000));
    
    if (now >= gracePeriodEnd) return null;
    
    const timeRemaining = Math.ceil((gracePeriodEnd - now) / 1000 / 60);
    return timeRemaining;
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
      <h2 className="text-lg font-medium text-gray-900 mb-4">Available Delivery Requests</h2>
      
      {requests.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-gray-500">No delivery requests available at the moment.</p>
          <p className="text-sm text-gray-400 mt-2">Check back later for new opportunities!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const timeRemaining = getTimeRemaining(request.preparation_start_time);
            const isPenaltyWindow = isWithinPenaltyWindow(request.preparation_start_time);
            
            return (
              <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{request.restaurant_name}</h3>
                    <p className="text-sm text-gray-600">£{request.amount}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Expires in</div>
                    <div className={`text-lg font-semibold ${
                      countdowns[request.id] <= 10 ? 'text-red-600' : 
                      countdowns[request.id] <= 20 ? 'text-orange-600' : 'text-blue-600'
                    }`}>
                      {countdowns[request.id] || 0}s
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium mr-2">Pickup:</span>
                    {request.pickup_address}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium mr-2">Delivery:</span>
                    {request.delivery_address}
                  </div>
                </div>

                {/* Preparation Time Warning */}
                {timeRemaining !== null && (
                  <div className={`mb-4 p-3 rounded-lg border ${
                    isPenaltyWindow 
                      ? 'border-orange-200 bg-orange-50 text-orange-800' 
                      : 'border-green-200 bg-green-50 text-green-800'
                  }`}>
                    <div className="flex items-center text-sm">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {isPenaltyWindow 
                        ? `⚠️ Rejecting now will affect your efficiency score. Wait ${timeRemaining} more minutes for no penalty.`
                        : "✅ Preparation window ended. Rejecting now won't affect your efficiency score."
                      }
                    </div>
                  </div>
                )}

                {/* Expiration Warning */}
                {(countdowns[request.id] || 0) <= 10 && (countdowns[request.id] || 0) > 0 && (
                  <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-800">
                    <div className="flex items-center text-sm">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      ⚠️ This request expires in {countdowns[request.id]} seconds! Make your decision quickly.
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleAccept(request.id)}
                    disabled={(countdowns[request.id] || 0) <= 0}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center ${
                      (countdowns[request.id] || 0) <= 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {(countdowns[request.id] || 0) <= 0 ? 'Expired' : 'Accept'}
                  </button>
                  <button
                    onClick={() => handleRejectClick(request)}
                    disabled={(countdowns[request.id] || 0) <= 0}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center ${
                      (countdowns[request.id] || 0) <= 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {(countdowns[request.id] || 0) <= 0 ? 'Expired' : 'Reject'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection Warning Modal */}
      {showRejectionModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Reject Order?</h3>
            </div>
            
            <div className="mb-6">
              {isWithinPenaltyWindow(selectedRequest.preparation_start_time) ? (
                <div className="text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
                  <p className="font-medium mb-2">⚠️ Efficiency Impact Warning</p>
                  <p className="text-sm">
                    Rejecting this order now will lower your efficiency score and points. 
                    If you wait until the restaurant preparation window ends (10 minutes), no penalty will be applied.
                  </p>
                  <p className="text-sm mt-2 font-medium">
                    Are you sure you want to reject?
                  </p>
                </div>
              ) : (
                <div className="text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
                  <p className="font-medium mb-2">✅ No Penalty</p>
                  <p className="text-sm">
                    The preparation window has ended. Rejecting this order now won't affect your efficiency score.
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleRejectCancel}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Yes, Reject Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeliveryRequests;
