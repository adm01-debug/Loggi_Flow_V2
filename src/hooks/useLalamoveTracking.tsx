import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DriverLocation {
  driverId: string;
  name: string;
  phone: string;
  plateNumber: string;
  photo: string;
  coordinates: {
    lat: number;
    lng: number;
    updatedAt: string;
  };
}

interface OrderStop {
  coordinates: {
    lat: number;
    lng: number;
  };
  address: string;
  name: string;
  phone: string;
}

interface OrderDetails {
  orderId: string;
  driverId: string;
  shareLink: string;
  status: string;
  distance: {
    value: string;
    unit: string;
  };
  stops: OrderStop[];
}

interface TrackingAlert {
  id: string;
  type: 'route_deviation' | 'stopped' | 'speed_anomaly' | 'arrived_pickup' | 'arrived_delivery';
  message: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'critical';
}

interface LocationHistory {
  lat: number;
  lng: number;
  timestamp: Date;
}

export const useLalamoveTracking = (orderId: string | null, useSandbox = true) => {
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [alerts, setAlerts] = useState<TrackingAlert[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationHistory[]>([]);
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationRef = useRef<{ lat: number; lng: number; timestamp: Date } | null>(null);
  const stoppedTimeRef = useRef<Date | null>(null);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Check if driver is on route
  const checkRouteDeviation = (
    driverLat: number,
    driverLng: number,
    stops: OrderStop[]
  ): boolean => {
    if (stops.length < 2) return false;

    // Simple check: distance from the line between origin and destination
    const origin = stops[0].coordinates;
    const destination = stops[stops.length - 1].coordinates;

    // Calculate perpendicular distance from point to line
    const A = driverLat - origin.lat;
    const B = driverLng - origin.lng;
    const C = destination.lat - origin.lat;
    const D = destination.lng - origin.lng;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    const param = lenSq !== 0 ? dot / lenSq : -1;

    let nearestLat: number, nearestLng: number;

    if (param < 0) {
      nearestLat = origin.lat;
      nearestLng = origin.lng;
    } else if (param > 1) {
      nearestLat = destination.lat;
      nearestLng = destination.lng;
    } else {
      nearestLat = origin.lat + param * C;
      nearestLng = origin.lng + param * D;
    }

    const distance = calculateDistance(driverLat, driverLng, nearestLat, nearestLng);
    
    // Consider deviated if more than 500m from route
    return distance > 500;
  };

  // Add alert
  const addAlert = (
    type: TrackingAlert['type'],
    message: string,
    severity: TrackingAlert['severity']
  ) => {
    const newAlert: TrackingAlert = {
      id: crypto.randomUUID(),
      type,
      message,
      timestamp: new Date(),
      severity,
    };

    setAlerts((prev) => [newAlert, ...prev.slice(0, 9)]); // Keep last 10 alerts

    if (severity === 'critical') {
      toast.error(message);
    } else if (severity === 'warning') {
      toast.warning(message);
    } else {
      toast.info(message);
    }
  };

  // Clear alert
  const clearAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  // Fetch order details
  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) return null;

    try {
      const { data, error } = await supabase.functions.invoke('lalamove-tracking', {
        body: { action: 'getOrderDetails', orderId, useSandbox },
      });

      if (error) throw error;

      const order = data.data;
      const orderInfo: OrderDetails = {
        orderId: order.orderId,
        driverId: order.driverId,
        shareLink: order.shareLink,
        status: order.status,
        distance: order.distance,
        stops: order.stops.map((stop: any) => ({
          coordinates: {
            lat: parseFloat(stop.coordinates.lat),
            lng: parseFloat(stop.coordinates.lng),
          },
          address: stop.address,
          name: stop.name,
          phone: stop.phone,
        })),
      };

      setOrderDetails(orderInfo);
      return orderInfo;
    } catch (err: any) {
      console.error('Error fetching order details:', err);
      setError(err.message);
      return null;
    }
  }, [orderId, useSandbox]);

  // Fetch driver location
  const fetchDriverLocation = useCallback(async () => {
    if (!orderId || !orderDetails?.driverId) return;

    try {
      const { data, error } = await supabase.functions.invoke('lalamove-tracking', {
        body: { 
          action: 'getDriverLocation', 
          orderId, 
          driverId: orderDetails.driverId,
          useSandbox 
        },
      });

      if (error) throw error;

      const driver = data.data;
      const currentLat = parseFloat(driver.coordinates.lat);
      const currentLng = parseFloat(driver.coordinates.lng);

      const location: DriverLocation = {
        driverId: driver.driverId,
        name: driver.name,
        phone: driver.phone,
        plateNumber: driver.plateNumber,
        photo: driver.photo,
        coordinates: {
          lat: currentLat,
          lng: currentLng,
          updatedAt: driver.coordinates.updatedAt,
        },
      };

      // Add to location history
      setLocationHistory((prev) => [
        ...prev,
        { lat: currentLat, lng: currentLng, timestamp: new Date() },
      ].slice(-50)); // Keep last 50 points

      // Check for alerts
      if (lastLocationRef.current) {
        const distance = calculateDistance(
          lastLocationRef.current.lat,
          lastLocationRef.current.lng,
          currentLat,
          currentLng
        );

        // Check if stopped (moved less than 10m in 2 minutes)
        if (distance < 10) {
          if (!stoppedTimeRef.current) {
            stoppedTimeRef.current = new Date();
          } else {
            const stoppedDuration = (new Date().getTime() - stoppedTimeRef.current.getTime()) / 1000 / 60;
            if (stoppedDuration >= 2) {
              addAlert(
                'stopped',
                `Motorista parado há ${Math.round(stoppedDuration)} minutos`,
                stoppedDuration >= 5 ? 'critical' : 'warning'
              );
            }
          }
        } else {
          stoppedTimeRef.current = null;
        }

        // Check route deviation
        if (orderDetails?.stops && checkRouteDeviation(currentLat, currentLng, orderDetails.stops)) {
          addAlert(
            'route_deviation',
            'Motorista desviou da rota planejada',
            'warning'
          );
        }

        // Check if arrived at destination
        const destination = orderDetails?.stops[orderDetails.stops.length - 1];
        if (destination) {
          const distanceToDestination = calculateDistance(
            currentLat,
            currentLng,
            destination.coordinates.lat,
            destination.coordinates.lng
          );
          if (distanceToDestination < 100) {
            addAlert('arrived_delivery', 'Motorista chegou ao destino!', 'info');
          }
        }
      }

      lastLocationRef.current = { lat: currentLat, lng: currentLng, timestamp: new Date() };
      setDriverLocation(location);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching driver location:', err);
      // Don't set error for 403 (driver not available yet)
      if (!err.message?.includes('403')) {
        setError(err.message);
      }
    }
  }, [orderId, orderDetails, useSandbox]);

  // Start tracking
  const startTracking = useCallback(async () => {
    if (!orderId) {
      toast.error('ID do pedido é obrigatório');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const order = await fetchOrderDetails();
      
      if (!order) {
        throw new Error('Não foi possível obter detalhes do pedido');
      }

      if (!order.driverId) {
        toast.warning('Aguardando motorista aceitar o pedido...');
      }

      setIsTracking(true);

      // Start polling for driver location every 10 seconds
      pollingIntervalRef.current = setInterval(() => {
        fetchDriverLocation();
      }, 10000);

      // Initial fetch
      fetchDriverLocation();
    } catch (err: any) {
      console.error('Error starting tracking:', err);
      setError(err.message);
      toast.error('Erro ao iniciar rastreamento');
    } finally {
      setIsLoading(false);
    }
  }, [orderId, fetchOrderDetails, fetchDriverLocation]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsTracking(false);
    setDriverLocation(null);
    setOrderDetails(null);
    setLocationHistory([]);
    setAlerts([]);
    lastLocationRef.current = null;
    stoppedTimeRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return {
    driverLocation,
    orderDetails,
    alerts,
    locationHistory,
    isTracking,
    isLoading,
    error,
    startTracking,
    stopTracking,
    clearAlert,
    refetchDriverLocation: fetchDriverLocation,
  };
};
