import {CountryRegion} from '../../domain/country-region';

export interface RegionItem {
  countryRegion: CountryRegion;
  country: string;
  region: string;

  hasInfo: boolean;
  population: number;
  area: number;

  hasReport: boolean;
  reportDate: Date;
  confirmed: number;
  deaths: number;

  selected: boolean;
}
