import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Globe, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  language: "en" | "ta";
  onLanguageChange: (lang: "en" | "ta") => void;
}

const Header = ({ language, onLanguageChange }: HeaderProps) => {
  return (
    <header className="border-b bg-gradient-card px-6 py-4 legal-shadow">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-primary rounded-xl">
            <Scale className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {language === "en" ? "eDocs Legal" : "eDocs Legal"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {language === "en" 
                ? "Professional Document Generator" 
                : "தொழில்முறை ஆவண உருவாக்கி"
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onLanguageChange(language === "en" ? "ta" : "en")}
            className="flex items-center space-x-2 transition-smooth"
          >
            <Globe className="h-4 w-4" />
            <span className={language === "ta" ? "font-tamil" : ""}>
              {language === "en" ? "தமிழ்" : "English"}
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;