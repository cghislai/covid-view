import {ChartGroupReport} from './chart-group-report';
import {CountryRegion} from './country-region';

export interface ChartDateSerie {
  label: string;
  id: string;
  data: ChartGroupReport[];
}
