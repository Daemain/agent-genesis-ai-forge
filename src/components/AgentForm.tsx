
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

const AgentForm: React.FC<AgentFormProps> = ({
  onFormDataChange
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    isCompany: false,
    url: '',
    useCase: 'sales',
    voiceStyle: 'professional'
  });
  const [structuredData, setStructuredData] = useState<any>(null);

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

      toast({
        title: "Information Extracted",
        description: "Profile data has been analyzed successfully."
      });

      // If name is empty, try to fill it from extracted data
      if (!formData.fullName) {
        const extractedName = formData.isCompany 
          ? data.data.companyProfile?.name 
          : data.data.individualProfile?.name;
        
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
          useCase: formData.useCase,
          voiceStyle: formData.voiceStyle,
          structuredData: structuredData // Pass along any extracted structured data
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
    toast({
      title: "Demo Agent Loaded",
      description: "We've loaded a sample AI agent for you to try."
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Move Personal/Company toggle to the top */}
        <div className="flex items-center space-x-2 mx-0">
          <Label htmlFor="isCompany" className="text-sm cursor-pointer">Personal</Label>
          <Switch id="isCompany" checked={formData.isCompany} onCheckedChange={handleToggleChange} />
          <Label htmlFor="isCompany" className="text-sm cursor-pointer">Company</Label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">
              {formData.isCompany ? 'Company Name' : 'Full Name'}
            </Label>
            <Input 
              id="fullName" 
              name="fullName" 
              placeholder={formData.isCompany ? 'Acme Inc.' : 'John Smith'} 
              value={formData.fullName} 
              onChange={handleInputChange} 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="you@example.com" 
              value={formData.email} 
              onChange={handleInputChange} 
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="url">
            {formData.isCompany ? 'Company Website or Profile URL' : 'Personal Website or Profile URL'}
          </Label>
          <div className="flex space-x-2">
            <Input 
              id="url" 
              name="url" 
              placeholder={formData.isCompany ? 'https://yourcompany.com or LinkedIn URL' : 'https://yourwebsite.com or LinkedIn URL'} 
              value={formData.url} 
              onChange={handleInputChange}
              className="flex-1"
            />
            <Button 
              type="button" 
              variant="outline"
              onClick={extractProfileInformation}
              disabled={!formData.url || isSubmitting}
              className="whitespace-nowrap"
            >
              Extract Info
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="useCase">Use Case</Label>
            <Select value={formData.useCase} onValueChange={value => handleSelectChange('useCase', value)}>
              <SelectTrigger>
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
            <Label htmlFor="voiceStyle">Voice Style</Label>
            <Select value={formData.voiceStyle} onValueChange={value => handleSelectChange('voiceStyle', value)}>
              <SelectTrigger>
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

        {structuredData && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mt-2">
            <h4 className="text-sm font-medium mb-2">Extracted Profile Information</h4>
            <div className="text-xs max-h-40 overflow-y-auto">
              {formData.isCompany ? (
                <div>
                  <p><span className="font-medium">Company:</span> {structuredData.companyProfile?.name}</p>
                  <p><span className="font-medium">Tagline:</span> {structuredData.companyProfile?.tagline}</p>
                  <p><span className="font-medium">Products/Services:</span> {structuredData.companyProfile?.productsServices?.map((p: any) => p.name).join(', ')}</p>
                </div>
              ) : (
                <div>
                  <p><span className="font-medium">Name:</span> {structuredData.individualProfile?.name}</p>
                  <p><span className="font-medium">Title:</span> {structuredData.individualProfile?.title}</p>
                  <p><span className="font-medium">Skills:</span> {structuredData.individualProfile?.coreSkills?.join(', ')}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          type="submit" 
          className="w-full bg-agent-gradient hover:opacity-90"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Generating...' : 'Generate My AI Agent'}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          className="w-full border-agent-blue text-agent-blue hover:bg-agent-blue/5" 
          onClick={handleDemoClick}
          disabled={isSubmitting}
        >
          Try a Demo Agent
        </Button>
      </div>
    </form>
  );
};

export default AgentForm;
