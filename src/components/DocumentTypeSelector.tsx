import { FileText, Home, Shield, Users, Briefcase, DollarSign, Gift, FileX, Scroll, Handshake, Split } from "lucide-react";
import { cn } from "@/lib/utils";

/* ===== Types & Data ===== */
export interface DocumentType {
  id: string;
  name: { en: string; ta: string };
  description: { en: string; ta: string };
  icon: typeof FileText;
  category: string;
}

export const documentTypes: DocumentType[] = [
  {
    id: "sale-deed",
    name: { en: "Sale Deed", ta: "விற்பனை பத்திரம்" },
    description: { en: "Property sale and transfer documents", ta: "சொத்து விற்பனை மற்றும் பரிமாற்ற ஆவணங்கள்" },
    icon: Home,
    category: "Property",
  },
  {
    id: "gift-deed",
    name: { en: "Gift Deed", ta: "பரிசு பத்திரம்" },
    description: { en: "Property gifting documents", ta: "சொத்து பரிசு ஆவணங்கள்" },
    icon: Gift,
    category: "Property",
  },
  {
    id: "relinquishment-deed",
    name: { en: "Relinquishment Deed", ta: "விலகல் பத்திரம்" },
    description: { en: "Property rights relinquishment", ta: "சொத்து உரிமைகள் விலகல்" },
    icon: FileX,
    category: "Property",
  },
  {
    id: "rental-agreement",
    name: { en: "Rental Agreement", ta: "வாடகை ஒப்பந்தம்" },
    description: { en: "Residential and commercial rental contracts", ta: "குடியிருப்பு மற்றும் வணிக வாடகை ஒப்பந்தங்கள்" },
    icon: FileText,
    category: "Property",
  },
  {
    id: "will-agreement",
    name: { en: "Will Agreement", ta: "உயில் ஒப்பந்தம்" },
    description: { en: "Testament and inheritance documents", ta: "உயில் மற்றும் பரம்பரை ஆவணங்கள்" },
    icon: Scroll,
    category: "Legal",
  },
  {
    id: "power-of-attorney",
    name: { en: "Power of Attorney", ta: "அதிகாரப் பத்திரம்" },
    description: { en: "Legal authority delegation documents", ta: "சட்டப்பூர்வ அதிகார ஆவணங்கள்" },
    icon: Shield,
    category: "Legal",
  },
  {
    id: "agreement-to-sell",
    name: { en: "Agreement to Sell", ta: "விற்பனை ஒப்பந்தம்" },
    description: { en: "Property sale agreement documents", ta: "சொத்து விற்பனை ஒப்பந்த ஆவணங்கள்" },
    icon: Handshake,
    category: "Property",
  },
  {
    id: "partition-deed",
    name: { en: "Partition Deed", ta: "பிரிவு பத்திரம்" },
    description: { en: "Property division documents", ta: "சொத்து பிரிவு ஆவணங்கள்" },
    icon: Split,
    category: "Property",
  },
  {
    id: "nda",
    name: { en: "Non-Disclosure Agreement", ta: "ரகசியத்தன்மை ஒப்பந்தம்" },
    description: { en: "Protect confidential information", ta: "ரகசிய தகவல்களைப் பாதுகாக்கவும்" },
    icon: Users,
    category: "Business",
  },
];

/* ===== Component ===== */
interface DocumentTypeSelectorProps {
  selectedType: string | null;
  onTypeSelect: (typeId: string) => void;
  language: "en" | "ta";
}

const DocumentTypeSelector = ({ selectedType, onTypeSelect, language }: DocumentTypeSelectorProps) => {
  const isTA = language === "ta";

  return (
    <div className="w-full bg-gradient-card border-b legal-shadow p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-primary" />
            {isTA ? "ஆவண வகைகள்" : "Document Types"}
          </h2>
        </div>

        {/* Scroll on small, wrap on md+ */}
        <div
          className={cn(
            "flex gap-3 md:gap-4",
            "flex-nowrap md:flex-wrap",
            "overflow-x-auto md:overflow-visible scrollbar-hide",
            "pb-2 scroll-smooth snap-x md:snap-none"
          )}
          aria-label={isTA ? "ஆவண வகைகள்" : "Document types"}
        >
          {documentTypes.map((doc) => {
            const active = selectedType === doc.id;
            const label = isTA ? doc.name.ta : doc.name.en;
            const longTA = isTA && label.length > 10;

            return (
              <button
                key={doc.id}
                onClick={() => onTypeSelect(doc.id)}
                title={label}
                aria-pressed={active}
                className={cn(
                  "snap-start md:snap-none",
                  "flex-shrink-0 md:flex-shrink",
                  "flex flex-col items-center md:items-start justify-center md:justify-start",
                  "rounded-xl border transition-all duration-200 hover:scale-[1.02] select-none",
                  active
                    ? "bg-gradient-primary text-white ring-2 ring-primary/50"
                    : "bg-card hover:bg-accent border-border",
                  // space & sizing
                  "px-4 py-3 md:py-4",
                  "min-w-[140px] sm:min-w-[160px] md:min-w-[170px]",
                  "h-auto text-left shadow-sm"
                )}
              >
                <div className={cn("p-2 rounded-lg mb-2", active ? "bg-white/20" : "bg-gradient-primary")}>
                  <doc.icon className="h-4 w-4 text-white" />
                </div>

                <h3
                  className={cn(
                    "font-medium text-center md:text-left",
                    "whitespace-normal break-words leading-snug",
                    isTA ? "font-tamil" : "",
                    longTA ? "text-[12px]" : isTA ? "text-[13px]" : "text-sm",
                    active ? "text-white" : "text-foreground"
                  )}
                  style={{ lineHeight: 1.2 as any, hyphens: "auto" as any }}
                >
                  {label}
                </h3>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DocumentTypeSelector;
