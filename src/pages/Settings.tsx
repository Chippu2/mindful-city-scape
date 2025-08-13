import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Volume2, 
  Mic, 
  User,
  Save
} from 'lucide-react';

interface UserSettings {
  notifications_enabled: boolean;
  music_enabled: boolean;
  voice_guidance_enabled: boolean;
  volume: number;
}

interface UserProfile {
  username: string;
  email: string;
}

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings>({
    notifications_enabled: true,
    music_enabled: true,
    voice_guidance_enabled: true,
    volume: 0.5
  });
  const [profile, setProfile] = useState<UserProfile>({
    username: '',
    email: user?.email || ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSettings();
      fetchProfile();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, email')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setProfile({
          username: data.username || '',
          email: data.email || user?.email || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user?.id,
          ...settings
        });

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your preferences have been updated"
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user?.id,
          username: profile.username,
          email: profile.email
        });

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been saved"
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error", 
        description: "Failed to save profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-magic bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Customize your Mindscape City experience
        </p>
      </div>

      {/* Profile Settings */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2 text-primary" />
            Profile
          </CardTitle>
          <CardDescription>
            Update your personal information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={profile.username}
                onChange={(e) => setProfile({...profile, username: e.target.value})}
                placeholder="Your display name"
                className="border-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({...profile, email: e.target.value})}
                className="border-primary/20"
                disabled
              />
            </div>
          </div>
          <Button 
            onClick={saveProfile}
            disabled={saving}
            className="bg-gradient-magic hover:opacity-90"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="w-5 h-5 mr-2 text-primary" />
            Notifications
          </CardTitle>
          <CardDescription>
            Manage how Mindscape City reminds you to take breaks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Break Reminders</p>
              <p className="text-sm text-muted-foreground">
                Get notified when it's time for your scheduled breaks
              </p>
            </div>
            <Switch
              checked={settings.notifications_enabled}
              onCheckedChange={(checked) => 
                setSettings({...settings, notifications_enabled: checked})
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Audio Settings */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Volume2 className="w-5 h-5 mr-2 text-primary" />
            Audio
          </CardTitle>
          <CardDescription>
            Control music and voice guidance settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Background Music</p>
              <p className="text-sm text-muted-foreground">
                Play relaxing music during activities
              </p>
            </div>
            <Switch
              checked={settings.music_enabled}
              onCheckedChange={(checked) => 
                setSettings({...settings, music_enabled: checked})
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Voice Guidance</p>
              <p className="text-sm text-muted-foreground">
                Enable spoken instructions during activities
              </p>
            </div>
            <Switch
              checked={settings.voice_guidance_enabled}
              onCheckedChange={(checked) => 
                setSettings({...settings, voice_guidance_enabled: checked})
              }
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-medium">Volume</p>
              <span className="text-sm text-muted-foreground">
                {Math.round(settings.volume * 100)}%
              </span>
            </div>
            <Slider
              value={[settings.volume]}
              onValueChange={([value]) => setSettings({...settings, volume: value})}
              max={1}
              min={0}
              step={0.1}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save All Settings */}
      <div className="flex justify-center">
        <Button 
          onClick={saveSettings}
          disabled={saving}
          size="lg"
          className="bg-gradient-magic hover:opacity-90"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  );
};

export default Settings;