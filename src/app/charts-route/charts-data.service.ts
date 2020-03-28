import {BehaviorSubject, combineLatest, forkJoin, Observable, of} from 'rxjs';
import {DailyReports} from '../../domain/daily-reports';
import {Injectable} from '@angular/core';
import {CovidDataService} from '../covid-data.service';
import {map, publishReplay, refCount, switchMap, tap} from 'rxjs/operators';
import {ChartDateSerie} from '../../domain/chart-date-serie';
import {DailyReport} from '../../domain/daily-report';
import {ChartGroupReport} from '../../domain/chart-group-report';
import {AmChartDateSeries} from '../chart/am-chart-date-series';
import moment from 'moment-es6';
import {CountryRegion} from '../../domain/country-region';
import {ChartDataOption} from '../../domain/chart-data-option';
import {CountryInfo} from '../../domain/country-info';
import {CountriesService} from '../countries.service';


@Injectable({
  providedIn: 'root'
})
export class ChartsDataService {

  reportsData$: Observable<DailyReports[]>;
  countries$: Observable<string[]>;
  countriesRegions$: Observable<CountryRegion[]>;
  regions$: Observable<string[]>;
  dates$: Observable<string[]>;

  loadingData$ = new BehaviorSubject<boolean>(false);

  constructor(private covidDataService: CovidDataService,
              private countriesService: CountriesService,
  ) {
    this.reportsData$ = of(null).pipe(
      tap(a => this.loadingData$.next(true)),
      switchMap(a => this.covidDataService.listDailyReports$()),
      tap(a => this.loadingData$.next(false)),
      publishReplay(1), refCount()
    );
    this.countries$ = this.reportsData$.pipe(
      map(d => this.covidDataService.listCountries(d)),
      map(d => d.sort((a, b) => a.localeCompare(b))),
      publishReplay(1), refCount()
    );
    this.regions$ = this.reportsData$.pipe(
      map(d => this.covidDataService.listRegions(d)),
      publishReplay(1), refCount()
    );
    const countryRegions$ = this.reportsData$.pipe(
      map(d => this.covidDataService.listCountryRegions(d)),
    );
    const countryInfos = this.countriesService.listCountries$().pipe(
      publishReplay(1), refCount()
    );
    this.countriesRegions$ = combineLatest([countryInfos, countryRegions$]).pipe(
      map(r => this.createCountryRegionWithInfo(r[0], r[1])),
      publishReplay(1), refCount(),
    );
    this.dates$ = this.reportsData$.pipe(
      map(d => this.covidDataService.listDates(d)),
      publishReplay(1), refCount()
    );
  }

  toSeriesPerCountryForCountries$(countries: CountryRegion[], reports: DailyReports[], option: ChartDataOption) {
    const countySeries$List = countries.map(c => this.createCountrySerie$(c, reports));
    return countySeries$List.length === 0 ? of([]) : forkJoin(countySeries$List).pipe(
      map(groupReports => this.createChartReports(groupReports, option))
    );
  }

  private createCountrySerie$(country: CountryRegion, reports: DailyReports[]): Observable<ChartDateSerie> {
    const grouPReports = reports.map(r => this.extractCountryReport(r, country));
    return of(grouPReports).pipe(
      map(groupedReports => this.createDataSerie(country, groupedReports))
    );
  }

  private extractCountryReport(report: DailyReports, countryRegion: CountryRegion) {
    const countryReports = report.reports.filter(r => r.country === countryRegion.country && r.region === countryRegion.region);
    const dateString = report.dateString;
    const groupReport = this.createGroupReport(countryRegion, dateString, ...countryReports);
    return groupReport;
  }

  private createGroupReport(countryRegion: CountryRegion, dateString: string, ...dailyReports: DailyReport[]): ChartGroupReport {
    const confirmedValue = dailyReports.reduce((c, n) => c + n.confirmed, 0);
    const deaths = dailyReports.reduce((c, n) => c + n.death, 0);
    const recoveredValue = dailyReports.reduce((c, n) => c + n.recovered, 0);

    return {
      confirmed: confirmedValue,
      death: deaths,
      recovered: recoveredValue,
      label: countryRegion.labelValue(),
      id: countryRegion.idValue(),
      dateString,
      countryRegion
    };
  }

  private createDataSerie(country: CountryRegion, groupedReports: ChartGroupReport[]): ChartDateSerie {
    let lastGroupreport;
    groupedReports.forEach(g => {
      if (lastGroupreport) {
        g.confirmed = g.confirmed < lastGroupreport.confirmed ? undefined : g.confirmed;
        g.death = g.death < lastGroupreport.death ? undefined : g.death;
        g.recovered = g.recovered < lastGroupreport.recovered ? undefined : g.recovered;
      }
      lastGroupreport = g;
    });
    return {
      label: country.labelValue(),
      id: country.idValue(),
      data: groupedReports,
    };
  }

  private createChartReports(reports: ChartDateSerie[], options: ChartDataOption): AmChartDateSeries[] {
    const dates = this.covidDataService.listSeriesDates(reports);
    return dates.map(dateString => {
      const dayReports = reports.map(r => this.findDayReport(dateString, r))
        .filter(d => d != null);

      const dateValue = moment(dateString, 'YYYY-MM-DD').toDate();
      const dataSerie = {
        date: dateValue,
      } as AmChartDateSeries & any;

      dayReports.forEach(d => {
        dataSerie[d.id] = this.getMetricValue(d, d.countryRegion.info, options);
      });
      return dataSerie;
    });
  }

  private findDayReport(day: string, serie: ChartDateSerie) {
    return serie.data.find(d => d.dateString === day);
  }


  private getMetricValue(report: ChartGroupReport, countryInfo: CountryInfo, metric: ChartDataOption) {
    let value = undefined;
    switch (metric.dailyMetric || 'confirmed') {
      case 'confirmed':
        value = report.confirmed;
        break;
      case 'recovered':
        value = report.recovered;
        break;
      case 'death':
        value = report.death;
        break;
      case 'active':
        value = report.confirmed - report.death - report.recovered;
        break;
    }
    if (value === undefined || isNaN(value)) {
      return undefined;
    }
    switch (metric.countryInterpolation || 'none') {
      case 'none':
        return value;
      case 'population':
        if (countryInfo) {
          return value * 1000 / countryInfo.population;
        } else {
          return undefined;
        }
      case 'surface':
        if (countryInfo) {
          return value / countryInfo.area;
        } else {
          return undefined;
        }
      case 'confirmed':
        if (report.confirmed) {
          return value / report.confirmed;
          break;
        } else {
          return undefined;
        }
      default:
        return value;
    }
  }

  private createCountryRegionWithInfo(infos: CountryInfo[], regions: CountryRegion[]) {
    regions.forEach(r => {
      const foundInfo = infos.find(i => {
        return r.region.length > 0 && i.name && i.name.toLowerCase().indexOf(r.region.toLowerCase()) >= 0;
      });
      r.info = foundInfo;
    });
    return regions;
  }
}
