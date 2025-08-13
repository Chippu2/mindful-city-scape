import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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
  Save
} from 'lucide-react';

interface CityItem {
  id: string;
  item_name: string;
  item_type: string;
  rarity: string;
  position_x: number;
  position_y: number;
  is_placed: boolean;
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
  const [inventory, setInventory] = useState<CityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<CityItem | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const cityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchCityItems();
    }
  }, [user]);

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

  const handleDragStart = (item: CityItem, e: React.MouseEvent) => {
    setDraggedItem(item);
    
    if (item.is_placed && cityRef.current) {
      const rect = cityRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left - item.position_x,
        y: e.clientY - rect.top - item.position_y
      });
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    
    if (!draggedItem || !cityRef.current) return;

    const rect = cityRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width - 80, e.clientX - rect.left - dragOffset.x));
    const y = Math.max(0, Math.min(rect.height - 80, e.clientY - rect.top - dragOffset.y));

    try {
      const { error } = await supabase
        .from('city_items')
        .update({
          position_x: x,
          position_y: y,
          is_placed: true
        })
        .eq('id', draggedItem.id);

      if (error) throw error;
      
      fetchCityItems();
      toast({
        title: "Item placed!",
        description: `${draggedItem.item_name} added to your city`
      });
    } catch (error) {
      console.error('Error placing item:', error);
      toast({
        title: "Error",
        description: "Failed to place item",
        variant: "destructive"
      });
    }
    
    setDraggedItem(null);
  };

  const removeFromCity = async (item: CityItem) => {
    try {
      const { error } = await supabase
        .from('city_items')
        .update({
          is_placed: false,
          position_x: 0,
          position_y: 0
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
          Drag and drop items from your inventory to build your mindful oasis
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* City Canvas */}
        <div className="lg:col-span-3">
          <Card className="border-primary/20 overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-primary" />
                City Canvas
              </CardTitle>
              <CardDescription>
                Drop items here to place them in your city
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div
                ref={cityRef}
                className="relative h-96 bg-gradient-sky border-2 border-dashed border-primary/30 overflow-hidden"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {/* Ground */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-city-ground opacity-60"></div>
                
                {/* Placed items */}
                {cityItems.map((item) => {
                  const ItemIcon = itemIcons[item.item_type as keyof typeof itemIcons] || Building2;
                  const rarity = rarityConfig[item.rarity as keyof typeof rarityConfig];
                  
                  return (
                    <div
                      key={item.id}
                      className={`
                        absolute w-16 h-16 cursor-move group transition-all duration-200 hover:scale-110
                        ${draggedItem?.id === item.id ? 'opacity-50' : ''}
                      `}
                      style={{
                        left: item.position_x,
                        top: item.position_y,
                      }}
                      onMouseDown={(e) => handleDragStart(item, e)}
                      draggable
                    >
                      <div className={`
                        w-full h-full rounded-lg border-2 ${rarity.border} ${rarity.bg} 
                        flex items-center justify-center shadow-lg backdrop-blur-sm
                        group-hover:shadow-xl group-hover:${rarity.border}
                      `}>
                        <ItemIcon className={`w-8 h-8 ${rarity.color}`} />
                      </div>
                      
                      {/* Remove button */}
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromCity(item);
                        }}
                      >
                        <RotateCcw className="w-3 h-3" />
                      </Button>
                      
                      {/* Item name tooltip */}
                      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-background/90 backdrop-blur-sm rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {item.item_name}
                      </div>
                    </div>
                  );
                })}

                {/* Empty state */}
                {cityItems.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <Building2 className="w-16 h-16 text-muted-foreground mx-auto" />
                      <div>
                        <h3 className="text-lg font-medium text-muted-foreground">Your city awaits</h3>
                        <p className="text-sm text-muted-foreground">
                          Complete activities to earn items, then drag them here to build your city
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
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