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
  avgPrice: number;
}

export interface PriceAnalysis {
  average: number;
  highest: {
    market: string;
    price: number;
  };
  lowest: {
    market: string;
    price: number;
  };
  trend: 'rising' | 'falling' | 'stable';
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
