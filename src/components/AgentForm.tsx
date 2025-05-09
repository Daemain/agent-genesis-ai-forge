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
import { HelpCircle, Loader2 } from 'lucide-react';
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full"
      >
        <div className="px-6 pt-6">
          <TabsList className="grid grid-cols-2 w-full bg-gray-100 rounded-lg">
            <TabsTrigger value="details" className="rounded-md py-2.5">Agent Details</TabsTrigger>
            <TabsTrigger value="flow" disabled={!structuredData} className="rounded-md py-2.5">Conversation Flow</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="details" className="space-y-6 px-6 pb-6">
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Label className="text-sm text-gray-500">I'm creating an agent for:</Label>
            </div>
            <div className="flex items-center space-x-3">
              <Label 
                htmlFor="personal" 
                className={`text-sm cursor-pointer px-3 py-1.5 rounded-md ${!formData.isCompany ? 'bg-gray-100 font-medium' : 'text-gray-500'}`}
              >
                Personal
              </Label>
              <Switch id="isCompany" checked={formData.isCompany} onCheckedChange={handleToggleChange} />
              <Label 
                htmlFor="company" 
                className={`text-sm cursor-pointer px-3 py-1.5 rounded-md ${formData.isCompany ? 'bg-gray-100 font-medium' : 'text-gray-500'}`}
              >
                Company
              </Label>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <Label htmlFor="fullName" className="text-sm font-medium mb-1.5 block">
                {formData.isCompany ? 'Company Name' : 'Full Name'} <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="fullName" 
                name="fullName" 
                placeholder={formData.isCompany ? 'Acme Inc.' : 'John Smith'} 
                value={formData.fullName} 
                onChange={handleInputChange} 
                className="h-10"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="email" className="text-sm font-medium mb-1.5 block">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="you@example.com" 
                value={formData.email} 
                onChange={handleInputChange}
                className="h-10"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="url" className="text-sm font-medium mb-1.5 block">
                {formData.isCompany ? 'Company Website or Profile URL' : 'Personal Website or Profile URL'} <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-3">
                <Input 
                  id="url" 
                  name="url" 
                  placeholder={formData.isCompany ? 'https://yourcompany.com or LinkedIn URL' : 'https://yourwebsite.com or LinkedIn URL'} 
                  value={formData.url} 
                  onChange={handleInputChange}
                  className="h-10"
                  required
                />
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={extractProfileInformation}
                  disabled={!formData.url || isExtracting || isSubmitting}
                  className="whitespace-nowrap h-10"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Analyzing</span>
                    </>
                  ) : (
                    "Extract Info"
                  )}
                </Button>
              </div>
            </div>

            <Separator className="my-2" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <div className="flex items-center gap-1 mb-1.5">
                  <Label htmlFor="useCase" className="text-sm font-medium">Use Case</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle size={14} className="text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">Select how your AI agent will be used.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={formData.useCase} onValueChange={value => handleSelectChange('useCase', value)}>
                  <SelectTrigger className="h-10">
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
              
              <div>
                <div className="flex items-center gap-1 mb-1.5">
                  <Label htmlFor="voiceStyle" className="text-sm font-medium">Voice Style</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle size={14} className="text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">Choose the personality and tone your AI agent will use.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={formData.voiceStyle} onValueChange={value => handleSelectChange('voiceStyle', value)}>
                  <SelectTrigger className="h-10">
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
            <div className="mt-4 bg-gray-50 rounded-lg border border-gray-100 p-4">
              <h4 className="text-sm font-semibold mb-3">Extracted Profile Information</h4>
              <div className="text-sm space-y-3 text-gray-600">
                {formData.isCompany ? (
                  <div className="space-y-1.5">
                    <p><span className="font-medium">Company:</span> {structuredData.companyProfile?.company_name || structuredData.companyProfile?.originalData?.name}</p>
                    <p><span className="font-medium">Tagline:</span> {structuredData.companyProfile?.tagline || structuredData.companyProfile?.originalData?.tagline}</p>
                    <p><span className="font-medium">About:</span> {structuredData.companyProfile?.about_us || structuredData.companyProfile?.originalData?.about}</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
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
                className="mt-4 h-9 text-sm"
              >
                Generate Conversation Flow
              </Button>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              type="submit" 
              className="w-full bg-agent-blue hover:bg-agent-blue/90 text-white"
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
              className="w-full border-gray-200 text-gray-700 hover:bg-gray-50"
              onClick={handleDemoClick}
              disabled={isSubmitting}
            >
              Try a Demo Agent
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="flow" className="px-6 pb-6">
          {structuredData && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-medium">Customize Conversation Flow</h3>
                <div className="text-sm text-gray-500">
                  {flowGenerated ? "Flow generated successfully" : "Generate a flow to begin"}
                </div>
              </div>
              
              <ConversationFlowEditor
                initialFlow={conversationFlow}
                profileData={structuredData}
                isCompany={formData.isCompany}
                useCase={formData.useCase || 'sales'}
                voiceStyle={formData.voiceStyle || 'professional'}
                name={formData.fullName}
                onSave={handleSaveConversationFlow}
              />
              
              <div className="flex justify-end mt-4">
                <Button
                  type="submit"
                  className="bg-agent-blue hover:bg-agent-blue/90 text-white"
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
