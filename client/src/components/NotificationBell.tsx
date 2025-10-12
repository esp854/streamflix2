import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Trash2, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { io, Socket } from 'socket.io-client';

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'announcement';
  read: boolean;
  createdAt: string;
}

interface NotificationCount {
  total: number;
  unread: number;
  read: number;
}

const NotificationIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    case 'error':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    case 'announcement':
      return <Bell className="w-4 h-4 text-blue-500" />;
    default:
      return <Info className="w-4 h-4 text-blue-500" />;
  }
};

const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationCount, setNotificationCount] = useState<NotificationCount>({ total: 0, unread: 0, read: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const notificationRef = useRef<HTMLDivElement>(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const newSocket = io(process.env.NODE_ENV === 'production' ? 'https://streamflix2-o7vx.onrender.com' : 'http://localhost:5000');
      
      newSocket.on('connect', () => {
        console.log('Connected to notification service');
        newSocket.emit('join-notifications', { userId: user.id });
      });

      newSocket.on('new-notification', (notification: Notification) => {
        setNotifications(prev => [notification, ...prev]);
        setNotificationCount(prev => ({
          ...prev,
          unread: prev.unread + 1,
          total: prev.total + 1
        }));
        
        // Show toast for new notification
        toast({
          title: notification.title,
          description: notification.message,
          duration: 5000,
        });
      });

      newSocket.on('new-announcement', (announcement: any) => {
        const notification: Notification = {
          id: `announcement-${Date.now()}`,
          userId: user.id,
          title: announcement.title,
          message: announcement.message,
          type: 'announcement',
          read: false,
          createdAt: announcement.createdAt
        };
        
        setNotifications(prev => [notification, ...prev]);
        setNotificationCount(prev => ({
          ...prev,
          unread: prev.unread + 1,
          total: prev.total + 1
        }));
        
        // Show toast for announcement
        toast({
          title: `📢 ${announcement.title}`,
          description: announcement.message,
          duration: 8000,
        });
      });

      newSocket.on('unread-notifications', (unreadNotifications: Notification[]) => {
        setNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const newNotifications = unreadNotifications.filter(n => !existingIds.has(n.id));
          return [...newNotifications, ...prev];
        });
      });

      newSocket.on('notification-marked-read', ({ notificationId }: { notificationId: string }) => {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setNotificationCount(prev => ({
          ...prev,
          unread: Math.max(0, prev.unread - 1),
          read: prev.read + 1
        }));
      });

      setSocket(newSocket);

      return () => {
        newSocket.emit('leave-notifications');
        newSocket.disconnect();
      };
    }
  }, [isAuthenticated, user?.id, toast]);

  // Fetch notifications when component mounts or user changes
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchNotifications();
      fetchNotificationCount();
    }
  }, [isAuthenticated, user?.id]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/notifications', {
        credentials: 'include',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotificationCount = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/notifications/count', {
        credentials: 'include',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotificationCount(data);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      
      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setNotificationCount(prev => ({
          ...prev,
          unread: Math.max(0, prev.unread - 1),
          read: prev.read + 1
        }));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setNotificationCount(prev => ({
          ...prev,
          unread: 0,
          read: prev.total
        }));
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setNotificationCount(prev => ({
          ...prev,
          total: prev.total - 1,
          unread: Math.max(0, prev.unread - 1)
        }));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Il y a moins d\'une heure';
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)} heures`;
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative" ref={notificationRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-white hover:bg-white/20"
      >
        <Bell className="w-4 h-4" />
        {notificationCount.unread > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {notificationCount.unread > 99 ? '99+' : notificationCount.unread}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Notification Panel */}
          <Card className="absolute right-0 top-12 z-50 w-80 max-h-96 bg-gray-900 border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-sm font-semibold">
                  Notifications
                  {notificationCount.unread > 0 && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      {notificationCount.unread}
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center space-x-1">
                  {notificationCount.unread > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-white hover:bg-white/20 h-6 px-2 text-xs"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Tout marquer
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20 h-6 w-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <ScrollArea className="h-80">
                {isLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    Aucune notification
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b border-gray-700 hover:bg-gray-800 transition-colors ${
                          !notification.read ? 'bg-blue-900/20' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <NotificationIcon type={notification.type} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className={`text-sm font-medium ${
                                !notification.read ? 'text-white' : 'text-gray-300'
                              }`}>
                                {notification.title}
                              </h4>
                              <div className="flex items-center space-x-1">
                                {!notification.read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsRead(notification.id)}
                                    className="text-white hover:bg-white/20 h-5 w-5 p-0"
                                  >
                                    <Check className="w-3 h-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteNotification(notification.id)}
                                  className="text-white hover:bg-white/20 h-5 w-5 p-0"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
