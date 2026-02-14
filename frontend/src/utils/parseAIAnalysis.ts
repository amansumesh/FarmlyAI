import { DiseasePrediction, TreatmentRecommendation } from '../types/disease.types';

interface ParsedAnalysis {
  predictions: DiseasePrediction[];
  recommendations: TreatmentRecommendation[];
  localizedDisease?: string;
}

export function parseAIAnalysis(markdownText: string, crop: string = 'Unknown'): ParsedAnalysis {
  const lines = markdownText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let disease = '';
  let extractedCrop = crop;
  let confidence = 0.85;
  let severity: 'low' | 'moderate' | 'high' | 'critical' = 'moderate';
  
  const organicTreatments: string[] = [];
  const chemicalTreatments: string[] = [];
  const preventiveMeasures: string[] = [];
  
  let currentSection = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();
    
    // Extract crop name - look for various patterns
    if (crop === 'Other Plants' || crop === 'Unknown' || crop === 'Plant') {
      // Pattern 1: "Affected Crop: Tomato" or "Crop: Tomato"
      if (lowerLine.includes('crop') && lowerLine.includes(':')) {
        const cropMatch = line.match(/(?:affected\s+)?crop[^:]*:\s*\*\*([^*]+)\*\*/i) || 
                         line.match(/(?:affected\s+)?crop[^:]*:\s*([^*\n,.]+)/i);
        if (cropMatch) {
          extractedCrop = cropMatch[1].trim().replace(/\*\*/g, '').replace(/\*/g, '').trim();
        }
      }
      
      // Pattern 2: Common crop mentions in first few lines
      if (i < 10 && (extractedCrop === 'Other Plants' || extractedCrop === 'Unknown' || extractedCrop === 'Plant')) {
        const cropMappings: Record<string, string> = {
          'tomato': 'Tomato',
          'potato': 'Potato',
          'pepper': 'Pepper',
          'okra': 'Okra',
          'bhindi': 'Okra',
          'brinjal': 'Eggplant',
          'eggplant': 'Eggplant',
          'cucumber': 'Cucumber',
          'pumpkin': 'Pumpkin',
          'watermelon': 'Watermelon',
          'corn': 'Corn',
          'maize': 'Corn',
          'rice': 'Rice',
          'wheat': 'Wheat',
          'chili': 'Chili',
          'chilli': 'Chili',
          'capsicum': 'Bell Pepper',
          'bean': 'Bean',
          'pea': 'Pea',
          'cabbage': 'Cabbage',
          'cauliflower': 'Cauliflower',
          'spinach': 'Spinach',
          'lettuce': 'Lettuce',
          'onion': 'Onion',
          'garlic': 'Garlic',
          'carrot': 'Carrot',
          'radish': 'Radish',
          'beet': 'Beet',
          'turnip': 'Turnip',
          'mango': 'Mango',
          'banana': 'Banana',
          'apple': 'Apple',
          'orange': 'Orange',
          'grape': 'Grape',
          'papaya': 'Papaya',
          'guava': 'Guava'
        };
        
        for (const [searchTerm, displayName] of Object.entries(cropMappings)) {
          if (lowerLine.includes(searchTerm) && 
              (lowerLine.includes('plant') || lowerLine.includes('crop') || 
               lowerLine.includes('leaf') || lowerLine.includes('leaves') ||
               lowerLine.includes('tree') || lowerLine.includes('fruit'))) {
            extractedCrop = displayName;
            break;
          }
        }
      }
    }
    
    // Extract disease name - look for various patterns
    if (!disease) {
      // Pattern 1: "Disease Identified: Early Blight"
      if (lowerLine.includes('disease') && lowerLine.includes(':')) {
        const match = line.match(/disease[^:]*:\s*\*\*([^*]+)\*\*/i) || 
                     line.match(/disease[^:]*:\s*([^*\n]+)/i);
        if (match) {
          disease = match[1].trim().replace(/\*\*/g, '').replace(/\*/g, '').trim();
        }
      }
      
      // Pattern 2: "**Early Blight**" at the start
      const boldMatch = line.match(/^\*\*([^*]+)\*\*$/);
      if (boldMatch && i < 5) {
        const potential = boldMatch[1].trim().replace(/\*\*/g, '').replace(/\*/g, '').trim();
        if (potential.length > 3 && !potential.toLowerCase().includes('analysis')) {
          disease = potential;
        }
      }
      
      // Pattern 3: After "Diagnosis:" or "Identified:" headers
      if ((lowerLine.includes('diagnosis') || lowerLine.includes('identified')) && 
          lowerLine.includes(':') && i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        const cleaned = nextLine.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^[-*]\s*/, '').trim();
        if (cleaned && cleaned.length > 3) {
          disease = cleaned;
        }
      }
      
      // Pattern 4: "The plant is suffering from..."
      if (lowerLine.includes('suffering from') || lowerLine.includes('affected by') || 
          lowerLine.includes('showing signs of')) {
        const match = line.match(/(?:suffering from|affected by|showing signs of)\s+\*\*([^*]+)\*\*/i) ||
                     line.match(/(?:suffering from|affected by|showing signs of)\s+([^.,\n]+)/i);
        if (match) {
          disease = match[1].trim().replace(/\*\*/g, '').replace(/\*/g, '').trim();
        }
      }
    }
    
    // Extract confidence
    const confMatch = line.match(/confidence[:\s]+(\d+)%/i) || 
                     line.match(/(\d+)%\s+confidence/i) ||
                     line.match(/certainty[:\s]+(\d+)%/i);
    if (confMatch) {
      confidence = parseInt(confMatch[1]) / 100;
    }
    
    // Extract severity
    if (lowerLine.includes('severity')) {
      if (lowerLine.match(/\b(low|mild|minor)\b/i)) severity = 'low';
      else if (lowerLine.match(/\b(critical|severe|very high)\b/i)) severity = 'critical';
      else if (lowerLine.match(/\bhigh\b/i)) severity = 'high';
      else severity = 'moderate';
    }
    
    // Section detection - more flexible patterns
    if (lowerLine.match(/##\s*(organic|natural|home|biological)/)) {
      currentSection = 'organic';
      continue;
    }
    
    if (lowerLine.match(/##\s*(chemical|fungicide|pesticide|spray)/)) {
      currentSection = 'chemical';
      continue;
    }
    
    if (lowerLine.match(/##\s*(prevent|future|avoid|cultural)/)) {
      currentSection = 'preventive';
      continue;
    }
    
    // Also detect by keywords in regular text
    if (lowerLine.includes('organic') && (lowerLine.includes('treatment') || lowerLine.includes('control'))) {
      currentSection = 'organic';
      continue;
    }
    
    if (lowerLine.includes('chemical') && (lowerLine.includes('treatment') || lowerLine.includes('control'))) {
      currentSection = 'chemical';
      continue;
    }
    
    if (lowerLine.includes('prevention') || lowerLine.includes('preventive')) {
      currentSection = 'preventive';
      continue;
    }
    
    // Extract treatment items - multiple patterns
    let content = '';
    
    // Pattern 1: Bullet points (- or *)
    const bulletMatch = line.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch && currentSection) {
      content = bulletMatch[1].trim();
    }
    
    // Pattern 2: Numbered lists
    const numberMatch = line.match(/^\d+\.\s+(.+)$/);
    if (numberMatch && currentSection) {
      content = numberMatch[1].trim();
    }
    
    // Pattern 3: Bold items without bullets
    if (!content && currentSection && line.match(/^\*\*[^*]+\*\*/)) {
      content = line.replace(/^\*\*|\*\*$/g, '').trim();
    }
    
    // Clean up content
    if (content) {
      content = content
        .replace(/\*\*/g, '')  // Remove all bold markers
        .replace(/\*/g, '')    // Remove all asterisks
        .replace(/^`|`$/g, '') // Remove code markers
        .replace(/`/g, '')     // Remove all backticks
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Convert markdown links to text
        .replace(/##\s*/g, '') // Remove header markers
        .replace(/:$/g, '')    // Remove trailing colons
        .trim();
      
      // Only add if it's substantive content
      if (content.length > 5 && !content.toLowerCase().includes('treatment') && 
          !content.toLowerCase().includes('recommendations')) {
        if (currentSection === 'organic') {
          organicTreatments.push(content);
        } else if (currentSection === 'chemical') {
          chemicalTreatments.push(content);
        } else if (currentSection === 'preventive') {
          preventiveMeasures.push(content);
        }
      }
    }
  }
  
  // Fallback: if no disease found, try to extract from first few lines
  if (!disease) {
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      if (line.length > 5 && line.length < 100 && 
          !line.toLowerCase().includes('analysis') &&
          !line.startsWith('#')) {
        disease = line.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^[-*]\s*/, '').replace(/:/g, '').trim();
        break;
      }
    }
  }
  
  // Final fallback
  if (!disease) {
    disease = 'Disease Detected';
  }
  
  // Final cleanup of disease name
  disease = disease.replace(/\*\*/g, '').replace(/\*/g, '').replace(/:/g, '').trim();
  
  const predictions: DiseasePrediction[] = [
    {
      disease,
      crop: extractedCrop,
      confidence,
      severity,
    },
  ];
  
  const recommendations: TreatmentRecommendation[] = [];
  
  if (organicTreatments.length > 0) {
    recommendations.push({
      type: 'organic',
      title: 'Organic Treatment',
      description: 'Natural and environmentally friendly treatment options',
      steps: organicTreatments,
    });
  }
  
  if (chemicalTreatments.length > 0) {
    recommendations.push({
      type: 'chemical',
      title: 'Chemical Treatment',
      description: 'Conventional chemical control methods',
      steps: chemicalTreatments,
    });
  }
  
  if (preventiveMeasures.length > 0) {
    recommendations.push({
      type: 'preventive',
      title: 'Prevention Measures',
      description: 'Steps to prevent future occurrences',
      steps: preventiveMeasures,
    });
  }
  
  return {
    predictions,
    recommendations,
    localizedDisease: disease,
  };
}
