import React, { useEffect, useState } from 'react';
import { Notification as NotificationType } from '../types';

interface NotificationProps {
  notifications: NotificationType[];
}

function Notification({ notifications }: NotificationProps) {
  const [visibleNotifications, setVisibleNotifications] = useState<NotificationType[]>([]);

  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      setVisibleNotifications(prev => [latest, ...prev.slice(0, 2)]);

      // 5초 후 자동 제거
      const timer = setTimeout(() => {
        setVisibleNotifications(prev =>
          prev.filter(notification => notification.id !== latest.id)
        );
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notifications]);

  const removeNotification = (id: number) => {
    setVisibleNotifications(prev =>
      prev.filter(notification => notification.id !== id)
    );
  };

  return (
    <div className="fixed top-4 right-4 z-40 space-y-2">
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          className={`bg-white border-l-4 ${
            notification.type === 'PENALTY_DRAWN' 
              ? 'border-red-500' 
              : 'border-blue-500'
          } rounded-lg shadow-lg p-4 max-w-sm transform transition-all duration-300 ${
            index === 0 ? 'translate-x-0' : 'translate-x-2'
          }`}
          style={{ marginTop: index * 60 }}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">
                {notification.message}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(notification.timestamp).toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-2 text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Notification;