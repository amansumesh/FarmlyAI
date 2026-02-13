import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface TreatmentData {
  treatments: {
    [disease: string]: {
      organic: string[];
      chemical: string[];
      preventive: string[];
    };
  };
  diseaseNames: {
    [language: string]: {
      [disease: string]: string;
    };
  };
}

let treatmentData: TreatmentData;

function loadTreatmentData(): TreatmentData {
  if (!treatmentData) {
    const dataPath = join(__dirname, '../data/treatments.json');
    const rawData = readFileSync(dataPath, 'utf-8');
    treatmentData = JSON.parse(rawData);
  }
  return treatmentData;
}

export class TreatmentService {
  static getLocalizedDiseaseName(
    disease: string,
    language: string
  ): string {
    const data = loadTreatmentData();
    return (
      data.diseaseNames[language]?.[disease] ||
      data.diseaseNames.en[disease] ||
      disease
    );
  }

  static getRecommendations(disease: string) {
    const data = loadTreatmentData();
    return (
      data.treatments[disease] || {
        organic: ['Consult local agricultural expert'],
        chemical: ['Consult local agricultural expert'],
        preventive: ['Monitor plant health regularly'],
      }
    );
  }
}
