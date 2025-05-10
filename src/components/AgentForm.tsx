
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';
import { FormData } from "@/types/agent";
import { useAgentForm } from "@/hooks/useAgentForm";
import AgentDetailsTab from "@/components/agent/AgentDetailsTab";
import ConversationFlowTab from "@/components/agent/ConversationFlowTab";

interface AgentFormProps {
  onFormDataChange: (formData: FormData) => void;
}

const AgentForm: React.FC<AgentFormProps> = ({
  onFormDataChange
}) => {
  const initialFormData: FormData = {
    fullName: '',
    email: '',
    isCompany: false,
    url: '',
    useCase: 'sales',
    voiceStyle: 'professional'
  };

  const {
    isSubmitting,
    isExtracting,
    isGeneratingFlow,
    formData,
    structuredData,
    conversationFlow,
    activeTab,
    flowGenerated,
    error,
    setActiveTab,
    handleInputChange,
    handleSelectChange,
    handleToggleChange,
    extractProfileInformation,
    generateConversationFlow,
    handleSubmit,
    handleDemoClick,
    handleSaveConversationFlow
  } = useAgentForm(initialFormData, onFormDataChange);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive" className="mx-6 mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6 pt-6">
          <TabsList className="grid grid-cols-2 w-full bg-gray-100 rounded-lg">
            <TabsTrigger value="details" className="rounded-md py-1">Agent Details</TabsTrigger>
            <TabsTrigger value="flow" disabled={!structuredData} className="rounded-md py-1">Conversation Flow</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="details">
          <AgentDetailsTab 
            formData={formData}
            structuredData={structuredData}
            isExtracting={isExtracting}
            isGeneratingFlow={isGeneratingFlow}
            isSubmitting={isSubmitting}
            handleInputChange={handleInputChange}
            handleSelectChange={handleSelectChange}
            handleToggleChange={handleToggleChange}
            extractProfileInformation={extractProfileInformation}
            generateConversationFlow={generateConversationFlow}
            handleDemoClick={handleDemoClick}
          />
        </TabsContent>
        
        <TabsContent value="flow">
          <ConversationFlowTab 
            structuredData={structuredData}
            conversationFlow={conversationFlow}
            isCompany={formData.isCompany}
            useCase={formData.useCase}
            voiceStyle={formData.voiceStyle}
            name={formData.fullName}
            isSubmitting={isSubmitting}
            onSaveFlow={handleSaveConversationFlow}
          />
        </TabsContent>
      </Tabs>
    </form>
  );
};

export default AgentForm;
