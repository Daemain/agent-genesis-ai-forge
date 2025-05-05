
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="w-full py-4 px-4 md:px-8 border-b bg-white/80 backdrop-blur-sm z-10">
      <div className="container max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-agent-gradient">
            Agentify
          </span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-gray-600 hover:text-agent-blue transition-colors">
            Home
          </Link>
          <Link to="/my-agents" className="text-gray-600 hover:text-agent-blue transition-colors">
            My Agents
          </Link>
        </nav>
        
        <div className="flex items-center space-x-3">
          <Link to="/my-agents">
            <Button variant="outline" className="hidden md:inline-flex">
              My Agents
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
