import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import MiniActivityEngine from '@/components/activities/MiniActivityEngine';
import { useActivityRotation } from '@/components/activities/ActivityRotationEngine';
import { useNotificationManager } from '@/components/notifications/NotificationManager';
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
  Brain,
  RefreshCw,
  Lock,
  Gift,
  Zap
} from 'lucide-react';

const activityIcons = {
  cloud_catcher: Wind,
  lantern_release: Gift,
  garden_bloom: Heart,
  rooftop_melody: Brain,
  balloon_voyage: Wind,
  mystery_visitor: Brain,
  star_path: Sparkles,
  cozy_sketch: Palette,
  wind_chime: Brain,
  memory_market: Brain
};

const rarityConfig = {
  common: { icon: Sparkles, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20' },
  rare: { icon: Gem, color: 'text-rare-glow', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  legendary: { icon: Crown, color: 'text-legendary-glow', bg: 'bg-pink-500/10', border: 'border-pink-500/20' }
};

const Activities = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentActivity, setCurrentActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const {
    dailyActivities,
    currentSeason,
    userLevel,
    dailyActivityCount,
    maxDailyActivities,
    canPlayActivity,
    nextActivityUnlock,
    refreshDailyActivities
  } = useActivityRotation();
  
  const { sendOfflineEncouragement } = useNotificationManager();

  useEffect(() => {
    setLoading(false);
  }, []);

  const startActivity = (activity: any) => {
    if (!canPlayActivity) {
      toast({
        title: "Daily limit reached",
        description: `You've completed ${maxDailyActivities} activities today. Take a mindful break offline!`,
        variant: "destructive"
      });
      sendOfflineEncouragement();
      return;
    }
    
    setCurrentActivity(activity);
  };

  const completeActivity = async (result: any) => {
    if (!currentActivity || !user) return;

    try {
      // Record completion
      const { error: completionError } = await supabase
        .from('activity_completions')
        .insert({
          user_id: user.id,
          activity_id: currentActivity.id,
          reward_earned: currentActivity.reward.item_name
        });

      if (completionError) throw completionError;

      // Add city item reward
      const { error: rewardError } = await supabase
        .from('city_items')
        .insert({
          user_id: user.id,
          item_name: currentActivity.reward.item_name,
          item_type: currentActivity.reward.type,
          rarity: currentActivity.reward.rarity,
          position_x: Math.random() * 800 + 100,
          position_y: Math.random() * 600 + 100,
          position_z: 0,
          is_placed: false
        });

      if (rewardError) throw rewardError;

      // Update stats
      const { error: statsError } = await supabase
        .from('stats')
        .upsert({
          user_id: user.id,
          total_breaks: dailyActivityCount + 1,
          last_activity_date: new Date().toISOString().split('T')[0]
        });

      if (statsError) console.error('Stats update error:', statsError);

      const rarity = currentActivity.reward.rarity;
      toast({
        title: "Activity Complete! 🎉",
        description: `You earned a ${rarity} ${currentActivity.reward.item_name}! Check your city to place it.`
      });

      setCurrentActivity(null);
      
      // Encourage offline break
      setTimeout(() => {
        sendOfflineEncouragement();
      }, 2000);
      
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
    setCurrentActivity(null);
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
  if (currentActivity) {
    return (
      <MiniActivityEngine
        activity={currentActivity}
        onComplete={completeActivity}
        onCancel={cancelActivity}
        season={currentSeason}
        userLevel={userLevel}
      />
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
          Complete mini-activities to earn magical items for your city
        </p>
        <div className="flex justify-center space-x-4 text-sm">
          <Badge variant="outline">
            {currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)} Season
          </Badge>
          <Badge variant="outline">
            Level {userLevel}
          </Badge>
          <Badge variant="outline">
            {dailyActivityCount}/{maxDailyActivities} Daily Activities
          </Badge>
        </div>
      </div>

      {/* Daily Activity Limit Warning */}
      {!canPlayActivity && (
        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardContent className="p-6 text-center">
            <Zap className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <h3 className="text-lg font-medium mb-2">Daily Activity Limit Reached</h3>
            <p className="text-muted-foreground mb-4">
              You've completed {maxDailyActivities} activities today! Time for some offline mindful moments.
            </p>
            <Button 
              variant="outline" 
              onClick={sendOfflineEncouragement}
              className="border-orange-500/20"
            >
              Get Offline Suggestion
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Activity Controls */}
      <div className="flex justify-center space-x-4">
        <Button
          variant="outline"
          onClick={refreshDailyActivities}
          className="border-primary/20"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Activities
        </Button>
      </div>

      {/* Activities grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dailyActivities.map((activity) => {
          const ActivityIcon = activityIcons[activity.type as keyof typeof activityIcons] || Wind;
          const rarity = rarityConfig[activity.reward.rarity as keyof typeof rarityConfig];
          const RarityIcon = rarity.icon;
          const isLocked = activity.unlock_level > userLevel;
          
          return (
            <Card 
              key={activity.id} 
              className={`
                transition-all duration-200 cursor-pointer
                border-2 ${rarity.border} ${rarity.bg}
                ${isLocked ? 'opacity-50' : 'hover:shadow-lg hover:scale-105'}
                ${activity.seasonal_variant ? 'ring-2 ring-primary/20' : ''}
              `}
            >
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-gradient-magic">
                    {isLocked ? (
                      <Lock className="w-6 h-6 text-primary-foreground" />
                    ) : (
                      <ActivityIcon className="w-6 h-6 text-primary-foreground" />
                    )}
                  </div>
                  <div className="flex space-x-1">
                    {activity.seasonal_variant && (
                      <Badge variant="outline" className="text-primary border-primary/20">
                        {activity.seasonal_variant}
                      </Badge>
                    )}
                    <Badge variant="outline" className={`${rarity.color} ${rarity.border}`}>
                      <RarityIcon className="w-3 h-3 mr-1" />
                      {activity.reward.rarity}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <CardTitle className="text-lg">{activity.name}</CardTitle>
                  <CardDescription className="flex items-center mt-2">
                    <Clock className="w-4 h-4 mr-1" />
                    {activity.duration} minutes
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
                    <span className="text-sm">{activity.reward.item_name}</span>
                  </div>
                </div>
                
                {isLocked ? (
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Unlocks at Level {activity.unlock_level}
                    </p>
                    <Button disabled className="w-full">
                      <Lock className="w-4 h-4 mr-2" />
                      Locked
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={() => startActivity(activity)}
                    disabled={!canPlayActivity}
                    className="w-full bg-gradient-magic hover:opacity-90"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Activity
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Next Unlock Preview */}
      {nextActivityUnlock && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="p-6 text-center">
            <Lock className="w-8 h-8 text-primary mx-auto mb-2" />
            <h3 className="text-lg font-medium mb-2">Next Unlock</h3>
            <p className="text-muted-foreground mb-2">
              <strong>{nextActivityUnlock.name}</strong> unlocks at Level {nextActivityUnlock.level}
            </p>
            <p className="text-sm text-muted-foreground">
              Complete {nextActivityUnlock.breaksNeeded} more mindful breaks to unlock!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Activities;