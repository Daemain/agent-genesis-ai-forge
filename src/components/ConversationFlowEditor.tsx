
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2, ChevronDown, ChevronUp, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ConversationScenario {
  scenario: string;
  userInputs: string[];
  responses: string[];
  followUps: string[];
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
  const [flow, setFlow] = useState<ConversationScenario[]>(initialFlow);
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  const [selectedScenario, setSelectedScenario] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (initialFlow.length > 0) {
      setFlow(initialFlow);
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
      setFlow(data.data.conversationFlow);
      
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
    const newScenario: ConversationScenario = {
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
    
    if (field === 'scenario') {
      newFlow[index].scenario = value as string;
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

  return (
    <div className="space-y-6">
      <Tabs defaultValue="scenarios" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="scenarios" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Conversation Scenarios</h3>
            <Button 
              onClick={addScenario} 
              size="sm" 
              className="flex items-center gap-1"
            >
              <PlusCircle size={16} /> Add Scenario
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1 bg-white rounded-md shadow p-4 h-[500px] overflow-y-auto">
              <ul className="space-y-2">
                {flow.map((scenario, index) => (
                  <li key={index} className="relative">
                    <button
                      onClick={() => setSelectedScenario(index)}
                      className={`w-full text-left p-2 rounded ${
                        selectedScenario === index ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      {scenario.scenario || `Scenario ${index + 1}`}
                    </button>
                    <div className="absolute right-2 top-2 flex space-x-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); moveScenario(index, 'up'); }}
                        className="text-gray-500 hover:text-gray-700"
                        disabled={index === 0}
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); moveScenario(index, 'down'); }}
                        className="text-gray-500 hover:text-gray-700"
                        disabled={index === flow.length - 1}
                      >
                        <ChevronDown size={16} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteScenario(index); }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-3 bg-white rounded-md shadow p-4 h-[500px] overflow-y-auto">
              {flow.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="scenario-name">Scenario Name</Label>
                    <Input
                      id="scenario-name"
                      value={flow[selectedScenario]?.scenario || ""}
                      onChange={(e) => updateScenario(selectedScenario, 'scenario', e.target.value)}
                      placeholder="Enter scenario name"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center">
                      <Label>Example User Questions</Label>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => addArrayItem(selectedScenario, 'userInputs')}
                      >
                        <PlusCircle size={16} /> Add
                      </Button>
                    </div>
                    
                    {flow[selectedScenario]?.userInputs.map((input, index) => (
                      <div key={index} className="flex mt-2">
                        <Input
                          value={input}
                          onChange={(e) => updateArrayItem(selectedScenario, 'userInputs', index, e.target.value)}
                          placeholder={`User question ${index + 1}`}
                          className="flex-1"
                        />
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="ml-2"
                          onClick={() => removeArrayItem(selectedScenario, 'userInputs', index)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="flex justify-between items-center">
                      <Label>Agent Responses</Label>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => addArrayItem(selectedScenario, 'responses')}
                      >
                        <PlusCircle size={16} /> Add
                      </Button>
                    </div>
                    
                    {flow[selectedScenario]?.responses.map((response, index) => (
                      <div key={index} className="flex mt-2">
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
                          className="ml-2 h-auto"
                          onClick={() => removeArrayItem(selectedScenario, 'responses', index)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="flex justify-between items-center">
                      <Label>Follow-up Questions</Label>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => addArrayItem(selectedScenario, 'followUps')}
                      >
                        <PlusCircle size={16} /> Add
                      </Button>
                    </div>
                    
                    {flow[selectedScenario]?.followUps.map((followUp, index) => (
                      <div key={index} className="flex mt-2">
                        <Input
                          value={followUp}
                          onChange={(e) => updateArrayItem(selectedScenario, 'followUps', index, e.target.value)}
                          placeholder={`Follow-up question ${index + 1}`}
                          className="flex-1"
                        />
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="ml-2"
                          onClick={() => removeArrayItem(selectedScenario, 'followUps', index)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
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
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="system-prompt">System Prompt</Label>
              <Textarea
                id="system-prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={8}
                placeholder="System prompt that guides the AI agent's behavior and knowledge"
                className="font-mono text-sm"
              />
            </div>
            
            <div>
              <Label htmlFor="custom-prompt">Custom Prompt</Label>
              <Textarea
                id="custom-prompt"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={8}
                placeholder="Enter a custom prompt to generate a different conversation flow"
                className="font-mono text-sm"
              />
              <Button 
                className="mt-2" 
                onClick={handleGenerateWithCustomPrompt}
                disabled={isGenerating || !customPrompt.trim()}
              >
                {isGenerating ? "Generating..." : "Generate With Custom Prompt"}
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="preview">
          <div className="bg-white rounded-md shadow p-4 max-h-[600px] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">Flow Preview</h3>
            
            <div className="space-y-6">
              {flow.map((scenario, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{scenario.scenario}</CardTitle>
                    <CardDescription>
                      Scenario {index + 1} of {flow.length}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">User Inputs:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {scenario.userInputs.map((input, i) => (
                          <li key={i} className="text-gray-700">{input}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Agent Responses:</h4>
                      <div className="space-y-2">
                        {scenario.responses.map((response, i) => (
                          <div key={i} className="p-3 bg-blue-50 rounded-md text-gray-700">{response}</div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Follow-up Questions:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {scenario.followUps.map((followUp, i) => (
                          <li key={i} className="text-gray-700">{followUp}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConversationFlowEditor;
