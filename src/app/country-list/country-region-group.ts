import {CountryRegion} from '../../domain/country-region';
import {CountryInfo} from '../../domain/country-info';

export class CountryRegionGroup {
  country: string;
  regions: CountryRegion[];
  selected: true | false | 'partial';
  expanded?: boolean;
  info?: CountryInfo;

  constructor(country: string) {
    this.country = country;
    this.regions = [];
    this.selected = false;
    this.expanded = false;
  }
}
