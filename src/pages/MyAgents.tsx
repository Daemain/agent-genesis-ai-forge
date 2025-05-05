
import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Volume2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';

interface Agent {
  id: string;
  name: string;
  email: string;
  is_company: boolean;
  url: string;
  use_case: string;
  voice_style: string;
  eleven_labs_agent_id: string | null;
  created_at: string;
}

const MyAgents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your agents. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getAvatarGradientClass = (name: string) => {
    const styles = [
      "bg-gradient-to-r from-agent-blue to-agent-purple",
      "bg-gradient-to-r from-agent-purple to-agent-light-purple",
      "bg-gradient-to-r from-agent-light-purple to-agent-blue",
      "bg-gradient-to-r from-agent-dark-blue to-agent-blue"
    ];
    
    // Use the first character of the name as a simple hash
    const hash = name.charCodeAt(0) % 4;
    return styles[hash];
  };

  const getUseCaseLabel = (useCase: string) => {
    switch (useCase) {
      case 'sales': return 'Sales Agent';
      case 'customer-support': return 'Support Agent';
      case 'lead-qualification': return 'Lead Qualifier';
      default: return 'Assistant';
    }
  };

  const getVoiceDescription = (voiceStyle: string) => {
    switch (voiceStyle) {
      case 'friendly': return "Warm, conversational, approachable";
      case 'professional': return "Clear, authoritative, poised";
      case 'energetic': return "Dynamic, enthusiastic, engaging";
      case 'calm': return "Soothing, composed, reassuring";
      default: return "Professional, clear, friendly";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-radial from-white to-gray-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid -z-10"></div>
      <Header />
      
      <main className="flex-1 w-full px-4 md:px-8 py-12">
        <div className="container max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">My AI Agents</h1>
              <p className="text-gray-600">Manage your AI sales agents</p>
            </div>
            <Link to="/">
              <Button>Create New Agent</Button>
            </Link>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-agent-blue"></div>
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <h3 className="text-lg font-medium mb-2">No agents yet</h3>
              <p className="text-gray-500 mb-6">You haven't created any AI agents yet.</p>
              <Link to="/">
                <Button>Create Your First Agent</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map(agent => (
                <Card key={agent.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <Avatar className={`w-12 h-12 ${getAvatarGradientClass(agent.name)}`}>
                        <AvatarFallback className="text-white">{getInitials(agent.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                        <CardDescription className="mt-1">{agent.email}</CardDescription>
                        <div className="mt-2">
                          <Badge variant="outline">{getUseCaseLabel(agent.use_case)}</Badge>
                          {agent.is_company && (
                            <Badge variant="outline" className="ml-2">Company</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      <p className="text-gray-500 mb-2">
                        Created on {new Date(agent.created_at).toLocaleDateString()}
                      </p>
                      <div className="flex items-center mt-4">
                        <Volume2 size={16} className="text-agent-purple mr-2" />
                        <span className="font-medium">Voice:</span>
                        <span className="ml-1 capitalize">{agent.voice_style}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{getVoiceDescription(agent.voice_style)}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4 flex justify-between">
                    <Button variant="outline" size="sm" className="w-full">
                      Chat with Agent
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default MyAgents;
