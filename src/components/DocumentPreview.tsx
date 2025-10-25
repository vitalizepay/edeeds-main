import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, Download, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { documentTypes } from "./DocumentTypeSelector";
import jsPDF from "jspdf";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import { saveAs } from "file-saver";
import tamilFontBase64 from "@/fonts/NotoSansTamil-Regular.base64";

interface DocumentPreviewProps {
  selectedType: string | null;
  formData: Record<string, string>;
  language: "en" | "ta";
}

const monthYear = (lang: "en" | "ta") =>
  new Date().toLocaleDateString(lang === "ta" ? "ta-IN" : "en-US", {
    month: "long",
    year: "numeric",
  });

/* ========= PDF font helper (Tamil) ========= */
function ensureFont(doc: jsPDF, language: "en" | "ta") {
  if (language === "ta") {
    // @ts-ignore
    if (!(doc as any).__tamilFontLoaded) {
      doc.addFileToVFS("NotoSansTamil-Regular.ttf", tamilFontBase64);
      doc.addFont("NotoSansTamil-Regular.ttf", "NotoTamil", "normal");
      // @ts-ignore
      (doc as any).__tamilFontLoaded = true;
    }
    doc.setFont("NotoTamil", "normal");
  } else {
    doc.setFont("helvetica", "normal");
  }
}

