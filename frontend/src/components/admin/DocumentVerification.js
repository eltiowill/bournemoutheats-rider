import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Logo from '../common/Logo';

function DocumentVerification() {
  const [verificationQueue, setVerificationQueue] = useState([]);
  const [selectedRider, setSelectedRider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [reviewData, setReviewData] = useState({
    status: 'approved',
    rejection_reason: '',
    admin_notes: ''
  });

  useEffect(() => {
    fetchVerificationQueue();
  }, []);

  const fetchVerificationQueue = async () => {
    try {
      const response = await axios.get('http://localhost:8000/admin/verification-queue');
      setVerificationQueue(response.data.riders);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching verification queue:', error);
      setLoading(false);
    }
  };

  const handleReviewDocument = (document, rider) => {
    setSelectedDocument(document);
    setSelectedRider(rider);
    setReviewModal(true);
  };

  const handleReviewSubmit = async () => {
    try {
      await axios.post(`http://localhost:8000/admin/review-document/${selectedDocument.id}`, reviewData);
      
      // Refresh the queue
      await fetchVerificationQueue();
      
      // Close modal and reset
      setReviewModal(false);
      setSelectedDocument(null);
      setSelectedRider(null);
      setReviewData({
        status: 'approved',
        rejection_reason: '',
        admin_notes: ''
      });
      
      alert('Document review submitted successfully');
    } catch (error) {
      console.error('Error reviewing document:', error);
      alert('Error reviewing document. Please try again.');
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getDocumentTypeIcon = (type) => {
    const icons = {
      id_card: '🆔',
      driving_license: '🚗',
      insurance: '🛡️',
      right_to_work: '📋'
    };
    return icons[type] || '📄';
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
            <h2 className="text-2xl font-bold text-gray-900">Document Verification</h2>
            <p className="text-gray-600">Review and approve rider documents</p>
          </div>
          <Logo className="h-12 w-auto" showText={false} />
        </div>
        
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Verification Queue: {verificationQueue.length} riders pending
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Review uploaded documents to activate rider accounts
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Queue */}
      <div className="space-y-6">
        {verificationQueue.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pending verifications</h3>
            <p className="text-gray-500">All rider documents have been reviewed.</p>
          </div>
        ) : (
          verificationQueue.map((riderData) => (
            <div key={riderData.rider.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
              {/* Rider Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-blue-600">
                        {riderData.rider.first_name[0]}{riderData.rider.last_name[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {riderData.rider.first_name} {riderData.rider.last_name}
                      </h3>
                      <p className="text-sm text-gray-600">{riderData.rider.email}</p>
                      <p className="text-sm text-gray-500">{riderData.rider.phone}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Priority Score</div>
                    <div className="text-lg font-semibold text-blue-600">
                      {Math.round(riderData.priority_score)}h
                    </div>
                    <div className="text-xs text-gray-400">waiting</div>
                  </div>
                </div>
                
                {/* Verification Progress */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Verification Progress</span>
                    <span>{riderData.verification_summary.approved}/{riderData.verification_summary.total_required} Complete</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(riderData.verification_summary.approved / riderData.verification_summary.total_required) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Documents Grid */}
              <div className="px-6 py-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {riderData.documents.map((document) => (
                    <div key={document.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getDocumentTypeIcon(document.document_type)}</span>
                          <span className="text-sm font-medium text-gray-900">
                            {document.document_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                        {getStatusBadge(document.status)}
                      </div>
                      
                      <div className="text-xs text-gray-500 mb-3">
                        <div>Uploaded: {new Date(document.uploaded_at).toLocaleDateString()}</div>
                        <div>Size: {(document.file_size / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                      
                      {document.status === 'pending' && (
                        <button
                          onClick={() => handleReviewDocument(document, riderData.rider)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-md text-sm font-medium transition-colors duration-200"
                        >
                          Review Document
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {reviewModal && selectedDocument && selectedRider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Review Document - {selectedRider.first_name} {selectedRider.last_name}
              </h3>
              <button
                onClick={() => setReviewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Document Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-medium">
                      {selectedDocument.document_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Uploaded:</span>
                    <span className="ml-2 font-medium">
                      {new Date(selectedDocument.uploaded_at).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">File Size:</span>
                    <span className="ml-2 font-medium">
                      {(selectedDocument.file_size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">File Type:</span>
                    <span className="ml-2 font-medium">{selectedDocument.mime_type}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Decision
                </label>
                <select
                  value={reviewData.status}
                  onChange={(e) => setReviewData({...reviewData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="approved">Approve</option>
                  <option value="rejected">Reject</option>
                </select>
              </div>
              
              {reviewData.status === 'rejected' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={reviewData.rejection_reason}
                    onChange={(e) => setReviewData({...reviewData, rejection_reason: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Please provide a reason for rejection..."
                    required
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={reviewData.admin_notes}
                  onChange={(e) => setReviewData({...reviewData, admin_notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes or comments..."
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setReviewModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleReviewSubmit}
                disabled={reviewData.status === 'rejected' && !reviewData.rejection_reason}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentVerification;
