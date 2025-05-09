
import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AgentForm, { FormData } from '@/components/AgentForm';

const Index = () => {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    isCompany: false,
    url: '',
    useCase: 'sales',
    voiceStyle: 'professional'
  });

  const handleFormDataChange = (data: FormData) => {
    setFormData(data);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 relative">
      <div className="absolute inset-0 bg-grid opacity-30 -z-10"></div>
      <Header />
      
      <main className="flex-1 w-full px-4 md:px-6 py-16">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-block mb-3">
              <span className="bg-agent-blue/10 text-agent-blue text-xs font-medium px-3 py-1 rounded-full">AI-POWERED SALES AGENTS</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-gray-900">Create Your Personalized Agent in 2 Minutes</h1>
            <p className="text-lg text-gray-700 max-w-xl mx-auto">
              Paste your profile or website link — we'll do the rest.
            </p>
          </div>
          
          <div className="backdrop-blur-sm bg-white/70 rounded-2xl shadow-lg border border-gray-100 max-w-3xl mx-auto overflow-hidden">
            <AgentForm onFormDataChange={handleFormDataChange} />
          </div>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-5 rounded-xl bg-white border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-agent-blue/10 flex items-center justify-center mb-4">
                <span className="text-agent-blue font-medium">1</span>
              </div>
              <h3 className="text-base font-medium mb-2">Submit Your Info</h3>
              <p className="text-sm text-gray-500">
                Enter your LinkedIn profile or company website URL and we'll analyze it
              </p>
            </div>
            
            <div className="p-5 rounded-xl bg-white border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-agent-purple/10 flex items-center justify-center mb-4">
                <span className="text-agent-purple font-medium">2</span>
              </div>
              <h3 className="text-base font-medium mb-2">AI Creates Your Agent</h3>
              <p className="text-sm text-gray-500">
                Our AI builds a custom agent with your tone, knowledge, and expertise
              </p>
            </div>
            
            <div className="p-5 rounded-xl bg-white border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-agent-light-purple/10 flex items-center justify-center mb-4">
                <span className="text-agent-light-purple font-medium">3</span>
              </div>
              <h3 className="text-base font-medium mb-2">Start Connecting</h3>
              <p className="text-sm text-gray-500">
                Deploy your AI agent to engage with leads, qualify prospects, or support customers
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
