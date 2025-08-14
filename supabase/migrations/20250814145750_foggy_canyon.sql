/*
  # Ultimate Mindscape City Upgrade Schema

  1. New Tables
    - `cities` - Support for multiple cities per user
    - `npcs` - Non-player characters in cities
    - `seasonal_events` - Dynamic seasonal content
    - `user_quests` - Meta-game quest system
    - `offline_activities` - Track offline mindful activities

  2. Enhanced Tables
    - Add `position_z` to city_items for 3D positioning
    - Add seasonal and difficulty fields to activities
    - Enhanced user settings for new features

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for user data access
*/

-- Add position_z to existing city_items table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'city_items' AND column_name = 'position_z'
  ) THEN
    ALTER TABLE city_items ADD COLUMN position_z FLOAT NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Create cities table for multi-city support
CREATE TABLE IF NOT EXISTS cities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city_name TEXT NOT NULL DEFAULT 'My Magical City',
  is_active BOOLEAN NOT NULL DEFAULT true,
  city_level INTEGER NOT NULL DEFAULT 1,
  theme TEXT NOT NULL DEFAULT 'magical',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create NPCs table
CREATE TABLE IF NOT EXISTS npcs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  npc_name TEXT NOT NULL,
  npc_type TEXT NOT NULL, -- quest_giver, musician, gardener, merchant, etc.
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  position_z FLOAT NOT NULL DEFAULT 0,
  behavior_script JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create seasonal events table
CREATE TABLE IF NOT EXISTS seasonal_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL, -- festival, challenge, bonus_week, etc.
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  affected_activities TEXT[] DEFAULT '{}',
  bonus_rewards JSONB DEFAULT '{}',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user quests table for meta-game
CREATE TABLE IF NOT EXISTS user_quests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_name TEXT NOT NULL,
  quest_type TEXT NOT NULL, -- daily, weekly, achievement, seasonal
  description TEXT,
  requirements JSONB NOT NULL DEFAULT '{}', -- {activities: ["cloud_catcher", "garden_bloom"], count: 3}
  rewards JSONB NOT NULL DEFAULT '{}', -- {items: [...], currency: 100}
  progress JSONB NOT NULL DEFAULT '{}',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create offline activities tracking
CREATE TABLE IF NOT EXISTS offline_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- walk, stretch, breathe, journal, etc.
  description TEXT,
  duration_minutes INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reward_earned TEXT,
  verified BOOLEAN NOT NULL DEFAULT false -- For future verification features
);

-- Add new columns to existing activities table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activities' AND column_name = 'difficulty_level'
  ) THEN
    ALTER TABLE activities ADD COLUMN difficulty_level TEXT DEFAULT 'easy' CHECK (difficulty_level IN ('easy', 'medium', 'expert'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activities' AND column_name = 'unlock_level'
  ) THEN
    ALTER TABLE activities ADD COLUMN unlock_level INTEGER NOT NULL DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activities' AND column_name = 'seasonal_variants'
  ) THEN
    ALTER TABLE activities ADD COLUMN seasonal_variants JSONB DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activities' AND column_name = 'is_procedural'
  ) THEN
    ALTER TABLE activities ADD COLUMN is_procedural BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- Add new columns to user_settings for enhanced features
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'daily_activity_limit'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN daily_activity_limit INTEGER NOT NULL DEFAULT 5;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'offline_reminders'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN offline_reminders BOOLEAN NOT NULL DEFAULT true;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'seasonal_effects'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN seasonal_effects BOOLEAN NOT NULL DEFAULT true;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'city_theme'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN city_theme TEXT NOT NULL DEFAULT 'magical';
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE npcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasonal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for cities
CREATE POLICY "Users can manage their own cities" ON cities
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for npcs
CREATE POLICY "Users can manage their own NPCs" ON npcs
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for seasonal_events (public read, admin write)
CREATE POLICY "Anyone can view seasonal events" ON seasonal_events
  FOR SELECT USING (is_active = true);

