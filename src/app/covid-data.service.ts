import {Injectable} from '@angular/core';
import {GithubService} from './github.service';
import {map, publishReplay, refCount, switchMap} from 'rxjs/operators';
import {DailyReportGitBlob} from '../domain/daily-report-git-blob';
import {forkJoin, Observable, of} from 'rxjs';
import {DailyReports} from '../domain/daily-reports';
import {DailyReport} from '../domain/daily-report';
import moment from 'moment-es6';
import {ChartDateSerie} from '../domain/chart-date-serie';
import {CountryRegion} from '../domain/country-region';
import {CsvUtils} from '../domain/utils/csv-utils';


@Injectable({
  providedIn: 'root'
})
export class CovidDataService {

  constructor(private githubService: GithubService) {
  }

  listDailyReports$(): Observable<DailyReports[]> {
    return this.listDataFilesDateRange$().pipe(
      switchMap(list => this.createDailyReportsList(list))
    );
  }

  listCountries(reports: DailyReports[]): string[] {
    return reports.reduce((c, n) => this.extractUniqueString(c, n.reports.map(r => r.country)), []);
  }

  listRegions(reports: DailyReports[]): string[] {
    return reports.reduce((c, n) => this.extractUniqueString(c, n.reports.map(r => r.region)), []);
  }

  listCountryRegions(reports: DailyReports[]): CountryRegion[] {
    return reports.reduce((c, n) => this.extractCountryRegions(c, n.reports), []);
  }

  listDates(reports: DailyReports[]): string[] {
    return reports.reduce((c, n) => this.extractUniqueString(c, [n.dateString]), []);
  }

  listSeriesDates(reports: ChartDateSerie[]): string[] {
    return reports.reduce((c, n) => this.extractUniqueString(c, n.data.map(d => d.dateString)), []);
  }

  private listDataFilesDateRange$(): Observable<DailyReportGitBlob[]> {
    const now = moment().startOf('day');
    const firstDate = moment('2020-01-22');
    const dateStrings = this.createDateRangeStrings(firstDate, now);
    const dateBlobs = this.createDateBlobs(dateStrings)
      .filter(b => b != null);
    return of(dateBlobs);
  }

  private createDailyReportsList(blobList: DailyReportGitBlob[]): Observable<DailyReports[]> {
    return forkJoin(blobList.map(blob => this.createDailyReports$(blob)));
  }

  private createDailyReports$(blob: DailyReportGitBlob): Observable<DailyReports> {
    const report$ = this.githubService.getRawBlobContentUrl$(blob.url).pipe(
      map(content => this.parseDailReportCsv(content)),
      publishReplay(1), refCount()
    );

    return report$.pipe(
      map(r => {
        return {
          dateString: blob.dateString,
          reports: r
        } as DailyReports;
      })
    );
  }

  private parseDailReportCsv(content: string): DailyReport[] {
    const array = CsvUtils.CSVToArray(content, ',');
    return array.slice(1).map(line => this.parseReportLine(line));
  }

  private parseReportLine(parts: string[]): DailyReport {
    const newFormat = parts.length > 8;

    const regionPart = parts[newFormat ? 2 : 0];
    const countryPart = parts[newFormat ? 3 : 1];
    const dateStringPart = parts[newFormat ? 5 : 2];
    const confirmed = parts[newFormat ? 7 : 3];
    const death = parts[newFormat ? 8 : 4];
    const recovered = parts[newFormat ? 9 : 5];

    let fixedCountry = countryPart === 'Mainland China' ? 'China' : countryPart;
    return {
      confirmed: this.safeParseInt(confirmed),
      country: fixedCountry,
      dateString: dateStringPart,
      death: this.safeParseInt(death),
      recovered: this.safeParseInt(recovered),
      region: regionPart || countryPart
    };
  }

  private safeParseInt(confirmed: string) {
    if (confirmed) {
      const intValue = parseInt(confirmed, 10);
      if (!isNaN(intValue)) {
        return intValue;
      }
    }
    return 0;
  }

  private createDateRangeStrings(from: moment.Moment, to: moment.Moment) {
    let testMoment = moment(from);
    const dates = [];
    while (testMoment.isBefore(to)) {
      const dateString = testMoment.format('YYYY-MM-DD');
      dates.push(dateString);

      testMoment = testMoment.add(1, 'day');
    }
    return dates;
  }

  private createDateBlobs(dateStrings: string[]) {
    return dateStrings.map(dateStringValue => {
      const dateMoment = moment(dateStringValue, 'YYYY-MM-DD');
      if (!dateMoment.isValid()) {
        return null;
      }

      const usDateString = dateMoment.format('MM-DD-YYYY');
      const pathValue = `csse_covid_19_data/csse_covid_19_daily_reports/${usDateString}.csv`;
      const urlValue = this.githubService.getRawBlobContentPath(`CSSEGISandData/COVID-19/master/${pathValue}`);
      return {
        dateString: dateStringValue,
        url: urlValue,
        path: pathValue,
        blobSha: null,
      } as DailyReportGitBlob;
    });
  }

  private extractUniqueString(cur: string[], next: string[]): string[] {
    next.forEach(n => {
      if (!cur.includes(n)) {
        cur.push(n);
      }
    });
    return cur;
  }

  private extractCountryRegions(cur: CountryRegion[], reports: DailyReport[]) {
    const countryRegions = reports.map(c => {
      return new CountryRegion(c.country, c.region);
    });
    countryRegions.forEach(cr => {
      const found = cur.find(curCr => curCr.country === cr.country && curCr.region === cr.region) != null;
      if (!found) {
        cur.push(cr);
      }
    });
    return cur;
  }
}
