
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { HelpCircle, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { FormData } from "@/types/agent";

interface AgentDetailsTabProps {
  formData: FormData;
  structuredData: any;
  isExtracting: boolean;
  isGeneratingFlow: boolean;
  isSubmitting: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  handleToggleChange: (checked: boolean) => void;
  extractProfileInformation: () => Promise<void>;
  generateConversationFlow: () => Promise<void>;
  handleDemoClick: () => void;
}

const AgentDetailsTab: React.FC<AgentDetailsTabProps> = ({
  formData,
  structuredData,
  isExtracting,
  isGeneratingFlow,
  isSubmitting,
  handleInputChange,
  handleSelectChange,
  handleToggleChange,
  extractProfileInformation,
  generateConversationFlow,
  handleDemoClick
}) => {
  return (
    <div className="space-y-6 px-6 pb-6">
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <Label className="text-sm text-gray-500 my-[16px]">I'm creating an agent for:</Label>
        </div>
        <div className="flex items-center space-x-3">
          <Label htmlFor="personal" className={`text-sm cursor-pointer px-3 py-1.5 rounded-md ${!formData.isCompany ? 'bg-gray-100 font-medium' : 'text-gray-500'}`}>
            Personal
          </Label>
          <Switch id="isCompany" checked={formData.isCompany} onCheckedChange={handleToggleChange} />
          <Label htmlFor="company" className={`text-sm cursor-pointer px-3 py-1.5 rounded-md ${formData.isCompany ? 'bg-gray-100 font-medium' : 'text-gray-500'}`}>
            Company
          </Label>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <Label htmlFor="fullName" className="text-sm font-medium mb-1.5 block">
            {formData.isCompany ? 'Company Name' : 'Full Name'} <span className="text-red-500">*</span>
          </Label>
          <Input id="fullName" name="fullName" placeholder={formData.isCompany ? 'Acme Inc.' : 'John Smith'} value={formData.fullName} onChange={handleInputChange} className="h-10" required />
        </div>
        
        <div>
          <Label htmlFor="email" className="text-sm font-medium mb-1.5 block">
            Email Address <span className="text-red-500">*</span>
          </Label>
          <Input id="email" name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleInputChange} className="h-10" required />
        </div>
        
        <div>
          <Label htmlFor="url" className="text-sm font-medium mb-1.5 block">
            {formData.isCompany ? 'Company Website or Profile URL' : 'Personal Website or Profile URL'} <span className="text-red-500">*</span>
          </Label>
          <div className="flex gap-3">
            <Input id="url" name="url" placeholder={formData.isCompany ? 'https://yourcompany.com or LinkedIn URL' : 'https://yourwebsite.com or LinkedIn URL'} value={formData.url} onChange={handleInputChange} className="h-10" required />
            <Button type="button" variant="outline" onClick={extractProfileInformation} disabled={!formData.url || isExtracting || isSubmitting} className="whitespace-nowrap h-10">
              {isExtracting ? <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Analyzing</span>
                </> : "Extract Info"}
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
            disabled={isGeneratingFlow}
          >
            {isGeneratingFlow ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              "Generate Conversation Flow"
            )}
          </Button>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button type="submit" className="w-full bg-agent-blue hover:bg-agent-blue/90 text-white" disabled={isSubmitting || !structuredData}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : 'Generate My AI Agent'}
        </Button>
        <Button type="button" variant="outline" className="w-full border-gray-200 text-gray-700 hover:bg-gray-50" onClick={handleDemoClick} disabled={isSubmitting}>
          Try a Demo Agent
        </Button>
      </div>
    </div>
  );
};

export default AgentDetailsTab;