/* ================= Important Heading / Label Detection ================= */
const HEADING_PATTERNS = {
  en: [
    /^THIS .* (executed|made).*/i,
    /^WHEREAS:?$/i,
    /^NOW,? THIS (DEED|AGREEMENT).*$/i,
    /^SCHEDULE.*:?$/i,
    /^SCHEDULE OF PROPERTY:$/i,
    /^FINAL RECIPIENT DETAILS:?$/i,
    /^WITNESSES:?$/i,
    /^SIGNED:?$/i,
    /^GOVERNING LAW:?$/i,
    /^CONSIDERATION:?$/i,
    /^TITLE ?& ?ENCUMBRANCES:?$/i,
    /^DELIVERY OF POSSESSION:?$/i,
    /^INDEMNITY:?$/i,
    /^TAXES ?& ?OUTGOINGS:?$/i,
    /^MUTATION:?$/i,
    /^TERM:?$/i,
    /^RENT( AND SECURITY DEPOSIT)?:?$/i,
    /^MAINTENANCE:?$/i,
    /^UTILITIES( AND MAINTENANCE)?:?$/i,
    /^ENTRY:?$/i,
    /^TERMINATION:?$/i,
    /^DISPUTE RESOLUTION.*:?$/i,
    /^PROPERTY:?$/i,
    /^PRICE:?$/i,
    /^COMPLETION:?$/i,
    /^POSSESSION:?$/i,
    /^DEFAULT:?$/i,
    /^REPRESENTATIONS:?$/i,
    /^APPOINTMENT OF EXECUTOR:?$/i,
    /^BEQUESTS:?$/i,
    /^RESIDUARY:?$/i,
    /^ASSETS:?$/i,
    /^DEBTS ?& ?EXPENSES:?$/i,
    /^INTERPRETATION:?$/i,
    /^SIGNING:?$/i,
  ],
  ta: [
    /^இந்த .* (செய்யப்பட்டது|அன்று).*$/u,
    /^இந்நாள் .*$/u,
    /^எனினும்:?$/u,
    /^இதனால்:?$/u,
    /^அட்டவணை.*:?$/u,
    /^இறுதி பெறுபவர்.*:?$/u,
    /^சாட்சிகள்.*:?$/u,
    /^கையெழுத்து.*:?$/u,
    /^நடைமுறை சட்டம்.*:?$/u,
    /^பரிசீலனை.*:?$/u,
    /^உரிமை.*:?$/u,
    /^பிடிப்பு.*:?$/u,
    /^பாதுகாப்பு.*:?$/u,
    /^வரி.*செலவுகள்.*:?$/u,
    /^காலம்:?$/u,
    /^வளாகம்:?$/u,
    /^வாடகை.*வைப்பு.*:?$/u,
    /^பராமரிப்பு:?$/u,
    /^பொதுசேவைகள்:?$/u,
    /^பார்வை:?$/u,
    /^முடிவு:?$/u,
  ],
};
function isHeadingLine(line: string, lang: "en" | "ta") {
  const t = (line || "").trim();
  if (!t) return false;
  if (HEADING_PATTERNS[lang].some((rx) => rx.test(t))) return true;
  if (lang === "en" && /^[A-Z0-9 ()'".,&\-\/]+:$/u.test(t)) return true; // ALL-CAPS with :
  return false;
}

/** NEW: detect numbered headings like “1. PURPOSE. …” (English) */
function extractNumberedHeading(line: string) {
  // 1. PURPOSE. Rest of sentence...
  const m = /^\s*(\d+)\.\s*([A-Z0-9 ()'’&/.\-]+?)\.\s+(.*)$/u.exec(line || "");
  if (!m) return null;
  const n = m[1];
  const title = m[2].trim();
  const rest = m[3] ?? "";
  return { prefix: `${n}. ${title}.`, rest };
}

/** Labels to bold when they appear before a colon on a line */
const BOLD_LABELS = {
  en: [
    "EXECUTANT",
    "RELEASEE",
    "LANDLORD",
    "TENANT",
    "DONOR",
    "DONEE",
    "PRINCIPAL",
    "ATTORNEY/AGENT",
    "SELLER",
    "BUYER",
    "SURVEY NO.",
    "PLOT NO.",
    "LAND AREA",
    "LOCATION",
    "PROPERTY DESCRIPTION",
    "NAME",
    "FATHER/HUSBAND",
    "PURPOSE",
    "CONFIDENTIAL INFORMATION",
    "EXCLUSIONS",
    "OBLIGATIONS",
    "TERM",
    "NO LICENSE",
    "REMEDIES",
    "GOVERNING LAW",
    "PROPERTY",
    "PRICE",
    "COMPLETION",
    "POSSESSION",
    "DEFAULT",
    "REPRESENTATIONS",
    "SIGNED",
    "WITNESSES",
  ],
  ta: [
    "நிறைவேற்றுபவர்",
    "விடுதலை பெறுபவர்",
    "வீட்டு உரிமையாளர்",
    "குத்தகைதாரர்",
    "வழங்குபவர்",
    "பெறுபவர்",
    "முதன்மை",
    "முகவர்",
    "விற்பனையாளர்",
    "வாங்குபவர்",
    "ஆய்வு எண்",
    "பிளாட் எண்",
    "பரப்பளவு",
    "இிடம்",
    "சொத்து விவரம்",
    "பெயர்",
    "தந்தை/கணவர்",
    "நோக்கம்",
    "ரகசிய தகவல்",
    "விலக்குகள்",
    "கடமைகள்",
    "காலம்",
    "சட்டம்",
    "சாட்சிகள்",
    "கையெழுத்து",
  ],
} as const;

function matchInlineLabel(line: string, lang: "en" | "ta") {
  const m = /^([\p{L}\p{N}\/&().' \-]+):\s*(.*)$/u.exec(line || "");
  if (!m) return null;
  const label = m[1].trim();
  const rest = m[2] ?? "";
  const list = BOLD_LABELS[lang].map((s) => s.toLowerCase());
  const isWanted =
    list.includes(label.toLowerCase()) ||
    (lang === "en" && /^[A-Z0-9 \/&().'-]+$/u.test(label));
  return isWanted ? { label, rest } : null;
}

/* =================== Bold values in Preview =================== */
function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function boldValuesInline(text: string, formData: Record<string, string>) {
  let nodes: (string | JSX.Element)[] = [text];
  for (const v of Object.values(formData)) {
    const val = (v ?? "").trim();
    if (!val) continue;
    const re = new RegExp(`(${escapeRegExp(val)})`, "gi");
    nodes = nodes.flatMap((part, idx) => {
      if (typeof part !== "string") return [part];
      const pieces = part.split(re);
      return pieces.map((p, i) =>
        i % 2 === 1 ? (
          <strong key={`${idx}-${i}`} className="font-bold">
            {p}
          </strong>
        ) : (
          p
        )
      );
    });
  }
  return nodes;
}

/* ============ FULL LEGAL TEMPLATES (EN + TA) ============ */
const generateDocumentContent = (
  typeId: string,
  d: Record<string, string>,
  language: "en" | "ta"
) => {
  const en = {
    "sale-deed": `
SALE DEED

THIS DEED OF ABSOLUTE SALE is made and executed on ${d.executionDate || "[Date]"} (${monthYear("en")}).

BETWEEN:
${d.vendorName || "[Vendor Name]"}, S/D/W of ${d.vendorFatherName || "[Father Name]"}, residing at ${d.vendorAddress || "[Vendor Address]"}
(hereinafter referred to as the "Vendor", which expression shall, unless repugnant to the context, include his/her heirs, successors, legal representatives and assigns) of the ONE PART;

AND

${d.purchaserName || "[Purchaser Name]"}, S/D/W of ${d.purchaserFatherName || "[Father Name]"}, residing at ${d.purchaserAddress || "[Purchaser Address]"}
(hereinafter referred to as the "Purchaser", which expression shall, unless repugnant to the context, include his/her heirs, successors, legal representatives and assigns) of the OTHER PART.

WHEREAS:
A. The Vendor is the sole, absolute and lawful owner and in peaceful possession of the immovable property described in the SCHEDULE hereunder written ("Property").
B. The Vendor has agreed to sell and the Purchaser has agreed to purchase the Property for a total sale consideration of INR ${d.saleAmount || "[Amount]"} /- (Rupees [in words]) free from all encumbrances.

NOW THIS DEED WITNESSETH as under:
1. CONSIDERATION: In consideration of the Purchaser paying the said sum of INR ${d.saleAmount || "[Amount]"}/-, the receipt whereof the Vendor hereby admits and acknowledges, the Vendor doth hereby grant, convey, transfer and assign unto the Purchaser the Property absolutely and forever.
2. TITLE & ENCUMBRANCES: The Vendor covenants that (i) he/she has good, clear and marketable title; (ii) the Property is free from all encumbrances, liens, charges, mortgages, agreements to sell, lis pendens, attachments and claims; and (iii) the Vendor has full right and authority to sell.
3. DELIVERY OF POSSESSION: Vacant and peaceful possession of the Property is this day delivered to the Purchaser together with the original title deeds, if any.
4. INDEMNITY: The Vendor shall indemnify and keep indemnified the Purchaser against any loss arising out of any defect in title or breach of the Vendor's covenants herein.
5. TAXES & OUTGOINGS: All municipal taxes, cesses and outgoings up to the date hereof shall be borne by the Vendor; thereafter by the Purchaser.
6. MUTATION: The Purchaser is entitled to get the Property mutated in his/her name in all public records and utility connections, and the Vendor shall execute necessary writings for such purposes.
7. GOVERNING LAW: This Deed shall be governed by the laws of India.

SCHEDULE OF PROPERTY:
All that piece and parcel of land/flat/house situated at ${d.propertyAddress || "[Property Address]"}, bearing Survey No. ${d.surveyNumber || "[Survey Number]"}, admeasuring ${d.propertyArea || "[Area in Sq.ft]"} square feet, together with all easements, appurtenances and hereditaments.

IN WITNESS WHEREOF the parties hereto have executed this Deed on the day, month and year first above written.

Vendor: ____________________________   (${d.vendorName || "Vendor"})
Purchaser: _________________________   (${d.purchaserName || "Purchaser"})

WITNESSES:
1) _______________________  2) _______________________
`.trim(),

    "rental-agreement": `
RENTAL AGREEMENT

THIS RENTAL AGREEMENT ("Agreement") is made on ${d.effectiveDate || "[Date]"} by and between:
Landlord: ${d.landlordName || "[Landlord Name]"}, ${d.landlordAddress || "[Address]"}
Tenant: ${d.tenantName || "[Tenant Name]"}, ${d.tenantAddress || "[Address]"}

1. TERM: The term shall commence on ${d.startDate || "________"} and end on ${d.endDate || "________"} (usually ${d.termDuration || "11 months"}).
2. PREMISES: ${d.propertyAddress || "[Premises Address]"} to be used solely for ${d.useType === "commercial" ? "commercial" : "residential"} purposes.
3. RENT: Monthly rent INR ${d.monthlyRent || "________"}/-, payable on or before the 1st of every month; first due on ${d.firstRentDue || "________"}; mode: ${
      d.paymentMethod
        ? d.paymentMethod === "bank_transfer"
          ? "Bank Transfer"
          : d.paymentMethod === "cheque"
          ? "Cheque"
          : d.paymentMethod === "cash"
          ? "Cash"
          : "Online"
        : "________"
    }.
4. SECURITY DEPOSIT: INR ${d.securityDeposit || "________"} refundable subject to deductions for damages and dues upon vacation.
5. MAINTENANCE: Tenant to keep premises in good order; Landlord to attend to structural repairs and common areas.
6. UTILITIES: Unless otherwise agreed in writing, utilities shall be borne by the ${
      d.utilitiesResponsibility === "tenant"
        ? "Tenant"
        : d.utilitiesResponsibility === "landlord"
        ? "Landlord"
        : "Tenant"
    } (including ${d.includedUtilities || "electricity, water, gas"}).
7. ENTRY: Landlord may enter with reasonable prior notice (normally ${d.entryNotice || "24 hours"}) for inspection/repairs.
8. TERMINATION: Either party may terminate by written notice ${d.noticePeriod || "30"} days in advance; material breach allows immediate termination.
9. DISPUTE RESOLUTION & LAW: Subject to arbitration/mediation as agreed, governed by the laws of ${d.governingLaw || "India"}.

SIGNED:
Tenant: ____________________    Landlord: ____________________

WITNESSES: 1) ____________________   2) ____________________
`.trim(),

    "relinquishment-deed": `
RELINQUISHMENT DEED

THIS DEED is executed on ${d.executionDate || "________"}.

EXECUTANT: ${d.executantName || "________________"}, S/D/W of ${d.executantFatherName || "________________"}, ${d.executantAddress || "________________"} ("Executant").
RELEASEE: ${d.releaseeName || "________________"}, Spouse: ${d.releaseeSpouseName || "________________"}, ${d.releaseeAddress || "________________"} ("Releasee").

WHEREAS:
A. ${d.deceasedName || "________________"} (S/D/W of ${d.deceasedFatherName || "________________"}) of ${d.deceasedAddress || "________________"} died on ${d.deathDate || "________"} leaving behind legal heirs including the Executant.
B. The property more fully described in the SCHEDULE is part of the estate of the deceased.
C. Out of natural love and affection and for good and valuable consideration, the Executant is desirous of relinquishing his/her share in favour of the Releasee.

NOW THIS DEED WITNESSETH:
1. RELEASE: The Executant hereby releases, relinquishes and quit-claims unto the Releasee all his/her rights, title, share and interest in the SCHEDULE Property, being the share described as ${d.sharePercentage || "[Share]"}.
2. EFFECT: Upon execution, the Executant shall have no claim over the SCHEDULE Property and the Releasee shall hold the same absolutely.
3. INDEMNITY: The Executant shall indemnify the Releasee against any claim made by any person through or under the Executant.
4. ORIGINAL REFERENCE: The parties refer to Gift Deed Document No. ${d.giftDeedNumber || "________"}, Book ${d.giftDeedBook || "____"}, Vol ${d.giftDeedVolume || "____"}, Pages ${d.giftDeedPages || "____"} (if applicable).

SCHEDULE (PROPERTY):
Survey No.: ${d.surveyNumber || "________"}; Plot No.: ${d.plotNumber || "________"}; Land Area: ${d.landArea || "________"}; Location: ${d.propertyLocation || "________"}.
Property Description: ${d.propertyDescription || "________"}.

FINAL RECIPIENT DETAILS:
Name: ${d.finalRecipientName || "________"}; Father/Husband: ${d.finalRecipientRelation || "________"}.

SIGNED:
EXECUTANT: _________________________    RELEASEE: _________________________

WITNESSES:
1) ${d.witness1Name || "____________"}   2) ${d.witness2Name || "____________"}
`.trim(),

    "nda": `
NON-DISCLOSURE AGREEMENT (Mutual)

This Agreement is entered into on ${d.effectiveDate || "[Date]"} ("Effective Date") by and between
${d.partyOneName || "[First Party]"} and ${d.partyTwoName || "[Second Party]"} (each a "Party" and together the "Parties").

1. PURPOSE. The Parties desire to exchange certain confidential information for ${d.purpose || "[Purpose]"} ("Purpose").
2. CONFIDENTIAL INFORMATION. "Confidential Information" means all non-public information disclosed by a Party, whether oral, visual or written, that is designated confidential or by its nature ought to be confidential, including technical, business, financial and personal data.
3. EXCLUSIONS. Confidential Information does not include information that is (a) already public without breach, (b) rightfully received from a third party without duty of confidentiality, (c) independently developed without use of the other Party’s information, or (d) required to be disclosed by law or court order (with prompt notice).
4. OBLIGATIONS. Each Receiving Party shall (a) use the Confidential Information solely for the Purpose, (b) restrict disclosure to its need-to-know personnel bound by obligations no less protective, and (c) protect the information using reasonable care.
5. TERM. This Agreement remains in effect for ${d.duration || "5"} years from the Effective Date; confidentiality obligations survive for ${d.duration || "5"} years after the last disclosure.
6. NO LICENSE. No rights are granted except as expressly stated.
7. REMEDIES. Breach may cause irreparable harm; injunctive relief and other remedies at law or equity are available.
8. GOVERNING LAW. This Agreement shall be governed by the laws of ${d.governingLaw || "India"}; courts having jurisdiction accordingly.

Signed:
${d.partyOneName || "First Party"}: _______________________
${d.partyTwoName || "Second Party"}: _______________________
`.trim(),

    "gift-deed": `
GIFT DEED

THIS DEED OF GIFT is executed on ${d.executionDate || "________"}.

DONOR: ${d.donorName || "________________"}, S/D/W of ${d.donorFatherName || "________________"}, residing at ${d.donorAddress || "________________"} ("Donor").
DONEE: ${d.doneeName || "________________"}, S/D/W of ${d.doneeFatherName || "________________"}, residing at ${d.doneeAddress || "________________"} ("Donee"). Relationship: ${d.relationship || "________"}.

WHEREAS:
A. The Donor is the absolute owner of the property set out in the SCHEDULE hereunder ("Property").
B. Out of natural love and affection and without any monetary consideration (/${d.consideration === "gratuitous" ? "pure gift" : "love & affection"}/), the Donor desires to gift the Property to the Donee.

NOW THIS DEED WITNESSETH:
1. GIFT: The Donor hereby voluntarily gifts, grants, transfers and conveys to the Donee the Property with all rights, easements and appurtenances, to hold absolutely and forever. The Donee hereby accepts the gift.
2. POSSESSION & TITLE: The Donor delivers, and the Donee accepts, peaceful possession of the Property. The Donor covenants that the Property is free from all encumbrances and that the Donor has full power to gift.
3. INDEMNITY: The Donor shall indemnify the Donee against claims arising through the Donor.
4. MUTATION: The Donee may get the Property mutated in his/her name; the Donor shall sign necessary writings.

SCHEDULE (PROPERTY):
${d.propertyAddress || "________________"}; Survey No. ${d.surveyNumber || "________"}; Area/Measurement ${d.landArea || "________"}.

IN WITNESS WHEREOF the Donor and Donee have executed this Deed.

SIGNED:
Donor: _______________________    Donee: _______________________

WITNESSES:
1) ${d.witness1Name || "____________"}   2) ${d.witness2Name || "____________"}
`.trim(),

    "will-agreement": `
LAST WILL AND TESTAMENT

I, ${d.testatorName || "________________"}, S/D/W of ${d.testatorFatherName || "________________"}, residing at ${d.testatorAddress || "________________"}, being of sound mind and disposing memory, hereby make this Will on ${d.executionDate || "________"} and revoke all prior Wills.

1. APPOINTMENT OF EXECUTOR. I appoint ${d.executorName || "________________"} as the Executor of this Will.
2. BEQUESTS. I bequeath the following:
   (a) To ${d.beneficiary1Name || "________________"}: ${d.beneficiary1Share || "________"}.
3. RESIDUARY. All the rest, residue and remainder of my estate (the "Estate") not otherwise disposed of is given to my lawful heirs as per law.
4. ASSETS. My assets include: ${d.assetsDescription || "________"}.
5. DEBTS & EXPENSES. My just debts, funeral and testamentary expenses shall be first paid out of the Estate.
6. INTERPRETATION. Headings for convenience; invalidity of any clause shall not affect the remainder.
7. SIGNING. I have signed this Will in the presence of the witnesses who, at my request and in my presence, have attested the same.

SIGNED by the Testator in our presence:

TESTATOR: ____________________________   (${d.testatorName || "Testator"})

WITNESSES (both present at the same time):
1) ${d.witness1Name || "____________"}  Signature: __________
2) ${d.witness2Name || "____________"}  Signature: __________
`.trim(),

    "power-of-attorney": `
POWER OF ATTORNEY

THIS POWER OF ATTORNEY is executed on ${d.executionDate || "________"}.

PRINCIPAL: ${d.principalName || "________________"}, ${d.principalAddress || "________________"} ("Principal").
ATTORNEY/AGENT: ${d.attorneyName || "________________"}, ${d.attorneyAddress || "________________"} ("Attorney").

WHEREAS the Principal desires to appoint the Attorney to act for and on behalf of the Principal in respect of matters described below.

NOW THIS INSTRUMENT WITNESSETH:
1. POWERS GRANTED. The Attorney is authorized to (illustrative):
   (a) sell, convey, lease, mortgage, exchange or otherwise deal with immovable property; 
   (b) execute and register deeds and documents; 
   (c) receive consideration, issue receipts and discharges; 
   (d) represent before government/revenue/registration authorities; 
   (e) operate bank accounts and sign instruments to the extent permitted by law; 
   (f) appoint agents/sub-attorneys as necessary.
   Specific scope: ${d.poaScope || "________"}.
2. NATURE. This Power is ${d.revocation === "irrevocable" ? "IRREVOCABLE (subject to law)" : "REVOCABLE at the Principal's discretion"}.
3. RATIFICATION & INDEMNITY. The Principal ratifies all lawful acts of the Attorney and agrees to indemnify the Attorney for acts done in good faith.
4. REVOCATION. Subject to clause 2, the Principal may revoke by written notice and registration as applicable.

SIGNED:
Principal: _____________________    Attorney: _____________________

WITNESSES:
1) ${d.witness1Name || "____________"}   2) ${d.witness2Name || "____________"}
`.trim(),

    "agreement-to-sell": `
AGREEMENT TO SELL

This Agreement is made on ${d.agreementDate || "________"} between:
Seller: ${d.sellerName || "________________"}, ${d.sellerAddress || "________________"} ("Seller");
Buyer: ${d.buyerName || "________________"}, ${d.buyerAddress || "________________"} ("Buyer").

1. PROPERTY. ${d.propertyAddress || "________________"}; Survey No. ${d.surveyNumber || "________"}; Area ${d.landArea || "________"} ("Property").
2. PRICE. Total consideration INR ${d.totalPrice || "________"}/-. Buyer has paid advance/earnest INR ${d.advancePaid || "________"}; balance payable on ${d.balanceDueDate || "________"}.
3. TITLE & ENCUMBRANCES. Seller represents good and marketable title; Property is free from encumbrances.
4. COMPLETION. Sale deed to be executed and registered by ${d.completionDate || "________"} subject to Buyer paying balance and Seller handing over documents and possession.
5. POSSESSION. Possession to be delivered on execution/registration unless otherwise agreed.
6. DEFAULT. If Buyer defaults, advance may be forfeited; if Seller defaults, Buyer may seek refund with damages/specific performance.
7. REPRESENTATIONS. Each party has full capacity and authority to execute.
8. DISPUTE RESOLUTION & LAW. Subject to specific performance in competent courts; governed by the laws of India.

SIGNED:
Seller: _______________________   Buyer: _______________________

WITNESSES:
1) ${d.witness1Name || "____________"}   2) ${d.witness2Name || "____________"}
`.trim(),

    "partition-deed": `
PARTITION DEED

This Deed is executed on ${d.executionDate || "________"} by the co-parceners whose names appear below ("Parties").

CO-PARCENERS: ${d.coparceners || "A, B, C"}.

WHEREAS the Parties are joint owners/co-parceners of the joint family property more fully described in the SCHEDULE; and
WHEREAS the Parties desire to effect a complete partition by metes and bounds and to take their respective shares separately.

NOW THIS DEED WITNESSETH:
1. DIVISION. The joint property described in the SCHEDULE is partitioned and allotted in the shares set out herein (${d.shareMatrix || "e.g., A-40%, B-30%, C-30%"}). Each Party shall henceforth hold his/her share absolutely.
2. POSSESSION. Each Party is put in separate possession of the portion allotted to him/her; no Party shall claim any right over the other's share.
3. MUTATION. Parties shall apply to competent authorities for mutation and separate assessments; they shall cooperate and execute writings.
4. ENCUMBRANCES. Each Party declares his/her share is free from encumbrances unless expressly recorded.
5. INDEMNITY. Each Party shall indemnify others against claims arising through him/her.
6. DISPUTE RESOLUTION & LAW. Governed by the laws of India; subject to jurisdiction of competent courts.

SCHEDULE (JOINT PROPERTY):
${d.familyPropertyDesc || "________"}

SIGNED:

WITNESSES:
1) ${d.witness1Name || "____________"}   2) ${d.witness2Name || "____________"}
`.trim(),

    "general-power-of-authority": `
GENERAL POWER OF ATTORNEY

This General Power of Attorney is executed on ${d.executionDate || "________"}.

PRINCIPAL: ${d.principalName || "________________"}, ${d.principalAddress || "________________"} ("Principal").
ATTORNEY: ${d.attorneyName || "________________"}, ${d.attorneyAddress || "________________"} ("Attorney").

WHEREAS the Principal desires to appoint the Attorney to act for and on behalf of the Principal in all matters generally.

NOW THIS INSTRUMENT WITNESSETH:
1. POWERS GRANTED. The Attorney is authorized to do all acts and things necessary for the management and protection of the Principal's affairs, including but not limited to:
   (a) Manage and operate bank accounts, receive payments, and issue receipts.
   (b) Buy, sell, lease, mortgage, or otherwise deal with property.
   (c) Execute contracts, agreements, and legal documents.
   (d) Represent the Principal before government authorities and courts.
   (e) Collect debts, rents, and other monies due to the Principal.
   (f) Pay bills, taxes, and other obligations.
2. NATURE. This Power is general and irrevocable unless otherwise specified.
3. RATIFICATION. The Principal ratifies all lawful acts of the Attorney.
4. REVOCATION. This Power may be revoked by written notice from the Principal.

SIGNED:
Principal: _____________________    Attorney: _____________________

WITNESSES:
1) ${d.witness1Name || "____________"}   2) ${d.witness2Name || "____________"}
`.trim(),

    "builder-buyer-agreement": `
BUILDER BUYER AGREEMENT

This Agreement is made on ${d.agreementDate || "________"} between:
Builder: ${d.builderName || "________________"}, ${d.builderAddress || "________________"} ("Builder").
Buyer: ${d.buyerName || "________________"}, ${d.buyerAddress || "________________"} ("Buyer").

1. PROJECT. The Builder agrees to construct and deliver ${d.projectDescription || "________"} ("Project") at ${d.projectLocation || "________"}.
2. UNIT. Buyer agrees to purchase Unit No. ${d.unitNumber || "________"} in the Project, measuring ${d.unitArea || "________"} sq.ft., for a total consideration of INR ${d.totalPrice || "________"}/-.
3. PAYMENT SCHEDULE. Buyer shall pay as follows: ${d.paymentSchedule || "________"}.
4. COMPLETION. The Project shall be completed by ${d.completionDate || "________"}. Builder shall provide occupation certificate and necessary approvals.
5. POSSESSION. Possession shall be handed over upon full payment and completion.
6. DELAYS. In case of delay beyond ${d.delayPeriod || "________"} days, Buyer shall be entitled to compensation at the rate of INR ${d.delayCompensation || "________"} per day.
7. DEFAULT. If Buyer defaults, Builder may forfeit earnest money; if Builder defaults, Buyer may seek specific performance or refund with interest.
8. FORCE MAJEURE. Parties shall not be liable for delays due to unforeseen circumstances.
9. LAW. Governed by the laws of India.

SIGNED:
Builder: _______________________   Buyer: _______________________

WITNESSES:
1) ${d.witness1Name || "____________"}   2) ${d.witness2Name || "____________"}
`.trim(),

    "mutation-legal-document": `
MUTATION LEGAL DOCUMENT

This Mutation Document is executed on ${d.executionDate || "________"}.

APPLICANT: ${d.applicantName || "________________"}, ${d.applicantAddress || "________________"} ("Applicant").
AUTHORITY: ${d.authorityName || "________________"}, ${d.authorityAddress || "________________"} ("Authority").

WHEREAS the Applicant is the rightful owner of the property described in the SCHEDULE.
WHEREAS the Applicant seeks mutation of the property in his/her name in the revenue records.

NOW THIS DOCUMENT WITNESSETH:
1. APPLICATION. The Applicant hereby applies for mutation of the property in his/her name.
2. DETAILS. The property is located at ${d.propertyAddress || "________"}, Survey No. ${d.surveyNumber || "________"}, measuring ${d.propertyArea || "________"} sq.ft.
3. DOCUMENTS SUBMITTED. The Applicant submits the following documents: ${d.submittedDocuments || "________"}.
4. APPROVAL. The Authority approves the mutation subject to verification of documents and payment of fees.
5. EFFECT. Upon mutation, the property shall be recorded in the name of the Applicant.
6. FEES. Mutation fees amounting to INR ${d.mutationFees || "________"}/- shall be paid.
7. LAW. Governed by the relevant state revenue laws.

SIGNED:
Applicant: _____________________    Authority: _____________________

WITNESSES:
1) ${d.witness1Name || "____________"}   2) ${d.witness2Name || "____________"}
`.trim(),


  };

  const ta = {
    /* Tamil templates with escaped $ to prevent template literal interpolation */
    "sale-deed": `
விற்பனை பத்திரம்

இந்த முழு விற்பனை பத்திரம் ${d.executionDate || "[தேதி]"} (${monthYear("ta")}) அன்று செய்யப்படுகிறது.

இடையே:
விற்பனையாளர்: ${d.vendorName || "[விற்பனையாளர்]"}, ${d.vendorFatherName || "[தந்தை பெயர்]"} அவர்களின் மகன்/மகள், முகவரி: ${d.vendorAddress || "[முகவரி]"}.
வாங்குபவர்: ${d.purchaserName || "[வாங்குபவர்]"}, ${d.purchaserFatherName || "[தந்தை பெயர்]"} அவர்களின் மகன்/மகள், முகவரி: ${d.purchaserAddress || "[முகவரி]"}.

எனினும்:
அ) கீழே உள்ள அட்டவணைச் சொத்தின் முழு உரிமை மற்றும் பிடிப்பு விற்பனையாளருக்கே உண்டு.
ஆ) ரூ. ${d.saleAmount || "[தொகை]"}/- மொத்த விற்பனை மதிப்பிற்கு, சொத்தை விற்பனை செய்ய விற்பனையாளர் மற்றும் வாங்க ஒப்புக்கொண்டார்/ஒப்புக்கொண்டார்.

இதனால்:
1. பரிசீலனை: வாங்குபவர் ரூ. ${d.saleAmount || "[தொகை]"}/- செலுத்தியதன் பேரில், விற்பனையாளர் மேலே குறிப்பிட்ட சொத்தை வாங்குபவருக்கு நிரந்தரமாக மாற்றுகிறார்.
2. உரிமை & சுமைகள்: சொத்துக்கு விற்பனையாளருக்கு நல்ல, சந்தையில் விற்கக்கூடிய உரிமை உண்டு; எந்தப் பிணையமோ தடைமோ இல்லை.
3. பிடிப்பு: சொத்து மற்றும் தொடர்பான அசல் ஆவணங்கள் இன்று வாங்குபவருக்கு ஒப்படைக்கப்படுகின்றன.
4. பாதுகாப்பு: தலைப்பு குறைபாடுகள் ஏதும் இருப்பின், விற்பனையாளர் இழப்பீடு அளிப்பார்.
5. வரி & செலவுகள்: இத்தேதிவரை விற்பனையாளர்; பின்னர் வாங்குபவர்.
6. பெயர்மாற்றம்: அனைத்து பதிவுகளிலும் வாங்குபவர் பெயர்மாற்றம் மேற்கொள்ளலாம்; விற்பனையாளர் உதவிசெய்வார்.
7. நடைமுறை சட்டம்: இந்திய சட்டம்.

அட்டவணை (SCHEDULE):
${d.propertyAddress || "[சொத்து முகவரி]"}, ஆய்வு எண் ${d.surveyNumber || "[ஆய்வு எண்]"}, பரப்பளவு ${d.propertyArea || "[பரப்பளவு]"} சதுரஅடி.

கையெழுத்து:
விற்பனையாளர்: ____________________   வாங்குபவர்: ____________________
சாட்சிகள்: 1) __________________  2) __________________
`.trim(),
    "rental-agreement": `
வாடகை ஒப்பந்தம்

இந்த ஒப்பந்தம் ${d.effectiveDate || "[தேதி]"} அன்று செய்யப்பட்டது.
வீட்டு உரிமையாளர்: ${d.landlordName || "[பெயர்]"}, ${d.landlordAddress || "[முகவரி]"}
குத்தகைதாரர்: ${d.tenantName || "[பெயர்]"}, ${d.tenantAddress || "[முகவரி]"}

1. காலம்: ${d.startDate || "________"} முதல் ${d.endDate || "________"} வரை (${d.termDuration || "11 மாதங்கள்"}).
2. வளாகம்: ${d.propertyAddress || "[முகவரி]"}; பயன்பாடு: ${d.useType === "commercial" ? "வணிக" : "குடியிருப்பு"}.
3. வாடகை: ரூ. ${d.monthlyRent || "________"}/-; முதல் கட்டணம் ${d.firstRentDue || "________"}; முறை: ${
      d.paymentMethod
        ? d.paymentMethod === "bank_transfer"
          ? "வங்கி பரிமாற்றம்"
          : d.paymentMethod === "cheque"
          ? "காசோலை"
          : d.paymentMethod === "cash"
          ? "ரொக்கம்"
          : "ஆன்லைன்"
        : "________"
    }.
4. பாதுகாப்பு வைப்பு: ரூ. ${d.securityDeposit || "________"}/- (தகுந்த கழிவுகளுக்கு பின் திருப்பு).
5. பராமரிப்பு: குத்தகைதாரர் வளாகத்தை பராமரிக்க வேண்டும்; கட்டடத்தின் முக்கிய பழுது/பொது பகுதிகள் உரிமையாளர்.
6. பொதுசேவைகள்: இயல்பு முறையில் ${d.utilitiesResponsibility === "லாந்த்லார்ட்" ? "உரிமையாளர்" : "குத்தகைதாரர்"} செலுத்த வேண்டும் (${d.includedUtilities || "மின்சாரம், நீர், எரிவாயு"}).
7. பார்வை: ${d.entryNotice || "24 மணி"} முன் அறிவிப்புடன் உரிமையாளர் நுழையலாம்.
8. முடிவு: ${d.noticePeriod || "30"} நாள் எழுத்து அறிவிப்புடன்; கடுமையான ஒழுங்கு மீறலில் உடனடி முடிவு.
9. சட்டம்: ${d.governingLaw || "இந்தியா"} சட்டங்கள்.

கையெழுத்து:
குத்தகைதாரர்: _____________  வீட்டு உரிமையாளர்: _____________
சாட்சிகள்: 1) __________  2) __________
`.trim(),
    "relinquishment-deed": `
துறப்பு பத்திரம்

${d.executionDate || "________"} அன்று.

நிறைவேற்றுபவர்: ${d.executantName || "________________"}, ${d.executantFatherName || "________________"} அவர்களின் மகன்/மகள், ${d.executantAddress || "________________"}.
விடுதலை பெறுபவர்: ${d.releaseeName || "________________"}, மனைவி/கணவர்: ${d.releaseeSpouseName || "________________"}, ${d.releaseeAddress || "________________"}.

எனினும்:
அ) ${d.deceasedName || "________________"} (${d.deceasedFatherName || "________________"} அவர்களின் மகன்/மகள்), ${d.deceasedAddress || "________________"}; இறப்பு தேதி ${d.deathDate || "________"}.
ஆ) கீழுள்ள அட்டவணைச் சொத்தில் நிறைவேற்றுபவருக்கு பங்கு உண்டு.
இ) இயற்கை காதல்/பாசம் காரணமாக நிறைவேற்றுபவர் தம் பங்கினை விடுதலை பெறுபவருக்கு துறக்க விரும்புகிறார்.

இதனால்:
1. துறப்பு: நிறைவேற்றுபவர் ${d.sharePercentage || "[பங்கு]"} அளவிலான தம் உரிமைகள் அனைத்தையும் விடுதலை பெறுபவருக்கு நிரந்தரமாக துறக்கிறார்.
2. விளைவு: இப்பொது முதல் நிறைவேற்றுபவருக்கு எந்த உரிமையும் இல்லை; விடுதலை பெறுபவர் முழு உரிமையுடன் வைத்திருப்பார்.
3. பாதுகாப்பு: நிறைவேற்றுபவர் மூலமாக எழும் கோரிக்கைகளுக்கு இழப்பீடு வழங்குவர்.
4. குறிப்பு: பரிசு பத்திரம் ஆவண எண் ${d.giftDeedNumber || "____"}, புத்தகம் ${d.giftDeedBook || "____"}, தொகுதி ${d.giftDeedVolume || "____"}, பக்கங்கள் ${d.giftDeedPages || "____"}.

அட்டவணை (சொத்து):
ஆய்வு எண் ${d.surveyNumber || "____"}, பிளாட் எண் ${d.plotNumber || "____"}, பரப்பளவு ${d.landArea || "____"}, இடம் ${d.propertyLocation || "____"}.
சொத்து விவரம்: ${d.propertyDescription || "________"}.

இறுதி பெறுபவர்:
பெயர்: ${d.finalRecipientName || "________"}; தந்தை/கணவர்: ${d.finalRecipientRelation || "________"}.

கையெழுத்து:
நிறைவேற்றுபவர்: ____________   விடுதலை பெறுபவர்: ____________

சாட்சிகள்:
1) ${d.witness1Name || "____________"}   2) ${d.witness2Name || "____________"}
`.trim(),
    "nda": `
ரகசியத்தன்மை ஒப்பந்தம் (இருதரப்பு)

இந்நாள் ${d.effectiveDate || "[தேதி]"} ("நடைமுறை தேதி") அன்று,
${d.partyOneName || "[முதல் தரப்பு]"} மற்றும் ${d.partyTwoName || "[இரண்டாம் தரப்பு]"} (மொத்தமாக "தரப்பினர்").

1. நோக்கம்: ${d.purpose || "[நோக்கம்]"} தொடர்பாக ரகசியத் தகவல்கள் பரிமாறுதல்.
2. ரகசிய தகவல்: எழுத்து/வாய்மொழி/காட்சி வடிவில் வெளிப்படுத்தப்படும் எல்லா மறைதகவல்களும்.
3. விலக்குகள்: பொதுவெளியில் உள்ளவை; மூன்றாம் தரப்பிடம் இருந்து சட்டப்படி கிடைப்பவை; சுயமாக உருவாக்கப்பட்டவை; சட்டப் பறிமுதல்.
4. கடமைகள்: (a) குறிக்கப்பட்ட நோக்கத்திற்கே பயன்படுத்துதல்; (b) தேவையுள்ளவர்களுக்கு மட்டும் வெளிப்படுத்துதல்; (c) நியாயமான பாதுகாப்பு.
5. காலம்: ${d.duration || "5"} ஆண்டு; இரகசிய கடமைகள் கடைசித் தகவல் வெளியீட்டிற்கு பிறகும் தொடர்ந்து பொருந்தும்.
6. உரிமை இல்லை: இங்கு வெளிப்படையாக வழங்கப்பட்டதைத் தவிர பிற உரிமைகள் இல்லை.
7. நிவாரணம்: மீறல் ஏற்பட்டால் தடையுத்தரவு உள்ளிட்ட நிவாரணங்கள் கிடைக்கும்.
8. சட்டம்: ${d.governingLaw || "இந்தியா"} சட்டம்.

கையெழுத்து:
${d.partyOneName || "முதல் தரப்பு"}: _____________
${d.partyTwoName || "இரண்டாம் தரப்பு"}: _____________
`.trim(),
    "gift-deed": `
பரிசு பத்திரம்

${d.executionDate || "________"} அன்று செய்யப்பட்டது.

வழங்குபவர்: ${d.donorName || "________________"}, ${d.donorFatherName || "________________"} அவர்களின் மகன்/மகள், ${d.donorAddress || "________________"}.
பெறுபவர்: ${d.doneeName || "________________"}, ${d.doneeFatherName || "________________"} அவர்களின் மகன்/மகள், ${d.doneeAddress || "________________"}. உறவு: ${d.relationship || "________"}.

எனினும்:
அ) அட்டவணைச் சொத்தின் முழு உரிமை வழங்குபவருக்கே உண்டு.
ஆ) இயற்கை காதல்/பாசத்தால் (மொத்தத்தில் ${d.consideration === "gratuitous" ? "பரிசீலனை இன்றி" : "காதல்/பாசம் அடிப்படையில்"}) வழங்க விரும்புகிறார்.

இதனால்:
1. வழங்கல்: மேலே குறிப்பிட்ட சொத்தினை பெறுபவருக்கு முழுமையாக பரிசாக வழங்குகிறார்; பெறுபவர் ஏற்றுக்கொள்கிறார்.
2. பிடிப்பு & உரிமை: அமைதியான பிடிப்பு இன்று வழங்கப்படுகிறது; எந்த சுமையும் இல்லை என வழங்குபவர் உறுதி செய்கிறார்.
3. பாதுகாப்பு: வழங்குபவர் மூலமாக எழும் கோரிக்கைகளுக்கு இழப்பீடு.
4. பெயர்மாற்றம்: பெறுபவர் பெயர்மாற்றம்/பதிவு மேற்கொள்ளலாம்; வழங்குபவர் உதவிசெய்வார்.

அட்டவணை:
${d.propertyAddress || "________________"}; ஆய்வு எண் ${d.surveyNumber || "________"}; பரப்பளவு ${d.landArea || "________"}.

கையெழுத்து:
வழங்குபவர்: ___________  பெறுபவர்: ___________

சாட்சிகள்:
1) ${d.witness1Name || "____________"}   2) ${d.witness2Name || "____________"}
`.trim(),
    "will-agreement": `
இறுதி உத்தரவு

நான், ${d.testatorName || "________________"}, ${d.testatorFatherName || "________________"} அவர்களின் மகன்/மகள், ${d.testatorAddress || "________________"}, நல்ல நினைவாற்றல் உடையவன்/உடையவள், ${d.executionDate || "________"} அன்று இவ்வுத்தரவை செய்கிறேன்; இதற்கு முன் செய்த அனைத்தையும் ரத்து செய்கிறேன்.

1. செயலாக்குநர்: ${d.executorName || "________________"} அவர்களை நியமிக்கிறேன்.
2. வழங்குகள்: 
   (அ) ${d.beneficiary1Name || "________________"} — ${d.beneficiary1Share || "________"}.
3. மீதமுள்ள சொத்து: சட்டப்படி எனது வாரிசுகளுக்கு செல்லும்.
4. சொத்துகள்: ${d.assetsDescription || "________"}.
5. கடன்கள்: இறுதி சடங்குகள்/செலவுகள் முதலில் செலுத்தப்பட வேண்டும்.
6. விளக்கம்: எந்த விதியும் செல்லாது எனத் தீர்ப்பளிக்கப்பட்டால், மற்ற விதிகள் தொடரும்.
7. சாட்சி: ஒன்றாக இருந்து நான் கையெழுத்திடும் போது சாட்சிகள் கையெழுத்திட்டனர்.

கையெழுத்து:
உத்தரவையாளர்: ______________________

சாட்சிகள்:
1) ${d.witness1Name || "____________"} கையொ: ______
2) ${d.witness2Name || "____________"} கையொ: ______
`.trim(),
    "power-of-attorney": `
அமைச்சர்சீட்டு (Power of Attorney)

${d.executionDate || "________"}.

முதன்மை: ${d.principalName || "________________"}, முகவரி: ${d.principalAddress || "________________"}.
அமைச்சர்/முகவர்: ${d.attorneyName || "________________"}, முகவரி: ${d.attorneyAddress || "________________"}.

இதனால்:
1. அதிகாரங்கள்: (அ) விற்பனை/குத்தகை/பிணை/பதிவு; (ஆ) ஆவணங்கள் கையொப்பமிடல்-பதிவு; (இ) தொகை பெறுதல்-ரசீது; (ஈ) அரசு/வருவாய்/பதிவு அலுவலகங்கள் முன் பிரதிநிதித்துவம்; (உ) வங்கி கணக்கு செயல்படுத்தல்; (ஊ) துணை முகவர் நியமனம்; குறிப்பிட்ட வரம்பு: ${d.poaScope || "________"}.
2. தன்மை: இந்த அதிகாரப்பத்திரம் ${d.revocation === "irrevocable" ? "ரத்து செய்ய இயலாதது" : "ரத்து செய்யக்கூடியது"}.
3. உறுதிப்படுத்தல்/பாதுகாப்பு: நல்ல நம்பிக்கையில் செய்யப்பட்ட செய்கைகளுக்கான பாதுகாப்பு.
4. ரத்து: சட்டப்படி எழுத்துப்பூர்வமாக ரத்து செய்யலாம்.

கையெழுத்து:
முதன்மை: _____________  அமைச்சர்: _____________

சாட்சிகள்:
1) ${d.witness1Name || "____________"}   2) ${d.witness2Name || "____________"}
`.trim(),
    "agreement-to-sell": `
விற்பனைக்கு ஒப்பந்தம்

${d.agreementDate || "________"}.

விற்பனையாளர்: ${d.sellerName || "________________"}, ${d.sellerAddress || "________________"}.
வாங்குபவர்: ${d.buyerName || "________________"}, ${d.buyerAddress || "________________"}.

1. சொத்து: ${d.propertyAddress || "________________"}; ஆய்வு எண் ${d.surveyNumber || "________"}; பரப்பளவு ${d.landArea || "________"}.
2. விலை: ரூ. ${d.totalPrice || "________"}; முன்பணம் ரூ. ${d.advancePaid || "________"}; இருப்புத் தொகை ${d.balanceDueDate || "________"} அன்று.
3. உரிமை: சொத்து எந்த சுமையுமின்றி; விற்பனைக்குத் தகுந்த உரிமை.
4. நிறைவு: ${d.completionDate || "________"}க்குள் விற்பனைப் பத்திரம் பதிவு; ஆவணங்கள் ஒப்படைப்பு.
5. பிடிப்பு: பதிவு/ஒப்படைப்பு நேரத்தில்.
6. தவறு: வாங்குபவர் தவறினால் முன்பணம் பறிமுதல்; விற்பனையாளர் தவறினால் பணம் திருப்பி/சிறப்பான செயல்திறன் கோரலாம்.
7. சட்டம்: இந்திய சட்டம்; தகுதியுள்ள நீதிமன்றங்கள்.

கையெழுத்து:

சாட்சிகள்:
1) ${d.witness1Name || "____________"}   2) ${d.witness2Name || "____________"}
`.trim(),
    "partition-deed": `
பகிர்வு பத்திரம்

${d.executionDate || "________"} அன்று கூட்டு பங்குதாரர்கள் ("தரப்பினர்") இத்தினை செய்தனர்.

கூட்டு பங்குதாரர்கள்: ${d.coparceners || "A, B, C"}.

எனினும்: தரப்பினரின் கூட்டு/குடும்பச் சொத்து கீழே உள்ள அட்டவணையில் விவரிக்கப்பட்டுள்ளது; முழுமையான பகிர்வு மேற்கொள்ள விரும்புகின்றனர்.

இதனால்:
1. பிரிப்பு: அட்டவணைச் சொத்து ${d.shareMatrix || "எ.கா., A-40%, B-30%, C-30%"} என்ற விகிதத்தில் பிரிக்கப்படுகிறது; ஒவ்வொருவரும் தமக்குக் கிடைத்த பங்கினை தனியாக வைத்திருப்பர்.
2. பிடிப்பு: ஒவ்வொருவரும் தமக்குக் கிடைத்த பகுதியின் தனிப்பிடிப்பைப் பெறுவர்.
3. பெயர்மாற்றம்: தேவையான அதிகாரிகளிடம் பெயர்மாற்றம்/வரிவிதிப்பு பிரித்தல்.
4. பாதுகாப்பு: ஒவ்வொருவரும் தமதூடாக எழும் கோரிக்கைகளுக்கு மற்றவர்களை பாதுகாப்பர்.
5. சட்டம்: இந்திய சட்டம்; தகுதியுள்ள நீதிமன்றங்கள்.

அட்டவணை (கூட்டு சொத்து):
${d.familyPropertyDesc || "________"}

கையெழுத்து:

சாட்சிகள்:
1) ${d.witness1Name || "____________"}   2) ${d.witness2Name || "____________"}
`.trim(),

    "general-power-of-authority": `
பொதுவான அதிகாரப் பத்திரம்

${d.executionDate || "________"} அன்று செய்யப்பட்டது.

முதன்மை: ${d.principalName || "________________"}, முகவரி: ${d.principalAddress || "________________"}.
முகவர்: ${d.attorneyName || "________________"}, முகவரி: ${d.attorneyAddress || "________________"}.

எனினும்: முதன்மை தம் அனைத்து விவகாரங்களிலும் முகவரை நியமிக்க விரும்புகிறார்.

இதனால்:
1. வழங்கப்பட்ட அதிகாரங்கள்: முகவருக்கு முதன்மையின் விவகாரங்களை நிர்வகிப்பதற்கும் பாதுகாப்பதற்கும் தேவையான அனைத்து செயல்களும் அதிகாரங்கள் வழங்கப்படுகின்றன, குறிப்பாக:
   (அ) வங்கி கணக்குகளை நிர்வகித்தல் மற்றும் செயல்படுத்துதல், தொகைகளைப் பெறுதல் மற்றும் ரசீது வழங்குதல்.
   (ஆ) சொத்துகளை விற்பனை செய்தல், குத்தகை செய்தல், பிணை செய்தல் அல்லது பிற முறையில் கையாளுதல்.
   (இ) ஒப்பந்தங்கள், ஒப்பந்தங்கள் மற்றும் சட்ட ஆவணங்களை செயல்படுத்துதல்.
   (ஈ) அரசு அதிகாரிகள் மற்றும் நீதிமன்றங்களுக்கு முன் முதன்மையைப் பிரதிநிதித்துவப்படுத்துதல்.
   (உ) முதன்மைக்கு உரிய கடன்கள், வாடகைகள் மற்றும் பிற தொகைகளை வசூலித்தல்.
   (ஊ) முதன்மையின் கடமைகள் மற்றும் பிற கடமைகளை செலுத்துதல்.
2. தன்மை: இந்த அதிகாரப்பத்திரம் பொதுவானது மற்றும் ரத்து செய்ய இயலாதது.
3. ஒப்புதல்: முதன்மை முகவரின் அனைத்து சட்டப்பூர்வ செயல்களையும் ஒப்புக்கொள்கிறார்.
4. ரத்து: இந்த அதிகாரப்பத்திரத்தை எழுத்துப்பூர்வமாக ரத்து செய்யலாம்.

கையெழுத்து:
முதன்மை: _____________  முகவர்: _____________

சாட்சிகள்:
1) ${d.witness1Name || "____________"}   2) ${d.witness2Name || "____________"}
`.trim(),

    "builder-buyer-agreement": `
கட்டிடக்காரர் வாங்குபவர் ஒப்பந்தம்

${d.agreementDate || "________"} அன்று செய்யப்பட்டது.

கட்டிடக்காரர்: ${d.builderName || "________________"}, முகவரி: ${d.builderAddress || "________________"}.
வாங்குபவர்: ${d.buyerName || "________________"}, முகவரி: ${d.buyerAddress || "________________"}.

1. திட்டம்: கட்டிடக்காரர் ${d.projectDescription || "________"} ("திட்டம்") என்ற திட்டத்தை ${d.projectLocation || "________"} இல் கட்டி முடித்து ஒப்படைக்க ஒப்புக்கொள்கிறார்.
2. அலகு: வாங்குபவர் திட்டத்தில் ${d.unitNumber || "________"} என்ற அலகை வாங்க ஒப்புக்கொள்கிறார், இது ${d.unitArea || "________"} சதுர அடி அளவு கொண்டது, மொத்த மதிப்பு ரூ. ${d.totalPrice || "________"}/-.
3. கட்டண அட்டவணை: வாங்குபவர் பின்வரும் வகையில் கட்டணம் செலுத்த வேண்டும்: ${d.paymentSchedule || "________"}.
4. நிறைவு: திட்டம் ${d.completionDate || "________"} அன்று நிறைவடையும். கட்டிடக்காரர் ஆக்கிரமிப்பு சான்றிதழ் மற்றும் தேவையான அனுமதிகளை வழங்குவார்.
5. பிடிப்பு: முழு கட்டணம் மற்றும் நிறைவு நிலையில் பிடிப்பு ஒப்படைக்கப்படும்.
6. தாமதம்: நிறைவில் ${d.delayPeriod || "________"} நாள் தாமதம் ஏற்பட்டால், வாங்குபவருக்கு ரூ. ${d.delayCompensation || "________"}/- ஒரு நாளுக்கு இழப்பீடு வழங்கப்படும்.
7. தவறு: வாங்குபவர் தவறினால், கட்டிடக்காரர் முன்பணத்தைப் பறிமுதல் செய்யலாம்; கட்டிடக்காரர் தவறினால், வாங்குபவர் சிறப்பான செயல்திறன் அல்லது வட்டியுடன் பணத்தைத் திருப்பி கோரலாம்.
8. இயற்கை பேரழிவு: எதிர்பாராத சம்பவங்கள் காரணமாக தாமதம் ஏற்பட்டால் எந்த தரப்பும் பொறுப்பல்ல.
9. சட்டம்: இந்திய சட்டங்கள் இதற்கு பொருந்தும்.

கையெழுத்து:
கட்டிடக்காரர்: _____________  வாங்குபவர்: _____________

சாட்சிகள்:
1) ${d.witness1Name || "____________"}   2) ${d.witness2Name || "____________"}
`.trim(),

    "mutation-legal-document": (
"மாற்றம் சட்ட ஆவணம்\n" +
(d.executionDate || "________") + " அன்று செய்யப்பட்டது.\n" +
"விண்ணப்பதாரர்: " + (d.applicantName || "________________") + ", முகவரி: " + (d.applicantAddress || "________________") + ".\n" +
"அதிகாரி: " + (d.authorityName || "________________") + ", முகவரி: " + (d.authorityAddress || "________________") + ".\n" +
"எனினும்: விண்ணப்பதாரர் அட்டவணையில் விவரிக்கப்பட்ட சொத்தின் சட்டப்பூர்வ உரிமையாளர்.\n" +
"எனினும்: விண்ணப்பதாரர் தம் பெயரில் வருவாய் பதிவுகளில் சொத்தை மாற்றம் செய்ய விரும்புகிறார்.\n" +
"இதனால்:\n" +
"1. விண்ணப்பம்: விண்ணப்பதாரர் தம் பெயரில் சொத்தை மாற்றம் செய்ய விண்ணப்பிக்கிறார்.\n" +
"2. விவரங்கள்: சொத்து " + (d.propertyAddress || "________") + " இல் அமைந்துள்ளது, ஆய்வு எண் " + (d.surveyNumber || "________") + ", " + (d.propertyArea || "________") + " சதுர அடி அளவு கொண்டது.\n" +
"3. சமர்ப்பிக்கப்பட்ட ஆவணங்கள்: விண்ணப்பதாரர் பின்வரும் ஆவணங்களை சமர்ப்பிக்கிறார்: " + (d.submittedDocuments || "________") + ".\n" +
"4. ஒப்புதல்: ஆவணங்கள் சரிபார்க்கப்பட்டு கட்டணம் செலுத்தப்பட்ட பிறகு அதிகாரி மாற்றத்தை ஒப்புக்கொள்கிறார்.\n" +
"5. விளைவு: மாற்றத்திற்கு பிறகு சொத்து விண்ணப்பதாரின் பெயரில் பதிவு செய்யப்படும்.\n" +
"6. கட்டணம்: மாற்ற கட்டணம் ரூ. " + (d.mutationFees || "________") + "/- செலுத்தப்பட வேண்டும்.\n" +
"7. சட்டம்: தொடர்புடைய மாநில வருவாய் சட்டங்கள் இதற்கு பொருந்தும்.\n" +
"கையெழுத்து:\n" +
"விண்ணப்பதாரர்: _____________  அதிகாரி: _____________\n" +
"சாட்சிகள்:\n" +
"1) " + (d.witness1Name || "____________") + "   2) " + (d.witness2Name || "____________") + "\n"
).trim(),


  };

  const bank = language === "ta" ? ta : en;
  return (bank as Record<string, string>)[typeId] || "";
};

/* ============================= Component ============================= */
const DocumentPreview = ({
  selectedType,
  formData,
  language,
}: DocumentPreviewProps) => {
  const [isFullPreviewOpen, setIsFullPreviewOpen] = useState(false);

  const documentContent = selectedType
    ? generateDocumentContent(selectedType, formData, language)
    : "";

  const docType = selectedType
    ? documentTypes.find((doc) => doc.id === selectedType)
    : null;

  /* =================== PDF with bold headings + labels (English only) =================== */
  const handleDownloadPDF = () => {
    if (!documentContent.trim()) return;

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    ensureFont(doc, language);
    const baseSize = language === "ta" ? 11 : 12;
    doc.setFontSize(baseSize);

    const left = 40;
    const maxWidth = 515;
    const lines = documentContent.split("\n");
    let y = 60;
    const lineGap = 16;

    let titlePrinted = false;

    const ensurePage = () => {
      if (y > 780) {
        doc.addPage();
        ensureFont(doc, language);
        doc.setFontSize(baseSize);
        y = 60;
      }
    };

    for (const raw of lines) {
      const line = raw ?? "";
      const t = line.trim();

      if (!titlePrinted && t) {
        ensurePage();
        if (language === "en") doc.setFont(undefined, "bold");
        doc.setFontSize(baseSize + 4);
        doc.text(t, left + maxWidth / 2, y, { align: "center" as any });
        y += lineGap + 4;
        if (language === "en") doc.setFont(undefined, "normal");
        doc.setFontSize(baseSize);
        titlePrinted = true;
        continue;
      }

      // NEW: numbered heading (e.g., "1. PURPOSE. ...")
      const num = extractNumberedHeading(line);
      if (num) {
        ensurePage();
        if (language === "en") doc.setFont(undefined, "bold");
        doc.text(num.prefix, left, y);
        const prefixW = doc.getTextWidth(num.prefix + " ");
        if (language === "en") doc.setFont(undefined, "normal");
        const restChunks = doc.splitTextToSize(num.rest || " ", maxWidth - prefixW);
        doc.text(restChunks, left + prefixW, y);
        y += lineGap * (restChunks.length || 1);
        continue;
      }

      const heading = isHeadingLine(t, language);
      const inline = matchInlineLabel(line, language);

      if (heading) {
        ensurePage();
        if (language === "en") doc.setFont(undefined, "bold");
        const chunks = doc.splitTextToSize(line || " ", maxWidth);
        doc.text(chunks, left, y);
        y += lineGap * chunks.length;
        if (language === "en") doc.setFont(undefined, "normal");
        continue;
      }

      if (inline) {
        ensurePage();
        if (language === "en") doc.setFont(undefined, "bold");
        const labelText = inline.label + ": ";
        doc.text(labelText, left, y);
        const labelWidth = doc.getTextWidth(labelText);

        if (language === "en") doc.setFont(undefined, "normal");
        const restChunks = doc.splitTextToSize(inline.rest || " ", maxWidth - labelWidth);
        doc.text(restChunks, left + labelWidth, y);
        y += lineGap * restChunks.length;
        continue;
      }

      const chunks = doc.splitTextToSize(line || " ", maxWidth);
      ensurePage();
      doc.text(chunks, left, y);
      y += lineGap * chunks.length;
    }

    const fileName = docType ? `${docType.name[language]}.pdf` : "document.pdf";
    doc.save(fileName);
  };

  /** ===== DOCX: bold headings + inline labels + numbered headings (English only) ===== */
  const TAMIL_DOCX_FONT = "Nirmala UI";
  const EN_DOCX_FONT = "Calibri";

  const handleDownloadDOC = async () => {
    if (!documentContent.trim()) return;
    try {
      const isTA = language === "ta";
      const baseFont = isTA ? TAMIL_DOCX_FONT : EN_DOCX_FONT;

      const paras: Paragraph[] = [];
      const lines = documentContent.split("\n");
      let titlePrinted = false;

      for (const raw of lines) {
        const t = (raw ?? "").trim();

        if (!titlePrinted && t) {
          paras.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: t,
                  bold: language === "en",
                  size: 32,
                  font: baseFont,
                }),
              ],
              heading: HeadingLevel.TITLE,
            })
          );
          titlePrinted = true;
          continue;
        }

        const num = extractNumberedHeading(raw);
        const heading = isHeadingLine(t, language);
        const inline = matchInlineLabel(raw, language);

        if (num) {
          paras.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: num.prefix + " ",
                  bold: language === "en",
                  size: 24,
                  font: baseFont,
                }),
                new TextRun({
                  text: num.rest || " ",
                  size: 24,
                  font: baseFont,
                }),
              ],
            })
          );
          continue;
        }

        if (heading) {
          paras.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: raw || " ",
                  bold: language === "en",
                  size: 24,
                  font: baseFont,
                }),
              ],
            })
          );
          continue;
        }

        if (inline) {
          paras.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: inline.label + ": ",
                  bold: language === "en",
                  size: 24,
                  font: baseFont,
                }),
                new TextRun({
                  text: inline.rest || " ",
                  size: 24,
                  font: baseFont,
                }),
              ],
            })
          );
          continue;
        }

        paras.push(
          new Paragraph({
            children: [
              new TextRun({
                text: raw || " ",
                size: 24,
                font: baseFont,
              }),
            ],
          })
        );
      }

      const doc = new Document({
        styles: {
          default: {
            document: { run: { font: baseFont, size: 24 }, paragraph: { spacing: { line: 276 } } },
          },
        },
        sections: [{ properties: {}, children: paras }],
      });

      const blob = await Packer.toBlob(doc);
      const fileName = docType ? `${docType.name[language]}.docx` : "document.docx";
      saveAs(blob, fileName);
    } catch (error) {
      console.error("Error generating DOC file:", error);
    }
  };

  if (!selectedType) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-card border-l">
        <div className="text-center p-8">
          <div className="flex items-center justify-center w-16 h-16 bg-muted rounded-full mx-auto mb-4">
            <Eye className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            {language === "en" ? "Document Preview" : "ஆவண முன்னோட்டம்"}
          </h3>
          <p className="text-muted-foreground text-sm">
            {language === "en"
              ? "Select a document type and fill out the form to see the preview"
              : "முன்னோட்டம் காண ஆவண வகையைத் தேர்ந்தெடுத்து படிவத்தை நிரப்பவும்"}
          </p>
        </div>
      </div>
    );
  }

  /* ==================== PREVIEW render ==================== */
  const previewLines = documentContent.split("\n");

  const renderPreviewContent = (isFull: boolean) => {
    let titlePrinted = false;
    return previewLines.map((raw, idx) => {
      const t = (raw ?? "").trim();

      if (!titlePrinted && t) {
        titlePrinted = true;
        return (
          <p key={`${isFull ? 'full' : 'main'}-${idx}`} className="font-extrabold text-center mb-2">
            {boldValuesInline(t, formData)}
          </p>
        );
      }

      const num = extractNumberedHeading(raw);
      const heading = isHeadingLine(t, language);
      const inline = matchInlineLabel(raw, language);

      if (num) {
        return (
          <p key={`${isFull ? 'full' : 'main'}-${idx}`}>
            <strong className="font-bold">{num.prefix}</strong>{" "}
            {boldValuesInline(num.rest, formData)}
          </p>
        );
      }

      if (heading) {
        return (
          <p key={`${isFull ? 'full' : 'main'}-${idx}`} className="font-bold">
            {boldValuesInline(raw, formData)}
          </p>
        );
      }

      if (inline) {
        return (
          <p key={`${isFull ? 'full' : 'main'}-${idx}`}>
            <strong className="font-bold">{inline.label}:</strong>{" "}
            {boldValuesInline(inline.rest, formData)}
          </p>
        );
      }

      return <p key={`${isFull ? 'full' : 'main'}-${idx}`}>{boldValuesInline(raw, formData)}</p>;
    });
  };

  return (
    <div className="h-full flex flex-col bg-gradient-card">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-card p-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-primary rounded-lg">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2
              className={cn(
                "text-lg font-bold text-foreground",
                language === "ta" && "font-tamil"
              )}
            >
              {docType?.name[language]}
            </h2>
            <p className="text-sm text-muted-foreground">
              {language === "en" ? "Live Preview" : "நேரடி முன்னோட்டம்"}
            </p>
          </div>
        </div>
      </div>

      {/* Document Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <Card className="legal-shadow bg-white border-0">
          <CardContent className="p-8">
            <div
              className={cn(
                "text-sm leading-7 text-gray-800 text-left",
                language === "ta" && "font-tamil text-base"
              )}
              style={language === "ta" ? { fontFamily: "'Noto Sans Tamil', 'Inter', sans-serif" } : undefined}
            >
              {renderPreviewContent(false)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 border-t bg-card p-4 space-y-3">
        <Dialog open={isFullPreviewOpen} onOpenChange={setIsFullPreviewOpen}>
          <DialogTrigger asChild>
            <Button
              className="w-full bg-gradient-subtle hover:bg-gradient-primary text-foreground hover:text-white shadow-xl hover-scale transition-smooth"
              disabled={!documentContent.trim()}
            >
              <Eye className="h-4 w-4 mr-2" />
              <span className={cn("font-medium", language === "ta" && "font-tamil")}>
                {language === "en" ? "Full Preview" : "முழு முன்னோட்டம்"}
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className={cn(language === "ta" && "font-tamil")}>
                {docType?.name[language]} - {language === "en" ? "Full Preview" : "முழு முன்னோட்டம்"}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <Card className="bg-white border-0">
                <CardContent className="p-8">
                  <div
                    className={cn(
                      "text-sm leading-7 text-gray-800 text-left",
                      language === "ta" && "font-tamil text-base"
                    )}
                    style={language === "ta" ? { fontFamily: "'Noto Sans Tamil', 'Inter', sans-serif" } : undefined}
                  >
                    {renderPreviewContent(true)}
                  </div>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>

        <Button
          className="w-full legal-gradient text-white shadow-xl hover-scale transition-smooth"
          disabled={!documentContent.trim()}
          onClick={handleDownloadPDF}
        >
          <Download className="h-4 w-4 mr-2" />
          <span className={cn("font-medium", language === "ta" && "font-tamil")}>
            {language === "en" ? "Download PDF" : "PDF பதிவிறக்கம்"}
          </span>
        </Button>

        <Button
          className="w-full shadow-xl hover-scale transition-smooth bg-white border-2 border-primary/20 hover:bg-primary/5"
          variant="outline"
          disabled={!documentContent.trim()}
          onClick={handleDownloadDOC}
        >
          <FileText className="h-4 w-4 mr-2 text-primary" />
          <span className={cn("font-medium", language === "ta" && "font-tamil")}>
            {language === "en" ? "Download DOC" : "DOC பதிவிறக்கம்"}
          </span>
        </Button>
      </div>
    </div>
  );
};

export default DocumentPreview;
