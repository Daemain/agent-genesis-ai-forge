
import React from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import ConversationFlowEditor from "@/components/ConversationFlowEditor";
import { ConversationScenario } from "@/types/agent";

interface ConversationFlowTabProps {
  structuredData: any;
  conversationFlow: ConversationScenario[];
  isCompany: boolean;
  useCase: string;
  voiceStyle: string;
  name: string;
  isSubmitting: boolean;
  onSaveFlow: (flow: ConversationScenario[]) => void;
}

const ConversationFlowTab: React.FC<ConversationFlowTabProps> = ({
  structuredData,
  conversationFlow,
  isCompany,
  useCase,
  voiceStyle,
  name,
  isSubmitting,
  onSaveFlow
}) => {
  return (
    <div className="px-6 pb-6">
      {structuredData && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-medium">Customize Conversation Flow</h3>
            <div className="text-sm text-gray-500">
              {conversationFlow.length > 0 ? "Flow generated successfully" : "Generate a flow to begin"}
            </div>
          </div>
          
          <ConversationFlowEditor 
            initialFlow={conversationFlow} 
            profileData={structuredData} 
            isCompany={isCompany} 
            useCase={useCase} 
            voiceStyle={voiceStyle} 
            name={name} 
            onSave={onSaveFlow} 
          />
          
          <div className="flex justify-end mt-4">
            <Button type="submit" className="bg-agent-blue hover:bg-agent-blue/90 text-white" disabled={isSubmitting || conversationFlow.length === 0}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : 'Create AI Agent with Custom Flow'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationFlowTab;
