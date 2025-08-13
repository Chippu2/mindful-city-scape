-- Create users profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create break schedules table
CREATE TABLE public.break_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  break_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  do_not_disturb_start TIME,
  do_not_disturb_end TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create city items table
CREATE TABLE public.city_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_type TEXT NOT NULL, -- building, tree, decoration, etc.
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'legendary')),
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  is_placed BOOLEAN NOT NULL DEFAULT false,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activities table
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 5,
  activity_type TEXT NOT NULL, -- breathe, stretch, doodle, mini-game
  reward_item_name TEXT,
  reward_rarity TEXT CHECK (reward_rarity IN ('common', 'rare', 'legendary')),
  instructions JSONB, -- Store step-by-step instructions
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user activity completions table
CREATE TABLE public.activity_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reward_earned TEXT -- The city item earned from this completion
);

-- Create user settings table
CREATE TABLE public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  music_enabled BOOLEAN NOT NULL DEFAULT true,
  voice_guidance_enabled BOOLEAN NOT NULL DEFAULT true,
  volume FLOAT NOT NULL DEFAULT 0.5 CHECK (volume >= 0 AND volume <= 1),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.break_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.city_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for break_schedules
CREATE POLICY "Users can manage their own break schedules" ON public.break_schedules
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for city_items
CREATE POLICY "Users can manage their own city items" ON public.city_items
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for activities (public read access)
CREATE POLICY "Anyone can view activities" ON public.activities
  FOR SELECT USING (true);

-- Create policies for activity_completions
CREATE POLICY "Users can manage their own activity completions" ON public.activity_completions
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for user_settings
CREATE POLICY "Users can manage their own settings" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, username)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)));
  
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert sample activities
INSERT INTO public.activities (name, description, duration_minutes, activity_type, reward_item_name, reward_rarity, instructions) VALUES
('Deep Breathing', 'Take a moment to focus on your breath and center yourself', 3, 'breathe', 'Glowing Tree', 'common', 
 '["Sit comfortably and close your eyes", "Breathe in slowly for 4 counts", "Hold your breath for 4 counts", "Exhale slowly for 6 counts", "Repeat 5 times"]'),
 
('Gentle Stretch', 'Release tension with simple stretching movements', 5, 'stretch', 'Cozy Café', 'common',
 '["Stand up and reach your arms overhead", "Gently twist your torso left and right", "Roll your shoulders backward 5 times", "Touch your toes if comfortable", "Take 3 deep breaths"]'),
 
('Mindful Doodling', 'Let your creativity flow with relaxing doodling', 7, 'doodle', 'Floating Balloon', 'rare',
 '["Get a piece of paper or open drawing app", "Start with simple circles or lines", "Let your hand move freely without judgment", "Focus on the movement, not the result", "Enjoy the process for 5 minutes"]'),
 
('Gratitude Reflection', 'Take time to appreciate the good things in your life', 4, 'reflect', 'Rooftop Garden', 'rare',
 '["Think of 3 things you are grateful for today", "Consider why each one matters to you", "Feel the positive emotions they bring", "Take a moment to smile about them", "Carry this feeling with you"]'),
 
('Mini Meditation', 'A short guided meditation to reset your mind', 8, 'meditate', 'Crystal Fountain', 'legendary',
 '["Find a quiet spot and sit comfortably", "Close your eyes and focus on your breath", "Notice thoughts without judgment", "Return focus to breathing when mind wanders", "End with 3 deep, intentional breaths"]');