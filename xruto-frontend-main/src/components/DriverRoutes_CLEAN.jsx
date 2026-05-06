import React, { useState, useEffect } from 'react';

// Get API URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// API service for driver routes
const driverAPI = {
  // Get routes assigned to specific driver
  getDriverRoutes: async (driverId, date = new Date().toISOString().split('T')[0]) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/driver-routes/${driverId}?date=${date}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error('API Error - getDriverRoutes:', error);
      throw new Error(`Failed to fetch driver routes: ${error.message}`);
    }
  },

  // Update delivery status from driver app
  updateDeliveryStatus: async (driverId, orderId, status, location = null) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/driver-update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driver_id: driverId,
          order_id: orderId,
          status: status,
          location: location,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('API Error - updateDeliveryStatus:', error);
      throw new Error(`Failed to update delivery status: ${error.message}`);
    }
  },

  // Get detailed route information
  getRouteDetails: async (routeId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/route-details/${routeId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error('API Error - getRouteDetails:', error);
      throw new Error(`Failed to fetch route details: ${error.message}`);
    }
  }
};

// OPTIMIZED: Depot Return Segments Component
const DepotReturnSegments = ({ route, onNavigateSegment }) => {
  const segments = route.route_segments || [];
  
  if (segments.length <= 1) return null;

  return (
    <div className="mt-4 p-3 bg-gray-700 rounded-lg">
      <div className="flex items-center mb-3">
        <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center mr-2">
          <span className="text-xs font-bold text-white">{segments.length}</span>
        </div>
        <h4 className="text-sm font-semibold text-white">Depot Return Segments</h4>
      </div>
      
      <div className="space-y-2">
        {segments.map((segment, index) => {
          const completedOrders = segment.orders?.filter(order => order.delivery_status === 'delivered').length || 0;
          const totalOrders = segment.orders?.length || 0;
          const progress = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
          const isActive = progress > 0 && progress < 100;
          const isCompleted = progress === 100;
          
          return (
            <div key={segment.segment_id} className={`p-3 rounded-lg border ${
              isCompleted ? 'bg-green-800 border-green-600' : 
              isActive ? 'bg-blue-800 border-blue-600' : 
              'bg-gray-800 border-gray-600'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                    isCompleted ? 'bg-green-500' : isActive ? 'bg-blue-500' : 'bg-gray-600'
                  }`}>
                    {isCompleted ? '✓' : segment.segment_id}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      Segment {segment.segment_id}
                    </div>
                    <div className="text-xs text-gray-400">
                      {totalOrders} orders • {segment.distance_km}km • {segment.duration_minutes}min
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => onNavigateSegment(segment)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    isCompleted ? 'bg-green-600 hover:bg-green-700' :
                    isActive ? 'bg-blue-600 hover:bg-blue-700' :
                    'bg-orange-600 hover:bg-orange-700'
                  } text-white`}
                >
                  {isCompleted ? 'Review' : isActive ? 'Continue' : 'Start'}
                </button>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-600 rounded-full h-2 mb-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isCompleted ? 'bg-green-500' : isActive ? 'bg-blue-500' : 'bg-gray-500'
                  }`}
                  style={{ width: `${Math.max(progress, 5)}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between text-xs text-gray-400">
                <span>{completedOrders}/{totalOrders} completed</span>
                <span>{Math.round(progress)}% done</span>
              </div>
              
              {/* Return to Depot Indicator */}
              {segment.return_to_depot && (
                <div className="mt-2 flex items-center text-xs text-orange-400">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                  Return to depot after segment
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Overall Progress */}
      <div className="mt-3 pt-3 border-t border-gray-600">
        <div className="flex justify-between text-sm">
          <span className="text-gray-300">Total Progress:</span>
          <span className="text-white font-medium">{route.progress_percentage || 0}%</span>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Est. {Math.round((route.estimated_duration_minutes || 0) / 60 * 10) / 10}h total</span>
          <span>{route.depot_returns_needed || segments.length} depot returns</span>
        </div>
      </div>
    </div>
  );
};

const DriverRoutes = ({ driverId = 'driver1' }) => {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routeOrders, setRouteOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liveUpdateEnabled, setLiveUpdateEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    let intervalId;
    
    if (liveUpdateEnabled) {
      intervalId = setInterval(() => {
        loadDriverRoutes();
        setLastUpdate(new Date());
      }, 30000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [liveUpdateEnabled, driverId]);

  useEffect(() => {
    loadDriverRoutes();
  }, [driverId]);

  const loadDriverRoutes = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await driverAPI.getDriverRoutes(driverId);
      
      if (result.success) {
        const processedRoutes = result.routes.map(route => {
          const completedOrders = route.orders?.filter(order => order.delivery_status === 'delivered').length || 0;
          const totalOrders = route.orders?.length || 0;
          const progressPercentage = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;
          
          return {
            ...route,
            completed_orders: completedOrders,
            progress_percentage: progressPercentage,
            status: progressPercentage === 100 ? 'completed' : (progressPercentage > 0 ? 'in_progress' : route.status)
          };
        });
        
        setRoutes(processedRoutes);
        console.log(`Loaded ${processedRoutes.length} routes for driver: ${driverId}`);
      } else {
        throw new Error(result.message || 'Failed to load driver routes');
      }
      
    } catch (error) {
      console.error('Failed to load driver routes:', error);
      setError(`Failed to load routes: ${error.message}`);
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRouteDetails = async (route) => {
    setSelectedRoute(route);
    setRouteOrders(route.orders || []);
  };

  const updateDeliveryStatus = async (orderId, newStatus) => {
    try {
      console.log(`Updating order ${orderId} to ${newStatus}`);
      
      setRouteOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, delivery_status: newStatus } : order
      ));

      const result = await driverAPI.updateDeliveryStatus(driverId, orderId, newStatus);
      
      if (result.success) {
        setRoutes(prev => prev.map(route => {
          if (route.id === selectedRoute?.id || route.route_id === selectedRoute?.route_id) {
            const updatedOrders = routeOrders.map(order => 
              order.id === orderId ? { ...order, delivery_status: newStatus } : order
            );
            const completedCount = updatedOrders.filter(o => o.delivery_status === 'delivered').length;
            const newProgress = Math.round((completedCount / updatedOrders.length) * 100);
            
            return {
              ...route,
              completed_orders: completedCount,
              progress_percentage: newProgress,
              status: newProgress === 100 ? 'completed' : (newProgress > 0 ? 'in_progress' : 'assigned')
            };
          }
          return route;
        }));

        if (selectedRoute) {
          const completedCount = routeOrders.filter(o => 
            o.id === orderId ? newStatus === 'delivered' : o.delivery_status === 'delivered'
          ).length;
          const newProgress = Math.round((completedCount / routeOrders.length) * 100);
          
          setSelectedRoute(prev => ({
            ...prev,
            completed_orders: completedCount,
            progress_percentage: newProgress,
            status: newProgress === 100 ? 'completed' : (newProgress > 0 ? 'in_progress' : 'assigned')
          }));
        }
        
        console.log('Delivery status updated successfully');
      } else {
        throw new Error(result.message || 'Failed to update status');
      }
      
    } catch (error) {
      console.error('Failed to update delivery status:', error);
      setError('Failed to update delivery status');
      loadRouteDetails(selectedRoute);
    }
  };

  // Navigate to specific segment
  const navigateToSegment = (route, segment) => {
    const segmentOrders = segment.orders;
    const depot = { lat: 53.3808256, lng: -2.575416 }; // Warrington depot
    
    // Create navigation URL for segment
    const waypoints = segmentOrders.map(order => `${order.latitude},${order.longitude}`).join(',');
    const navigationUrl = `https://wego.here.com/directions/mix/${depot.lat},${depot.lng}/${waypoints}/${depot.lat},${depot.lng}`;
    
    // Open navigation in new window
    window.open(navigationUrl, '_blank');
    
    console.log(`📍 Navigating to ${route.route_name} - Segment ${segment.segment_id} with ${segment.orders.length} orders`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'assigned': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'assigned': return 'Assigned';
      default: return 'Unknown';
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDistance = (km) => {
    if (!km) return '0km';
    return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
  };

  // Route Details View
  if (selectedRoute) {
    const completedOrders = routeOrders.filter(order => order.delivery_status === 'delivered').length;
    const pendingOrders = routeOrders.filter(order => order.delivery_status !== 'delivered').length;
    const progressPercentage = routeOrders.length > 0 ? Math.round((completedOrders / routeOrders.length) * 100) : 0;

    return (
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-orange-500 to-yellow-500 p-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setSelectedRoute(null)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              ←
            </button>
            <h1 className="text-lg font-semibold">{selectedRoute.route_name}</h1>
            <button 
              onClick={() => loadRouteDetails(selectedRoute)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              🔄
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-sm text-gray-300">Route Progress</span>
              <span className="text-sm font-semibold">{completedOrders}/{routeOrders.length} completed</span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="text-center text-sm font-bold mt-1">{progressPercentage}%</div>
          </div>
        </div>

        {/* Orders List */}
        <div className="p-4 space-y-3">
          {routeOrders.map((order, index) => (
            <div key={order.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded mr-2">
                      #{index + 1}
                    </span>
                    <h3 className="font-semibold text-white">{order.customer_name}</h3>
                  </div>
                  <p className="text-sm text-gray-300 mb-1">{order.delivery_address}</p>
                  <p className="text-xs text-gray-400">{order.postcode}</p>
                </div>
                <div className="text-right ml-4">
                  <div className="text-lg font-bold text-orange-400">£{order.order_value || '0.00'}</div>
                  <div className="text-xs text-gray-400">{order.weight || 2}kg</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 mb-3">
                <a 
                  href={`https://wego.here.com/?map=${order.latitude},${order.longitude},15,normal`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                >
                  🧭 Navigate
                </a>
                <a 
                  href={`tel:${order.customer_phone}`}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-center py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                >
                  📞 Call
                </a>
              </div>

              {/* Delivery Status */}
              <div className="flex space-x-2">
                {order.delivery_status === 'delivered' ? (
                  <div className="flex-1 bg-green-600 text-white text-center py-2 px-3 rounded-lg text-sm font-medium">
                    ✅ Delivered
                  </div>
                ) : (
                  <button
                    onClick={() => updateDeliveryStatus(order.id, 'delivered')}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-center py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                  >
                    📦 Mark Delivered
                  </button>
                )}
              </div>

              {order.special_instructions && (
                <div className="mt-3 p-2 bg-gray-700 rounded text-xs text-gray-300">
                  <strong>Instructions:</strong> {order.special_instructions}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700">
          <div className="flex justify-around items-center py-2">
            <button 
              onClick={() => setSelectedRoute(null)}
              className="flex flex-col items-center space-y-1 p-2 text-orange-400"
            >
              <span className="text-2xl">🚛</span>
              <span className="text-xs">My Routes</span>
            </button>
            <button className="flex flex-col items-center space-y-1 p-2 text-gray-400">
              <span className="text-2xl">📍</span>
              <span className="text-xs">Navigate</span>
            </button>
            <button className="flex flex-col items-center space-y-1 p-2 text-gray-400">
              <span className="text-2xl">📞</span>
              <span className="text-xs">Support</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Routes List View
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-orange-500 to-yellow-500 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">My Routes</h1>
            <p className="text-gray-400 text-sm">Driver: {driverId} • {routes.length} assigned routes</p>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setLiveUpdateEnabled(!liveUpdateEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                liveUpdateEnabled ? 'bg-white/20' : 'bg-white/10'
              }`}
            >
              {liveUpdateEnabled ? '🔴' : '⚪'}
            </button>
            <button 
              onClick={loadDriverRoutes}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              disabled={loading}
            >
              {loading ? '⏳' : '🔄'}
            </button>
          </div>
        </div>

        {/* Live Update Status */}
        {liveUpdateEnabled && (
          <div className="text-xs text-gray-200 mb-2">
            🔴 Live updates enabled • Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="m-4 p-3 bg-red-600/20 border border-red-500 rounded-lg">
          <p className="text-red-400 text-sm">⚠️ {error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && routes.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-xl font-semibold mb-2">Loading Routes...</h2>
          <p className="text-gray-400">Please wait while we fetch your assignments</p>
        </div>
      )}

      {/* Dashboard Stats */}
      {!loading && routes.length > 0 && (
        <div className="p-4">
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div>
              <div className="text-lg font-bold text-green-500">
                {routes.reduce((sum, route) => sum + (route.completed_orders || 0), 0)}
              </div>
              <div className="text-xs text-gray-400">Delivered</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-500">
                {routes.reduce((sum, route) => sum + ((route.total_orders || 0) - (route.completed_orders || 0)), 0)}
              </div>
              <div className="text-xs text-gray-400">Pending</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-500">
                {routes.length > 0 ? Math.round(routes.reduce((sum, route) => sum + (route.progress_percentage || 0), 0) / routes.length) : 0}%
              </div>
              <div className="text-xs text-gray-400">Progress</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-500">
                {routes.reduce((sum, route) => sum + (route.depot_returns_needed || 1), 0)}
              </div>
              <div className="text-xs text-gray-400">Returns</div>
            </div>
          </div>
        </div>
      )}

      {/* No Routes Message */}
      {!loading && routes.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🚛</div>
          <h2 className="text-xl font-semibold mb-2">No Routes Assigned</h2>
          <p className="text-gray-400 mb-4">Waiting for route assignments from dispatch</p>
          <button 
            onClick={loadDriverRoutes}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Check for Updates
          </button>
        </div>
      )}

      {/* Routes */}
      <div className="p-4 space-y-4">
        {routes.map((route) => (
          <div key={route.id || route.route_id} className="bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl p-1">
            <div className="bg-gray-800 rounded-xl p-4 h-full">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: route.zone_color || '#FF6B35' }}
                  ></div>
                  <h2 className="text-xl font-bold text-white">{route.route_name}</h2>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(route.status)} text-white`}>
                  {getStatusText(route.status)}
                </span>
              </div>

              <div className="flex items-center space-x-6 mb-4 text-sm text-gray-300">
                <div className="flex items-center space-x-1">
                  <span>⏱️</span>
                  <span>{formatDuration(route.estimated_duration_minutes)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>📍</span>
                  <span>{formatDistance(route.total_distance_km)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>📦</span>
                  <span>{route.total_orders || 0} orders</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>{route.completed_orders || 0}/{route.total_orders || 0}</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${route.progress_percentage || 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Route Metrics */}
              <div className="mb-4 grid grid-cols-3 gap-2 text-xs text-gray-400">
                <div className="bg-gray-700/50 rounded p-2">
                  <div className="text-gray-500">Fuel Cost</div>
                  <div className="text-white font-semibold">£{route.estimated_fuel_cost || '0.00'}</div>
                </div>
                <div className="bg-gray-700/50 rounded p-2">
                  <div className="text-gray-500">Efficiency</div>
                  <div className="text-white font-semibold">{Math.round((route.efficiency_score || 0) * 100)}%</div>
                </div>
                <div className="bg-gray-700/50 rounded p-2">
                  <div className="text-gray-500">Depot Returns</div>
                  <div className="text-orange-400 font-semibold">{route.depot_returns_needed || 1}</div>
                </div>
              </div>

              {/* Depot Return Segments - OPTIMIZED for Performance */}
              <DepotReturnSegments 
                route={route} 
                onNavigateSegment={(segment) => navigateToSegment(route, segment)}
              />

              {/* Action Buttons */}
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={() => loadRouteDetails(route)}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  View Route
                </button>
                <a 
                  href={route.navigation_url || `https://wego.here.com/?map=${route.center_lat || 53.3808},${route.center_lng || -2.5740},12,normal`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  🧭
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700">
        <div className="flex justify-around items-center py-2">
          <button className="flex flex-col items-center space-y-1 p-2 text-orange-400">
            <span className="text-2xl">🚛</span>
            <span className="text-xs">My Routes</span>
          </button>
          <button 
            onClick={loadDriverRoutes}
            className="flex flex-col items-center space-y-1 p-2 text-gray-400"
          >
            <span className="text-2xl">🔄</span>
            <span className="text-xs">Refresh</span>
          </button>
          <button className="flex flex-col items-center space-y-1 p-2 text-gray-400">
            <span className="text-2xl">📊</span>
            <span className="text-xs">Stats</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverRoutes;