import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  CheckCircle, 
  Clock, 
  Sparkles, 
  Gem,
  Crown,
  Wind,
  Move,
  Palette,
  Heart,
  Brain
} from 'lucide-react';

interface Activity {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  activity_type: string;
  reward_item_name: string;
  reward_rarity: string;
  instructions: any;
}

interface ActivitySession {
  activity: Activity;
  currentStep: number;
  isActive: boolean;
  timeRemaining: number;
}

const activityIcons = {
  breathe: Wind,
  stretch: Move,
  doodle: Palette,
  reflect: Heart,
  meditate: Brain
};

const rarityConfig = {
  common: { icon: Sparkles, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20' },
  rare: { icon: Gem, color: 'text-rare-glow', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  legendary: { icon: Crown, color: 'text-legendary-glow', bg: 'bg-pink-500/10', border: 'border-pink-500/20' }
};

const Activities = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [session, setSession] = useState<ActivitySession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('duration_minutes');

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: "Error",
        description: "Failed to load activities",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startActivity = (activity: Activity) => {
    const instructions = Array.isArray(activity.instructions) 
      ? activity.instructions 
      : JSON.parse(activity.instructions as string);
    
    setSession({
      activity: { ...activity, instructions },
      currentStep: 0,
      isActive: true,
      timeRemaining: activity.duration_minutes * 60
    });
  };

  const nextStep = () => {
    if (!session) return;
    
    if (session.currentStep < session.activity.instructions.length - 1) {
      setSession({
        ...session,
        currentStep: session.currentStep + 1
      });
    } else {
      completeActivity();
    }
  };

  const completeActivity = async () => {
    if (!session || !user) return;

    try {
      // Record completion
      const { error: completionError } = await supabase
        .from('activity_completions')
        .insert({
          user_id: user.id,
          activity_id: session.activity.id,
          reward_earned: session.activity.reward_item_name
        });

      if (completionError) throw completionError;

      // Add city item reward
      const { error: rewardError } = await supabase
        .from('city_items')
        .insert({
          user_id: user.id,
          item_name: session.activity.reward_item_name,
          item_type: session.activity.activity_type,
          rarity: session.activity.reward_rarity,
          position_x: Math.random() * 800 + 100,
          position_y: Math.random() * 600 + 100,
          is_placed: false
        });

      if (rewardError) throw rewardError;

      const rarity = session.activity.reward_rarity;
      toast({
        title: "Activity Complete! 🎉",
        description: `You earned a ${rarity} ${session.activity.reward_item_name}! Check your city to place it.`
      });

      setSession(null);
    } catch (error) {
      console.error('Error completing activity:', error);
      toast({
        title: "Error",
        description: "Failed to complete activity",
        variant: "destructive"
      });
    }
  };

  const cancelActivity = () => {
    setSession(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  // Activity session view
  if (session) {
    const progress = ((session.currentStep + 1) / session.activity.instructions.length) * 100;
    const ActivityIcon = activityIcons[session.activity.activity_type as keyof typeof activityIcons] || Wind;
    
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-gradient-magic">
                <ActivityIcon className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl">{session.activity.name}</CardTitle>
            <CardDescription>
              Step {session.currentStep + 1} of {session.activity.instructions.length}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Progress value={progress} className="w-full" />
            
            <div className="text-center space-y-4">
              <p className="text-lg leading-relaxed p-6 bg-card rounded-lg border border-primary/10">
                {session.activity.instructions[session.currentStep]}
              </p>
              
              <div className="flex justify-center space-x-4">
                <Button 
                  variant="outline" 
                  onClick={cancelActivity}
                  className="border-primary/20"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={nextStep}
                  className="bg-gradient-magic hover:opacity-90"
                >
                  {session.currentStep < session.activity.instructions.length - 1 ? 'Next Step' : 'Complete'}
                  <CheckCircle className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Activities list view
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-magic bg-clip-text text-transparent">
          Mindful Activities
        </h1>
        <p className="text-muted-foreground">
          Complete guided activities to earn magical items for your city
        </p>
      </div>

      {/* Activities grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activities.map((activity) => {
          const ActivityIcon = activityIcons[activity.activity_type as keyof typeof activityIcons] || Wind;
          const rarity = rarityConfig[activity.reward_rarity as keyof typeof rarityConfig];
          const RarityIcon = rarity.icon;
          
          return (
            <Card 
              key={activity.id} 
              className={`
                transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer
                border-2 ${rarity.border} ${rarity.bg}
              `}
            >
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-gradient-magic">
                    <ActivityIcon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <Badge variant="outline" className={`${rarity.color} ${rarity.border}`}>
                    <RarityIcon className="w-3 h-3 mr-1" />
                    {activity.reward_rarity}
                  </Badge>
                </div>
                
                <div>
                  <CardTitle className="text-lg">{activity.name}</CardTitle>
                  <CardDescription className="flex items-center mt-2">
                    <Clock className="w-4 h-4 mr-1" />
                    {activity.duration_minutes} minutes
                  </CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {activity.description}
                </p>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Reward:</p>
                  <div className={`flex items-center p-2 rounded-lg ${rarity.bg} ${rarity.border} border`}>
                    <RarityIcon className={`w-4 h-4 mr-2 ${rarity.color}`} />
                    <span className="text-sm">{activity.reward_item_name}</span>
                  </div>
                </div>
                
                <Button 
                  onClick={() => startActivity(activity)}
                  className="w-full bg-gradient-magic hover:opacity-90"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Activity
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Activities;