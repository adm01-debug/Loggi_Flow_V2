import { useState, useCallback, createContext, useContext, ReactNode } from "react";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  xpReward: number;
  coinsReward: number;
}

interface AchievementNotification extends Achievement {
  timestamp: number;
}

interface AchievementContextType {
  notifications: AchievementNotification[];
  unlockAchievement: (achievement: Achievement) => void;
  dismissNotification: (id: string) => void;
  clearAll: () => void;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export function AchievementProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AchievementNotification[]>([]);

  const unlockAchievement = useCallback((achievement: Achievement) => {
    const notification: AchievementNotification = {
      ...achievement,
      timestamp: Date.now(),
    };
    
    setNotifications((prev) => [...prev, notification]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.timestamp !== notification.timestamp));
    }, 5000);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <AchievementContext.Provider value={{ notifications, unlockAchievement, dismissNotification, clearAll }}>
      {children}
    </AchievementContext.Provider>
  );
}

export function useAchievementNotifications() {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error("useAchievementNotifications must be used within an AchievementProvider");
  }
  return context;
}
