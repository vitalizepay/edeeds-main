import { useState, useEffect } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Download, FileText, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { documentTypes } from "./DocumentTypeSelector";

interface FormField {
  id: string;
  label: { en: string; ta: string };
  type: "text" | "textarea" | "date" | "number" | "radio" | "select";
  required: boolean;
  placeholder?: { en: string; ta: string };
  options?: { value: string; label: { en: string; ta: string } }[];
  section: string;
  maxLength?: number;
  readOnly?: boolean;
}

const getFormFields = (typeId: string): FormField[] => {
  const commonFields: Record<string, FormField[]> = {
    // ---------------- SALE DEED ----------------
    "sale-deed": [
      { id: "executionDate", label: { en: "Execution Date", ta: "செயல்பாடு தேதி" }, type: "date", required: true, section: "execution" },
      { id: "vendorName", label: { en: "Vendor Name", ta: "விற்பனையாளர் பெயர்" }, type: "text", required: true, placeholder: { en: "Enter vendor's full name", ta: "விற்பனையாளரின் முழு பெயர்" }, section: "vendor", maxLength: 25 },
      { id: "vendorFatherName", label: { en: "Father's Name", ta: "தந்தையின் பெயர்" }, type: "text", required: true, section: "vendor" },
      { id: "vendorAddress", label: { en: "Vendor Address", ta: "விற்பனையாளர் முகவரி" }, type: "textarea", required: true, section: "vendor" },
      { id: "purchaserName", label: { en: "Purchaser Name", ta: "வாங்குபவர் பெயர்" }, type: "text", required: true, section: "purchaser" },
      { id: "purchaserFatherName", label: { en: "Father's Name", ta: "தந்தையின் பெயர்" }, type: "text", required: true, section: "purchaser" },
      { id: "purchaserAddress", label: { en: "Purchaser Address", ta: "வாங்குபவர் முகவரி" }, type: "textarea", required: true, section: "purchaser" },
      { id: "propertyAddress", label: { en: "Property Address", ta: "சொத்து முகவரி" }, type: "text", required: true, section: "property" },
      { id: "surveyNumber", label: { en: "Survey Number", ta: "ஆய்வு எண்" }, type: "text", required: true, section: "property" },
      { id: "propertyArea", label: { en: "Area (Sq.ft)", ta: "பரப்பளவு (சதுர அடி)" }, type: "text", required: true, section: "property" },
      { id: "saleAmount", label: { en: "Sale Consideration (₹)", ta: "விற்பனை கருத்தில் (₹)" }, type: "number", required: true, section: "property" }
    ],

    // ---------------- RENTAL AGREEMENT ----------------
    "rental-agreement": [
      { id: "effectiveDate", label: { en: "Effective Date", ta: "நடைமுறை தேதி" }, type: "date", required: true, section: "parties" },
      { id: "landlordName", label: { en: "Landlord Name", ta: "வீட்டு உரிமையாளர் பெயர்" }, type: "text", required: true, section: "parties", maxLength: 25 },
      { id: "landlordAddress", label: { en: "Landlord Address", ta: "வீட்டு உரிமையாளர் முகவரி" }, type: "textarea", required: true, section: "parties" },
      { id: "tenantName", label: { en: "Tenant Name", ta: "குத்தகைதாரர் பெயர்" }, type: "text", required: true, section: "parties" },
      { id: "tenantAddress", label: { en: "Tenant Address", ta: "குத்தகைதாரர் முகவரி" }, type: "textarea", required: true, section: "parties" },
      { id: "termDuration", label: { en: "Term Duration", ta: "காலம்" }, type: "text", required: false, section: "term", placeholder: { en: "11 Months", ta: "11 மாதங்கள்" }, readOnly: true },
      { id: "startDate", label: { en: "Start Date", ta: "தொடக்க தேதி" }, type: "date", required: true, section: "term" },
      { id: "endDate", label: { en: "End Date", ta: "முடிவு தேதி" }, type: "date", required: true, section: "term" },
      { id: "propertyAddress", label: { en: "Property Address", ta: "சொத்து முகவரி" }, type: "textarea", required: true, section: "premises" },
      { id: "useType", label: { en: "Use Type", ta: "பயன்பாட்டு வகை" }, type: "select", required: true, section: "premises",
        options: [{ value: "residential", label: { en: "Residential", ta: "குடியிருப்பு" } }, { value: "commercial", label: { en: "Commercial", ta: "வணிக" } }] },
      { id: "monthlyRent", label: { en: "Monthly Rent (₹)", ta: "மாதாந்திர வாடகை (₹)" }, type: "number", required: true, section: "costs" },
      { id: "firstRentDue", label: { en: "First Rent Due Date", ta: "முதல் வாடகை செலுத்த வேண்டிய தேதி" }, type: "date", required: true, section: "costs" },
      { id: "paymentMethod", label: { en: "Payment Method", ta: "கட்டணம் செலுத்தும் முறை" }, type: "select", required: true, section: "costs",
        options: [
          { value: "bank_transfer", label: { en: "Bank Transfer", ta: "வங்கி பரிமாற்றம்" } },
          { value: "cheque", label: { en: "Cheque", ta: "காசோலை" } },
          { value: "cash", label: { en: "Cash", ta: "ரொக்கம்" } },
          { value: "online", label: { en: "Online Payment", ta: "ஆன்லைன் கட்டணம்" } }
        ] },
      { id: "securityDeposit", label: { en: "Security Deposit (₹)", ta: "பாதுகாப்பு வைப்பு (₹)" }, type: "number", required: true, section: "costs" }
    ],

    // ---------------- RELINQUISHMENT DEED ----------------
    "relinquishment-deed": [
      { id: "executionDate", label: { en: "Execution Date", ta: "செயல்பாடு தேதி" }, type: "date", required: true, section: "execution" },
      { id: "executantName", label: { en: "Executant Name", ta: "செயல்படுத்துபவர் பெயர்" }, type: "text", required: true, section: "executant" },
      { id: "executantFatherName", label: { en: "Father's Name", ta: "தந்தையின் பெயர்" }, type: "text", required: true, section: "executant" },
      { id: "executantAddress", label: { en: "Executant Address", ta: "செயல்படுத்துபவர் முகவரி" }, type: "textarea", required: true, section: "executant" },
      { id: "releaseeName", label: { en: "Releasee Name", ta: "விடுதலை செய்யப்படுபவர் பெயர்" }, type: "text", required: true, section: "releasee" },
      { id: "releaseeSpouseName", label: { en: "Spouse Name", ta: "மனைவி/கணவர் பெயர்" }, type: "text", required: true, section: "releasee" },
      { id: "releaseeAddress", label: { en: "Releasee Address", ta: "விடுதலை செய்யப்படுபவர் முகவரி" }, type: "textarea", required: true, section: "releasee" },
      { id: "deceasedName", label: { en: "Deceased Name", ta: "இறந்தவர் பெயர்" }, type: "text", required: true, section: "deceased" },
      { id: "deceasedFatherName", label: { en: "Father's Name", ta: "தந்தையின் பெயர்" }, type: "text", required: true, section: "deceased" },
      { id: "deceasedAddress", label: { en: "Last Known Address", ta: "கடைசியாக அறியப்பட்ட முகவரி" }, type: "textarea", required: true, section: "deceased" },
      { id: "deathDate", label: { en: "Date of Death", ta: "இறந்த தேதி" }, type: "date", required: true, section: "deceased" },
      { id: "surveyNumber", label: { en: "Survey Number", ta: "ஆய்வு எண்" }, type: "text", required: true, section: "property" },
      { id: "plotNumber", label: { en: "Plot Number", ta: "நிலக்கட்டு எண்" }, type: "text", required: true, section: "property" },
      { id: "landArea", label: { en: "Land Area", ta: "நிலம் பரப்பளவு" }, type: "text", required: true, section: "property" },
      { id: "propertyLocation", label: { en: "Property Location", ta: "சொத்து இடம்" }, type: "textarea", required: true, section: "property" },
      { id: "giftDeedNumber", label: { en: "Gift Deed Document Number", ta: "பரிசு பத்திர ஆவண எண்" }, type: "text", required: true, section: "giftdeed" },
      { id: "giftDeedBook", label: { en: "Book Number", ta: "புத்தக எண்" }, type: "text", required: true, section: "giftdeed" },
      { id: "giftDeedVolume", label: { en: "Volume Number", ta: "தொகுதி எண்" }, type: "text", required: true, section: "giftdeed" },
      { id: "giftDeedPages", label: { en: "Page Numbers", ta: "பக்க எண்கள்" }, type: "text", required: true, section: "giftdeed" },
      { id: "heir1Name", label: { en: "Legal Heir 1 - Name", ta: "சட்ட வாரிசு 1 - பெயர்" }, type: "text", required: true, section: "heirs" },
      { id: "heir1Age", label: { en: "Age", ta: "வயது" }, type: "number", required: true, section: "heirs" },
      { id: "heir1Relationship", label: { en: "Relationship", ta: "உறவுமுறை" }, type: "text", required: true, section: "heirs" },
      { id: "heir1Address", label: { en: "Address", ta: "முகவரி" }, type: "textarea", required: true, section: "heirs" },
      { id: "propertyDescription", label: { en: "Property Description", ta: "சொத்து விவரணை" }, type: "textarea", required: true, section: "description" },
      { id: "sharePercentage", label: { en: "Share Being Relinquished (%)", ta: "விடப்படும் பங்கு (%)" }, type: "text", required: true, section: "description" },
      { id: "finalRecipientName", label: { en: "Final Recipient Name", ta: "இறுதி பெறுபவர் பெயர்" }, type: "text", required: true, section: "recipient" },
      { id: "finalRecipientRelation", label: { en: "Father's/Husband's Name", ta: "தந்தை/கணவர் பெயர்" }, type: "text", required: true, section: "recipient" },
      { id: "witness1Name", label: { en: "Witness 1 Name", ta: "சாட்சி 1 பெயர்" }, type: "text", required: true, section: "witnesses" },
      { id: "witness2Name", label: { en: "Witness 2 Name", ta: "சாட்சி 2 பெயர்" }, type: "text", required: true, section: "witnesses" }
    ],

    // ---------------- NDA ----------------
    "nda": [
      { id: "partyOneName", label: { en: "First Party Name", ta: "முதல் தரப்பு பெயர்" }, type: "text", required: true, section: "parties" },
      { id: "partyTwoName", label: { en: "Second Party Name", ta: "இரண்டாம் தரப்பு பெயர்" }, type: "text", required: true, section: "parties" },
      { id: "purpose", label: { en: "Purpose of Agreement", ta: "ஒப்பந்தத்தின் நோக்கம்" }, type: "textarea", required: true, section: "general" },
      { id: "effectiveDate", label: { en: "Effective Date", ta: "நடைமுறை தேதி" }, type: "date", required: true, section: "term" },
      { id: "duration", label: { en: "Duration (Years)", ta: "காலம் (ஆண்டுகள்)" }, type: "number", required: true, section: "term" }
    ],

    // ---------------- GIFT DEED ----------------
    "gift-deed": [
      { id: "executionDate", label:{en:"Execution Date", ta:"செயல்பாடு தேதி"}, type:"date", required:true, section:"execution" },
      { id: "donorName", label:{en:"Donor Name", ta:"வழங்குபவர் பெயர்"}, type:"text", required:true, placeholder:{en:"Full name of donor", ta:"வழங்குபவரின் முழு பெயர்"}, section:"donor" },
      { id: "donorFatherName", label:{en:"Father's/Husband's Name", ta:"தந்தை/கணவர் பெயர்"}, type:"text", required:true, section:"donor" },
      { id: "donorAddress", label:{en:"Donor Address", ta:"வழங்குபவர் முகவரி"}, type:"textarea", required:true, section:"donor" },
      { id: "doneeName", label:{en:"Donee Name", ta:"பெறுபவர் பெயர்"}, type:"text", required:true, section:"donee" },
      { id: "doneeFatherName", label:{en:"Father's/Husband's Name", ta:"தந்தை/கணவர் பெயர்"}, type:"text", required:true, section:"donee" },
      { id: "doneeAddress", label:{en:"Donee Address", ta:"பெறுபவர் முகவரி"}, type:"textarea", required:true, section:"donee" },
      { id: "relationship", label:{en:"Relationship", ta:"உறவுமுறை"}, type:"text", required:true, placeholder:{en:"e.g., Son/Daughter/Relative", ta:"எ.கா., மகன்/மகள்/உறவினர்"}, section:"donee" },
      { id: "propertyAddress", label:{en:"Property Address", ta:"சொத்து முகவரி"}, type:"textarea", required:true, section:"property" },
      { id: "surveyNumber", label:{en:"Survey Number", ta:"ஆய்வு எண்"}, type:"text", required:true, section:"property" },
      { id: "landArea", label:{en:"Area/Measurement", ta:"பரப்பளவு/அளவீடு"}, type:"text", required:true, section:"property" },
      { id: "consideration", label:{en:"Consideration", ta:"பரிசீலனை"}, type:"select", required:true, section:"property",
        options:[
          {value:"gratuitous", label:{en:"Gift (No consideration)", ta:"பரிசு (பரிசீலனை இல்லை)"}},
          {value:"with_love_affection", label:{en:"Natural love & affection", ta:"இயற்கை காதல் & பாசம்"}}
        ]},
      { id: "witness1Name", label:{en:"Witness 1 Name", ta:"சாட்சி 1 பெயர்"}, type:"text", required:true, section:"witnesses" },
      { id: "witness2Name", label:{en:"Witness 2 Name", ta:"சாட்சி 2 பெயர்"}, type:"text", required:true, section:"witnesses" }
    ],

    // ---------------- WILL ----------------
    "will-agreement": [
      { id: "executionDate", label:{en:"Date of Will", ta:"உத்தரவு தேதி"}, type:"date", required:true, section:"testator" },
      { id: "testatorName", label:{en:"Testator Name", ta:"உத்தரவையாளர் பெயர்"}, type:"text", required:true, section:"testator" },
      { id: "testatorFatherName", label:{en:"Father's/Husband's Name", ta:"தந்தை/கணவர் பெயர்"}, type:"text", required:true, section:"testator" },
      { id: "testatorAddress", label:{en:"Testator Address", ta:"உத்தரவையாளர் முகவரி"}, type:"textarea", required:true, section:"testator" },
      { id: "beneficiary1Name", label:{en:"Beneficiary 1 Name", ta:"பெறுநர் 1 பெயர்"}, type:"text", required:true, section:"beneficiaries" },
      { id: "beneficiary1Share", label:{en:"Share/Bequest", ta:"பங்கு/வழங்கு"}, type:"text", required:true, placeholder:{en:"e.g., 50% house share", ta:"எ.கா., வீட்டில் 50% பங்கு"}, section:"beneficiaries" },
      { id: "assetsDescription", label:{en:"Assets Description", ta:"சொத்துகள் விவரம்"}, type:"textarea", required:true, section:"assets" },
      { id: "executorName", label:{en:"Executor Name", ta:"செயலாக்குநர் பெயர்"}, type:"text", required:true, section:"executor" },
      { id: "witness1Name", label:{en:"Witness 1 Name", ta:"சாட்சி 1 பெயர்"}, type:"text", required:true, section:"witnesses" },
      { id: "witness2Name", label:{en:"Witness 2 Name", ta:"சாட்சி 2 பெயர்"}, type:"text", required:true, section:"witnesses" }
    ],

    // ---------------- POWER OF ATTORNEY ----------------
    "power-of-attorney": [
      { id: "executionDate", label:{en:"Execution Date", ta:"செயல்பாடு தேதி"}, type:"date", required:true, section:"execution" },
      { id:"principalName", label:{en:"Principal Name", ta:"முதன்மை (அளிப்பவர்) பெயர்"}, type:"text", required:true, section:"principal" },
      { id:"principalAddress", label:{en:"Principal Address", ta:"முதன்மை முகவரி"}, type:"textarea", required:true, section:"principal" },
      { id:"attorneyName", label:{en:"Attorney/Agent Name", ta:"அமைச்சர்/முகவர் பெயர்"}, type:"text", required:true, section:"attorney" },
      { id:"attorneyAddress", label:{en:"Attorney Address", ta:"முகவர் முகவரி"}, type:"textarea", required:true, section:"attorney" },
      { id:"poaScope", label:{en:"Powers Granted", ta:"வழங்கப்படும் அதிகாரங்கள்"}, type:"textarea", required:true, placeholder:{en:"e.g., Sell/Lease/Execute deeds; operate bank a/c", ta:"எ.கா., விற்பனை/குத்தகை/ஆவண கையெழுத்து; வங்கி கணக்கு"}, section:"powers" },
      { id:"revocation", label:{en:"Revocation Clause", ta:"ரத்துச் செய்தல் விதி"}, type:"select", required:true, section:"powers",
        options:[
          {value:"revocable", label:{en:"Revocable", ta:"ரத்து செய்யக்கூடியது"}},
          {value:"irrevocable", label:{en:"Irrevocable", ta:"ரத்து செய்ய இயலாதது"}}
        ]},
      { id:"witness1Name", label:{en:"Witness 1 Name", ta:"சாட்சி 1 பெயர்"}, type:"text", required:true, section:"witnesses" },
      { id:"witness2Name", label:{en:"Witness 2 Name", ta:"சாட்சி 2 பெயர்"}, type:"text", required:true, section:"witnesses" }
    ],

    // ---------------- AGREEMENT TO SELL ----------------
    "agreement-to-sell": [
      { id:"agreementDate", label:{en:"Agreement Date", ta:"ஒப்பந்த தேதி"}, type:"date", required:true, section:"parties" },
      { id:"sellerName", label:{en:"Seller Name", ta:"விற்பனையாளர் பெயர்"}, type:"text", required:true, section:"parties" },
      { id:"sellerAddress", label:{en:"Seller Address", ta:"விற்பனையாளர் முகவரி"}, type:"textarea", required:true, section:"parties" },
      { id:"buyerName", label:{en:"Buyer Name", ta:"வாங்குபவர் பெயர்"}, type:"text", required:true, section:"parties" },
      { id:"buyerAddress", label:{en:"Buyer Address", ta:"வாங்குபவர் முகவரி"}, type:"textarea", required:true, section:"parties" },
      { id:"propertyAddress", label:{en:"Property Address", ta:"சொத்து முகவரி"}, type:"textarea", required:true, section:"property" },
      { id:"surveyNumber", label:{en:"Survey Number", ta:"ஆய்வு எண்"}, type:"text", required:true, section:"property" },
      { id:"landArea", label:{en:"Area/Measurement", ta:"பரப்பளவு/அளவீடு"}, type:"text", required:true, section:"property" },
      { id:"totalPrice", label:{en:"Total Price (₹)", ta:"மொத்த விலை (₹)"}, type:"number", required:true, section:"price" },
      { id:"advancePaid", label:{en:"Advance/Token (₹)", ta:"முன்பணம் (₹)"}, type:"number", required:true, section:"price" },
      { id:"balanceDueDate", label:{en:"Balance Payment Date", ta:"இருப்புத் தொகை தேதி"}, type:"date", required:true, section:"price" },
      { id:"completionDate", label:{en:"Sale Completion / Registration Date", ta:"விற்பனை நிறைவு / பதிவு தேதி"}, type:"date", required:true, section:"completion" },
      { id:"witness1Name", label:{en:"Witness 1 Name", ta:"சாட்சி 1 பெயர்"}, type:"text", required:true, section:"witnesses" },
      { id:"witness2Name", label:{en:"Witness 2 Name", ta:"சாட்சி 2 பெயர்"}, type:"text", required:true, section:"witnesses" }
    ],

    // ---------------- PARTITION DEED ----------------
    "partition-deed": [
      { id:"executionDate", label:{en:"Execution Date", ta:"செயல்பாடு தேதி"}, type:"date", required:true, section:"execution" },
      { id:"coparceners", label:{en:"Co-parceners (comma separated)", ta:"கூட்டு பங்குதாரர்கள் (கமா பிரித்து)"}, type:"textarea", required:true, section:"parties" },
      { id:"familyPropertyDesc", label:{en:"Family/Joint Property Description", ta:"குடும்ப/கூட்டு சொத்து விவரம்"}, type:"textarea", required:true, section:"property" },
      { id:"shareMatrix", label:{en:"Share Allocation (e.g., A-40%, B-30%, C-30%)", ta:"பங்கீடு (எ.கா., A-40%, B-30%, C-30%)"}, type:"textarea", required:true, section:"shares" },
      { id:"witness1Name", label:{en:"Witness 1 Name", ta:"சாட்சி 1 பெயர்"}, type:"text", required:true, section:"witnesses" },
      { id:"witness2Name", label:{en:"Witness 2 Name", ta:"சாட்சி 2 பெயர்"}, type:"text", required:true, section:"witnesses" }
    ],

    // ---------------- GENERAL POWER OF AUTHORITY ----------------
    "general-power-of-authority": [
      { id:"executionDate", label:{en:"Execution Date", ta:"செயல்பாடு தேதி"}, type:"date", required:true, placeholder:{en:"mm/dd/yyyy", ta:"மாதம்/நாள்/ஆண்டு"}, section:"execution" },
      { id:"place", label:{en:"Place", ta:"இடம்"}, type:"text", required:true, section:"execution" },
      { id:"principalName", label:{en:"Principal Name", ta:"முதன்மை (அளிப்பவர்) பெயர்"}, type:"text", required:true, section:"principal" },
      { id:"principalFatherName", label:{en:"Principal Father's Name", ta:"முதன்மை தந்தையின் பெயர்"}, type:"text", required:true, section:"principal" },
      { id:"principalPermanentAddress", label:{en:"Permanent Address", ta:"நிரந்தர முகவரி"}, type:"textarea", required:true, section:"principal" },
      { id:"principalCurrentAddress", label:{en:"Current Address", ta:"தற்போதைய முகவரி"}, type:"textarea", required:true, section:"principal" },
      { id:"principalAge", label:{en:"Principal Age", ta:"முதன்மை வயது"}, type:"number", required:true, section:"principal" },
      { id:"principalOccupation", label:{en:"Principal Occupation", ta:"முதன்மை தொழில்"}, type:"text", required:true, section:"principal" },
      { id:"principalContact", label:{en:"Principal Contact Number", ta:"முதன்மை தொடர்பு எண்"}, type:"text", required:true, section:"principal" },
      { id:"primaryAttorneyName", label:{en:"Primary Attorney Name", ta:"முதன்மை அமைச்சர் பெயர்"}, type:"text", required:true, section:"attorney" },
      { id:"primaryAttorneyFatherName", label:{en:"Primary Attorney Father's Name", ta:"முதன்மை அமைச்சர் தந்தையின் பெயர்"}, type:"text", required:true, section:"attorney" },
      { id:"primaryAttorneyCurrentAddress", label:{en:"Primary Attorney Current Address", ta:"முதன்மை அமைச்சர் தற்போதைய முகவரி"}, type:"textarea", required:true, section:"attorney" },
      { id:"primaryAttorneyAge", label:{en:"Primary Attorney Age", ta:"முதன்மை அமைச்சர் வயது"}, type:"number", required:true, section:"attorney" },
      { id:"primaryAttorneyOccupation", label:{en:"Primary Attorney Occupation", ta:"முதன்மை அமைச்சர் தொழில்"}, type:"text", required:true, section:"attorney" },
      { id:"primaryAttorneyContact", label:{en:"Primary Attorney Contact Number", ta:"முதன்மை அமைச்சர் தொடர்பு எண்"}, type:"text", required:true, section:"attorney" },
      { id:"alternateAttorneyName", label:{en:"Alternate Attorney Name", ta:"மாற்று அமைச்சர் பெயர்"}, type:"text", required:false, section:"alternate-attorney" },
      { id:"relationship", label:{en:"Relationship", ta:"உறவுமுறை"}, type:"select", required:false, section:"relationship",
        options:[
          {value:"wife_of", label:{en:"Wife of", ta:"மனைவி"}},
          {value:"husband_of", label:{en:"Husband of", ta:"கணவர்"}},
          {value:"son_of", label:{en:"Son of", ta:"மகன்"}},
          {value:"daughter_of", label:{en:"Daughter of", ta:"மகள்"}},
          {value:"other", label:{en:"Other", ta:"மற்றவை"}}
        ]},
      { id:"husbandName", label:{en:"Husband's Name", ta:"கணவர் பெயர்"}, type:"text", required:false, section:"relationship" },
      { id:"husbandAddress", label:{en:"Address", ta:"முகவரி"}, type:"textarea", required:false, section:"relationship" },
      { id:"manageProperty", label:{en:"To manage and look after my movable and immovable properties", ta:"எனது நகரக்கூடிய மற்றும் நகர இயலாத சொத்துகளை நிர்வகிக்க மற்றும் பார்த்துக்கொள்ள"}, type:"radio", required:false, section:"powers" },
      { id:"buySellProperty", label:{en:"To buy, sell, lease, mortgage, or otherwise deal with property", ta:"சொத்தை வாங்க, விற்க, குத்தகை, கடன், அல்லது வேறு வழியில் கையாள"}, type:"radio", required:false, section:"powers" },
      { id:"appearOffices", label:{en:"To appear before government offices, registrars, or courts", ta:"அரசு அலுவலகங்கள், பதிவாளர்கள் அல்லது நீதிமன்றங்களில் தோற்றமளிக்க"}, type:"radio", required:false, section:"powers" },
      { id:"operateBank", label:{en:"To operate bank accounts, sign cheques, and handle financial matters", ta:"வங்கி கணக்குகளை இயக்க, காசோலைகளில் கையெழுத்திட, மற்றும் நிதி விவகாரங்களை கையாள"}, type:"radio", required:false, section:"powers" },
      { id:"signDocuments", label:{en:"To sign and execute documents, deeds, and agreements", ta:"ஆவணங்கள், பத்திரங்கள் மற்றும் ஒப்பந்தங்களில் கையெழுத்திட மற்றும் செயல்படுத்த"}, type:"radio", required:false, section:"powers" },
      { id:"representLegal", label:{en:"To represent me in any legal, personal, or business matter", ta:"எந்தவொரு சட்ட, தனிப்பட்ட அல்லது வணிக விவகாரத்திலும் என்னை பிரதிநிதித்துவப்படுத்த"}, type:"radio", required:false, section:"powers" },
      { id:"otherPowers", label:{en:"Any other specific power(s)", ta:"வேறு எந்தவொரு குறிப்பிட்ட அதிகாரம்(கள்)"}, type:"textarea", required:false, section:"powers" },
      { id:"durationType", label:{en:"Duration Type", ta:"காலம் வகை"}, type:"select", required:true, section:"duration",
        options:[
          {value:"until_revoked", label:{en:"Until revoked by me in writing", ta:"என்னால் எழுத்துப்பூர்வமாக ரத்து செய்யப்படும் வரை"}},
          {value:"specific_period", label:{en:"Valid for specific period", ta:"குறிப்பிட்ட காலத்திற்கு செல்லுபடியாகும்"}}
        ]},
      { id:"durationStartDate", label:{en:"Duration Start Date", ta:"காலம் தொடக்க தேதி"}, type:"date", required:false, section:"duration" },
      { id:"durationEndDate", label:{en:"Duration End Date", ta:"காலம் முடிவு தேதி"}, type:"date", required:false, section:"duration" },
      { id:"witness1Name", label:{en:"Witness 1 Name", ta:"சாட்சி 1 பெயர்"}, type:"text", required:true, section:"witnesses" },
      { id:"witness1Address", label:{en:"Witness 1 Address", ta:"சாட்சி 1 முகவரி"}, type:"textarea", required:true, section:"witnesses" },
      { id:"witness2Name", label:{en:"Witness 2 Name", ta:"சாட்சி 2 பெயர்"}, type:"text", required:true, section:"witnesses" },
      { id:"witness2Address", label:{en:"Witness 2 Address", ta:"சாட்சி 2 முகவரி"}, type:"textarea", required:true, section:"witnesses" },
      { id:"identifyingOfficerName", label:{en:"Identifying Officer Name", ta:"அடையாளம் காணும் அதிகாரி பெயர்"}, type:"text", required:false, section:"officer" },
      { id:"notaryPublicName", label:{en:"Notary Public Name", ta:"நோட்டரி பொது பெயர்"}, type:"text", required:false, section:"officer" },
      { id:"scheduleI", label:{en:"Schedule I", ta:"அட்டவணை I"}, type:"textarea", required:false, section:"schedule" },
      { id:"scheduleII", label:{en:"Schedule II", ta:"அட்டவணை II"}, type:"textarea", required:false, section:"schedule" }
    ],

    // ---------------- BUILDER BUYER AGREEMENT ----------------
    "builder-buyer-agreement": [
      { id:"agreementDate", label:{en:"Agreement Date", ta:"ஒப்பந்த தேதி"}, type:"date", required:true, section:"parties" },
      { id:"builderName", label:{en:"Builder/Developer Name", ta:"கட்டிடக்காரர்/வளர்ச்சியாளர் பெயர்"}, type:"text", required:true, section:"parties" },
      { id:"builderAddress", label:{en:"Builder Address", ta:"கட்டிடக்காரர் முகவரி"}, type:"textarea", required:true, section:"parties" },
      { id:"buyerName", label:{en:"Buyer Name", ta:"வாங்குபவர் பெயர்"}, type:"text", required:true, section:"parties" },
      { id:"buyerAddress", label:{en:"Buyer Address", ta:"வாங்குபவர் முகவரி"}, type:"textarea", required:true, section:"parties" },
      { id:"projectName", label:{en:"Project Name", ta:"திட்டத்தின் பெயர்"}, type:"text", required:true, section:"project" },
      { id:"projectAddress", label:{en:"Project Address", ta:"திட்ட முகவரி"}, type:"textarea", required:true, section:"project" },
      { id:"unitDetails", label:{en:"Unit Details (Flat No., Area, etc.)", ta:"அலகு விவரங்கள் (அடுக்குமாடி எண், பரப்பளவு போன்றவை)"}, type:"textarea", required:true, section:"project" },
      { id:"totalPrice", label:{en:"Total Price (₹)", ta:"மொத்த விலை (₹)"}, type:"number", required:true, section:"price" },
      { id:"advancePaid", label:{en:"Advance/Token (₹)", ta:"முன்பணம் (₹)"}, type:"number", required:true, section:"price" },
      { id:"paymentSchedule", label:{en:"Payment Schedule", ta:"கட்டண அட்டவணை"}, type:"textarea", required:true, section:"price" },
      { id:"completionDate", label:{en:"Project Completion Date", ta:"திட்ட நிறைவு தேதி"}, type:"date", required:true, section:"completion" },
      { id:"possessionDate", label:{en:"Possession Date", ta:"ஆக்கிரமிப்பு தேதி"}, type:"date", required:true, section:"completion" },
      { id:"witness1Name", label:{en:"Witness 1 Name", ta:"சாட்சி 1 பெயர்"}, type:"text", required:true, section:"witnesses" },
      { id:"witness2Name", label:{en:"Witness 2 Name", ta:"சாட்சி 2 பெயர்"}, type:"text", required:true, section:"witnesses" }
    ],

    // ---------------- MUTATION LEGAL DOCUMENT ----------------
    "mutation-legal-document": [
      { id:"applicationDate", label:{en:"Application Date", ta:"விண்ணப்ப தேதி"}, type:"date", required:true, section:"application" },
      { id:"applicantName", label:{en:"Applicant Name", ta:"விண்ணப்பதாரர் பெயர்"}, type:"text", required:true, section:"applicant" },
      { id:"applicantAddress", label:{en:"Applicant Address", ta:"விண்ணப்பதாரர் முகவரி"}, type:"textarea", required:true, section:"applicant" },
      { id:"propertyAddress", label:{en:"Property Address", ta:"சொத்து முகவரி"}, type:"textarea", required:true, section:"property" },
      { id:"surveyNumber", label:{en:"Survey Number", ta:"ஆய்வு எண்"}, type:"text", required:true, section:"property" },
      { id:"landArea", label:{en:"Area/Measurement", ta:"பரப்பளவு/அளவீடு"}, type:"text", required:true, section:"property" },
      { id:"mutationReason", label:{en:"Reason for Mutation", ta:"மாற்றத்திற்கான காரணம்"}, type:"select", required:true, section:"mutation",
        options:[
          {value:"sale", label:{en:"Sale/Transfer", ta:"விற்பனை/பரிமாற்றம்"}},
          {value:"inheritance", label:{en:"Inheritance", ta:"பரம்பரை"}},
          {value:"gift", label:{en:"Gift", ta:"பரிசு"}},
          {value:"court_order", label:{en:"Court Order", ta:"நீதிமன்ற உத்தரவு"}},
          {value:"other", label:{en:"Other", ta:"மற்றவை"}}
        ]},
      { id:"previousOwner", label:{en:"Previous Owner Name", ta:"முந்தைய உரிமையாளர் பெயர்"}, type:"text", required:true, section:"ownership" },
      { id:"newOwner", label:{en:"New Owner Name", ta:"புதிய உரிமையாளர் பெயர்"}, type:"text", required:true, section:"ownership" },
      { id:"supportingDocuments", label:{en:"Supporting Documents", ta:"ஆதரவு ஆவணங்கள்"}, type:"textarea", required:true, placeholder:{en:"List documents like sale deed, death certificate, etc.", ta:"விற்பனை பத்திரம், இறப்பு சான்றிதழ் போன்ற ஆவணங்களை பட்டியலிடு"}, section:"documents" },
      { id:"witness1Name", label:{en:"Witness 1 Name", ta:"சாட்சி 1 பெயர்"}, type:"text", required:true, section:"witnesses" },
      { id:"witness2Name", label:{en:"Witness 2 Name", ta:"சாட்சி 2 பெயர்"}, type:"text", required:true, section:"witnesses" }
    ],
  };

  return commonFields[typeId as keyof typeof commonFields] || [];
};

