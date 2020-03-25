import {CountryInfo} from './country-info';

export class CountryRegion {
  country: string;
  region?: string;
  selected: boolean;
  info?: CountryInfo;


  constructor(country: string, region: string, info?: CountryInfo) {
    this.country = country || '';
    this.region = region || '';
    this.info = info;
  }

  idValue(): string {
    return `${this.country.substr(0, 5)}_${this.region == null ? 'main' : this.region.substr(0, 8)}`;
  }

  labelValue() {
    let label = `${this.country}`;
    if (this.region && this.region.length > 0) {
      label += ` (${this.region})`;
    }
    return label;
  }
}
