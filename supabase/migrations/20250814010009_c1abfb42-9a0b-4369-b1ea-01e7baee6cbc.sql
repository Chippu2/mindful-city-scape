-- Add stats table for tracking user progress
CREATE TABLE public.stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  streak_count INTEGER NOT NULL DEFAULT 0,
  total_breaks INTEGER NOT NULL DEFAULT 0,
  rare_items_count INTEGER NOT NULL DEFAULT 0,
  legendary_items_count INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on stats table
ALTER TABLE public.stats ENABLE ROW LEVEL SECURITY;

-- Create policy for stats
CREATE POLICY "Users can manage their own stats" 
ON public.stats 
FOR ALL 
USING (auth.uid() = user_id);

-- Add trigger for stats table
CREATE TRIGGER update_stats_updated_at
BEFORE UPDATE ON public.stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add multiple break schedules support by adding label and allowing multiple entries
ALTER TABLE public.break_schedules ADD COLUMN label TEXT DEFAULT 'Break Time';

-- Add screen time tracking
CREATE TABLE public.screen_time_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  daily_limit_minutes INTEGER DEFAULT 480, -- 8 hours default
  break_interval_minutes INTEGER DEFAULT 60, -- suggest break every hour
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on screen time settings
ALTER TABLE public.screen_time_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for screen time settings
CREATE POLICY "Users can manage their own screen time settings" 
ON public.screen_time_settings 
FOR ALL 
USING (auth.uid() = user_id);

-- Add trigger for screen time settings
CREATE TRIGGER update_screen_time_settings_updated_at
BEFORE UPDATE ON public.screen_time_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add daily login rewards tracking
CREATE TABLE public.daily_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reward_date DATE NOT NULL,
  reward_type TEXT NOT NULL, -- 'login', 'streak', 'mystery_box'
  reward_item TEXT,
  reward_rarity TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, reward_date, reward_type)
);

-- Enable RLS on daily rewards
ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY;

-- Create policy for daily rewards
CREATE POLICY "Users can view their own daily rewards" 
ON public.daily_rewards 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily rewards" 
ON public.daily_rewards 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Update handle_new_user function to create stats and screen time settings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, username)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)));
  
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  INSERT INTO public.stats (user_id)
  VALUES (NEW.id);
  
  INSERT INTO public.screen_time_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;