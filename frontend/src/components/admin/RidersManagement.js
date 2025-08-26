import React, { useState, useEffect } from 'react';
import axios from 'axios';

function RidersManagement() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    try {
      const response = await axios.get('http://localhost:8000/admin/riders');
      setRiders(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching riders:', error);
      setLoading(false);
    }
  };

  const handleApproveRider = async (riderId) => {
    try {
      await axios.post(`http://localhost:8000/admin/approve-rider/${riderId}`);
      // Update rider status locally
      setRiders(riders.map(rider => 
        rider._id === riderId 
          ? { ...rider, is_verified: true }
          : rider
      ));
    } catch (error) {
      console.error('Error approving rider:', error);
    }
  };

  const handleRejectRider = async (riderId) => {
    try {
      const reason = prompt('Please provide a reason for rejection:');
      if (reason) {
        await axios.post(`http://localhost:8000/admin/reject-rider/${riderId}`, null, {
          params: { reason }
        });
        // Remove rejected rider from list
        setRiders(riders.filter(rider => rider._id !== riderId));
      }
    } catch (error) {
      console.error('Error rejecting rider:', error);
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
      <h2 className="text-lg font-medium text-gray-900 mb-4">Riders Management</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rider
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {riders.map((rider) => (
              <tr key={rider._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {rider.first_name[0]}{rider.last_name[0]}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {rider.first_name} {rider.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {rider.role}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{rider.email}</div>
                  <div className="text-sm text-gray-500">{rider.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    rider.is_verified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {rider.is_verified ? 'Verified' : 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {!rider.is_verified ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApproveRider(rider._id)}
                        className="text-green-600 hover:text-green-900 font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectRider(rider._id)}
                        className="text-red-600 hover:text-red-900 font-medium"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-500">No action needed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RidersManagement;
