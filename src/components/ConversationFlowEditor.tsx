
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Trash2, ChevronDown, ChevronUp, Save, Play } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ConversationScenario {
  id?: string;
  scenario: string;
  userInputs: string[];
  responses: string[];
  followUps: string[];
  nextScenarioId?: string;
  conditions?: string;
}

interface ConversationFlowEditorProps {
  initialFlow?: ConversationScenario[];
  profileData: any;
  isCompany: boolean;
  useCase: string;
  voiceStyle: string;
  name: string;
  onSave?: (flow: ConversationScenario[]) => void;
}

const ConversationFlowEditor: React.FC<ConversationFlowEditorProps> = ({
  initialFlow = [],
  profileData,
  isCompany,
  useCase,
  voiceStyle,
  name,
  onSave
}) => {
  const [flow, setFlow] = useState<ConversationScenario[]>(initialFlow.map((scenario, index) => ({
    ...scenario,
    id: scenario.id || `scenario-${index}`
  })));
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  const [selectedScenario, setSelectedScenario] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isPreviewingFlow, setIsPreviewingFlow] = useState(false);
  const [currentPreviewScenario, setCurrentPreviewScenario] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (initialFlow.length > 0) {
      setFlow(initialFlow.map((scenario, index) => ({
        ...scenario,
        id: scenario.id || `scenario-${index}`
      })));
    } else {
      generateFlow();
    }
  }, []);

  const generateFlow = async (useCustomPrompt = false) => {
    try {
      setIsGenerating(true);
      toast({
        title: "Generating Conversation Flow",
        description: "Please wait while we create a customized conversation flow..."
      });

      const { data, error } = await supabase.functions.invoke('generate-conversation-flow', {
        body: {
          profileData,
          useCase,
          name,
          isCompany,
          voiceStyle,
          customPrompt: useCustomPrompt ? customPrompt : undefined
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.message || "Failed to generate conversation flow");
      }

      setSystemPrompt(data.data.systemPrompt);
      
      // Assign IDs to scenarios
      const scenariosWithIds = data.data.conversationFlow.map((scenario: ConversationScenario, index: number) => ({
        ...scenario,
        id: `scenario-${index}`
      }));
      
      setFlow(scenariosWithIds);
      
      toast({
        title: "Flow Generated",
        description: "Conversation flow has been successfully created."
      });
    } catch (error) {
      console.error("Error generating conversation flow:", error);
      toast({
        title: "Error",
        description: "Failed to generate conversation flow. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addScenario = () => {
    const newScenarioId = `scenario-${Date.now()}`;
    const newScenario: ConversationScenario = {
      id: newScenarioId,
      scenario: "New Scenario",
      userInputs: ["Sample question 1", "Sample question 2"],
      responses: ["Sample response"],
      followUps: ["Sample follow-up question"]
    };
    setFlow([...flow, newScenario]);
    setSelectedScenario(flow.length);
  };

  const deleteScenario = (index: number) => {
    if (flow.length <= 1) {
      toast({
        title: "Cannot Delete",
        description: "You must have at least one scenario in your conversation flow.",
        variant: "destructive"
      });
      return;
    }
    
    const newFlow = flow.filter((_, i) => i !== index);
    setFlow(newFlow);
    
    if (selectedScenario === index) {
      setSelectedScenario(Math.max(0, index - 1));
    } else if (selectedScenario > index) {
      setSelectedScenario(selectedScenario - 1);
    }
  };

  const moveScenario = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === flow.length - 1)) {
      return;
    }
    
    const newFlow = [...flow];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newFlow[index], newFlow[newIndex]] = [newFlow[newIndex], newFlow[index]];
    
    setFlow(newFlow);
    setSelectedScenario(newIndex);
  };

  const updateScenario = (index: number, field: keyof ConversationScenario, value: string | string[]) => {
    const newFlow = [...flow];
    
    if (field === 'scenario' || field === 'nextScenarioId' || field === 'conditions') {
      newFlow[index][field] = value as string;
    } else {
      newFlow[index][field] = value as string[];
    }
    
    setFlow(newFlow);
  };

  const updateArrayItem = (scenarioIndex: number, field: 'userInputs' | 'responses' | 'followUps', itemIndex: number, value: string) => {
    const newFlow = [...flow];
    newFlow[scenarioIndex][field][itemIndex] = value;
    setFlow(newFlow);
  };

  const addArrayItem = (scenarioIndex: number, field: 'userInputs' | 'responses' | 'followUps') => {
    const newFlow = [...flow];
    newFlow[scenarioIndex][field].push("");
    setFlow(newFlow);
  };

  const removeArrayItem = (scenarioIndex: number, field: 'userInputs' | 'responses' | 'followUps', itemIndex: number) => {
    if (flow[scenarioIndex][field].length <= 1) {
      toast({
        title: "Cannot Delete",
        description: `You must have at least one ${field.slice(0, -1)} in your scenario.`,
        variant: "destructive"
      });
      return;
    }
    
    const newFlow = [...flow];
    newFlow[scenarioIndex][field].splice(itemIndex, 1);
    setFlow(newFlow);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(flow);
    }
    
    toast({
      title: "Saved",
      description: "Your conversation flow has been saved."
    });
  };

  const handleGenerateWithCustomPrompt = () => {
    if (!customPrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a custom prompt.",
        variant: "destructive"
      });
      return;
    }
    
    generateFlow(true);
  };

  const startFlowPreview = () => {
    setIsPreviewingFlow(true);
    setCurrentPreviewScenario(0);
  };

  const stopFlowPreview = () => {
    setIsPreviewingFlow(false);
    setCurrentPreviewScenario(null);
  };

  const moveToNextScenario = (currentIndex: number) => {
    const currentScenario = flow[currentIndex];
    
    // If there's a specified next scenario
    if (currentScenario.nextScenarioId) {
      const nextIndex = flow.findIndex(s => s.id === currentScenario.nextScenarioId);
      if (nextIndex !== -1) {
        setCurrentPreviewScenario(nextIndex);
        return;
      }
    }
    
    // Default: move to next scenario in sequence
    const nextIndex = currentIndex + 1;
    if (nextIndex < flow.length) {
      setCurrentPreviewScenario(nextIndex);
    } else {
      toast({
        title: "End of Flow",
        description: "You've reached the end of the conversation flow."
      });
      stopFlowPreview();
    }
  };

  const getScenarioType = (scenario: ConversationScenario) => {
    if (scenario.scenario.toLowerCase().includes('intro') || scenario.scenario.toLowerCase().includes('greeting')) {
      return '🟢'; // Intro
    } else if (scenario.userInputs.some(input => input.includes('?')) || scenario.scenario.toLowerCase().includes('question')) {
      return '🔵'; // Question
    } else if (scenario.nextScenarioId || scenario.conditions) {
      return '🟡'; // Decision
    }
    return '⚪'; // Default
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Tabs defaultValue="scenarios" className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="scenarios">Conversation Flow</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="scenarios" className="space-y-4">
          {isPreviewingFlow ? (
            <div className="bg-white rounded-md shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Flow Preview Mode</h3>
                <Button variant="outline" onClick={stopFlowPreview}>Exit Preview</Button>
              </div>
              
              {currentPreviewScenario !== null && (
                <div className="space-y-6">
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <CardTitle>{flow[currentPreviewScenario].scenario}</CardTitle>
                      <CardDescription>Scenario {currentPreviewScenario + 1} of {flow.length}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Example User Questions:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {flow[currentPreviewScenario].userInputs.map((input, i) => (
                            <li key={i} className="text-gray-700">{input}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Agent Responses:</h4>
                        <div className="space-y-2">
                          {flow[currentPreviewScenario].responses.map((response, i) => (
                            <div key={i} className="p-3 bg-blue-50 rounded-md text-gray-700">{response}</div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Follow-up Questions:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {flow[currentPreviewScenario].followUps.map((followUp, i) => (
                            <li key={i} className="text-gray-700">{followUp}</li>
                          ))}
                        </ul>
                      </div>
                      
                      {flow[currentPreviewScenario].conditions && (
                        <div className="p-3 bg-yellow-50 rounded-md">
                          <h4 className="text-sm font-medium mb-1">Conditions:</h4>
                          <p className="text-gray-700">{flow[currentPreviewScenario].conditions}</p>
                        </div>
                      )}
                      
                      {flow[currentPreviewScenario].nextScenarioId && (
                        <div className="p-3 bg-green-50 rounded-md">
                          <h4 className="text-sm font-medium mb-1">Next Scenario:</h4>
                          <p className="text-gray-700">
                            {flow.find(s => s.id === flow[currentPreviewScenario].nextScenarioId)?.scenario || 'Unknown'}
                          </p>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button 
                        onClick={() => moveToNextScenario(currentPreviewScenario)}
                        className="w-full"
                      >
                        Continue to Next Scenario
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Conversation Scenarios</h3>
                <div className="space-x-2">
                  <Button 
                    onClick={addScenario} 
                    size="sm" 
                    className="flex items-center gap-1"
                  >
                    <PlusCircle size={16} /> Add Scenario
                  </Button>
                  <Button 
                    onClick={startFlowPreview} 
                    size="sm"
                    variant="outline" 
                    className="flex items-center gap-1"
                  >
                    <Play size={16} /> Preview Flow
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1 bg-white rounded-md shadow p-4 h-[600px] overflow-y-auto">
                  <ul className="space-y-2">
                    {flow.map((scenario, index) => (
                      <li key={index} className="relative">
                        <button
                          onClick={() => setSelectedScenario(index)}
                          className={`w-full text-left p-2 rounded flex items-center ${
                            selectedScenario === index ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                          }`}
                        >
                          <span className="mr-2" title={
                            getScenarioType(scenario) === '🟢' ? 'Intro/Greeting' : 
                            getScenarioType(scenario) === '🔵' ? 'Question' : 
                            getScenarioType(scenario) === '🟡' ? 'Decision' : 'General'
                          }>
                            {getScenarioType(scenario)}
                          </span>
                          <span className="truncate">{scenario.scenario || `Scenario ${index + 1}`}</span>
                        </button>
                        <div className="absolute right-2 top-2 flex space-x-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); moveScenario(index, 'up'); }}
                            className="text-gray-500 hover:text-gray-700"
                            disabled={index === 0}
                            title="Move up"
                          >
                            <ChevronUp size={16} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); moveScenario(index, 'down'); }}
                            className="text-gray-500 hover:text-gray-700"
                            disabled={index === flow.length - 1}
                            title="Move down"
                          >
                            <ChevronDown size={16} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteScenario(index); }}
                            className="text-red-500 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="md:col-span-3 bg-white rounded-md shadow p-4 h-[600px] overflow-y-auto">
                  {flow.length > 0 && (
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="scenario-name">Scenario Name</Label>
                        <Input
                          id="scenario-name"
                          value={flow[selectedScenario]?.scenario || ""}
                          onChange={(e) => updateScenario(selectedScenario, 'scenario', e.target.value)}
                          placeholder="Enter scenario name"
                          className="mb-6"
                        />
                      </div>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Example User Questions</CardTitle>
                          <CardDescription>
                            Questions the user might ask that would trigger this scenario
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {flow[selectedScenario]?.userInputs.map((input, index) => (
                            <div key={index} className="flex mt-2 group">
                              <Input
                                value={input}
                                onChange={(e) => updateArrayItem(selectedScenario, 'userInputs', index, e.target.value)}
                                placeholder={`User question ${index + 1}`}
                                className="flex-1"
                              />
                              <Button 
                                size="icon" 
                                variant="outline" 
                                className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeArrayItem(selectedScenario, 'userInputs', index)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          ))}
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => addArrayItem(selectedScenario, 'userInputs')}
                            className="mt-2 w-full"
                          >
                            <PlusCircle size={16} className="mr-2"/> Add Question
                          </Button>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Agent Responses</CardTitle>
                          <CardDescription>
                            How the AI agent should respond to user inquiries
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {flow[selectedScenario]?.responses.map((response, index) => (
                            <div key={index} className="flex mt-2 group">
                              <Textarea
                                value={response}
                                onChange={(e) => updateArrayItem(selectedScenario, 'responses', index, e.target.value)}
                                placeholder={`Agent response ${index + 1}`}
                                className="flex-1"
                                rows={3}
                              />
                              <Button 
                                size="icon" 
                                variant="outline" 
                                className="ml-2 h-auto opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeArrayItem(selectedScenario, 'responses', index)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          ))}
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => addArrayItem(selectedScenario, 'responses')}
                            className="mt-2 w-full"
                          >
                            <PlusCircle size={16} className="mr-2"/> Add Response
                          </Button>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Follow-up Questions</CardTitle>
                          <CardDescription>
                            Questions the agent might ask to keep the conversation going
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {flow[selectedScenario]?.followUps.map((followUp, index) => (
                            <div key={index} className="flex mt-2 group">
                              <Input
                                value={followUp}
                                onChange={(e) => updateArrayItem(selectedScenario, 'followUps', index, e.target.value)}
                                placeholder={`Follow-up question ${index + 1}`}
                                className="flex-1"
                              />
                              <Button 
                                size="icon" 
                                variant="outline" 
                                className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeArrayItem(selectedScenario, 'followUps', index)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          ))}
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => addArrayItem(selectedScenario, 'followUps')}
                            className="mt-2 w-full"
                          >
                            <PlusCircle size={16} className="mr-2"/> Add Follow-up
                          </Button>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Flow Logic</CardTitle>
                          <CardDescription>
                            Control where the conversation goes next
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label htmlFor="next-scenario">Next Scenario</Label>
                            <Select
                              value={flow[selectedScenario]?.nextScenarioId || ""}
                              onValueChange={(value) => updateScenario(selectedScenario, 'nextScenarioId', value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select next scenario (optional)" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Default (Next in sequence)</SelectItem>
                                {flow.map((scenario, index) => (
                                  index !== selectedScenario && (
                                    <SelectItem key={index} value={scenario.id || `scenario-${index}`}>
                                      {scenario.scenario || `Scenario ${index + 1}`}
                                    </SelectItem>
                                  )
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="conditions">Conditions (Optional)</Label>
                            <Textarea
                              id="conditions"
                              value={flow[selectedScenario]?.conditions || ""}
                              onChange={(e) => updateScenario(selectedScenario, 'conditions', e.target.value)}
                              placeholder="e.g., If user mentions 'pricing', go to pricing scenario"
                              rows={2}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => generateFlow()} 
                  disabled={isGenerating}
                >
                  {isGenerating ? "Generating..." : "Regenerate Flow"}
                </Button>
                
                <Button 
                  onClick={handleSave}
                  className="flex items-center gap-1"
                >
                  <Save size={16} /> Save Flow
                </Button>
              </div>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Prompt</CardTitle>
              <CardDescription>
                The core instructions that guide your AI agent's behavior and knowledge
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={8}
                placeholder="System prompt that guides the AI agent's behavior and knowledge"
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Custom Flow Generation</CardTitle>
              <CardDescription>
                Create a new conversation flow with custom instructions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={8}
                placeholder="Enter a custom prompt to generate a different conversation flow"
                className="font-mono text-sm"
              />
              <Button 
                onClick={handleGenerateWithCustomPrompt}
                disabled={isGenerating || !customPrompt.trim()}
                className="w-full"
              >
                {isGenerating ? "Generating..." : "Generate With Custom Prompt"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConversationFlowEditor;
