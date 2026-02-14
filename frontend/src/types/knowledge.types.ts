export interface KnowledgeContent {
  symptoms: string;
  treatment: string;
  prevention: string;
}

export interface KnowledgeItem {
  id: string;
  crop: string;
  category: string;
  disease: string;
  content: {
    english: KnowledgeContent;
    hindi?: KnowledgeContent;
    tamil?: KnowledgeContent;
    telugu?: KnowledgeContent;
    malayalam?: KnowledgeContent;
    kannada?: KnowledgeContent;
    [key: string]: KnowledgeContent | undefined;
  };
}

export type LanguageCode = 'en' | 'hi' | 'ta' | 'te' | 'ml' | 'kn';
