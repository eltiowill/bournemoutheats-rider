import asyncio
import json
from typing import Dict, List, Optional, Any
from datetime import datetime
import socketio
from fastapi import WebSocket
from models.user import User
from models.order import Order
from models.delivery import RiderEfficiency

class WebSocketService:
    def __init__(self):
        self.sio = socketio.AsyncServer(
            async_mode='asgi',
            cors_allowed_origins=['http://localhost:3000'],
            logger=True,
            engineio_logger=True
        )
        self.app = socketio.ASGIApp(self.sio)
        
        # Store active connections
        self.active_connections: Dict[str, WebSocket] = {}
        self.rider_connections: Dict[str, str] = {}  # rider_id -> socket_id
        self.admin_connections: List[str] = []
        
        # Register event handlers
        self._register_events()
    
    def _register_events(self):
        """Register Socket.IO event handlers"""
        
        @self.sio.event
        async def connect(sid, environ, auth):
            """Handle client connection"""
            print(f"Client connected: {sid}")
            await self.sio.emit('connected', {'sid': sid}, room=sid)
        
        @self.sio.event
        async def disconnect(sid):
            """Handle client disconnection"""
            print(f"Client disconnected: {sid}")
            await self._handle_disconnect(sid)
        
        @self.sio.event
        async def join_room(sid, data):
            """Join a specific room (rider_id or admin)"""
            room = data.get('room')
            user_type = data.get('user_type')
            
            if user_type == 'rider':
                rider_id = data.get('rider_id')
                if rider_id:
                    self.rider_connections[rider_id] = sid
                    await self.sio.emit('joined_room', {'room': room}, room=sid)
                    print(f"Rider {rider_id} joined room: {room}")
            
            elif user_type == 'admin':
                self.admin_connections.append(sid)
                await self.sio.emit('joined_room', {'room': 'admin'}, room=sid)
                print(f"Admin joined room: admin")
        
        @self.sio.event
        async def rider_location_update(sid, data):
            """Handle rider location updates"""
            rider_id = data.get('rider_id')
            location = data.get('location')
            timestamp = datetime.utcnow().isoformat()
            
            if rider_id and location:
                # Broadcast to admins
                await self._broadcast_to_admins('rider_location_updated', {
                    'rider_id': rider_id,
                    'location': location,
                    'timestamp': timestamp
                })
                
                # Store location in memory (in production, save to database)
                print(f"Rider {rider_id} location updated: {location}")
        
        @self.sio.event
        async def order_status_update(sid, data):
            """Handle order status updates"""
            order_id = data.get('order_id')
            status = data.get('status')
            rider_id = data.get('rider_id')
            timestamp = datetime.utcnow().isoformat()
            
            if order_id and status:
                # Broadcast to all connected clients
                await self.sio.emit('order_status_updated', {
                    'order_id': order_id,
                    'status': status,
                    'rider_id': rider_id,
                    'timestamp': timestamp
                })
                
                print(f"Order {order_id} status updated to: {status}")
        
        @self.sio.event
        async def score_update(sid, data):
            """Handle rider score updates"""
            rider_id = data.get('rider_id')
            new_score = data.get('new_score')
            efficiency = data.get('efficiency')
            timestamp = datetime.utcnow().isoformat()
            
            if rider_id and new_score is not None:
                # Broadcast to admins
                await self._broadcast_to_admins('rider_score_updated', {
                    'rider_id': rider_id,
                    'new_score': new_score,
                    'efficiency': efficiency,
                    'timestamp': timestamp
                })
                
                # Notify the specific rider
                if rider_id in self.rider_connections:
                    socket_id = self.rider_connections[rider_id]
                    await self.sio.emit('score_updated', {
                        'new_score': new_score,
                        'efficiency': efficiency,
                        'timestamp': timestamp
                    }, room=socket_id)
                
                print(f"Rider {rider_id} score updated to: {new_score}")
    
    async def _handle_disconnect(self, sid: str):
        """Handle client disconnection cleanup"""
        # Remove from admin connections
        if sid in self.admin_connections:
            self.admin_connections.remove(sid)
        
        # Remove from rider connections
        for rider_id, socket_id in list(self.rider_connections.items()):
            if socket_id == sid:
                del self.rider_connections[rider_id]
                break
    
    async def _broadcast_to_admins(self, event: str, data: Dict[str, Any]):
        """Broadcast event to all connected admins"""
        for admin_sid in self.admin_connections:
            await self.sio.emit(event, data, room=admin_sid)
    
    async def broadcast_order_update(self, order_data: Dict[str, Any]):
        """Broadcast order update to all connected clients"""
        await self.sio.emit('order_update', order_data)
    
    async def broadcast_rider_update(self, rider_data: Dict[str, Any]):
        """Broadcast rider update to admins"""
        await self._broadcast_to_admins('rider_update', rider_data)
    
    async def send_notification_to_rider(self, rider_id: str, notification: Dict[str, Any]):
        """Send notification to a specific rider"""
        if rider_id in self.rider_connections:
            socket_id = self.rider_connections[rider_id]
            await self.sio.emit('notification', notification, room=socket_id)
    
    async def broadcast_system_alert(self, alert_data: Dict[str, Any]):
        """Broadcast system alert to all connected clients"""
        await self.sio.emit('system_alert', alert_data)
    
    async def get_connected_riders(self) -> List[str]:
        """Get list of currently connected rider IDs"""
        return list(self.rider_connections.keys())
    
    async def get_connected_admins_count(self) -> int:
        """Get count of currently connected admins"""
        return len(self.admin_connections)
    
    async def is_rider_online(self, rider_id: str) -> bool:
        """Check if a specific rider is online"""
        return rider_id in self.rider_connections

# Create global instance
websocket_service = WebSocketService()
