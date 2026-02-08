export interface Scheme {
  id: string;
  name: string;
  description: string;
  benefits: string[];
  applicationSteps: string[];
  requiredDocuments: string[];
  applicationUrl: string;
  eligibilityMatch: number;
  type: 'central' | 'state' | 'district';
}

export interface SchemesResponse {
  eligibleSchemes: Scheme[];
  totalSchemes: number;
}
