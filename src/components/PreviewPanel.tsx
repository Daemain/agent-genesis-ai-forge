
import React, { useState } from 'react';
import { FormData } from './AgentForm';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Volume2, Mic, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface PreviewPanelProps {
  formData: FormData;
}

interface ConversationScenario {
  scenario: string;
  userInputs?: string[];
  responses: string[];
  followUps?: string[];
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  formData
}) => {
  const [openScenario, setOpenScenario] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const getPreviewResponse = () => {
    const {
      fullName,
      isCompany,
      useCase,
      voiceStyle
    } = formData;
    if (!fullName) return "Once you fill out the form, you'll see a preview of your AI agent here.";
    const companyOrPerson = isCompany ? "your company" : "you";
    let response = "";
    switch (useCase) {
      case 'sales':
        response = `Hi there! I'm an AI sales assistant for ${fullName}. I can help qualify leads, schedule demos, and answer questions about our products and pricing.`;
        break;
      case 'customer-support':
        response = `Hello! I'm ${fullName}'s customer support assistant. I can help troubleshoot issues, process returns, and handle general inquiries about our services.`;
        break;
      case 'lead-qualification':
        response = `Hi! I'm ${fullName}'s lead qualification assistant. I can help identify potential customers, gather key information, and connect promising leads with the sales team.`;
        break;
      default:
        response = `Hello! I'm an AI assistant for ${fullName}. I'm here to help with any questions you may have about ${companyOrPerson}.`;
    }
    return response;
  };

  const getVoiceDescription = () => {
    switch (formData.voiceStyle) {
      case 'friendly':
        return "Warm, conversational, approachable";
      case 'professional':
        return "Clear, authoritative, poised";
      case 'energetic':
        return "Dynamic, enthusiastic, engaging";
      case 'calm':
        return "Soothing, composed, reassuring";
      default:
        return "Professional, clear, friendly";
    }
  };

  const getInitials = () => {
    if (!formData.fullName) return "AI";
    return formData.fullName.split(' ').map(name => name[0]).join('').toUpperCase().substring(0, 2);
  };

  const getAvatarGradientClass = () => {
    const styles = ["bg-gradient-to-r from-agent-blue to-agent-purple", "bg-gradient-to-r from-agent-purple to-agent-light-purple", "bg-gradient-to-r from-agent-light-purple to-agent-blue", "bg-gradient-to-r from-agent-dark-blue to-agent-blue"];

    // Use the first character of the full name as a simple hash
    const hash = formData.fullName ? formData.fullName.charCodeAt(0) % 4 : 0;
    return styles[hash];
  };

  const getSampleDialogueFlow = () => {
    if (!formData.fullName) return [];

    // Return sample dialogue based on use case
    switch (formData.useCase) {
      case 'sales':
        return [{
          speaker: 'User',
          message: 'What products do you offer?'
        }, {
          speaker: 'Agent',
          message: `We offer a range of solutions designed to help businesses grow. Our most popular service is our AI-powered sales automation platform.`
        }, {
          speaker: 'User',
          message: 'How much does it cost?'
        }, {
          speaker: 'Agent',
          message: 'Our pricing is customized based on your specific needs. Would you like to schedule a demo to discuss your requirements?'
        }];
      case 'customer-support':
        return [{
          speaker: 'User',
          message: "I'm having trouble with my account"
        }, {
          speaker: 'Agent',
          message: `I'm sorry to hear that. Let me help you resolve this issue. Could you please tell me more about what's happening?`
        }, {
          speaker: 'User',
          message: "I can't log in with my password"
        }, {
          speaker: 'Agent',
          message: 'I understand how frustrating that can be. Let me help you reset your password or would you like me to connect you with our support team?'
        }];
      default:
        return [{
          speaker: 'User',
          message: 'Tell me about your services'
        }, {
          speaker: 'Agent',
          message: `I'd be happy to tell you about what ${formData.fullName} offers. Our focus is on delivering exceptional value through our specialized services.`
        }, {
          speaker: 'User',
          message: 'How can we get started?'
        }, {
          speaker: 'Agent',
          message: 'Getting started is easy! Would you like to schedule a call to discuss your specific needs?'
        }];
    }
  };

  // Sample conversation flow for preview
  const getSampleConversationScenarios = (): ConversationScenario[] => {
    if (!formData.fullName) return [];
    
    const name = formData.fullName;
    
    const baseScenarios = [
      {
        scenario: "Introduction",
        userInputs: ["Hi there", "Hello", "Who are you?"],
        responses: [`Hi, I'm ${name}'s AI assistant. How can I help you today?`, `Hello! I'm an AI assistant for ${name}. What can I assist you with?`],
        followUps: ["Is there something specific you'd like to know?", "How can I help you today?"]
      }
    ];
    
    let useCaseScenarios: ConversationScenario[] = [];
    
    switch (formData.useCase) {
      case 'sales':
        useCaseScenarios = [
          {
            scenario: "Products/Services",
            userInputs: ["What do you offer?", "Tell me about your products"],
            responses: [`At ${name}, we offer a range of solutions designed to meet your business needs. Our most popular offerings include our AI-powered automation tools and consulting services.`],
            followUps: ["Would you like more details on any specific offering?", "Are there particular challenges you're looking to solve?"]
          },
          {
            scenario: "Pricing Information",
            userInputs: ["How much does it cost?", "What are your prices?"],
            responses: [`Our pricing is customized based on your specific requirements. We offer flexible packages starting from $X per month.`, `We tailor our pricing to your needs. Would you like to schedule a consultation to discuss your requirements?`],
            followUps: ["What's your budget range?", "Would you prefer a monthly subscription or annual plan?"]
          }
        ];
        break;
      case 'customer-support':
        useCaseScenarios = [
          {
            scenario: "Troubleshooting",
            userInputs: ["I have a problem with my account", "My order hasn't arrived"],
            responses: [`I'm sorry to hear you're experiencing an issue. Could you please provide more details so I can help you better?`, `I understand how frustrating that can be. Let's get this resolved for you right away.`],
            followUps: ["When did you first notice this issue?", "Could you share your order number with me?"]
          },
          {
            scenario: "Returns and Refunds",
            userInputs: ["I want to return my purchase", "How do I get a refund?"],
            responses: [`I'd be happy to help with your return. Our return policy allows returns within 30 days of purchase.`, `For refunds, I'll need some information about your order first. Could you share your order details?`],
            followUps: ["Do you have the original packaging?", "When did you make your purchase?"]
          }
        ];
        break;
      case 'lead-qualification':
        useCaseScenarios = [
          {
            scenario: "Need Assessment",
            userInputs: ["I'm interested in your services", "My company needs solutions like yours"],
            responses: [`That's great to hear! To better understand how we can help, could you tell me a bit about your current challenges?`, `I appreciate your interest. To ensure we're a good fit, may I ask about your specific requirements?`],
            followUps: ["How many employees does your company have?", "What solutions have you tried before?"]
          },
          {
            scenario: "Budget Discussion",
            userInputs: ["What's the typical investment?", "How much should we budget for this?"],
            responses: [`Our solutions are tailored to your specific needs, with investments typically ranging from $X to $Y depending on scope.`, `We offer several packages at different price points. Could you share your budget range so I can recommend the most appropriate solution?`],
            followUps: ["When are you looking to implement this solution?", "Would you prefer a comprehensive package or starting with basics?"]
          }
        ];
        break;
      default:
        useCaseScenarios = [
          {
            scenario: "General Information",
            userInputs: ["Tell me about yourself", "What do you do?"],
            responses: [`I'm an AI assistant for ${name}, designed to provide information and assistance related to our offerings.`, `I represent ${name} and can answer questions, provide information, and help with various requests.`],
            followUps: ["Is there something specific you'd like to know?", "How can I assist you today?"]
          }
        ];
    }
    
    return [...baseScenarios, ...useCaseScenarios];
  };

  const toggleScenario = (scenarioName: string) => {
    if (openScenario === scenarioName) {
      setOpenScenario(null);
    } else {
      setOpenScenario(scenarioName);
    }
  };

  return <div className="bg-white rounded-xl shadow-lg p-6 h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-medium">Live Agent Preview</h3>
        <p className="text-sm text-gray-500">See a sample response based on your current inputs. Updates automatically</p>
      </div>
      
      <div className="flex-1 flex flex-col">
        <div className="flex items-start gap-3 mb-6">
          <Avatar className={`w-12 h-12 ${getAvatarGradientClass()}`}>
            <AvatarFallback className="text-white font-medium">{getInitials()}</AvatarFallback>
          </Avatar>
          
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{formData.fullName || "AI Agent"}</h4>
              <Badge variant="outline" className="text-xs font-normal">
                {formData.useCase === 'sales' ? 'Sales Agent' : formData.useCase === 'customer-support' ? 'Support Agent' : formData.useCase === 'lead-qualification' ? 'Lead Qualifier' : 'Assistant'}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">
              {formData.email || "agent@example.com"}
            </p>
          </div>
        </div>
        
        <div className="mb-6 flex-1">
          <div className="p-4 rounded-lg bg-gray-50 relative">
            <div className="absolute -top-2 left-4 w-4 h-4 bg-gray-50 rotate-45"></div>
            <p className="text-gray-800">{getPreviewResponse()}</p>
          </div>
          
          {/* Sample dialogue flow */}
          {formData.fullName && <div className="mt-6">
              <h5 className="text-sm font-medium mb-2">Sample Conversation Flow</h5>
              <div className="space-y-3">
                {getSampleDialogueFlow().map((dialogue, index) => <div key={index} className={`flex ${dialogue.speaker === 'User' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg ${dialogue.speaker === 'User' ? 'bg-agent-blue/10 text-agent-blue' : 'bg-gray-50'}`}>
                      <p className="text-xs font-semibold mb-1">{dialogue.speaker}</p>
                      <p className="text-sm">{dialogue.message}</p>
                    </div>
                  </div>)}
              </div>
            </div>}
          
          {/* Advanced Conversation Flow Preview */}
          {formData.fullName && (
            <div className="mt-8">
              <Button 
                variant="outline" 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex justify-between items-center"
              >
                <span>Advanced Conversation Flow</span>
                {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </Button>
              
              {showAdvanced && (
                <div className="mt-4 space-y-4 max-h-[300px] overflow-y-auto">
                  {getSampleConversationScenarios().map((scenario, index) => (
                    <Collapsible 
                      key={index}
                      open={openScenario === scenario.scenario} 
                      onOpenChange={() => toggleScenario(scenario.scenario)}
                      className="border rounded-md"
                    >
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="w-full flex justify-between items-center p-3 h-auto"
                        >
                          <span>{scenario.scenario}</span>
                          {openScenario === scenario.scenario ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-3 pt-0 border-t">
                        {scenario.userInputs && scenario.userInputs.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-semibold text-gray-500 mb-1">User may ask:</p>
                            <div className="flex flex-wrap gap-1">
                              {scenario.userInputs.map((input, i) => (
                                <Badge key={i} variant="outline" className="bg-agent-blue/5">{input}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-500 mb-1">Agent responses:</p>
                          <div className="space-y-2">
                            {scenario.responses.map((response, i) => (
                              <p key={i} className="text-sm bg-gray-50 p-2 rounded">{response}</p>
                            ))}
                          </div>
                        </div>
                        
                        {scenario.followUps && scenario.followUps.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1">Follow-up questions:</p>
                            <div className="flex flex-wrap gap-1">
                              {scenario.followUps.map((followUp, i) => (
                                <Badge key={i} variant="outline" className="bg-agent-purple/5">{followUp}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-auto">
          <div className="flex items-center gap-2 mb-2">
            <Volume2 size={16} className="text-agent-purple" />
            <p className="text-sm font-medium">Voice Style: {formData.voiceStyle || "Professional"}</p>
          </div>
          <p className="text-xs text-gray-500">{getVoiceDescription()}</p>
          
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MessageCircle size={14} />
              <p>Responds in under 2 seconds</p>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Mic size={14} className="text-agent-light-purple" />
              <p>ElevenLabs Voice AI</p>
            </div>
          </div>
        </div>
      </div>
    </div>;
};

export default PreviewPanel;
