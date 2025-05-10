
import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FormData, ConversationScenario } from "@/types/agent";

export function useAgentForm(initialFormData: FormData, onFormDataChange: (formData: FormData) => void) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGeneratingFlow, setIsGeneratingFlow] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [structuredData, setStructuredData] = useState<any>(null);
  const [conversationFlow, setConversationFlow] = useState<ConversationScenario[]>([]);
  const [activeTab, setActiveTab] = useState<string>("details");
  const [flowGenerated, setFlowGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Setup error boundary with useEffect
  useEffect(() => {
    // Global error handler to prevent blank screens
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError(...args);
      // Don't set error state for React internal warnings
      const errorString = args.join(' ');
      if (!errorString.includes('React') && !errorString.includes('Warning')) {
        setError(prev => prev || "An unexpected error occurred. Please try again.");
      }
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  // Handle form data changes
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
      setError(null);
      setIsExtracting(true);
      toast({
        title: "Extracting Information",
        description: "Analyzing your profile data..."
      });

      const { data, error: apiError } = await supabase.functions.invoke('extract-profile', {
        body: {
          url: formData.url,
          isCompany: formData.isCompany,
          name: formData.fullName,
          email: formData.email
        }
      });

      if (apiError) {
        console.error("Supabase function error:", apiError);
        throw new Error(apiError.message || "Failed to extract profile information");
      }

      if (!data || !data.success) {
        console.error("Function returned error:", data);
        throw new Error(data?.message || "Failed to extract profile information");
      }

      setStructuredData(data.data);

      // If name is empty, try to fill it from extracted data
      if (!formData.fullName) {
        const extractedName = formData.isCompany ? 
          data.data.companyProfile?.company_name || data.data.companyProfile?.originalData?.name : 
          data.data.individualProfile?.full_name || data.data.individualProfile?.originalData?.name;
        
        if (extractedName) {
          const newFormData = {
            ...formData,
            fullName: extractedName
          };
          setFormData(newFormData);
          onFormDataChange(newFormData);
        }
      }

      toast({
        title: "Information Extracted",
        description: "Profile data has been analyzed successfully."
      });

      console.log("Extracted data:", data.data);
    } catch (error) {
      console.error("Error extracting profile information:", error);
      setError((error as Error).message || "Failed to extract profile information");
      toast({
        title: "Error",
        description: `Failed to extract profile information: ${(error as Error).message || "Unknown error"}`,
        variant: "destructive"
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const generateConversationFlow = async (profileDataToUse?: any) => {
    if (isGeneratingFlow) return; // Prevent multiple simultaneous requests
    
    try {
      setError(null);
      const dataToUse = profileDataToUse || structuredData;
      
      if (!dataToUse) {
        toast({
          title: "Missing Information",
          description: "Please extract profile information first.",
          variant: "destructive"
        });
        return;
      }

      setIsGeneratingFlow(true);
      
      toast({
        title: "Generating Flow",
        description: "Creating a conversation flow based on the profile..."
      });

      // Create a safe, simplified copy of the data to send
      let safeDataToUse;
      try {
        // Use a more defensive approach to create safe data
        const dataString = JSON.stringify(dataToUse, (key, value) => {
          // Filter out functions, undefined values
          if (typeof value === 'function' || value === undefined) {
            return undefined;
          }
          return value;
        });
        safeDataToUse = JSON.parse(dataString);
      } catch (e) {
        console.error("Error preparing data for API call:", e);
        // Fallback to a minimal dataset if JSON serialization fails
        safeDataToUse = {
          isCompany: formData.isCompany,
          name: formData.fullName,
          useCase: formData.useCase
        };
      }

      const payload = {
        profileData: safeDataToUse,
        useCase: formData.useCase,
        name: formData.fullName,
        isCompany: formData.isCompany,
        voiceStyle: formData.voiceStyle
      };

      console.log("Sending payload to generate-conversation-flow:", JSON.stringify(payload, null, 2));

      const { data, error: apiError } = await supabase.functions.invoke('generate-conversation-flow', {
        body: payload
      });

      if (apiError) {
        console.error("Supabase function error:", apiError);
        throw new Error(apiError.message || "Failed to generate conversation flow");
      }

      if (!data || !data.success) {
        console.error("Function returned error:", data);
        throw new Error(data?.message || "Failed to generate conversation flow");
      }

      console.log("Generated conversation flow response:", data);
      
      // Add defensive check for valid conversation flow data
      if (data.data && Array.isArray(data.data.conversationFlow)) {
        setConversationFlow(data.data.conversationFlow);
        setFlowGenerated(true);
        setActiveTab("flow");
        
        toast({
          title: "Flow Generated",
          description: "Conversation flow has been created successfully."
        });
      } else if (data.data && data.data.conversationFlow) {
        // Try to parse if it's a string
        try {
          if (typeof data.data.conversationFlow === 'string') {
            // Clean the string from markdown artifacts if present
            const cleanString = data.data.conversationFlow
              .replace(/```json\n?/g, '')
              .replace(/```\n?/g, '')
              .trim();
              
            const parsedFlow = JSON.parse(cleanString);
            if (Array.isArray(parsedFlow)) {
              setConversationFlow(parsedFlow);
              setFlowGenerated(true);
              setActiveTab("flow");
              
              toast({
                title: "Flow Generated",
                description: "Conversation flow has been created successfully."
              });
              return;
            }
          }
          throw new Error("Invalid conversation flow format");
        } catch (e) {
          console.error("Failed to parse conversation flow:", e);
          throw new Error("Received malformed conversation flow data. Please try again.");
        }
      } else {
        console.error("Invalid conversation flow data:", data.data);
        throw new Error("Received invalid conversation flow data");
      }
    } catch (error) {
      console.error("Error generating conversation flow:", error);
      setError((error as Error).message || "Failed to generate conversation flow");
      toast({
        title: "Error",
        description: `Failed to generate conversation flow: ${(error as Error).message || "Unknown error"}`,
        variant: "destructive"
      });
      
      // Provide basic conversation flow as fallback in case of error
      setConversationFlow([
        {
          scenario: "Default Greeting",
          userInputs: ["Hello", "Hi there", "Hey"],
          responses: [`Hi, I'm ${formData.fullName}'s AI assistant. How can I help you today?`],
          followUps: ["Is there something specific you'd like to know?"]
        }
      ]);
      toast({
        title: "Fallback Used",
        description: "Using basic conversation flow template due to error."
      });
    } finally {
      setIsGeneratingFlow(false);
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
      setError(null);
      setIsSubmitting(true);
      toast({
        title: "Agent Generation Started",
        description: "We're creating your AI sales agent now. This might take a minute or two."
      });

      // Create a safe copy of the data to send
      const safeDataToSend = {
        name: formData.fullName,
        email: formData.email,
        isCompany: formData.isCompany,
        url: formData.url,
        useCase: formData.useCase,
        voiceStyle: formData.voiceStyle,
        structuredData: structuredData ? JSON.parse(JSON.stringify(structuredData)) : null,
        conversationFlow: conversationFlow ? JSON.parse(JSON.stringify(conversationFlow)) : []
      };

      // Call the edge function to scrape the profile and create an agent
      const { data, error } = await supabase.functions.invoke('scrape-linkedin', {
        body: safeDataToSend
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
      setError("Failed to create agent");
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
        productsServices: [{
          name: "CloudManage",
          description: "Cloud resource management platform"
        }, {
          name: "DataSync Pro",
          description: "Enterprise data synchronization tool"
        }, {
          name: "SecureBiz",
          description: "Business security and compliance solution"
        }],
        industriesServed: ["Technology", "Finance", "Healthcare", "Manufacturing"],
        faqs: [{
          question: "What makes your solutions different?",
          answer: "Our solutions are built with user-experience first, ensuring high adoption rates and ROI."
        }, {
          question: "Do you offer custom implementations?",
          answer: "Yes, we provide tailored implementations to meet your specific business needs."
        }],
        contactInfo: {
          website: "https://www.techinnovations.example.com",
          email: "info@techinnovations.example.com"
        }
      }
    };
    setStructuredData(demoStructuredData);
    setError(null);

    toast({
      title: "Demo Agent Loaded",
      description: "We've loaded a sample AI agent for you to try."
    });
  };

  const handleSaveConversationFlow = (flow: ConversationScenario[]) => {
    setConversationFlow(flow);
  };

  return {
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
  };
}
