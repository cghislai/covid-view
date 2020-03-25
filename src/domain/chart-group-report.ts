import {CountryRegion} from './country-region';

export interface ChartGroupReport {
  dateString: string;
  label: string;
  id: string;
  confirmed: number;
  recovered: number;
  death: number;
  countryRegion: CountryRegion;
}
