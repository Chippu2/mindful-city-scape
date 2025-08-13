import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Sparkles, 
  Building2, 
  Settings, 
  LogOut,
  Menu,
  X,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Card } from '@/components/ui/card';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);

  const navItems = [
    { path: '/', icon: Home, label: 'Break Schedule', description: 'Plan your mindful moments' },
    { path: '/activities', icon: Sparkles, label: 'Mindful Activities', description: 'Guided relaxation tasks' },
    { path: '/city', icon: Building2, label: 'Your City', description: 'Build your magical city' },
    { path: '/settings', icon: Settings, label: 'Settings', description: 'Customize your experience' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const toggleMusic = () => {
    setMusicPlaying(!musicPlaying);
    // Note: Actual music implementation would go here
  };

  return (
    <div className="min-h-screen bg-gradient-sky">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-card/80 backdrop-blur-sm border border-primary/20"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-80 bg-card/95 backdrop-blur-sm border-r border-primary/20 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-2 rounded-lg bg-gradient-magic">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-magic bg-clip-text text-transparent">
                Mindscape City
              </h1>
              <p className="text-sm text-muted-foreground">Your mindful oasis</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Button
                  key={item.path}
                  variant={isActive ? "default" : "ghost"}
                  className={`
                    w-full justify-start h-auto p-4 text-left transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-magic text-primary-foreground shadow-lg' 
                      : 'hover:bg-primary/10 hover:border-primary/20'
                    }
                  `}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                >
                  <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{item.label}</span>
                    <span className={`text-xs ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {item.description}
                    </span>
                  </div>
                </Button>
              );
            })}
          </nav>

          {/* Music toggle */}
          <div className="mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMusic}
              className="w-full border-primary/20 hover:bg-primary/10"
            >
              {musicPlaying ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
              {musicPlaying ? 'Music On' : 'Music Off'}
            </Button>
          </div>

          {/* Sign out */}
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-80">
        <main className="min-h-screen p-4 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;