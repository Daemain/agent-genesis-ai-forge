
import React from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from 'lucide-react';
import ConversationFlowEditor from "@/components/ConversationFlowEditor";
import { ConversationScenario } from "@/types/agent";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  if (!structuredData) {
    return (
      <div className="px-6 pb-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Profile data is required. Please go back to the Agent Details tab and extract profile information first.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="px-6 pb-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-medium">Customize Conversation Flow</h3>
          <div className="text-sm text-gray-500">
            {conversationFlow.length > 0 ? "Flow generated successfully" : "Generate a flow to begin"}
          </div>
        </div>
        
        {conversationFlow.length > 0 ? (
          <ConversationFlowEditor 
            initialFlow={conversationFlow} 
            profileData={structuredData} 
            isCompany={isCompany} 
            useCase={useCase} 
            voiceStyle={voiceStyle} 
            name={name} 
            onSave={onSaveFlow} 
          />
        ) : (
          <div className="bg-gray-50 border border-gray-100 rounded-md p-6 text-center">
            <p className="text-gray-500">No conversation flow has been generated yet. Click the "Generate Conversation Flow" button on the Agent Details tab.</p>
          </div>
        )}
        
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
    </div>
  );
};

export default ConversationFlowTab;
