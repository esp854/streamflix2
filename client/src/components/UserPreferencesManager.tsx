import React, { useState, useEffect } from 'react';
import { useUserPreferencesSync } from '@/hooks/useUserPreferencesSync';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  autoplay?: boolean;
  subtitles?: boolean;
  quality?: 'auto' | 'hd' | 'sd';
  notifications?: {
    newContent?: boolean;
    recommendations?: boolean;
    updates?: boolean;
  };
}

export default function UserPreferencesManager() {
  const { loadLocalPreferences, updatePreference, syncPreferences } = useUserPreferencesSync();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<UserPreferences>({});

  useEffect(() => {
    // Charger les préférences au montage du composant
    const localPreferences = loadLocalPreferences() || {};
    setPreferences(localPreferences);
  }, [loadLocalPreferences]);

  const handleThemeChange = (value: string) => {
    const theme = value as 'light' | 'dark' | 'system';
    setPreferences(prev => ({ ...prev, theme }));
    updatePreference('theme', theme);
    
    toast({
      title: "Préférences mises à jour",
      description: "Le thème a été mis à jour avec succès.",
    });
  };

  const handleLanguageChange = (value: string) => {
    setPreferences(prev => ({ ...prev, language: value }));
    updatePreference('language', value);
    
    toast({
      title: "Préférences mises à jour",
      description: "La langue a été mise à jour avec succès.",
    });
  };

  const handleAutoplayChange = (checked: boolean) => {
    setPreferences(prev => ({ ...prev, autoplay: checked }));
    updatePreference('autoplay', checked);
  };

  const handleSubtitlesChange = (checked: boolean) => {
    setPreferences(prev => ({ ...prev, subtitles: checked }));
    updatePreference('subtitles', checked);
  };

  const handleQualityChange = (value: string) => {
    const quality = value as 'auto' | 'hd' | 'sd';
    setPreferences(prev => ({ ...prev, quality }));
    updatePreference('quality', quality);
    
    toast({
      title: "Préférences mises à jour",
      description: "La qualité de lecture a été mise à jour avec succès.",
    });
  };

  const handleNotificationChange = (key: keyof NonNullable<UserPreferences['notifications']>, checked: boolean) => {
    const updatedNotifications = {
      ...preferences.notifications,
      [key]: checked
    };
    
    setPreferences(prev => ({ 
      ...prev, 
      notifications: updatedNotifications 
    }));
    
    updatePreference('notifications', updatedNotifications);
  };

  const handleSyncPreferences = async () => {
    try {
      await syncPreferences();
      toast({
        title: "Synchronisation réussie",
        description: "Vos préférences ont été synchronisées avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur de synchronisation",
        description: "Impossible de synchroniser vos préférences.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Préférences utilisateur</h2>
          <p className="text-muted-foreground">
            Gérez vos préférences et synchronisez-les entre vos appareils.
          </p>
        </div>
        <Button variant="outline" onClick={handleSyncPreferences}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Synchroniser
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Paramètres d'affichage */}
        <Card>
          <CardHeader>
            <CardTitle>Affichage</CardTitle>
            <CardDescription>
              Personnalisez l'apparence de l'application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="theme">Thème</Label>
              <Select value={preferences.theme || 'system'} onValueChange={handleThemeChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">Système</SelectItem>
                  <SelectItem value="light">Clair</SelectItem>
                  <SelectItem value="dark">Sombre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="language">Langue</Label>
              <Select value={preferences.language || 'fr'} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">Anglais</SelectItem>
                  <SelectItem value="es">Espagnol</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Paramètres de lecture */}
        <Card>
          <CardHeader>
            <CardTitle>Lecture</CardTitle>
            <CardDescription>
              Configurez vos préférences de lecture.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="autoplay">Lecture automatique</Label>
              <Switch
                id="autoplay"
                checked={preferences.autoplay ?? true}
                onCheckedChange={handleAutoplayChange}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="subtitles">Sous-titres</Label>
              <Switch
                id="subtitles"
                checked={preferences.subtitles ?? true}
                onCheckedChange={handleSubtitlesChange}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="quality">Qualité</Label>
              <Select value={preferences.quality || 'auto'} onValueChange={handleQualityChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="hd">HD</SelectItem>
                  <SelectItem value="sd">SD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Paramètres de notification */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Choisissez les notifications que vous souhaitez recevoir.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="new-content">Nouveaux contenus</Label>
              <Switch
                id="new-content"
                checked={preferences.notifications?.newContent ?? true}
                onCheckedChange={(checked) => handleNotificationChange('newContent', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="recommendations">Recommandations</Label>
              <Switch
                id="recommendations"
                checked={preferences.notifications?.recommendations ?? true}
                onCheckedChange={(checked) => handleNotificationChange('recommendations', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="updates">Mises à jour</Label>
              <Switch
                id="updates"
                checked={preferences.notifications?.updates ?? true}
                onCheckedChange={(checked) => handleNotificationChange('updates', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}