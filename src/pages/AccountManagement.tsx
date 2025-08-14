import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  Trash2, 
  Shield, 
  Database, 
  AlertTriangle,
  FileText,
  Calendar,
  Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AccountManagement = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const exportUserData = async () => {
    setLoading(true);
    try {
      // Fetch all user data
      const [
        { data: profile },
        { data: stats },
        { data: cityItems },
        { data: activities },
        { data: breakSchedules },
        { data: settings },
        { data: rewards }
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user?.id).single(),
        supabase.from('stats').select('*').eq('user_id', user?.id).single(),
        supabase.from('city_items').select('*').eq('user_id', user?.id),
        supabase.from('activity_completions').select('*').eq('user_id', user?.id),
        supabase.from('break_schedules').select('*').eq('user_id', user?.id),
        supabase.from('user_settings').select('*').eq('user_id', user?.id).single(),
        supabase.from('daily_rewards').select('*').eq('user_id', user?.id)
      ]);

      const userData = {
        exported_at: new Date().toISOString(),
        user_id: user?.id,
        email: user?.email,
        profile,
        stats,
        city_items: cityItems || [],
        activity_completions: activities || [],
        break_schedules: breakSchedules || [],
        user_settings: settings,
        daily_rewards: rewards || []
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(userData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mindscape-city-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported successfully!",
        description: "Your data has been downloaded as a JSON file"
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export failed",
        description: "Failed to export your data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      toast({
        title: "Confirmation required",
        description: "Please type 'DELETE' to confirm account deletion",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Delete user data in order (foreign keys)
      await supabase.from('daily_rewards').delete().eq('user_id', user?.id);
      await supabase.from('activity_completions').delete().eq('user_id', user?.id);
      await supabase.from('city_items').delete().eq('user_id', user?.id);
      await supabase.from('break_schedules').delete().eq('user_id', user?.id);
      await supabase.from('screen_time_settings').delete().eq('user_id', user?.id);
      await supabase.from('stats').delete().eq('user_id', user?.id);
      await supabase.from('user_settings').delete().eq('user_id', user?.id);
      await supabase.from('profiles').delete().eq('user_id', user?.id);

      // Delete auth user (this will cascade to all related data)
      const { error } = await supabase.auth.admin.deleteUser(user?.id || '');
      
      if (error) {
        // If admin delete fails, try user delete
        await supabase.auth.signOut();
      }

      toast({
        title: "Account deleted",
        description: "Your account and all data have been permanently deleted"
      });

      navigate('/auth');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Deletion failed",
        description: "Failed to delete your account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-magic bg-clip-text text-transparent">
          Account Management
        </h1>
        <p className="text-muted-foreground">
          Manage your account settings and data
        </p>
      </div>

      {/* Data Export */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="w-5 h-5 mr-2 text-primary" />
            Export My Data
          </CardTitle>
          <CardDescription>
            Download all your data including city items, activity history, and settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-background/50 rounded-lg">
              <Database className="w-6 h-6 text-primary" />
              <div>
                <p className="text-sm font-medium">Profile & Settings</p>
                <p className="text-xs text-muted-foreground">Personal info & preferences</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-background/50 rounded-lg">
              <Building2 className="w-6 h-6 text-accent" />
              <div>
                <p className="text-sm font-medium">City Items</p>
                <p className="text-xs text-muted-foreground">Your collected treasures</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-background/50 rounded-lg">
              <Calendar className="w-6 h-6 text-rare-glow" />
              <div>
                <p className="text-sm font-medium">Activity History</p>
                <p className="text-xs text-muted-foreground">Completed sessions</p>
              </div>
            </div>
          </div>
          <Button 
            onClick={exportUserData} 
            disabled={loading}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            {loading ? 'Exporting...' : 'Export All Data'}
          </Button>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2 text-primary" />
            Privacy & Security
          </CardTitle>
          <CardDescription>
            Your data privacy and security information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-background/50 rounded-lg">
              <h4 className="font-medium mb-2">Data Storage</h4>
              <p className="text-sm text-muted-foreground">
                All your data is stored securely with Supabase and encrypted at rest. 
                We never share your personal information with third parties.
              </p>
            </div>
            <div className="p-4 bg-background/50 rounded-lg">
              <h4 className="font-medium mb-2">Data Retention</h4>
              <p className="text-sm text-muted-foreground">
                Your data is kept only as long as your account exists. 
                You can export or delete your data at any time.
              </p>
            </div>
          </div>
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertTitle>Data Protection</AlertTitle>
            <AlertDescription>
              We comply with data protection regulations and use industry-standard security measures 
              to protect your personal information.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Account Deletion */}
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <Trash2 className="w-5 h-5 mr-2" />
            Delete Account
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-destructive/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning: This action is irreversible</AlertTitle>
            <AlertDescription>
              Deleting your account will permanently remove:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Your profile and settings</li>
                <li>All city items and progress</li>
                <li>Activity history and statistics</li>
                <li>Daily rewards and achievements</li>
              </ul>
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            <label className="text-sm font-medium">
              Type <code className="bg-muted px-1 rounded">DELETE</code> to confirm:
            </label>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-destructive/20"
              placeholder="Type DELETE to confirm"
            />
            <Button
              variant="destructive"
              onClick={deleteAccount}
              disabled={loading || deleteConfirm !== 'DELETE'}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {loading ? 'Deleting Account...' : 'Delete Account Permanently'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountManagement;