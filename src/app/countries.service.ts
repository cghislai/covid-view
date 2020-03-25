import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs/operators';
import {CsvUtils} from '../domain/utils/csv-utils';
import {CountryInfo} from '../domain/country-info';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CountriesService {

  constructor(
    private httpClient: HttpClient,
  ) {
  }

  listCountries$(): Observable<CountryInfo[]> {
    return this.httpClient.get(`/assets/country-population.csv`, {
      responseType: 'text'
    }).pipe(
      map(d => this.parseCsv(d))
    );
  }

  private parseCsv(csvData: string) {
    const csvArray = CsvUtils.CSVToArray(csvData, '\t');
    return csvArray.slice(1).map(lineParts => {
      // iso alpha2	iso alpha3	iso numeric	fips code	name	capital	areaInSqKm	population	continent	languages	currency	geonameId
      const iso2 = lineParts[0];
      const iso3 = lineParts[1];
      const isoNUmeric = lineParts[2];
      const fips = lineParts[3];
      const name = lineParts[4];
      const capital = lineParts[5];
      // const continent = lineParts[5];
      // const continentName = lineParts[6];
      const area = lineParts[6];
      const population = lineParts[7];
      return {
        code: iso2,
        fips,
        name,
        population,
        area,
      } as CountryInfo;
    });
  }
}


