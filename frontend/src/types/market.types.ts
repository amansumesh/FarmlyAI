export interface Market {
  name: string;
  location: string;
  distance: number;
  price: number;
  unit: string;
  date: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
}

export interface PriceHistory {
  date: string;
  price: number;
  market: string;
}

export interface PriceAnalysis {
  average: number;
  min: number;
  max: number;
  trend: 'rising' | 'falling' | 'stable';
  recommendation: string;
  confidence: number;
}

export interface MarketPricesResponse {
  crop: string;
  markets: Market[];
  priceHistory: PriceHistory[];
  priceAnalysis: PriceAnalysis;
  updatedAt: string;
}

export interface GetMarketPricesRequest {
  crop: string;
  language?: string;
}
