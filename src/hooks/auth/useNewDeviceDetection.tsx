import { useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from "@/hooks/auth/useAuth";
import { toast } from 'sonner';

interface DeviceInfo {
  browser: string;
  os: string;
  device_type: string;
  fingerprint: string;
}

function parseUserAgent(): DeviceInfo {
  const ua = navigator.userAgent;
  
  // Detect browser
  let browser = 'Unknown';
  if (ua.includes('Firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('Edg')) {
    browser = 'Microsoft Edge';
  } else if (ua.includes('Chrome')) {
    browser = 'Chrome';
  } else if (ua.includes('Safari')) {
    browser = 'Safari';
  } else if (ua.includes('Opera') || ua.includes('OPR')) {
    browser = 'Opera';
  }

  // Detect OS
  let os = 'Unknown';
  if (ua.includes('Windows NT 10')) {
    os = 'Windows 10/11';
  } else if (ua.includes('Windows')) {
    os = 'Windows';
  } else if (ua.includes('Mac OS X')) {
    os = 'macOS';
  } else if (ua.includes('Linux')) {
    os = 'Linux';
  } else if (ua.includes('Android')) {
    os = 'Android';
  } else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
    os = 'iOS';
  }

  // Detect device type
  let device_type = 'Desktop';
  if (/Mobi|Android/i.test(ua)) {
    device_type = 'Mobile';
  } else if (/Tablet|iPad/i.test(ua)) {
    device_type = 'Tablet';
  }

  // Generate a simple fingerprint based on available info
  const fingerprint = btoa(`${browser}-${os}-${device_type}-${navigator.language}-${screen.width}x${screen.height}`);

  return { browser, os, device_type, fingerprint };
}

async function getClientIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'Unknown';
  }
}

export function useNewDeviceDetection() {
  const { user } = useAuth();

  const checkAndRegisterDevice = useCallback(async () => {
    if (!user?.id || !user?.email) return;

    try {
      const deviceInfo = parseUserAgent();
      const ipAddress = await getClientIP();

      // Check if device is already known
      const { data: existingDevice, error: checkError } = await supabase
        .from('known_devices')
        .select('*')
        .eq('user_id', user.id)
        .eq('device_fingerprint', deviceInfo.fingerprint)
        .maybeSingle();

      if (checkError) {
        return;
      }

      if (existingDevice) {
        // Update last seen
        await supabase
          .from('known_devices')
          .update({ 
            last_seen_at: new Date().toISOString(),
            ip_address: ipAddress 
          })
          .eq('id', existingDevice.id);
        
        // Known device updated
        return;
      }

      // Check if user has any devices registered (first login detection)
      const { count } = await supabase
        .from('known_devices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const isFirstDevice = count === 0;

      // Register new device
      const { error: insertError } = await supabase
        .from('known_devices')
        .insert({
          user_id: user.id,
          device_fingerprint: deviceInfo.fingerprint,
          ip_address: ipAddress,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          device_type: deviceInfo.device_type,
          is_trusted: isFirstDevice, // First device is automatically trusted
        });

      if (insertError) {
        return;
      }

      // If not first device, send email alert
      if (!isFirstDevice) {
        const { error: emailError } = await supabase.functions.invoke('new-device-alert', {
          body: {
            user_id: user.id,
            user_email: user.email,
            device_info: {
              browser: deviceInfo.browser,
              os: deviceInfo.os,
              device_type: deviceInfo.device_type,
              ip_address: ipAddress,
            },
            login_time: new Date().toISOString(),
          },
        });

        if (!emailError) {
          toast.info('Novo dispositivo detectado', {
            description: 'Um email de alerta foi enviado para sua conta.',
          });
        }
      }
    } catch {
      // Silent fail - device detection is non-critical
    }
  }, [user?.id, user?.email]);

  // Run device check on mount when user is authenticated
  useEffect(() => {
    if (user?.id) {
      checkAndRegisterDevice();
    }
  }, [user?.id, checkAndRegisterDevice]);

  return { checkAndRegisterDevice };
}
