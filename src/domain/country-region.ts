import {CountryInfo} from './country-info';
import validate = WebAssembly.validate;

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
    const trimmedCountry = this.trim(this.country, 5);
    const trimmedRegion = this.trim(this.region, 8);
    return `${trimmedCountry}_${trimmedRegion}`;
  }

  labelValue() {
    let label = `${this.country}`;
    if (this.region && this.region.length > 0) {
      label += ` (${this.region})`;
    }
    return label;
  }

  private trim(value: string, length: number) {
    return value
      .replace(/ ,_-\W/, '')
      .toLowerCase()
      .substr(0, length);
  }
}
