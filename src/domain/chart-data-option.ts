import {DailyReportMetric} from './daily-report-metric';
import {CountryInterpolation} from './country-interpolation';

export interface ChartDataOption {
  dailyMetric?: DailyReportMetric;
  countryInterpolation?: CountryInterpolation;
}
