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

interface TrackingHistoryRecord {
  id: string;
  lalamove_order_id: string;
  driver_name: string | null;
  latitude: number;
  longitude: number;
  recorded_at: string;
  order_status: string | null;
}

export const useLalamoveTracking = (orderId: string | null, useSandbox = true, coletaId?: string) => {
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [alerts, setAlerts] = useState<TrackingAlert[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationHistory[]>([]);
  const [savedHistory, setSavedHistory] = useState<TrackingHistoryRecord[]>([]);
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationRef = useRef<{ lat: number; lng: number; timestamp: Date } | null>(null);
  const stoppedTimeRef = useRef<Date | null>(null);
  const lastSavedLocationRef = useRef<{ lat: number; lng: number } | null>(null);

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

    const origin = stops[0].coordinates;
    const destination = stops[stops.length - 1].coordinates;

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
    
    return distance > 500;
  };

  // Save location to database
  const saveLocationToDatabase = async (
    location: DriverLocation,
    orderInfo: OrderDetails
  ) => {
    if (!orderId) return;

    // Only save if driver moved more than 50 meters
    if (lastSavedLocationRef.current) {
      const distance = calculateDistance(
        lastSavedLocationRef.current.lat,
        lastSavedLocationRef.current.lng,
        location.coordinates.lat,
        location.coordinates.lng
      );
      if (distance < 50) return;
    }

    try {
      const { error } = await supabase.from('rastreamento_historico').insert({
        coleta_id: coletaId || null,
        lalamove_order_id: orderId,
        driver_id: location.driverId,
        driver_name: location.name,
        driver_phone: location.phone,
        driver_plate: location.plateNumber,
        latitude: location.coordinates.lat,
        longitude: location.coordinates.lng,
        order_status: orderInfo.status,
        recorded_at: location.coordinates.updatedAt,
      });

      if (error) {
        // Error saving location to database - silent fail
      } else {
        lastSavedLocationRef.current = { 
          lat: location.coordinates.lat, 
          lng: location.coordinates.lng 
        };
      }
    } catch {
      // Error saving location - silent fail
    }
  };

  // Save alert to database
  const saveAlertToDatabase = async (
    type: string,
    severity: string,
    message: string,
    lat?: number,
    lng?: number
  ) => {
    if (!orderId) return;

    try {
      const { error } = await supabase.from('rastreamento_alertas').insert({
        lalamove_order_id: orderId,
        coleta_id: coletaId || null,
        alert_type: type,
        severity,
        message,
        latitude: lat,
        longitude: lng,
      });

      if (error) {
        // Silent fail - alert database logging is non-critical
      }
    } catch {
      // Silent fail
    }
  };

  // Add alert
  const addAlert = (
    type: TrackingAlert['type'],
    message: string,
    severity: TrackingAlert['severity'],
    lat?: number,
    lng?: number
  ) => {
    const newAlert: TrackingAlert = {
      id: crypto.randomUUID(),
      type,
      message,
      timestamp: new Date(),
      severity,
    };

    setAlerts((prev) => [newAlert, ...prev.slice(0, 9)]);

    // Save alert to database
    saveAlertToDatabase(type, severity, message, lat, lng);

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

  // Fetch saved history from database
  const fetchSavedHistory = useCallback(async () => {
    if (!orderId) return;

    try {
      const { data, error } = await supabase
        .from('rastreamento_historico')
        .select('*')
        .eq('lalamove_order_id', orderId)
        .order('recorded_at', { ascending: true });

      if (error) throw error;

      setSavedHistory(data || []);
    } catch {
      // Silent fail
    }
  }, [orderId]);

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
        stops: order.stops.map((stop: { coordinates: { lat: string; lng: string }; address: string; name: string; phone: string }) => ({
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
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
      ].slice(-50));

      // Save to database
      await saveLocationToDatabase(location, orderDetails);

      // Check for alerts
      if (lastLocationRef.current) {
        const distance = calculateDistance(
          lastLocationRef.current.lat,
          lastLocationRef.current.lng,
          currentLat,
          currentLng
        );

        // Check if stopped
        if (distance < 10) {
          if (!stoppedTimeRef.current) {
            stoppedTimeRef.current = new Date();
          } else {
            const stoppedDuration = (new Date().getTime() - stoppedTimeRef.current.getTime()) / 1000 / 60;
            if (stoppedDuration >= 2) {
              addAlert(
                'stopped',
                `Motorista parado há ${Math.round(stoppedDuration)} minutos`,
                stoppedDuration >= 5 ? 'critical' : 'warning',
                currentLat,
                currentLng
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
            'warning',
            currentLat,
            currentLng
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
            addAlert('arrived_delivery', 'Motorista chegou ao destino!', 'info', currentLat, currentLng);
          }
        }
      }

      lastLocationRef.current = { lat: currentLat, lng: currentLng, timestamp: new Date() };
      setDriverLocation(location);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      if (!errorMessage.includes('403')) {
        setError(errorMessage);
      }
    }
  }, [orderId, orderDetails, useSandbox, coletaId]);

  // Start tracking
  const startTracking = useCallback(async () => {
    if (!orderId) {
      toast.error('ID do pedido é obrigatório');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Load saved history first
      await fetchSavedHistory();

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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error('Erro ao iniciar rastreamento');
    } finally {
      setIsLoading(false);
    }
  }, [orderId, fetchOrderDetails, fetchDriverLocation, fetchSavedHistory]);

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
    lastSavedLocationRef.current = null;
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
    savedHistory,
    isTracking,
    isLoading,
    error,
    startTracking,
    stopTracking,
    clearAlert,
    refetchDriverLocation: fetchDriverLocation,
    refetchSavedHistory: fetchSavedHistory,
  };
};
