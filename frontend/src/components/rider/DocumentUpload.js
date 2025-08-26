import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Logo from '../common/Logo';

function DocumentUpload() {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState('');
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const documentTypes = [
    { value: 'id_card', label: 'ID Card', icon: '🆔', description: 'Government-issued photo identification' },
    { value: 'driving_license', label: 'Driving License', icon: '🚗', description: 'Valid driving license or permit' },
    { value: 'insurance', label: 'Insurance', icon: '🛡️', description: 'Vehicle insurance certificate' },
    { value: 'right_to_work', label: 'Right to Work', icon: '📋', description: 'Proof of right to work in the UK' }
  ];

  useEffect(() => {
    fetchDocuments();
    fetchVerificationStatus();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get('http://localhost:8000/rider/documents');
      setDocuments(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setLoading(false);
    }
  };

  const fetchVerificationStatus = async () => {
    try {
      const response = await axios.get('http://localhost:8000/rider/verification-overview');
      setVerificationStatus(response.data);
    } catch (error) {
      console.error('Error fetching verification status:', error);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Please upload JPEG, PNG, or PDF files only.');
        return;
      }
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size too large. Maximum size is 10MB.');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedDocumentType) {
      alert('Please select both a file and document type.');
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('document_type', selectedDocumentType);
      
      await axios.post('http://localhost:8000/rider/upload-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Reset form and refresh documents
      setSelectedFile(null);
      setSelectedDocumentType('');
      document.getElementById('file-input').value = '';
      
      await fetchDocuments();
      await fetchVerificationStatus();
      
      alert('Document uploaded successfully!');
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Error uploading document. Please try again.');
    } finally {
      setUploading(false);
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

  const getDocumentTypeInfo = (type) => {
    return documentTypes.find(dt => dt.value === type) || { label: type, icon: '📄', description: '' };
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
            <p className="text-gray-600">Upload required documents to verify your account</p>
          </div>
          <Logo className="h-12 w-auto" showText={false} />
        </div>
      </div>

      {/* Verification Progress */}
      {verificationStatus && (
        <div className="mb-6 bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Verification Progress</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{verificationStatus.verification_progress.uploaded}</div>
              <div className="text-sm text-gray-600">Documents Uploaded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{verificationStatus.verification_progress.approved}</div>
              <div className="text-sm text-gray-600">Documents Approved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{verificationStatus.verification_progress.pending_review}</div>
              <div className="text-sm text-gray-600">Pending Review</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{verificationStatus.verification_progress.rejected}</div>
              <div className="text-sm text-gray-600">Documents Rejected</div>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${(verificationStatus.verification_progress.approved / verificationStatus.verification_progress.total_required) * 100}%` }}
            ></div>
          </div>
          
          <div className="mt-2 text-sm text-gray-600 text-center">
            {verificationStatus.verification_progress.approved} of {verificationStatus.verification_progress.total_required} documents verified
          </div>
        </div>
      )}

      {/* Upload Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Upload New Document</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Type *
            </label>
            <select
              value={selectedDocumentType}
              onChange={(e) => setSelectedDocumentType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select document type</option>
              {documentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File *
            </label>
            <input
              id="file-input"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileSelect}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Accepted formats: JPEG, PNG, PDF (max 10MB)
            </p>
          </div>
        </div>
        
        {selectedFile && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-blue-800">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
          </div>
        )}
        
        <div className="mt-6">
          <button
            onClick={handleUpload}
            disabled={!selectedFile || !selectedDocumentType || uploading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200"
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </div>
      </div>

      {/* Document Types Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Required Documents</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documentTypes.map((type) => {
            const uploadedDoc = documents.find(d => d.document_type === type.value);
            const isUploaded = !!uploadedDoc;
            const isApproved = uploadedDoc?.status === 'approved';
            const isRejected = uploadedDoc?.status === 'rejected';
            
            return (
              <div key={type.value} className={`border rounded-lg p-4 ${
                isApproved ? 'border-green-200 bg-green-50' :
                isRejected ? 'border-red-200 bg-red-50' :
                isUploaded ? 'border-yellow-200 bg-yellow-50' :
                'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{type.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{type.label}</h4>
                    <p className="text-sm text-gray-600">{type.description}</p>
                    
                    {isUploaded && (
                      <div className="mt-2">
                        {getStatusBadge(uploadedDoc.status)}
                        {uploadedDoc.status === 'rejected' && uploadedDoc.rejection_reason && (
                          <p className="text-xs text-red-600 mt-1">
                            Reason: {uploadedDoc.rejection_reason}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Uploaded Documents */}
      {documents.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Uploaded Documents</h3>
          
          <div className="space-y-4">
            {documents.map((document) => {
              const typeInfo = getDocumentTypeInfo(document.document_type);
              
              return (
                <div key={document.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{typeInfo.icon}</span>
                      <div>
                        <h4 className="font-medium text-gray-900">{typeInfo.label}</h4>
                        <p className="text-sm text-gray-500">
                          Uploaded: {new Date(document.uploaded_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          Size: {(document.file_size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {getStatusBadge(document.status)}
                      {document.status === 'rejected' && (
                        <button
                          onClick={() => {
                            setSelectedDocumentType(document.document_type);
                            document.getElementById('file-input').focus();
                          }}
                          className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          Re-upload
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Next Steps */}
      {verificationStatus && verificationStatus.next_steps && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Next Steps</h3>
          
          <div className="space-y-2">
            {verificationStatus.next_steps.map((step, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                <p className="text-sm text-gray-700">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentUpload;
