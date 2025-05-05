
import React from 'react';
import { Button } from "@/components/ui/button";

const Header: React.FC = () => {
  return (
    <header className="w-full py-4 px-4 md:px-8">
      <div className="container max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-agent-gradient flex items-center justify-center">
            <span className="text-white font-bold text-lg">AG</span>
          </div>
          <span className="text-xl font-bold">AgentGenesis</span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <a href="#" className="text-sm font-medium hover:text-primary">Features</a>
          <a href="#" className="text-sm font-medium hover:text-primary">Pricing</a>
          <a href="#" className="text-sm font-medium hover:text-primary">Templates</a>
          <a href="#" className="text-sm font-medium hover:text-primary">Enterprise</a>
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="hidden md:flex">
            Sign In
          </Button>
          <Button size="sm">
            Try For Free
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
