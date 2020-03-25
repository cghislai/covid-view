export interface DailyReport {
  country: string;
  region: string;
  dateString: string;

  confirmed: number;
  recovered: number;
  death: number;
}
