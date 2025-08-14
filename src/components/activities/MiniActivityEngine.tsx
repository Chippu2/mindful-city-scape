import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Cloud, 
  Sparkles, 
  Music, 
  Palette, 
  Brain,
  Wind,
  Star,
  Gift,
  TreePine,
  Heart
} from 'lucide-react';

interface MiniActivity {
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
}

interface MiniActivityEngineProps {
  activity: MiniActivity;
  onComplete: (reward: any) => void;
  onCancel: () => void;
  season: string;
  userLevel: number;
}

// Cloud Catcher Activity
function CloudCatcherActivity({ onComplete, difficulty, season }: any) {
  const [clouds, setClouds] = useState<Array<{id: number, x: number, y: number, caught: boolean}>>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Generate clouds based on difficulty
    const cloudCount = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 8 : 12;
    const initialClouds = Array.from({ length: cloudCount }, (_, i) => ({
      id: i,
      x: Math.random() * 300,
      y: Math.random() * 200,
      caught: false
    }));
    setClouds(initialClouds);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onComplete({ score, completed: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [difficulty, onComplete, score]);

  const catchCloud = (cloudId: number) => {
    setClouds(prev => prev.map(cloud => 
      cloud.id === cloudId ? { ...cloud, caught: true } : cloud
    ));
    setScore(prev => prev + 1);
  };

  const seasonalCloudColor = season === 'winter' ? '#e3f2fd' :
                            season === 'autumn' ? '#fff3e0' :
                            season === 'spring' ? '#f3e5f5' :
                            '#e8f5e8';

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Badge variant="outline">Score: {score}</Badge>
        <Badge variant="outline">Time: {timeLeft}s</Badge>
      </div>
      
      <div 
        className="relative w-full h-64 bg-gradient-to-b from-blue-200 to-blue-100 rounded-lg overflow-hidden cursor-pointer"
        style={{ background: `linear-gradient(to bottom, ${seasonalCloudColor}, #e3f2fd)` }}
      >
        {clouds.map(cloud => (
          !cloud.caught && (
            <div
              key={cloud.id}
              className="absolute w-12 h-8 bg-white rounded-full opacity-80 hover:opacity-100 transition-all duration-200 cursor-pointer animate-pulse"
              style={{ 
                left: cloud.x, 
                top: cloud.y,
                transform: 'translate(-50%, -50%)'
              }}
              onClick={() => catchCloud(cloud.id)}
            >
              <Cloud className="w-full h-full text-blue-300" />
            </div>
          )
        ))}
        
        {/* Seasonal effects */}
        {season === 'winter' && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        )}
      </div>
      
      <p className="text-sm text-muted-foreground text-center">
        Tap the sparkling clouds to catch them! {season === 'winter' ? '❄️ Winter clouds give bonus points!' : ''}
      </p>
    </div>
  );
}

// Lantern Release Activity
function LanternReleaseActivity({ onComplete, season }: any) {
  const [intention, setIntention] = useState('');
  const [lanternReleased, setLanternReleased] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);

  const releaseLantern = () => {
    if (intention.trim()) {
      setLanternReleased(true);
      setAnimationPhase(1);
      
      setTimeout(() => setAnimationPhase(2), 1000);
      setTimeout(() => setAnimationPhase(3), 2000);
      setTimeout(() => onComplete({ intention, completed: true }), 3000);
    }
  };

  const seasonalLanternColor = season === 'winter' ? 'from-blue-400 to-purple-400' :
                              season === 'autumn' ? 'from-orange-400 to-red-400' :
                              season === 'spring' ? 'from-pink-400 to-purple-400' :
                              'from-yellow-400 to-orange-400';

  return (
    <div className="space-y-6">
      {!lanternReleased ? (
        <>
          <div className="space-y-4">
            <label className="text-sm font-medium">Write your intention on the lantern:</label>
            <textarea
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder="What mindful intention would you like to set?"
              className="w-full p-3 border rounded-lg resize-none h-20"
              maxLength={100}
            />
          </div>
          
          <div className="text-center">
            <div className={`inline-block p-6 rounded-full bg-gradient-to-br ${seasonalLanternColor} shadow-lg`}>
              <Gift className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <Button 
            onClick={releaseLantern}
            disabled={!intention.trim()}
            className="w-full bg-gradient-magic hover:opacity-90"
          >
            Release Lantern
          </Button>
        </>
      ) : (
        <div className="text-center space-y-4">
          <div 
            className={`inline-block p-6 rounded-full bg-gradient-to-br ${seasonalLanternColor} shadow-lg transition-all duration-1000 ${
              animationPhase >= 2 ? 'transform -translate-y-32 opacity-50' : 
              animationPhase >= 1 ? 'transform -translate-y-16' : ''
            }`}
          >
            <Gift className="w-8 h-8 text-white" />
          </div>
          
          <div className="space-y-2">
            <p className="text-lg font-medium">Your intention has been released!</p>
            <p className="text-sm text-muted-foreground italic">"{intention}"</p>
            {animationPhase >= 3 && (
              <p className="text-sm text-primary animate-pulse">
                ✨ Your lantern joins the festival in your city! ✨
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Garden Bloom Activity (Breath-synced)
function GardenBloomActivity({ onComplete, difficulty }: any) {
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [cycleCount, setCycleCount] = useState(0);
  const [plantGrowth, setPlantGrowth] = useState(0);
  const targetCycles = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 5 : 7;

  useEffect(() => {
    const breathCycle = () => {
      // Inhale (4s)
      setBreathPhase('inhale');
      setTimeout(() => {
        // Hold (2s)
        setBreathPhase('hold');
        setTimeout(() => {
          // Exhale (6s)
          setBreathPhase('exhale');
          setTimeout(() => {
            setCycleCount(prev => {
              const newCount = prev + 1;
              setPlantGrowth((newCount / targetCycles) * 100);
              
              if (newCount >= targetCycles) {
                onComplete({ cycles: newCount, completed: true });
                return newCount;
              }
              
              breathCycle(); // Continue cycle
              return newCount;
            });
          }, 6000);
        }, 2000);
      }, 4000);
    };

    breathCycle();
  }, [difficulty, onComplete, targetCycles]);

  const getBreathInstruction = () => {
    switch (breathPhase) {
      case 'inhale': return 'Breathe in slowly...';
      case 'hold': return 'Hold your breath...';
      case 'exhale': return 'Breathe out gently...';
    }
  };

  const getPlantSize = () => {
    const baseSize = 2;
    const growthMultiplier = 1 + (plantGrowth / 100) * 2;
    return baseSize * growthMultiplier;
  };

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">{getBreathInstruction()}</h3>
        <Progress value={(cycleCount / targetCycles) * 100} className="w-full" />
        <p className="text-sm text-muted-foreground">
          Breath cycle {cycleCount} of {targetCycles}
        </p>
      </div>
      
      <div className="relative h-32 flex items-end justify-center">
        <div 
          className={`transition-all duration-1000 ${
            breathPhase === 'inhale' ? 'scale-110' : 
            breathPhase === 'hold' ? 'scale-105' : 
            'scale-100'
          }`}
          style={{ transform: `scale(${getPlantSize()})` }}
        >
          <TreePine className="w-8 h-8 text-green-500" />
        </div>
        
        {/* Sparkles around growing plant */}
        {plantGrowth > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: Math.floor(plantGrowth / 20) }).map((_, i) => (
              <Sparkles
                key={i}
                className="absolute w-4 h-4 text-yellow-400 animate-pulse"
                style={{
                  left: `${30 + Math.random() * 40}%`,
                  top: `${20 + Math.random() * 60}%`,
                  animationDelay: `${i * 0.5}s`
                }}
              />
            ))}
          </div>
        )}
      </div>
      
      <p className="text-sm text-muted-foreground">
        Your mindful breathing helps the magical plant grow! 🌱
      </p>
    </div>
  );
}