-- Create policies for user_quests
CREATE POLICY "Users can manage their own quests" ON user_quests
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for offline_activities
CREATE POLICY "Users can manage their own offline activities" ON offline_activities
  FOR ALL USING (auth.uid() = user_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_cities_updated_at
  BEFORE UPDATE ON cities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update the handle_new_user function to create default city and NPCs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_city_id UUID;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, username)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)));
  
  -- Create user settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  -- Create stats
  INSERT INTO public.stats (user_id)
  VALUES (NEW.id);
  
  -- Create screen time settings
  INSERT INTO public.screen_time_settings (user_id)
  VALUES (NEW.id);
  
  -- Create default city
  INSERT INTO public.cities (user_id, city_name)
  VALUES (NEW.id, 'My First Magical City')
  RETURNING id INTO new_city_id;
  
  -- Create welcome NPCs
  INSERT INTO public.npcs (city_id, user_id, npc_name, npc_type, position_x, position_z, behavior_script)
  VALUES 
    (new_city_id, NEW.id, 'Luna the Guide', 'quest_giver', 2, 2, '{"greeting": "Welcome to your magical city!", "quest": "complete_first_activity"}'),
    (new_city_id, NEW.id, 'Melody the Musician', 'musician', -2, -2, '{"greeting": "Let''s make some beautiful music together!", "specialty": "rooftop_melody"}');
  
  -- Create welcome quest
  INSERT INTO public.user_quests (user_id, quest_name, quest_type, description, requirements, rewards)
  VALUES (
    NEW.id,
    'Welcome to Mindscape City',
    'tutorial',
    'Complete your first mindful activity to start building your magical city!',
    '{"activities_completed": 0, "target": 1}',
    '{"items": [{"name": "Welcome Garden", "rarity": "rare", "type": "decoration"}], "message": "Your journey begins!"}'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some sample seasonal events
INSERT INTO seasonal_events (event_name, event_type, start_date, end_date, affected_activities, bonus_rewards, description) VALUES
('Spring Blossom Festival', 'festival', '2024-03-20', '2024-04-20', ARRAY['cloud_catcher', 'garden_bloom', 'lantern_release'], '{"bonus_rarity": "rare", "special_items": ["Cherry Blossom Tree", "Spring Fountain"]}', 'Celebrate the arrival of spring with special activities and rare rewards!'),
('Summer Solstice Celebration', 'festival', '2024-06-20', '2024-07-20', ARRAY['star_path', 'balloon_voyage'], '{"bonus_rarity": "rare", "special_items": ["Solar Obelisk", "Sunflower Field"]}', 'The longest day brings magical rewards and sunny activities!'),
('Autumn Harvest Moon', 'festival', '2024-09-20', '2024-10-20', ARRAY['wind_chime', 'cozy_sketch', 'memory_market'], '{"bonus_rarity": "legendary", "special_items": ["Harvest Moon Tower", "Golden Wheat Field"]}', 'Gather the autumn bounty with special harvest-themed activities!'),
('Winter Wonderland', 'festival', '2024-12-20', '2025-01-20', ARRAY['cloud_catcher', 'lantern_release', 'star_path'], '{"bonus_rarity": "legendary", "special_items": ["Ice Palace", "Aurora Bridge", "Snow Globe Garden"]}', 'Transform your city into a winter wonderland with magical snow and ice!');

-- Update existing activities with new fields
UPDATE activities SET 
  difficulty_level = 'easy',
  unlock_level = 1,
  seasonal_variants = '{"winter": {"name": "Winter Snowflake Catcher", "reward": "Snowflake Decoration"}}'
WHERE activity_type = 'breathe';

UPDATE activities SET 
  difficulty_level = 'medium',
  unlock_level = 3,
  seasonal_variants = '{"spring": {"name": "Spring Flower Bloom", "reward": "Blooming Garden"}}'
WHERE activity_type = 'stretch';

UPDATE activities SET 
  difficulty_level = 'easy',
  unlock_level = 2,
  seasonal_variants = '{"autumn": {"name": "Autumn Leaf Art", "reward": "Autumn Gallery"}}'
WHERE activity_type = 'doodle';

UPDATE activities SET 
  difficulty_level = 'medium',
  unlock_level = 4,
  seasonal_variants = '{"summer": {"name": "Summer Gratitude Garden", "reward": "Gratitude Shrine"}}'
WHERE activity_type = 'reflect';

UPDATE activities SET 
  difficulty_level = 'expert',
  unlock_level = 5,
  seasonal_variants = '{"winter": {"name": "Winter Solstice Meditation", "reward": "Meditation Pagoda"}}'
WHERE activity_type = 'meditate';