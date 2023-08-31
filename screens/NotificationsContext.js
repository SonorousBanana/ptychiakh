import React, { createContext, useContext, useState } from 'react';

const NotificationsContext = createContext();

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const [newNotificationsCount, setNewNotificationsCount] = useState(0);

  const addNotification = (message) => {
    setNotifications([...notifications, message]);
    setNewNotificationsCount(newNotificationsCount + 1);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setNewNotificationsCount(0);
  };

  return (
    <NotificationsContext.Provider value={{ notifications, newNotificationsCount, addNotification, clearNotifications }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
