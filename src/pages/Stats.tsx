import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  Calendar, 
  Trophy, 
  Gem, 
  Crown, 
  Flame, 
  Star,
  Gift,
  Clock,
  Target
} from 'lucide-react';

interface UserStats {
  streak_count: number;
  total_breaks: number;
  rare_items_count: number;
  legendary_items_count: number;
  last_activity_date: string | null;
}

interface DailyReward {
  reward_date: string;
  reward_type: string;
  reward_item: string | null;
  reward_rarity: string | null;
}

const Stats = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentRewards, setRecentRewards] = useState<DailyReward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchRecentRewards();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('stats')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: "Error",
        description: "Failed to load your stats",
        variant: "destructive"
      });
    }
  };

  const fetchRecentRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_rewards')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentRewards(data || []);
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimDailyReward = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Check if already claimed today
      const { data: existing } = await supabase
        .from('daily_rewards')
        .select('*')
        .eq('user_id', user?.id)
        .eq('reward_date', today)
        .eq('reward_type', 'login')
        .single();

      if (existing) {
        toast({
          title: "Already claimed!",
          description: "You've already claimed your daily reward today",
          variant: "destructive"
        });
        return;
      }

      // Determine reward based on streak
      const currentStreak = stats?.streak_count || 0;
      let rewardRarity = 'common';
      let rewardItem = 'Mindful Flower';

      if (currentStreak >= 7) {
        rewardRarity = 'legendary';
        rewardItem = 'Rainbow Bridge';
      } else if (currentStreak >= 3) {
        rewardRarity = 'rare';
        rewardItem = 'Golden Tree';
      }

      // Add reward to daily_rewards
      const { error: rewardError } = await supabase
        .from('daily_rewards')
        .insert({
          user_id: user?.id,
          reward_date: today,
          reward_type: 'login',
          reward_item: rewardItem,
          reward_rarity: rewardRarity
        });

      if (rewardError) throw rewardError;

      // Add item to city_items
      const { error: itemError } = await supabase
        .from('city_items')
        .insert({
          user_id: user?.id,
          item_name: rewardItem,
          item_type: 'reward',
          rarity: rewardRarity,
          is_placed: false,
          position_x: 0,
          position_y: 0
        });

      if (itemError) throw itemError;

      toast({
        title: "Daily reward claimed! 🎁",
        description: `You received a ${rewardRarity} ${rewardItem}!`
      });

      fetchRecentRewards();
    } catch (error) {
      console.error('Error claiming reward:', error);
      toast({
        title: "Error",
        description: "Failed to claim daily reward",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const streakProgress = Math.min((stats?.streak_count || 0) / 7 * 100, 100);
  const isStreakRewardReady = (stats?.streak_count || 0) >= 7;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-magic bg-clip-text text-transparent">
          Your Journey
        </h1>
        <p className="text-muted-foreground">
          Track your mindfulness progress and celebrate achievements
        </p>
      </div>

      {/* Daily Reward */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Gift className="w-5 h-5 mr-2 text-primary" />
            Daily Reward
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Come back daily to earn magical city items!
              </p>
              <Badge variant={isStreakRewardReady ? "default" : "secondary"}>
                {isStreakRewardReady ? "Legendary Reward Ready!" : `${stats?.streak_count || 0} day streak`}
              </Badge>
            </div>
            <button
              onClick={claimDailyReward}
              className="px-6 py-3 bg-gradient-magic text-primary-foreground rounded-lg font-medium hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Claim Reward
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Streak */}
        <Card className="border-accent/20 bg-accent/5">
          <CardContent className="p-6 text-center">
            <Flame className="w-8 h-8 text-accent mx-auto mb-2" />
            <p className="text-3xl font-bold text-accent">{stats?.streak_count || 0}</p>
            <p className="text-sm text-muted-foreground">Day Streak</p>
            <div className="mt-3 space-y-1">
              <Progress value={streakProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {7 - (stats?.streak_count || 0)} days to legendary reward
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total Breaks */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 text-center">
            <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-3xl font-bold text-primary">{stats?.total_breaks || 0}</p>
            <p className="text-sm text-muted-foreground">Mindful Moments</p>
          </CardContent>
        </Card>

        {/* Rare Items */}
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="p-6 text-center">
            <Gem className="w-8 h-8 text-rare-glow mx-auto mb-2" />
            <p className="text-3xl font-bold text-rare-glow">{stats?.rare_items_count || 0}</p>
            <p className="text-sm text-muted-foreground">Rare Treasures</p>
          </CardContent>
        </Card>

        {/* Legendary Items */}
        <Card className="border-pink-500/20 bg-pink-500/5">
          <CardContent className="p-6 text-center">
            <Crown className="w-8 h-8 text-legendary-glow mx-auto mb-2" />
            <p className="text-3xl font-bold text-legendary-glow">{stats?.legendary_items_count || 0}</p>
            <p className="text-sm text-muted-foreground">Legendary Items</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Rewards */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="w-5 h-5 mr-2 text-primary" />
              Recent Rewards
            </CardTitle>
            <CardDescription>
              Your latest treasures and achievements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentRewards.length === 0 ? (
              <div className="text-center py-8">
                <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  Complete activities to start earning rewards!
                </p>
              </div>
            ) : (
              recentRewards.map((reward, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-background/50 rounded-lg">
                  <div className={`p-2 rounded-lg ${
                    reward.reward_rarity === 'legendary' ? 'bg-pink-500/20' :
                    reward.reward_rarity === 'rare' ? 'bg-yellow-500/20' :
                    'bg-accent/20'
                  }`}>
                    {reward.reward_rarity === 'legendary' ? <Crown className="w-4 h-4 text-legendary-glow" /> :
                     reward.reward_rarity === 'rare' ? <Gem className="w-4 h-4 text-rare-glow" /> :
                     <Star className="w-4 h-4 text-accent" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{reward.reward_item || 'Daily Login'}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(reward.reward_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className={
                    reward.reward_rarity === 'legendary' ? 'text-legendary-glow border-pink-500/20' :
                    reward.reward_rarity === 'rare' ? 'text-rare-glow border-yellow-500/20' :
                    'text-accent border-accent/20'
                  }>
                    {reward.reward_rarity || 'common'}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Progress Insights */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-primary" />
              Progress Insights
            </CardTitle>
            <CardDescription>
              Your mindfulness journey overview
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Weekly Goal Progress</span>
                <span>{Math.min(stats?.total_breaks || 0, 7)}/7</span>
              </div>
              <Progress value={Math.min((stats?.total_breaks || 0) / 7 * 100, 100)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-background/50 rounded-lg">
                <Calendar className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-lg font-bold">{stats?.total_breaks || 0}</p>
                <p className="text-xs text-muted-foreground">Total Sessions</p>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg">
                <Target className="w-6 h-6 text-accent mx-auto mb-2" />
                <p className="text-lg font-bold">{((stats?.total_breaks || 0) * 5)} min</p>
                <p className="text-xs text-muted-foreground">Time Invested</p>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
              <p className="text-sm font-medium mb-1">Next Milestone</p>
              <p className="text-xs text-muted-foreground">
                {stats?.streak_count && stats.streak_count >= 7 
                  ? "Keep your streak for bonus rewards!"
                  : `${7 - (stats?.streak_count || 0)} more days for legendary rewards`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Stats;