interface DocumentFormProps {
  selectedType: string | null;
  language: "en" | "ta";
  onFormDataChange: (data: Record<string, string>) => void;
}

const DocumentForm = ({ selectedType, language, onFormDataChange }: DocumentFormProps) => {
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleFieldChange = (fieldId: string, value: string) => {
    const newData = { ...formData, [fieldId]: value };
    setFormData(newData);
    onFormDataChange(newData);
    if (selectedType) {
      localStorage.setItem(`docform-${selectedType}`, JSON.stringify(newData));
    }
  };

  useEffect(() => {
    if (!selectedType) {
      setFormData({});
      onFormDataChange({});
      return;
    }
    const saved = localStorage.getItem(`docform-${selectedType}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setFormData(parsed);
      onFormDataChange(parsed);
    } else {
      setFormData({});
      onFormDataChange({});
    }
  }, [selectedType]);

  if (!selectedType) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-subtle">
        <div className="text-center animate-fade-in">
          <div className="flex items-center justify-center w-16 h-16 bg-muted rounded-full mx-auto mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className={cn("text-lg font-medium mb-2", language === "ta" && "font-tamil")}>
            {language === "en" ? "Select a Document Type" : "ஒரு ஆவண வகையைத் தேர்ந்தெடுக்கவும்"}
          </h3>
          <p className={cn("text-muted-foreground", language === "ta" && "font-tamil")}>
            {language === "en"
              ? "Choose a document type from the sidebar to begin."
              : "தொடங்க பக்கப்பட்டியலில் இருந்து ஒரு ஆவண வகையைத் தேர்ந்தெடுக்கவும்."}
          </p>
        </div>
      </div>
    );
  }

  const documentType = documentTypes.find(type => type.id === selectedType);
  const formFields = getFormFields(selectedType);

  // Grouped sections
  const sections =
    selectedType === "sale-deed" ? [
      { id: "execution", title: { en: "EXECUTION DETAILS", ta: "செயல்பாடு விவரங்கள்" } },
      { id: "vendor", title: { en: "VENDOR INFORMATION", ta: "விற்பனையாளர் தகவல்" } },
      { id: "purchaser", title: { en: "PURCHASER INFORMATION", ta: "வாங்குபவர் தகவல்" } },
      { id: "property", title: { en: "PROPERTY DETAILS", ta: "சொத்து விவரங்கள்" } }
    ] : selectedType === "rental-agreement" ? [
      { id: "parties", title: { en: "PARTIES", ta: "தரப்பினர்" } },
      { id: "term", title: { en: "TERM", ta: "காலம்" } },
      { id: "premises", title: { en: "PREMISES, USE & OCCUPANCY", ta: "வளாகம், பயன்பாடு மற்றும் ஆக்கிரமிப்பு" } },
      { id: "costs", title: { en: "COSTS AND PAYMENT", ta: "செலவுகள் மற்றும் கட்டணம்" } }
    ] : selectedType === "relinquishment-deed" ? [
      { id: "execution", title: { en: "EXECUTION DETAILS", ta: "செயல்பாடு விவரங்கள்" } },
      { id: "executant", title: { en: "EXECUTANT INFORMATION", ta: "செயல்படுத்துபவர் தகவல்" } },
      { id: "releasee", title: { en: "RELEASEE INFORMATION", ta: "விடுதலை பெறுபவர் தகவல்" } },
      { id: "deceased", title: { en: "DECEASED INFORMATION", ta: "இறந்தவர் தகவல்" } },
      { id: "property", title: { en: "PROPERTY INFORMATION", ta: "சொத்து தகவல்" } },
      { id: "giftdeed", title: { en: "GIFT DEED REFERENCE", ta: "பரிசு பத்திர குறிப்பு" } },
      { id: "heirs", title: { en: "LEGAL HEIRS", ta: "சட்ட வாரிசுகள்" } },
      { id: "description", title: { en: "PROPERTY SHARE & DESCRIPTION", ta: "சொத்து பங்கு மற்றும் விவரணை" } },
      { id: "recipient", title: { en: "FINAL RECIPIENT", ta: "இறுதி பெறுபவர்" } },
      { id: "witnesses", title: { en: "WITNESSES", ta: "சாட்சிகள்" } }
    ] : selectedType === "gift-deed" ? [
      { id: "execution", title: { en: "EXECUTION DETAILS", ta: "செயல்பாடு விவரங்கள்" } },
      { id: "donor", title: { en: "DONOR DETAILS", ta: "வழங்குபவர் விவரங்கள்" } },
      { id: "donee", title: { en: "DONEE DETAILS", ta: "பெறுபவர் விவரங்கள்" } },
      { id: "property", title: { en: "PROPERTY DETAILS", ta: "சொத்து விவரங்கள்" } },
      { id: "witnesses", title: { en: "WITNESSES", ta: "சாட்சிகள்" } }
    ] : selectedType === "will-agreement" ? [
      { id: "testator", title: { en: "TESTATOR DETAILS", ta: "உத்தரவையாளர் விவரங்கள்" } },
      { id: "beneficiaries", title: { en: "BENEFICIARIES", ta: "பெறுநர்கள்" } },
      { id: "assets", title: { en: "ASSETS", ta: "சொத்துகள்" } },
      { id: "executor", title: { en: "EXECUTOR", ta: "செயலாக்குநர்" } },
      { id: "witnesses", title: { en: "WITNESSES", ta: "சாட்சிகள்" } }
    ] : selectedType === "power-of-attorney" ? [
      { id: "execution", title: { en: "EXECUTION DETAILS", ta: "செயல்பாடு விவரங்கள்" } },
      { id: "principal", title: { en: "PRINCIPAL", ta: "முதன்மை (அளிப்பவர்)" } },
      { id: "attorney", title: { en: "ATTORNEY/AGENT", ta: "அமைச்சர்/முகவர்" } },
      { id: "powers", title: { en: "POWERS", ta: "அதிகாரங்கள்" } },
      { id: "witnesses", title: { en: "WITNESSES", ta: "சாட்சிகள்" } }
    ] : selectedType === "agreement-to-sell" ? [
      { id: "parties", title: { en: "PARTIES", ta: "தரப்பினர்" } },
      { id: "property", title: { en: "PROPERTY DETAILS", ta: "சொத்து விவரங்கள்" } },
      { id: "price", title: { en: "PRICE & PAYMENT", ta: "விலை & கட்டணம்" } },
      { id: "completion", title: { en: "COMPLETION", ta: "நிறைவு" } },
      { id: "witnesses", title: { en: "WITNESSES", ta: "சாட்சிகள்" } }
    ] : selectedType === "partition-deed" ? [
      { id: "execution", title: { en: "EXECUTION DETAILS", ta: "செயல்பாடு விவரங்கள்" } },
      { id: "parties", title: { en: "CO-PARCENERS", ta: "கூட்டு பங்குதாரர்கள்" } },
      { id: "property", title: { en: "JOINT PROPERTY", ta: "கூட்டு சொத்து" } },
      { id: "shares", title: { en: "ALLOCATION OF SHARES", ta: "பங்கீடு" } },
      { id: "witnesses", title: { en: "WITNESSES", ta: "சாட்சிகள்" } }
    ] : selectedType === "general-power-of-authority" ? [
      { id: "execution", title: { en: "EXECUTION DETAILS", ta: "செயல்பாடு விவரங்கள்" } },
      { id: "principal", title: { en: "DETAILS OF THE PRINCIPAL", ta: "முதன்மை விவரங்கள்" } },
      { id: "attorney", title: { en: "DETAILS OF THE ATTORNEY", ta: "அமைச்சர் விவரங்கள்" } },
      { id: "alternate-attorney", title: { en: "ALTERNATE ATTORNEY", ta: "மாற்று அமைச்சர்" } },
      { id: "relationship", title: { en: "RELATIONSHIP", ta: "உறவுமுறை" } },
      { id: "powers", title: { en: "PURPOSE / POWERS GRANTED", ta: "நோக்கம் / வழங்கப்படும் அதிகாரங்கள்" } },
      { id: "duration", title: { en: "DURATION OF POWER", ta: "அதிகாரத்தின் காலம்" } },
      { id: "witnesses", title: { en: "WITNESSES", ta: "சாட்சிகள்" } },
      { id: "officer", title: { en: "OFFICER", ta: "அதிகாரி" } },
      { id: "schedule", title: { en: "SCHEDULE", ta: "அட்டவணை" } }
    ] : selectedType === "builder-buyer-agreement" ? [
      { id: "parties", title: { en: "PARTIES", ta: "தரப்பினர்" } },
      { id: "project", title: { en: "PROJECT DETAILS", ta: "திட்ட விவரங்கள்" } },
      { id: "price", title: { en: "PRICE & PAYMENT", ta: "விலை & கட்டணம்" } },
      { id: "completion", title: { en: "COMPLETION", ta: "நிறைவு" } },
      { id: "witnesses", title: { en: "WITNESSES", ta: "சாட்சிகள்" } }
    ] : selectedType === "mutation-legal-document" ? [
      { id: "application", title: { en: "APPLICATION DETAILS", ta: "விண்ணப்ப விவரங்கள்" } },
      { id: "applicant", title: { en: "APPLICANT INFORMATION", ta: "விண்ணப்பதாரர் தகவல்" } },
      { id: "property", title: { en: "PROPERTY DETAILS", ta: "சொத்து விவரங்கள்" } },
      { id: "mutation", title: { en: "MUTATION REASON", ta: "மாற்ற காரணம்" } },
      { id: "ownership", title: { en: "OWNERSHIP CHANGE", ta: "உரிமை மாற்றம்" } },
      { id: "documents", title: { en: "SUPPORTING DOCUMENTS", ta: "ஆதரவு ஆவணங்கள்" } },
      { id: "witnesses", title: { en: "WITNESSES", ta: "சாட்சிகள்" } }
    ] : [];

  const getFieldsBySection = (sectionId: string) =>
    formFields.filter(field => field.section === sectionId);

  const renderField = (field: FormField) => {
    const commonProps = {
      id: field.id,
      value: field.id === "termDuration" ? "11 Months" : (formData[field.id] || ""),
      className: cn("transition-smooth", language === "ta" && "font-tamil"),
      maxLength: field.maxLength,
      readOnly: field.readOnly
    };

    switch (field.type) {
      case "textarea":
        return (
          <Textarea
            {...commonProps}
            placeholder={field.placeholder?.[language]}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={cn(commonProps.className, "min-h-[100px] resize-none")}
          />
        );
      case "radio":
        return (
          <RadioGroup
            value={formData[field.id] || ""}
            onValueChange={(value) => handleFieldChange(field.id, value)}
            className="flex flex-col space-y-2"
          >
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                <Label
                  htmlFor={`${field.id}-${option.value}`}
                  className={cn("text-sm", language === "ta" && "font-tamil")}
                >
                  {option.label[language]}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
      case "select":
        return (
          <Select
            value={formData[field.id] || ""}
            onValueChange={(value) => handleFieldChange(field.id, value)}
          >
            <SelectTrigger className={commonProps.className}>
              <SelectValue placeholder={`Select ${field.label[language].toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className={language === "ta" ? "font-tamil" : ""}>
                    {option.label[language]}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return (
          <Input
            {...commonProps}
            type={field.type}
            placeholder={field.placeholder?.[language]}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        );
    }
  };

  const requiredMissing = formFields.filter(f => f.required && !String(formData[f.id] || "").trim());
  const isInvalid = requiredMissing.length > 0;

  return (
    <div className="flex-1 p-6 bg-gradient-subtle overflow-y-auto">
      <div className="space-y-6">
        <Card className="max-w-2xl mx-auto legal-card animate-fade-in">
          <CardHeader className="text-center">
            <CardTitle className={cn(
              "text-2xl font-bold uppercase tracking-wide mb-2",
              language === "ta" && "font-tamil"
            )}>
              {documentType?.name[language]}
            </CardTitle>
            <CardDescription className={cn(
              "text-sm font-medium",
              language === "ta" ? "font-tamil" : ""
            )}>
              {documentType?.description[language]}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {sections.length > 0 ? (
              sections.map((section) => {
                const sectionFields = getFieldsBySection(section.id);
                if (sectionFields.length === 0) return null;
                return (
                  <div key={section.id} className="space-y-4">
                    <div className="border-b pb-2">
                      <h3 className={cn(
                        "text-lg font-bold uppercase tracking-wide text-foreground",
                        language === "ta" && "font-tamil"
                      )}>
                        {section.title[language]}
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {sectionFields.map((field) => (
                        <div key={field.id} className="space-y-2">
                          <Label htmlFor={field.id} className={cn("text-sm font-semibold", language === "ta" && "font-tamil")}>
                            {field.label[language]}
                            {field.required && <span className="text-destructive ml-1">*</span>}
                          </Label>
                          {renderField(field)}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              formFields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.id} className={cn("text-sm font-medium", language === "ta" && "font-tamil")}>
                    {field.label[language]}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {renderField(field)}
                </div>
              ))
            )}

            {/* Validation alert */}
            {isInvalid && (
              <div className="flex items-start gap-3 p-3 rounded-md bg-amber-50 border border-amber-200">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className={cn("text-sm text-amber-800", language === "ta" && "font-tamil")}>
                  {language === "en" ? "Please fill the required fields: " : "தயவுசெய்து தேவையான புலங்களை நிரப்பவும்: "}
                  {requiredMissing.slice(0, 3).map(f => f.label[language]).join(", ")}
                  {requiredMissing.length > 3 ? " …" : ""}
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button className="w-full legal-gradient text-white font-semibold py-3" disabled={isInvalid}>
                <Download className="h-4 w-4 mr-2" />
                <span className={language === "ta" ? "font-tamil" : ""}>
                  {language === "en" ? "Generate Document" : "ஆவணத்தை உருவாக்கவும்"}
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>


    </div>
  );
};

export default DocumentForm;
