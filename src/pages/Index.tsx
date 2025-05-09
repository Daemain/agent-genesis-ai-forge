
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
    <div className="min-h-screen flex flex-col bg-gray-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid -z-10"></div>
      <Header />
      
      <main className="flex-1 w-full px-4 md:px-8 py-12">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block mb-2">
              <span className="bg-agent-blue/10 text-agent-blue text-xs font-medium px-3 py-1 rounded-full">AI-POWERED SALES AGENTS</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-agent-gradient animate-pulse-slow">Create Your Personalized Agent in 2 Minutes</h1>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Paste your profile or website link — we'll do the rest.
            </p>
          </div>
          
          <div className="glass-card rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 max-w-4xl mx-auto bg-white overflow-hidden">
            <AgentForm onFormDataChange={handleFormDataChange} />
          </div>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-center max-w-4xl mx-auto">
            <div className="p-6 rounded-xl bg-white/90 shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-agent-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-agent-blue font-semibold">1</span>
              </div>
              <h3 className="text-lg font-medium mb-2">Submit Your Info</h3>
              <p className="text-gray-500 text-sm">
                Enter your LinkedIn profile or company website URL and we'll analyze it
              </p>
            </div>
            
            <div className="p-6 rounded-xl bg-white/90 shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-agent-purple/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-agent-purple font-semibold">2</span>
              </div>
              <h3 className="text-lg font-medium mb-2">AI Creates Your Agent</h3>
              <p className="text-gray-500 text-sm">
                Our AI builds a custom agent with your tone, knowledge, and expertise
              </p>
            </div>
            
            <div className="p-6 rounded-xl bg-white/90 shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-agent-light-purple/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-agent-light-purple font-semibold">3</span>
              </div>
              <h3 className="text-lg font-medium mb-2">Start Connecting</h3>
              <p className="text-gray-500 text-sm">
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
