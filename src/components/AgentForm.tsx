import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
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
  const {
    toast
  } = useToast();
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    isCompany: false,
    url: '',
    useCase: 'sales',
    voiceStyle: 'professional'
  });
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {
      name,
      value
    } = e.target;
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Agent Generation Started",
      description: "We're creating your AI sales agent now."
    });
  };
  const handleDemoClick = () => {
    const demoData = {
      fullName: 'Alex Johnson',
      email: 'alex@techcompany.com',
      isCompany: true,
      url: 'https://www.techcompany.com',
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
  return <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          
        </div>

        <div className="flex items-center space-x-2 mx-0">
          <Label htmlFor="isCompany" className="text-sm cursor-pointer">Personal</Label>
          <Switch id="isCompany" checked={formData.isCompany} onCheckedChange={handleToggleChange} />
          <Label htmlFor="isCompany" className="text-sm cursor-pointer">Company</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="url">
            {formData.isCompany ? 'Company Website URL' : 'LinkedIn Profile URL'}
          </Label>
          <Input id="url" name="url" placeholder={formData.isCompany ? 'https://yourcompany.com' : 'https://linkedin.com/in/yourprofile'} value={formData.url} onChange={handleInputChange} />
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
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button type="submit" className="w-full bg-agent-gradient hover:opacity-90">
          Generate My AI Agent
        </Button>
        <Button type="button" variant="outline" className="w-full border-agent-blue text-agent-blue hover:bg-agent-blue/5" onClick={handleDemoClick}>
          Try a Demo Agent
        </Button>
      </div>
    </form>;
};
export default AgentForm;