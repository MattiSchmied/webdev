export interface Fact {
  id: string;
  category: string;
  value: string;
  sourceIds: string[];
  confidence: number;
  status: 'confirmed' | 'likely' | 'conflicting' | 'unavailable';
}
export interface PriceItem {
  id: string;
  title: string;
  description: string;
  priceText: string;
  notes: string;
}
export interface ResearchPack {
  schemaVersion: 1;
  sourceSnapshotHash: string;
  identity: { companyName: string; industry: string; location: string };
  businessFacts: Fact[];
  services: { id: string; title: string; description: string; status: string }[];
  pricing: { id: string; heading: string; sourceIds: string[]; status: string; items: PriceItem[] }[];
  bookingAndContactPaths: { id: string; type: string; value: string; status: string }[];
  assets: { id: string; url: string; checksum: string; managedAssetId: string | null }[];
}
