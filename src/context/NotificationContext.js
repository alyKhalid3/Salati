// src/context/NotificationContext.js
import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderMinutes, setReminderMinutes] = useState(10);
  const [recurringReminders, setRecurringReminders] = useState(true);

  return (
    <NotificationContext.Provider value={{
      notificationsEnabled,
      setNotificationsEnabled,
      reminderMinutes,
      setReminderMinutes,
      recurringReminders,
      setRecurringReminders,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
