import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Activity {
  id: string;
  name: string;
  type: string;
  description: string;
  duration: number;
  difficulty: 'easy' | 'medium' | 'expert';
  reward: {
    item_name: string;
    rarity: 'common' | 'rare' | 'legendary';
    type: string;
  };
  seasonal_variant?: string;
  unlock_level: number;
}

interface SeasonalEvent {
  id: string;
  event_name: string;
  start_date: string;
  end_date: string;
  affected_activities: string[];
  bonus_rewards: any;
}

export function useActivityRotation() {
  const { user } = useAuth();
  const [availableActivities, setAvailableActivities] = useState<Activity[]>([]);
  const [dailyActivities, setDailyActivities] = useState<Activity[]>([]);
  const [currentSeason, setCurrentSeason] = useState<'spring' | 'summer' | 'autumn' | 'winter'>('spring');
  const [activeEvents, setActiveEvents] = useState<SeasonalEvent[]>([]);
  const [userLevel, setUserLevel] = useState(1);
  const [dailyActivityCount, setDailyActivityCount] = useState(0);
  const [maxDailyActivities] = useState(5);

  // Base activity templates
  const baseActivities: Omit<Activity, 'id'>[] = [
    {
      name: 'Cloud Catcher',
      type: 'cloud_catcher',
      description: 'Catch sparkling clouds floating across the sky',
      duration: 3,
      difficulty: 'easy',
      reward: { item_name: 'Weather Vane', rarity: 'common', type: 'decoration' },
      unlock_level: 1
    },
    {
      name: 'Lantern Release',
      type: 'lantern_release', 
      description: 'Write an intention and release a magical lantern',
      duration: 4,
      difficulty: 'easy',
      reward: { item_name: 'Festival Lantern', rarity: 'common', type: 'decoration' },
      unlock_level: 1
    },
    {
      name: 'Garden Bloom',
      type: 'garden_bloom',
      description: 'Help magical plants grow with mindful breathing',
      duration: 5,
      difficulty: 'medium',
      reward: { item_name: 'Enchanted Garden', rarity: 'rare', type: 'building' },
      unlock_level: 3
    },
    {
      name: 'Rooftop Melody',
      type: 'rooftop_melody',
      description: 'Create beautiful music with your city buildings',
      duration: 4,
      difficulty: 'medium',
      reward: { item_name: 'Music Box Tower', rarity: 'rare', type: 'building' },
      unlock_level: 5
    },
    {
      name: 'Balloon Voyage',
      type: 'balloon_voyage',
      description: 'Guide a hot air balloon through magical sparkles',
      duration: 3,
      difficulty: 'easy',
      reward: { item_name: 'Sky Balloon', rarity: 'common', type: 'decoration' },
      unlock_level: 2
    },
    {
      name: 'Mystery Visitor',
      type: 'mystery_visitor',
      description: 'Solve riddles from a mysterious city visitor',
      duration: 5,
      difficulty: 'expert',
      reward: { item_name: 'Wizard Tower', rarity: 'legendary', type: 'building' },
      unlock_level: 10
    },
    {
      name: 'Star Path',
      type: 'star_path',
      description: 'Trace constellations in the night sky',
      duration: 4,
      difficulty: 'medium',
      reward: { item_name: 'Observatory', rarity: 'rare', type: 'building' },
      unlock_level: 7
    },
    {
      name: 'Cozy Sketch',
      type: 'cozy_sketch',
      description: 'Draw something beautiful for your city museum',
      duration: 5,
      difficulty: 'easy',
      reward: { item_name: 'Art Gallery', rarity: 'rare', type: 'building' },
      unlock_level: 4
    },
    {
      name: 'Wind Chime Whisper',
      type: 'wind_chime',
      description: 'Create harmonious melodies with magical chimes',
      duration: 3,
      difficulty: 'medium',
      reward: { item_name: 'Harmony Chimes', rarity: 'common', type: 'decoration' },
      unlock_level: 6
    },
    {
      name: 'Memory Market',
      type: 'memory_market',
      description: 'Remember and collect items from the magical market',
      duration: 4,
      difficulty: 'expert',
      reward: { item_name: 'Grand Marketplace', rarity: 'legendary', type: 'building' },
      unlock_level: 8
    }
  ];

  // Determine current season
  useEffect(() => {
    const now = new Date();
    const month = now.getMonth();
    
    if (month >= 2 && month <= 4) setCurrentSeason('spring');
    else if (month >= 5 && month <= 7) setCurrentSeason('summer');
    else if (month >= 8 && month <= 10) setCurrentSeason('autumn');
    else setCurrentSeason('winter');
  }, []);

  // Fetch user level and daily activity count
  useEffect(() => {
    if (user) {
      fetchUserProgress();
      fetchDailyActivityCount();
    }
  }, [user]);

  const fetchUserProgress = async () => {
    try {
      const { data: stats } = await supabase
        .from('stats')
        .select('total_breaks')
        .eq('user_id', user?.id)
        .single();

      if (stats) {
        // Calculate level based on total breaks (every 10 breaks = 1 level)
        const level = Math.floor(stats.total_breaks / 10) + 1;
        setUserLevel(level);
      }
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  };

  const fetchDailyActivityCount = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('activity_completions')
        .select('id')
        .eq('user_id', user?.id)
        .gte('completed_at', `${today}T00:00:00`)
        .lt('completed_at', `${today}T23:59:59`);

      if (error) throw error;
      setDailyActivityCount(data?.length || 0);
    } catch (error) {
      console.error('Error fetching daily activity count:', error);
    }
  };

  // Generate seasonal variants
  const generateSeasonalVariant = (activity: Omit<Activity, 'id'>, season: string): Omit<Activity, 'id'> => {
    const seasonalNames = {
      spring: {
        cloud_catcher: 'Cherry Blossom Catcher',
        garden_bloom: 'Spring Flower Bloom',
        balloon_voyage: 'Butterfly Balloon Ride'
      },
      summer: {
        cloud_catcher: 'Rainbow Cloud Catcher',
        star_path: 'Firefly Path',
        balloon_voyage: 'Sunset Balloon Journey'
      },
      autumn: {
        cloud_catcher: 'Autumn Leaf Catcher',
        garden_bloom: 'Harvest Moon Garden',
        wind_chime: 'Autumn Wind Symphony'
      },
      winter: {
        cloud_catcher: 'Snowflake Catcher',
        star_path: 'Aurora Path',
        lantern_release: 'Winter Solstice Lantern'
      }
    };

    const seasonalName = seasonalNames[season as keyof typeof seasonalNames]?.[activity.type as keyof typeof seasonalNames.spring];
    
    if (seasonalName) {
      return {
        ...activity,
        name: seasonalName,
        seasonal_variant: season,
        reward: {
          ...activity.reward,
          item_name: `${season} ${activity.reward.item_name}`,
          rarity: activity.reward.rarity === 'common' ? 'rare' : activity.reward.rarity
        }
      };
    }
    
    return activity;
  };

  // Generate daily activity rotation
  useEffect(() => {
    const generateDailyActivities = () => {
      // Filter activities by user level
      const unlockedActivities = baseActivities.filter(activity => activity.unlock_level <= userLevel);
      
      // Apply seasonal variants (30% chance)
      const seasonalActivities = unlockedActivities.map(activity => {
        if (Math.random() < 0.3 && currentSeason !== 'summer') {
          return generateSeasonalVariant(activity, currentSeason);
        }
        return activity;
      });

      // Shuffle and select 3-4 activities for the day
      const shuffled = [...seasonalActivities].sort(() => Math.random() - 0.5);
      const dailyCount = Math.min(4, Math.max(3, Math.floor(userLevel / 3) + 2));
      const selected = shuffled.slice(0, dailyCount);

      // Add IDs and difficulty scaling
      const withIds = selected.map((activity, index) => ({
        ...activity,
        id: `daily_${Date.now()}_${index}`,
        difficulty: scaleDifficulty(activity.difficulty, userLevel) as 'easy' | 'medium' | 'expert'
      }));

      setDailyActivities(withIds);
      setAvailableActivities(withIds);
    };

    generateDailyActivities();
  }, [userLevel, currentSeason]);

  const scaleDifficulty = (baseDifficulty: string, level: number): string => {
    if (level < 5) return 'easy';
    if (level < 10) return baseDifficulty === 'expert' ? 'medium' : baseDifficulty;
    return baseDifficulty;
  };

  // Check for seasonal events
  useEffect(() => {
    const checkSeasonalEvents = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('seasonal_events')
          .select('*')
          .lte('start_date', today)
          .gte('end_date', today);

        if (error) throw error;
        setActiveEvents(data || []);
      } catch (error) {
        console.error('Error fetching seasonal events:', error);
      }
    };

    checkSeasonalEvents();
  }, []);

  const canPlayActivity = () => {
    return dailyActivityCount < maxDailyActivities;
  };

  const getNextActivityUnlock = () => {
    const nextActivity = baseActivities.find(activity => activity.unlock_level > userLevel);
    return nextActivity ? {
      name: nextActivity.name,
      level: nextActivity.unlock_level,
      breaksNeeded: (nextActivity.unlock_level - userLevel) * 10
    } : null;
  };

  return {
    availableActivities,
    dailyActivities,
    currentSeason,
    activeEvents,
    userLevel,
    dailyActivityCount,
    maxDailyActivities,
    canPlayActivity: canPlayActivity(),
    nextActivityUnlock: getNextActivityUnlock(),
    refreshDailyActivities: () => {
      // Force refresh of daily activities
      setDailyActivities([]);
      setTimeout(() => {
        const shuffled = [...availableActivities].sort(() => Math.random() - 0.5);
        setDailyActivities(shuffled);
      }, 100);
    }
  };
}