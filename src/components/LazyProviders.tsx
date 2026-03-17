import { ReactNode, forwardRef } from "react";
import { AchievementProvider } from "@/hooks/useAchievementNotifications";
import { AchievementNotificationContainer } from "@/components/achievements/AchievementNotification";
import { TimezoneProvider } from "@/hooks/useTimezone";
import { SessionTimeoutWarning } from "@/components/security/SessionTimeoutWarning";
import { NewDeviceDetector } from "@/components/security/NewDeviceDetector";
import { SecurityPushNotificationProvider } from "@/components/security/SecurityPushNotificationProvider";
import { LiveRegionProvider } from "@/components/accessibility/LiveRegion";
import { ReducedMotionProvider } from "@/components/accessibility/ReducedMotion";

interface Props {
  children: ReactNode;
}

export default function LazyProviders({ children }: Props) {
  return (
    <ReducedMotionProvider>
      <LiveRegionProvider>
        <TimezoneProvider>
          <AchievementProvider>
            <AchievementNotificationContainer />
            <SessionTimeoutWarning />
            <NewDeviceDetector />
            <SecurityPushNotificationProvider />
            {children}
          </AchievementProvider>
        </TimezoneProvider>
      </LiveRegionProvider>
    </ReducedMotionProvider>
  );
}
