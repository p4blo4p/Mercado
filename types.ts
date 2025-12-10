
export enum TimeRange {
  D1 = '1d',
  D7 = '7d',
  M1 = '1m',
  M3 = '3m',
  Y1 = '1y',
  Y5 = '5y'
}

export enum DataSource {
  GENERAL = 'General (Yahoo/Google)',
  OFFICIAL = 'Oficial (FRED/BLS)',
  TRADING = 'Trading (Investing/TV)'
}

export interface MetricUrls {
  [DataSource.GENERAL]: string;
  [DataSource.OFFICIAL]: string;
  [DataSource.TRADING]: string;
}

export interface MetricThresholds {
  // Value where things become "Good" (Green line)
  goodLevel?: number;
  goodDirection: 'above' | 'below'; 
  
  // Value where things become "Bad" (Red line)
  badLevel?: number;
  badDirection: 'above' | 'below';
}

export interface MetricDefinition {
  id: string;
  name: string;
  category: 'Economic' | 'Market' | 'Ratio' | 'Sentiment';
  suffix?: string;
  isPercentage?: boolean;
  searchQuery: string;
  urls: MetricUrls;
  thresholds?: MetricThresholds;
  description?: string;
}

export interface DataPoint {
  date: string;
  value: number;
}

export interface MetricData {
  definition: MetricDefinition;
  currentValue: number;
  change: number;
  changePercent: number;
  history: DataPoint[];
  sourceUrl?: string;
  isSimulated?: boolean;
}

export interface AppSettings {
  timeRange: TimeRange;
  dataSource: DataSource;
  favorites: string[]; // array of MetricDefinition ids
}
