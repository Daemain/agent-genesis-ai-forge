
import React from 'react';
import { FormData } from './AgentForm';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Volume2 } from 'lucide-react';

interface PreviewPanelProps {
  formData: FormData;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ formData }) => {
  const getPreviewResponse = () => {
    const { fullName, isCompany, useCase, voiceStyle } = formData;
    
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
    return formData.fullName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getAvatarGradientClass = () => {
    const styles = [
      "bg-gradient-to-r from-agent-blue to-agent-purple",
      "bg-gradient-to-r from-agent-purple to-agent-light-purple",
      "bg-gradient-to-r from-agent-light-purple to-agent-blue",
      "bg-gradient-to-r from-agent-dark-blue to-agent-blue"
    ];
    
    // Use the first character of the full name as a simple hash
    const hash = formData.fullName ? formData.fullName.charCodeAt(0) % 4 : 0;
    return styles[hash];
  };
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-medium">Agent Preview</h3>
        <p className="text-sm text-gray-500">See how your AI agent will look and sound</p>
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
                {formData.useCase === 'sales' ? 'Sales Agent' : 
                 formData.useCase === 'customer-support' ? 'Support Agent' :
                 formData.useCase === 'lead-qualification' ? 'Lead Qualifier' : 'Assistant'}
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
        </div>
        
        <div className="mt-auto">
          <div className="flex items-center gap-2 mb-2">
            <Volume2 size={16} className="text-agent-purple" />
            <p className="text-sm font-medium">Voice Style: {formData.voiceStyle || "Professional"}</p>
          </div>
          <p className="text-xs text-gray-500">{getVoiceDescription()}</p>
          
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
            <MessageCircle size={14} />
            <p>Responds in under 2 seconds</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;
