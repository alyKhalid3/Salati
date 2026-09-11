// src/context/NotificationContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { storageBackend } from '../utils/storage';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
  const [reminderMinutes, setReminderMinutesState] = useState(10);
  const [recurringReminders, setRecurringRemindersState] = useState(true);
  // Settings load asynchronously; scheduling waits for this so a pass with
  // defaults doesn't race the pass with the user's saved values.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await storageBackend.getSettings();
        setNotificationsEnabledState(s.notificationsEnabled ?? true);
        setReminderMinutesState(s.reminderMinutes ?? 10);
        setRecurringRemindersState(s.recurringReminders ?? true);
      } catch {}
      setReady(true);
    })();
  }, []);

  const persist = (patch) => {
    storageBackend.getSettings()
      .then(s => storageBackend.saveSettings({ ...s, ...patch }))
      .catch(() => {});
  };

  const setNotificationsEnabled = (v) => { setNotificationsEnabledState(v); persist({ notificationsEnabled: v }); };
  const setReminderMinutes = (m) => { setReminderMinutesState(m); persist({ reminderMinutes: m }); };
  const setRecurringReminders = (v) => { setRecurringRemindersState(v); persist({ recurringReminders: v }); };

  return (
    <NotificationContext.Provider value={{
      notificationsEnabled,
      setNotificationsEnabled,
      reminderMinutes,
      setReminderMinutes,
      recurringReminders,
      setRecurringReminders,
      ready,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
