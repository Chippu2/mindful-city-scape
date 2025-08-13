import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Clock, Plus, Trash2, Bell, BellOff } from 'lucide-react';

interface BreakSchedule {
  id: string;
  break_time: string;
  is_active: boolean;
  do_not_disturb_start?: string;
  do_not_disturb_end?: string;
}

const Home = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<BreakSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBreakTime, setNewBreakTime] = useState('');
  const [dndStart, setDndStart] = useState('');
  const [dndEnd, setDndEnd] = useState('');

  useEffect(() => {
    if (user) {
      fetchSchedules();
    }
  }, [user]);

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('break_schedules')
        .select('*')
        .eq('user_id', user?.id)
        .order('break_time');

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast({
        title: "Error",
        description: "Failed to load your break schedule",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addBreakTime = async () => {
    if (!newBreakTime) return;

    try {
      const { error } = await supabase
        .from('break_schedules')
        .insert({
          user_id: user?.id,
          break_time: newBreakTime,
          do_not_disturb_start: dndStart || null,
          do_not_disturb_end: dndEnd || null,
        });

      if (error) throw error;

      setNewBreakTime('');
      setDndStart('');
      setDndEnd('');
      fetchSchedules();
      
      toast({
        title: "Break time added!",
        description: "Your mindful moment has been scheduled"
      });
    } catch (error) {
      console.error('Error adding break time:', error);
      toast({
        title: "Error",
        description: "Failed to add break time",
        variant: "destructive"
      });
    }
  };

  const toggleSchedule = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('break_schedules')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      fetchSchedules();
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast({
        title: "Error", 
        description: "Failed to update schedule",
        variant: "destructive"
      });
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('break_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchSchedules();
      
      toast({
        title: "Break time removed",
        description: "Schedule updated successfully"
      });
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast({
        title: "Error",
        description: "Failed to delete schedule",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded animate-pulse"></div>
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
          Your Mindful Schedule
        </h1>
        <p className="text-muted-foreground">
          Plan your peaceful breaks and watch your magical city grow
        </p>
      </div>

      {/* Add new break time */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="w-5 h-5 mr-2 text-primary" />
            Schedule a Mindful Break
          </CardTitle>
          <CardDescription>
            Add times when you'd like to take peaceful moments throughout your day
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="breakTime">Break Time</Label>
              <Input
                id="breakTime"
                type="time"
                value={newBreakTime}
                onChange={(e) => setNewBreakTime(e.target.value)}
                className="border-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dndStart">Do Not Disturb Start (Optional)</Label>
              <Input
                id="dndStart"
                type="time"
                value={dndStart}
                onChange={(e) => setDndStart(e.target.value)}
                className="border-primary/20"
                placeholder="e.g., 22:00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dndEnd">Do Not Disturb End (Optional)</Label>
              <Input
                id="dndEnd"
                type="time"
                value={dndEnd}
                onChange={(e) => setDndEnd(e.target.value)}
                className="border-primary/20"
                placeholder="e.g., 08:00"
              />
            </div>
          </div>
          <Button 
            onClick={addBreakTime} 
            disabled={!newBreakTime}
            className="bg-gradient-magic hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Break Time
          </Button>
        </CardContent>
      </Card>

      {/* Scheduled breaks */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center">
          <Clock className="w-5 h-5 mr-2 text-primary" />
          Your Scheduled Breaks
        </h2>
        
        {schedules.length === 0 ? (
          <Card className="border-dashed border-primary/20">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No breaks scheduled yet</h3>
              <p className="text-muted-foreground">
                Add your first mindful break above to start building your magical city!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {schedules.map((schedule) => (
              <Card key={schedule.id} className={`
                transition-all duration-200 border-2
                ${schedule.is_active 
                  ? 'border-primary/40 bg-gradient-to-r from-primary/5 to-accent/5' 
                  : 'border-muted bg-muted/20'
                }
              `}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-4">
                    <div className={`
                      p-2 rounded-full transition-colors
                      ${schedule.is_active 
                        ? 'bg-gradient-magic text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                      }
                    `}>
                      {schedule.is_active ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-medium">
                        {new Date(`2000-01-01T${schedule.break_time}`).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {(schedule.do_not_disturb_start || schedule.do_not_disturb_end) && (
                        <p className="text-sm text-muted-foreground">
                          DND: {schedule.do_not_disturb_start} - {schedule.do_not_disturb_end}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={schedule.is_active}
                      onCheckedChange={(checked) => toggleSchedule(schedule.id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteSchedule(schedule.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;