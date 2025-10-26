import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Send, Users, User, Bell } from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
}

const AdminNotifications: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const { toast } = useToast();

  // Form states
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'info'
  });

  const [announcementForm, setAnnouncementForm] = useState({
    subject: '',
    message: ''
  });

  // Fetch users for notification targeting
  React.useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/users', {
        credentials: 'include',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Function to get CSRF token
  const getCSRFToken = async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/csrf-token', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.csrfToken;
      }
      return null;
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
      return null;
    }
  };

  const sendNotification = async () => {
    if (!selectedUserId || !notificationForm.title || !notificationForm.message) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Get CSRF token
      const csrfToken = await getCSRFToken();
      if (!csrfToken) {
        throw new Error('Impossible de récupérer le jeton CSRF');
      }
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: selectedUserId,
          title: notificationForm.title,
          message: notificationForm.message,
          type: notificationForm.type
        }),
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Notification envoyée avec succès",
        });
        
        // Reset form
        setNotificationForm({ title: '', message: '', type: 'info' });
        setSelectedUserId('');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l\'envoi');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de l'envoi de la notification",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendAnnouncement = async () => {
    if (!announcementForm.subject || !announcementForm.message) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Get CSRF token
      const csrfToken = await getCSRFToken();
      if (!csrfToken) {
        throw new Error('Impossible de récupérer le jeton CSRF');
      }
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/notifications/announcement', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          subject: announcementForm.subject,
          message: announcementForm.message
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Succès",
          description: `Annonce envoyée à ${data.notificationsCount} utilisateurs`,
        });
        
        // Reset form
        setAnnouncementForm({ subject: '', message: '' });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l\'envoi');
      }
    } catch (error) {
      console.error('Error sending announcement:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de l'envoi de l'annonce",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Bell className="w-6 h-6 text-blue-500" />
        <h2 className="text-2xl font-bold text-white">Gestion des Notifications</h2>
      </div>

      <Tabs defaultValue="notification" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          <TabsTrigger value="notification" className="text-white">
            <User className="w-4 h-4 mr-2" />
            Notification Individuelle
          </TabsTrigger>
          <TabsTrigger value="announcement" className="text-white">
            <Users className="w-4 h-4 mr-2" />
            Annonce Générale
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notification" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Envoyer une Notification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-select" className="text-white">Utilisateur</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Sélectionner un utilisateur" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id} className="text-white">
                        {user.username} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification-title" className="text-white">Titre</Label>
                <Input
                  id="notification-title"
                  value={notificationForm.title}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Titre de la notification"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification-type" className="text-white">Type</Label>
                <Select value={notificationForm.type} onValueChange={(value) => setNotificationForm(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="info" className="text-white">Information</SelectItem>
                    <SelectItem value="success" className="text-white">Succès</SelectItem>
                    <SelectItem value="warning" className="text-white">Avertissement</SelectItem>
                    <SelectItem value="error" className="text-white">Erreur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification-message" className="text-white">Message</Label>
                <Textarea
                  id="notification-message"
                  value={notificationForm.message}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Message de la notification"
                  className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
                />
              </div>

              <Button
                onClick={sendNotification}
                disabled={isLoading || !selectedUserId || !notificationForm.title || !notificationForm.message}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send className="w-4 h-4 mr-2" />
                {isLoading ? 'Envoi...' : 'Envoyer la Notification'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcement" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Envoyer une Annonce</CardTitle>
              <p className="text-gray-400 text-sm">
                Cette annonce sera envoyée à tous les utilisateurs de la plateforme
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="announcement-subject" className="text-white">Sujet</Label>
                <Input
                  id="announcement-subject"
                  value={announcementForm.subject}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Sujet de l'annonce"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="announcement-message" className="text-white">Message</Label>
                <Textarea
                  id="announcement-message"
                  value={announcementForm.message}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Message de l'annonce"
                  className="bg-gray-700 border-gray-600 text-white min-h-[150px]"
                />
              </div>

              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-yellow-200 text-sm">
                  ⚠️ <strong>Attention :</strong> Cette annonce sera envoyée à tous les utilisateurs connectés et non connectés. 
                  Assurez-vous que le contenu est approprié et nécessaire.
                </p>
              </div>

              <Button
                onClick={sendAnnouncement}
                disabled={isLoading || !announcementForm.subject || !announcementForm.message}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Users className="w-4 h-4 mr-2" />
                {isLoading ? 'Envoi...' : 'Envoyer l\'Annonce à Tous'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminNotifications;