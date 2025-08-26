import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

function RealTimeMap() {
  const { user } = useAuth();
  const [riders, setRiders] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([50.7192, -1.8808]); // Bournemouth coordinates
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    // Initialize map when component mounts
    if (typeof window !== 'undefined' && window.L) {
      initializeMap();
    }

    // Fetch initial data
    fetchMapData();

    // Set up real-time updates
    const interval = setInterval(fetchMapData, 10000); // Update every 10 seconds

    return () => {
      clearInterval(interval);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  const initializeMap = () => {
    if (mapRef.current && !mapInstanceRef.current) {
      const L = window.L;
      
      mapInstanceRef.current = L.map(mapRef.current).setView(mapCenter, 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);

      // Add custom controls
      addMapControls();
    }
  };

  const addMapControls = () => {
    if (!mapInstanceRef.current) return;
    
    const L = window.L;
    
    // Add legend
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = function() {
      const div = L.DomUtil.create('div', 'info legend bg-white p-3 rounded shadow-lg');
      div.innerHTML = `
        <h4 class="font-bold mb-2">Map Legend</h4>
        <div class="space-y-1 text-sm">
          <div class="flex items-center">
            <div class="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
            <span>Available Riders</span>
          </div>
          <div class="flex items-center">
            <div class="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
            <span>Riders with Orders</span>
          </div>
          <div class="flex items-center">
            <div class="w-4 h-4 bg-orange-500 rounded-full mr-2"></div>
            <span>Pending Orders</span>
          </div>
          <div class="flex items-center">
            <div class="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
            <span>Late Orders</span>
          </div>
        </div>
      `;
      return div;
    };
    legend.addTo(mapInstanceRef.current);
  };

  const fetchMapData = async () => {
    try {
      setLoading(true);
      
      // Fetch riders with their current locations and status
      const ridersResponse = await axios.get('http://localhost:8000/admin/riders-locations');
      const ridersData = ridersResponse.data;
      
      // Fetch orders with their current status
      const ordersResponse = await axios.get('http://localhost:8000/admin/orders-status');
      const ordersData = ordersResponse.data;
      
      setRiders(ridersData);
      setOrders(ordersData);
      
      // Update map markers
      updateMapMarkers(ridersData, ordersData);
      
    } catch (error) {
      console.error('Error fetching map data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMapMarkers = (ridersData, ordersData) => {
    if (!mapInstanceRef.current) return;
    
    const L = window.L;
    
    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => {
      if (marker && marker.remove) {
        marker.remove();
      }
    });
    markersRef.current = {};

    // Add rider markers
    ridersData.forEach(rider => {
      if (rider.current_location && rider.current_location.lat && rider.current_location.lng) {
        const riderIcon = L.divIcon({
          className: 'rider-marker',
          html: `<div class="w-6 h-6 rounded-full border-2 border-white shadow-lg ${
            rider.current_order ? 'bg-blue-500' : 'bg-green-500'
          }"></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker([rider.current_location.lat, rider.current_location.lng], {
          icon: riderIcon
        }).addTo(mapInstanceRef.current);

        // Add popup with rider info
        const popupContent = `
          <div class="p-2">
            <h3 class="font-bold">${rider.first_name} ${rider.last_name}</h3>
            <p class="text-sm">Status: ${rider.current_order ? 'On Delivery' : 'Available'}</p>
            <p class="text-sm">Efficiency: ${rider.efficiency?.efficiency_percentage || 0}%</p>
            ${rider.current_order ? `<p class="text-sm">Order: ${rider.current_order.restaurant_name}</p>` : ''}
          </div>
        `;
        marker.bindPopup(popupContent);

        markersRef.current[`rider-${rider._id}`] = marker;
      }
    });

    // Add order markers
    ordersData.forEach(order => {
      if (order.pickup_location && order.pickup_location.lat && order.pickup_location.lng) {
        const orderIcon = L.divIcon({
          className: 'order-marker',
          html: `<div class="w-5 h-5 rounded-full border-2 border-white shadow-lg ${
            order.status === 'pending' ? 'bg-orange-500' :
            order.status === 'in_progress' ? 'bg-blue-500' :
            order.status === 'completed' ? 'bg-green-500' :
            order.status === 'late' ? 'bg-red-500' : 'bg-gray-500'
          }"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const marker = L.marker([order.pickup_location.lat, order.pickup_location.lng], {
          icon: orderIcon
        }).addTo(mapInstanceRef.current);

        // Add popup with order info
        const popupContent = `
          <div class="p-2">
            <h3 class="font-bold">${order.restaurant_name}</h3>
            <p class="text-sm">Status: ${order.status}</p>
            <p class="text-sm">Amount: £${order.total_amount}</p>
            <p class="text-sm">Address: ${order.pickup_address}</p>
            ${order.assigned_rider ? `<p class="text-sm">Rider: ${order.assigned_rider.first_name} ${order.assigned_rider.last_name}</p>` : ''}
          </div>
        `;
        marker.bindPopup(popupContent);

        markersRef.current[`order-${order._id}`] = marker;
      }
    });
  };

  const refreshMap = () => {
    fetchMapData();
  };

  const centerOnBournemouth = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(mapCenter, 13);
    }
  };

  if (loading && riders.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Real-time Map</h2>
        <div className="flex space-x-2">
          <button
            onClick={refreshMap}
            className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            Refresh
          </button>
          <button
            onClick={centerOnBournemouth}
            className="px-3 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700"
          >
            Center Map
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div 
          ref={mapRef} 
          className="w-full h-96"
          style={{ minHeight: '400px' }}
        ></div>
      </div>

      {/* Map Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-gray-900">Available Riders</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {riders.filter(r => !r.current_order).length}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-gray-900">Active Deliveries</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {orders.filter(o => o.status === 'in_progress').length}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-gray-900">Pending Orders</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {orders.filter(o => o.status === 'pending').length}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-gray-900">Late Orders</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {orders.filter(o => o.status === 'late').length}
          </p>
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-4 text-center text-sm text-gray-500">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}

export default RealTimeMap;
