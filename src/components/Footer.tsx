
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-6 px-4 md:px-8 mt-12">
      <div className="container max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-agent-gradient flex items-center justify-center">
                <span className="text-white font-bold text-sm">AG</span>
              </div>
              <span className="font-bold">AgentGenesis</span>
            </div>
            <p className="text-sm text-gray-500 max-w-xs">
              Create custom AI voice agents in minutes. Automate sales, support, and lead qualification with our advanced AI technology.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Product</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-500 hover:text-primary">Features</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-primary">Pricing</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-primary">Templates</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-primary">Enterprise</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-500 hover:text-primary">About</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-primary">Blog</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-primary">Careers</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-primary">Contact</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">© 2025 AgentGenesis. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-gray-500 hover:text-primary">Privacy Policy</a>
            <a href="#" className="text-xs text-gray-500 hover:text-primary">Terms of Service</a>
            <a href="#" className="text-xs text-gray-500 hover:text-primary">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
