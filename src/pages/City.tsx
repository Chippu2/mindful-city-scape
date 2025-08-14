import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import CityCanvas from '@/components/3d/CityCanvas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  Trees, 
  Sparkles, 
  Gem, 
  Crown,
  Package,
  RotateCcw,
  Save,
  Users,
  Palette,
  Volume2,
  Eye
} from 'lucide-react';

interface CityItem {
  id: string;
  item_name: string;
  item_type: string;
  rarity: string;
  position_x: number;
  position_y: number;
  position_z: number;
  is_placed: boolean;
}

interface NPC {
  id: string;
  npc_name: string;
  npc_type: string;
  position_x: number;
  position_y: number;
  position_z: number;
  behavior_script: any;
}

const rarityConfig = {
  common: { icon: Sparkles, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20' },
  rare: { icon: Gem, color: 'text-rare-glow', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  legendary: { icon: Crown, color: 'text-legendary-glow', bg: 'bg-pink-500/10', border: 'border-pink-500/20' }
};

const itemIcons = {
  building: Building2,
  tree: Trees,
  decoration: Sparkles,
  breathe: Trees,
  stretch: Building2,
  doodle: Sparkles,
  reflect: Trees,
  meditate: Crown
};

const City = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cityItems, setCityItems] = useState<CityItem[]>([]);
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [inventory, setInventory] = useState<CityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSeason, setCurrentSeason] = useState<'spring' | 'summer' | 'autumn' | 'winter'>('spring');
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');

  useEffect(() => {
    if (user) {
      fetchCityItems();
      fetchNPCs();
      determineSeason();
    }
  }, [user]);

  const determineSeason = () => {
    const now = new Date();
    const month = now.getMonth();
    
    if (month >= 2 && month <= 4) setCurrentSeason('spring');
    else if (month >= 5 && month <= 7) setCurrentSeason('summer');
    else if (month >= 8 && month <= 10) setCurrentSeason('autumn');
    else setCurrentSeason('winter');
  };

  const fetchCityItems = async () => {
    try {
      const { data, error } = await supabase
        .from('city_items')
        .select('*')
        .eq('user_id', user?.id)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;
      
      const placed = (data || []).filter(item => item.is_placed);
      const unplaced = (data || []).filter(item => !item.is_placed);
      
      setCityItems(placed);
      setInventory(unplaced);
    } catch (error) {
      console.error('Error fetching city items:', error);
      toast({
        title: "Error",
        description: "Failed to load your city",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchNPCs = async () => {
    try {
      // For now, create some sample NPCs based on user's city items
      const sampleNPCs: NPC[] = [
        {
          id: 'npc_1',
          npc_name: 'Luna the Guide',
          npc_type: 'quest_giver',
          position_x: 2,
          position_y: 0,
          position_z: 2,
          behavior_script: { greeting: "Welcome to your magical city!" }
        },
        {
          id: 'npc_2',
          npc_name: 'Melody the Musician',
          npc_type: 'musician',
          position_x: -2,
          position_y: 0,
          position_z: -2,
          behavior_script: { greeting: "Let's make some beautiful music!" }
        }
      ];
      
      setNpcs(sampleNPCs);
    } catch (error) {
      console.error('Error fetching NPCs:', error);
    }
  };

  const placeItemInCity = async (item: CityItem, x: number, y: number, z: number = 0) => {
    try {
      const { error } = await supabase
        .from('city_items')
        .update({
          position_x: x,
          position_y: y,
          position_z: z,
          is_placed: true
        })
        .eq('id', item.id);

      if (error) throw error;
      
      await fetchCityItems();
      toast({
        title: "Item placed!",
        description: `${item.item_name} added to your city`
      });
    } catch (error) {
      console.error('Error placing item:', error);
      toast({
        title: "Error",
        description: "Failed to place item",
        variant: "destructive"
      });
    }
  };

  const removeFromCity = async (item: CityItem) => {
    try {
      const { error } = await supabase
        .from('city_items')
        .update({
          is_placed: false,
          position_x: 0,
          position_y: 0
          position_z: 0
        })
        .eq('id', item.id);

      if (error) throw error;
      
      fetchCityItems();
      toast({
        title: "Item removed",
        description: `${item.item_name} moved back to inventory`
      });
    } catch (error) {
      console.error('Error removing item:', error);
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive"
      });
    }
  };

  const handleItemClick = (item: CityItem) => {
    toast({
      title: item.item_name,
      description: `A ${item.rarity} ${item.item_type} in your magical city`
    });
  };

  const handleNPCClick = (npc: NPC) => {
    toast({
      title: npc.npc_name,
      description: npc.behavior_script.greeting || "Hello there!"
    });
  };

  const quickPlaceItem = async (item: CityItem) => {
    // Quick place at random position
    const x = (Math.random() - 0.5) * 10;
    const y = 0;
    const z = (Math.random() - 0.5) * 10;
    
    await placeItemInCity(item, x, y, z);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse"></div>
        <div className="h-96 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-magic bg-clip-text text-transparent">
          Your Magical City
        </h1>
        <p className="text-muted-foreground">
          Build your 3D magical city with earned items and friendly NPCs
        </p>
        <div className="flex justify-center space-x-2">
          <Badge variant="outline">
            {currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)} Season
          </Badge>
          <Badge variant="outline">
            {cityItems.length} Items Placed
          </Badge>
          <Badge variant="outline">
            {npcs.length} NPCs
          </Badge>
        </div>
      </div>

      {/* View Controls */}
      <div className="flex justify-center space-x-4">
        <Button
          variant={viewMode === '3d' ? 'default' : 'outline'}
          onClick={() => setViewMode('3d')}
          className="border-primary/20"
        >
          <Eye className="w-4 h-4 mr-2" />
          3D View
        </Button>
        <Button
          variant={viewMode === '2d' ? 'default' : 'outline'}
          onClick={() => setViewMode('2d')}
          className="border-primary/20"
        >
          <Palette className="w-4 h-4 mr-2" />
          2D View
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* City Canvas */}
        <div className="lg:col-span-3">
          <Card className="border-primary/20 overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-primary" />
                {viewMode === '3d' ? '3D City View' : '2D City Canvas'}
              </CardTitle>
              <CardDescription>
                {viewMode === '3d' ? 'Explore your magical 3D city' : 'Classic 2D city view'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {viewMode === '3d' ? (
                <CityCanvas
                  cityItems={cityItems}
                  npcs={npcs}
                  season={currentSeason}
                  onItemClick={handleItemClick}
                  onNPCClick={handleNPCClick}
                />
              ) : (
                <div className="relative h-96 bg-gradient-sky border-2 border-dashed border-primary/30 overflow-hidden">
                  {/* 2D fallback view */}
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-city-ground opacity-60"></div>
                  
                  {cityItems.map((item) => {
                    const ItemIcon = itemIcons[item.item_type as keyof typeof itemIcons] || Building2;
                    const rarity = rarityConfig[item.rarity as keyof typeof rarityConfig];
                    
                    return (
                      <div
                        key={item.id}
                        className="absolute w-16 h-16 cursor-pointer group transition-all duration-200 hover:scale-110"
                        style={{
                          left: item.position_x * 20 + 200,
                          top: item.position_z * 20 + 200,
                        }}
                        onClick={() => handleItemClick(item)}
                      >
                        <div className={`w-full h-full rounded-lg border-2 ${rarity.border} ${rarity.bg} flex items-center justify-center shadow-lg`}>
                          <ItemIcon className={`w-8 h-8 ${rarity.color}`} />
                        </div>
                      </div>
                    );
                  })}
                  
                  {cityItems.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <Building2 className="w-16 h-16 text-muted-foreground mx-auto" />
                        <div>
                          <h3 className="text-lg font-medium text-muted-foreground">Your city awaits</h3>
                          <p className="text-sm text-muted-foreground">
                            Complete activities to earn items for your magical city
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Inventory */}
        <div className="lg:col-span-1">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2 text-primary" />
                Inventory
              </CardTitle>
              <CardDescription>
                Items earned from activities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
              {inventory.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Complete mindful activities to earn magical items for your city!
                  </p>
                </div>
              ) : (
                inventory.map((item) => {
                  const ItemIcon = itemIcons[item.item_type as keyof typeof itemIcons] || Building2;
                  const rarity = rarityConfig[item.rarity as keyof typeof rarityConfig];
                  const RarityIcon = rarity.icon;
                  
                  return (
                    <div
                      key={item.id}
                      className={`
                        p-3 rounded-lg border-2 ${rarity.border} ${rarity.bg} 
                        cursor-move hover:shadow-md transition-all duration-200 hover:scale-105
                      `}
                      draggable
                      onDragStart={(e) => {
                        setDraggedItem(item);
                        setDragOffset({ x: 40, y: 40 });
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-gradient-magic`}>
                          <ItemIcon className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.item_name}
                          </p>
                          <Badge variant="outline" className={`${rarity.color} ${rarity.border} text-xs`}>
                            <RarityIcon className="w-2 h-2 mr-1" />
                            {item.rarity}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* NPCs Panel */}
          <Card className="border-primary/20 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-primary" />
                City NPCs
              </CardTitle>
              <CardDescription>
                Friendly inhabitants of your city
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {npcs.map((npc) => (
                <div
                  key={npc.id}
                  className="p-3 rounded-lg border border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleNPCClick(npc)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-gradient-magic">
                      <Users className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{npc.npc_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {npc.npc_type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-accent/20 bg-accent/5">
          <CardContent className="p-6 text-center">
            <Sparkles className="w-8 h-8 text-accent mx-auto mb-2" />
            <p className="text-2xl font-bold">{inventory.filter(i => i.rarity === 'common').length}</p>
            <p className="text-sm text-muted-foreground">Common Items</p>
          </CardContent>
        </Card>
        
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="p-6 text-center">
            <Gem className="w-8 h-8 text-rare-glow mx-auto mb-2" />
            <p className="text-2xl font-bold">{inventory.filter(i => i.rarity === 'rare').length}</p>
            <p className="text-sm text-muted-foreground">Rare Items</p>
          </CardContent>
        </Card>
        
        <Card className="border-pink-500/20 bg-pink-500/5">
          <CardContent className="p-6 text-center">
            <Crown className="w-8 h-8 text-legendary-glow mx-auto mb-2" />
            <p className="text-2xl font-bold">{inventory.filter(i => i.rarity === 'legendary').length}</p>
            <p className="text-sm text-muted-foreground">Legendary Items</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default City;