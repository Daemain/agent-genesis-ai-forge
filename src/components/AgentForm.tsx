
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ConversationFlowEditor from "@/components/ConversationFlowEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Link, ChevronDown, HelpCircle, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

interface AgentFormProps {
  onFormDataChange: (formData: FormData) => void;
}

export interface FormData {
  fullName: string;
  email: string;
  isCompany: boolean;
  url: string;
  useCase: string;
  voiceStyle: string;
}

interface ConversationScenario {
  scenario: string;
  userInputs: string[];
  responses: string[];
  followUps: string[];
}

const AgentForm: React.FC<AgentFormProps> = ({
  onFormDataChange
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    isCompany: false,
    url: '',
    useCase: '',
    voiceStyle: ''
  });
  const [structuredData, setStructuredData] = useState<any>(null);
  const [conversationFlow, setConversationFlow] = useState<ConversationScenario[]>([]);
  const [activeTab, setActiveTab] = useState<string>("details");
  const [flowGenerated, setFlowGenerated] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: value
    };
    setFormData(newFormData);
    onFormDataChange(newFormData);
  };

  const handleSelectChange = (name: string, value: string) => {
    const newFormData = {
      ...formData,
      [name]: value
    };
    setFormData(newFormData);
    onFormDataChange(newFormData);
  };

  const handleToggleChange = (checked: boolean) => {
    const newFormData = {
      ...formData,
      isCompany: checked
    };
    setFormData(newFormData);
    onFormDataChange(newFormData);
  };

  const extractProfileInformation = async () => {
    if (!formData.url) {
      toast({
        title: "Missing Information",
        description: "Please enter a URL to extract profile information.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsExtracting(true);
      toast({
        title: "Extracting Information",
        description: "Analyzing your profile data..."
      });

      const { data, error } = await supabase.functions.invoke('extract-profile', {
        body: {
          url: formData.url,
          isCompany: formData.isCompany,
          name: formData.fullName,
          email: formData.email
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.message || "Failed to extract profile information");
      }

      setStructuredData(data.data);
      
      // Generate conversation flow after extracting profile
      generateConversationFlow(data.data);

      toast({
        title: "Information Extracted",
        description: "Profile data has been analyzed successfully."
      });

      // If name is empty, try to fill it from extracted data
      if (!formData.fullName) {
        const extractedName = formData.isCompany 
          ? data.data.companyProfile?.company_name || data.data.companyProfile?.originalData?.name
          : data.data.individualProfile?.full_name || data.data.individualProfile?.originalData?.name;
        
        if (extractedName) {
          const newFormData = {
            ...formData,
            fullName: extractedName
          };
          setFormData(newFormData);
          onFormDataChange(newFormData);
        }
      }

      console.log("Extracted data:", data.data);

    } catch (error) {
      console.error("Error extracting profile information:", error);
      toast({
        title: "Error",
        description: "Failed to extract profile information. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const generateConversationFlow = async (profileDataToUse?: any) => {
    try {
      const dataToUse = profileDataToUse || structuredData;
      
      if (!dataToUse) {
        toast({
          title: "Missing Information",
          description: "Please extract profile information first.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Generating Flow",
        description: "Creating a conversation flow based on the profile..."
      });

      const { data, error } = await supabase.functions.invoke('generate-conversation-flow', {
        body: {
          profileData: dataToUse,
          useCase: formData.useCase || 'sales', // Provide default value if empty
          name: formData.fullName,
          isCompany: formData.isCompany,
          voiceStyle: formData.voiceStyle || 'professional' // Provide default value if empty
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.message || "Failed to generate conversation flow");
      }

      setConversationFlow(data.data.conversationFlow);
      setFlowGenerated(true);
      setActiveTab("flow");

      toast({
        title: "Flow Generated",
        description: "Conversation flow has been created successfully."
      });

    } catch (error) {
      console.error("Error generating conversation flow:", error);
      toast({
        title: "Error",
        description: "Failed to generate conversation flow. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.fullName) {
      toast({
        title: "Missing Information",
        description: "Please enter your full name or company name.",
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.email) {
      toast({
        title: "Missing Information",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.url) {
      toast({
        title: "Missing Information",
        description: `Please enter your ${formData.isCompany ? 'company' : 'personal'} URL.`,
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      toast({
        title: "Agent Generation Started",
        description: "We're creating your AI sales agent now. This might take a minute or two."
      });
      
      // Call the edge function to scrape the profile and create an agent
      const { data, error } = await supabase.functions.invoke('scrape-linkedin', {
        body: {
          name: formData.fullName,
          email: formData.email,
          isCompany: formData.isCompany,
          url: formData.url,
          useCase: formData.useCase || 'sales', // Provide default if empty
          voiceStyle: formData.voiceStyle || 'professional', // Provide default if empty
          structuredData: structuredData, // Pass along any extracted structured data
          conversationFlow: conversationFlow // Pass the customized conversation flow
        }
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success!",
        description: "Your AI agent has been created successfully."
      });
      
      console.log("Agent created:", data);
      
    } catch (error) {
      console.error("Error creating agent:", error);
      toast({
        title: "Error",
        description: "There was a problem creating your AI agent. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoClick = () => {
    const demoData = {
      fullName: 'Alex Johnson',
      email: 'alex@techcompany.com',
      isCompany: true,
      url: 'https://www.linkedin.com/company/tech-innovations',
      useCase: 'sales',
      voiceStyle: 'professional'
    };
    setFormData(demoData);
    onFormDataChange(demoData);
    
    // Set demo structured data
    const demoStructuredData = {
      companyProfile: {
        name: "Tech Innovations",
        tagline: "Building the future of enterprise software",
        toneOfVoice: "Professional, Innovative, Trustworthy",
        about: "Tech Innovations was founded in 2015 with the mission to make enterprise software more accessible and user-friendly. We focus on cloud-native solutions that help businesses transform digitally.",
        productsServices: [
          { name: "CloudManage", description: "Cloud resource management platform" },
          { name: "DataSync Pro", description: "Enterprise data synchronization tool" },
          { name: "SecureBiz", description: "Business security and compliance solution" }
        ],
        industriesServed: ["Technology", "Finance", "Healthcare", "Manufacturing"],
        faqs: [
          { question: "What makes your solutions different?", answer: "Our solutions are built with user-experience first, ensuring high adoption rates and ROI." },
          { question: "Do you offer custom implementations?", answer: "Yes, we provide tailored implementations to meet your specific business needs." }
        ],
        contactInfo: {
          website: "https://www.techinnovations.example.com",
          email: "info@techinnovations.example.com"
        }
      }
    };
    setStructuredData(demoStructuredData);
    
    // Generate conversation flow with demo data
    generateConversationFlow(demoStructuredData);
    
    toast({
      title: "Demo Agent Loaded",
      description: "We've loaded a sample AI agent for you to try."
    });
  };

  const handleSaveConversationFlow = (flow: ConversationScenario[]) => {
    setConversationFlow(flow);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 mb-4 rounded-full p-1 w-full bg-gray-100">
          <TabsTrigger value="details" className="rounded-full px-6 py-3 text-lg font-medium">Agent Details</TabsTrigger>
          <TabsTrigger value="flow" disabled={!structuredData} className="rounded-full px-6 py-3 text-lg font-medium text-gray-500">Conversation Flow</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-7 bg-white rounded-3xl p-8 shadow-sm">
          <div className="mb-4">
            <Label className="block text-sm font-medium text-gray-500 mb-2">I'm creating an agent for:</Label>
            <div className="flex items-center space-x-4 bg-gray-50 rounded-full p-1 w-fit">
              <Label 
                htmlFor="personal" 
                className={`text-sm font-medium cursor-pointer rounded-full px-4 py-2 ${!formData.isCompany ? 'bg-white shadow-sm font-semibold' : 'text-gray-600'}`}
              >
                Personal
              </Label>
              <Switch id="isCompany" checked={formData.isCompany} onCheckedChange={handleToggleChange} className="bg-agent-purple" />
              <Label 
                htmlFor="company" 
                className={`text-sm font-medium cursor-pointer rounded-full px-4 py-2 ${formData.isCompany ? 'bg-white shadow-sm font-semibold' : 'text-gray-600'}`}
              >
                Company
              </Label>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-xl space-y-6">
            <h3 className="font-semibold text-gray-700">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-semibold flex items-center">
                  {formData.isCompany ? 'Company Name' : 'Full Name'} <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="relative">
                  <Input 
                    id="fullName" 
                    name="fullName" 
                    placeholder={formData.isCompany ? 'Acme Inc.' : 'John Smith'} 
                    value={formData.fullName} 
                    onChange={handleInputChange} 
                    className="rounded-xl h-12 pl-4"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold flex items-center">
                  Email Address <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="relative">
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    placeholder="you@example.com" 
                    value={formData.email} 
                    onChange={handleInputChange}
                    className="rounded-xl h-12 pl-4"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-xl space-y-6">
            <h3 className="font-semibold text-gray-700">Profile Source</h3>
            <div className="space-y-2">
              <Label htmlFor="url" className="text-sm font-semibold flex items-center">
                {formData.isCompany ? 'Company Website or Profile URL' : 'Personal Website or Profile URL'} <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="flex gap-3 items-stretch">
                <Input 
                  id="url" 
                  name="url" 
                  placeholder={formData.isCompany ? 'https://yourcompany.com or LinkedIn URL' : 'https://yourwebsite.com or LinkedIn URL'} 
                  value={formData.url} 
                  onChange={handleInputChange}
                  className="flex-1 rounded-xl h-12 pl-4"
                  required
                />
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={extractProfileInformation}
                  disabled={!formData.url || isExtracting || isSubmitting}
                  className="whitespace-nowrap rounded-xl h-12 px-4 text-base font-medium"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    "Extract Info"
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-xl space-y-6">
            <h3 className="font-semibold text-gray-700">Agent Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <Label htmlFor="useCase" className="text-sm font-semibold">Use Case</Label>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <HelpCircle size={14} className="text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Select how your AI agent will be used. This affects the tone and types of interactions it will be optimized for.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={formData.useCase} onValueChange={value => handleSelectChange('useCase', value)}>
                  <SelectTrigger className="rounded-xl h-12 text-base">
                    <SelectValue placeholder="Select a use case" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="customer-support">Customer Support</SelectItem>
                      <SelectItem value="lead-qualification">Lead Qualification</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <Label htmlFor="voiceStyle" className="text-sm font-semibold">Voice Style</Label>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <HelpCircle size={14} className="text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Choose the personality and tone your AI agent will use when communicating with users.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={formData.voiceStyle} onValueChange={value => handleSelectChange('voiceStyle', value)}>
                  <SelectTrigger className="rounded-xl h-12 text-base">
                    <SelectValue placeholder="Select a voice style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="energetic">Energetic</SelectItem>
                      <SelectItem value="calm">Calm</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {structuredData && (
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-6">
              <h4 className="text-lg font-semibold mb-4">Extracted Profile Information</h4>
              <div className="text-base space-y-4">
                {formData.isCompany ? (
                  <div className="space-y-3">
                    <p><span className="font-medium">Company:</span> {structuredData.companyProfile?.company_name || structuredData.companyProfile?.originalData?.name}</p>
                    <p><span className="font-medium">Tagline:</span> {structuredData.companyProfile?.tagline || structuredData.companyProfile?.originalData?.tagline}</p>
                    <p><span className="font-medium">About:</span> {structuredData.companyProfile?.about_us || structuredData.companyProfile?.originalData?.about}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p><span className="font-medium">Name:</span> {structuredData.individualProfile?.full_name || structuredData.individualProfile?.originalData?.name}</p>
                    <p><span className="font-medium">Role:</span> {structuredData.individualProfile?.profession_or_role || structuredData.individualProfile?.originalData?.title}</p>
                    <p><span className="font-medium">Bio:</span> {structuredData.individualProfile?.bio || structuredData.individualProfile?.originalData?.about}</p>
                  </div>
                )}
              </div>
              
              <Button 
                type="button"
                variant="outline"
                onClick={() => generateConversationFlow()}
                className="mt-6 rounded-xl h-12 px-6 text-base font-medium"
              >
                Generate Conversation Flow
              </Button>
            </div>
          )}
          
          <div className="pt-4 flex flex-col sm:flex-row gap-4">
            <Button 
              type="submit" 
              className="w-full bg-agent-gradient hover:opacity-90 rounded-xl py-3 text-base font-medium shadow-sm hover:shadow-md transition-shadow"
              disabled={isSubmitting || !structuredData}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                'Generate My AI Agent'
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full border-agent-blue text-agent-blue hover:bg-agent-blue/5 rounded-xl py-3 text-base font-medium transition-all" 
              onClick={handleDemoClick}
              disabled={isSubmitting}
            >
              Try a Demo Agent
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="flow">
          {structuredData && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Customize Conversation Flow</h3>
                <div className="text-sm text-gray-500">
                  {flowGenerated ? "Flow generated successfully" : "Generate a flow to begin"}
                </div>
              </div>
              
              <ConversationFlowEditor
                initialFlow={conversationFlow}
                profileData={structuredData}
                isCompany={formData.isCompany}
                useCase={formData.useCase || 'sales'} // Provide default if empty
                voiceStyle={formData.voiceStyle || 'professional'} // Provide default if empty
                name={formData.fullName}
                onSave={handleSaveConversationFlow}
              />
              
              <div className="flex justify-end mt-4">
                <Button
                  type="submit"
                  className="bg-agent-gradient hover:opacity-90 rounded-xl py-6 shadow-sm hover:shadow-md transition-shadow"
                  disabled={isSubmitting || conversationFlow.length === 0}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    'Create AI Agent with Custom Flow'
                  )}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </form>
  );
};

export default AgentForm;
