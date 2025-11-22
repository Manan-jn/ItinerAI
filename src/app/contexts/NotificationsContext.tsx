"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";

export interface Notification {
  id: string;
  message: string;
  timestamp: Date;
  read: boolean;
  source?: string; // Optional: track which component triggered the notification
}

interface NotificationsContextType {
  notifications: Notification[];
  addNotification: (message: string, source?: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  unreadCount: number;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  triggerFlyAnimation: boolean;
  setTriggerFlyAnimation: (trigger: boolean) => void;
  bellIconRef: React.RefObject<HTMLButtonElement | null>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [triggerFlyAnimation, setTriggerFlyAnimation] = useState(false);
  const bellIconRef = useRef<HTMLButtonElement | null>(null);

  const addNotification = useCallback((message: string, source?: string) => {
    const newNotification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      timestamp: new Date(),
      read: false,
      source,
    };

    setNotifications((prev) => [newNotification, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        unreadCount,
        isDropdownOpen,
        setIsDropdownOpen,
        triggerFlyAnimation,
        setTriggerFlyAnimation,
        bellIconRef,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
}