// Main Activity Engine Component
export default function MiniActivityEngine({ 
  activity, 
  onComplete, 
  onCancel, 
  season, 
  userLevel 
}: MiniActivityEngineProps) {
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState(activity.duration * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          toast({
            title: "Time's up!",
            description: "Great job on your mindful break!",
          });
          onComplete({ completed: false, timeout: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onComplete, toast]);

  const handleActivityComplete = (result: any) => {
    onComplete({
      ...result,
      activity_id: activity.id,
      reward: activity.reward,
      season_bonus: season !== 'summer'
    });
  };

  const renderActivity = () => {
    switch (activity.type) {
      case 'cloud_catcher':
        return (
          <CloudCatcherActivity
            onComplete={handleActivityComplete}
            difficulty={activity.difficulty}
            season={season}
          />
        );
      case 'lantern_release':
        return (
          <LanternReleaseActivity
            onComplete={handleActivityComplete}
            season={season}
          />
        );
      case 'garden_bloom':
        return (
          <GardenBloomActivity
            onComplete={handleActivityComplete}
            difficulty={activity.difficulty}
          />
        );
      default:
        return (
          <div className="text-center py-8">
            <p>Activity type "{activity.type}" not implemented yet.</p>
            <Button onClick={() => handleActivityComplete({ completed: true })}>
              Complete Activity
            </Button>
          </div>
        );
    }
  };

  const activityIcons = {
    cloud_catcher: Cloud,
    lantern_release: Gift,
    garden_bloom: TreePine,
    rooftop_melody: Music,
    balloon_voyage: Wind,
    mystery_visitor: Brain,
    star_path: Star,
    cozy_sketch: Palette,
    wind_chime: Music,
    memory_market: Brain
  };

  const ActivityIcon = activityIcons[activity.type as keyof typeof activityIcons] || Sparkles;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-gradient-magic">
              <ActivityIcon className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">{activity.name}</CardTitle>
          <CardDescription className="space-y-2">
            <p>{activity.description}</p>
            <div className="flex justify-center space-x-2">
              <Badge variant="outline">{activity.difficulty}</Badge>
              <Badge variant="outline">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</Badge>
              {activity.seasonal_variant && (
                <Badge variant="outline" className="bg-gradient-magic text-primary-foreground">
                  {season} variant
                </Badge>
              )}
            </div>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {renderActivity()}
          
          <div className="flex justify-center space-x-4">
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="border-primary/20"
            >
              Take a Break
            </Button>
          </div>
          
          {/* Reward preview */}
          <div className="text-center p-4 bg-background/50 rounded-lg border border-primary/10">
            <p className="text-sm font-medium mb-2">Reward Preview:</p>
            <div className="flex items-center justify-center space-x-2">
              <Badge 
                variant="outline" 
                className={`
                  ${activity.reward.rarity === 'legendary' ? 'text-legendary-glow border-pink-500/20' :
                    activity.reward.rarity === 'rare' ? 'text-rare-glow border-yellow-500/20' :
                    'text-accent border-accent/20'}
                `}
              >
                {activity.reward.rarity}
              </Badge>
              <span className="text-sm">{activity.reward.item_name}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}