import { useState } from "react";
import Header from "@/components/Header";
import DocumentTypeSelector from "@/components/DocumentTypeSelector";
import DocumentForm from "@/components/DocumentForm";
import DocumentPreview from "@/components/DocumentPreview";

const Index = () => {
  const [language, setLanguage] = useState<"en" | "ta">("en");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* SEO Meta Tags */}
      <title>{language === "en" ? "eDocs Legal - Professional Document Generator" : "eDocs Legal - தொழில்முறை ஆவண உருவாக்கி"}</title>
      <meta 
        name="description" 
        content={language === "en" 
          ? "Create professional legal documents instantly. Generate rental agreements, NDAs, sale deeds, and more with our easy-to-use platform. Real-time preview and Tamil language support."
          : "தொழில்முறை சட்ட ஆவணங்களை உடனடியாக உருவாக்கவும். எங்கள் பயன்பாட்டு-எளிய தளத்தின் மூலம் வாடகை ஒப்பந்தங்கள், NDA கள், விற்பனை பத்திரங்கள் மற்றும் பலவற்றை உருவாக்கவும்."
        }
      />
      
      <Header 
        language={language} 
        onLanguageChange={setLanguage} 
      />
      
      <DocumentTypeSelector
        selectedType={selectedType}
        onTypeSelect={setSelectedType}
        language={language}
      />
      
      <main className="flex-1 bg-gradient-subtle min-h-0">
        {selectedType ? (
          <div className="h-full flex">
            {/* Form Section - Left 50% */}
            <div className="flex-1 w-1/2 border-r border-border bg-card overflow-hidden">
              <DocumentForm
                selectedType={selectedType}
                language={language}
                onFormDataChange={setFormData}
              />
            </div>
            
            {/* Preview Section - Right 50% */}
            <div className="flex-1 w-1/2 bg-background overflow-hidden">
              <DocumentPreview
                selectedType={selectedType}
                formData={formData}
                language={language}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[60vh] text-center p-8">
            <div className="space-y-4 animate-fade-in">
              <div className="w-24 h-24 mx-auto bg-gradient-primary rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                {language === "en" ? "Select a Document Type" : "ஆவண வகையைத் தேர்ந்தெடுக்கவும்"}
              </h3>
              <p className="text-muted-foreground max-w-md">
                {language === "en" 
                  ? "Choose from the document types above to get started with creating your legal documents"
                  : "உங்கள் சட்ட ஆவணங்களை உருவாக்கத் தொடங்க மேலே உள்ள ஆவண வகைகளில் ஒன்றைத் தேர்ந்தெடுக்கவும்"
                }
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
