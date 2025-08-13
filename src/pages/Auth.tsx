import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Stars } from 'lucide-react';

const Auth = () => {
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  });

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          toast({
            title: "Sign in failed",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Welcome back to Mindscape City!",
            description: "Ready for your mindful break?"
          });
        }
      } else {
        const { error } = await signUp(formData.email, formData.password, formData.username);
        if (error) {
          toast({
            title: "Sign up failed", 
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Welcome to Mindscape City!",
            description: "Check your email to confirm your account, then start building your magical city!"
          });
        }
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-sky flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating sparkles background */}
        <div className="absolute top-20 left-20 animate-bounce">
          <Sparkles className="w-6 h-6 text-magic-glow opacity-60" />
        </div>
        <div className="absolute top-40 right-32 animate-pulse">
          <Stars className="w-8 h-8 text-rare-glow opacity-50" />
        </div>
        <div className="absolute bottom-32 left-1/4 animate-bounce delay-1000">
          <Sparkles className="w-4 h-4 text-legendary-glow opacity-70" />
        </div>
        <div className="absolute bottom-20 right-20 animate-pulse delay-500">
          <Stars className="w-6 h-6 text-accent opacity-60" />
        </div>
      </div>

      <Card className="w-full max-w-md backdrop-blur-sm bg-card/90 border-2 border-primary/20 shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="p-3 rounded-full bg-gradient-magic">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl bg-gradient-magic bg-clip-text text-transparent">
            {isLogin ? 'Welcome Back' : 'Join Mindscape City'}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isLogin 
              ? 'Ready to continue your mindful journey?' 
              : 'Start building your magical city with mindful breaks'
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="your@email.com"
                required
                className="border-primary/20 focus:border-primary"
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  placeholder="Your city builder name"
                  className="border-primary/20 focus:border-primary"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Your secure password"
                required
                className="border-primary/20 focus:border-primary"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-magic hover:opacity-90 transition-opacity"
              disabled={loading}
            >
              {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:text-primary/80"
              >
                {isLogin 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;