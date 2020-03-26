import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {ChartsDataService} from './charts-data.service';
import {debounceTime, delay, map, publishReplay, refCount, switchMap, tap} from 'rxjs/operators';
import {AmChartDateSeries} from '../chart/am-chart-date-series';
import {DailyReportMetric} from '../../domain/daily-report-metric';
import {CountryRegion} from '../../domain/country-region';
import {CountryInterpolation} from '../../domain/country-interpolation';
import {DailyReports} from '../../domain/daily-reports';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-charts-route',
  templateUrl: './charts-route.component.html',
  styleUrls: ['./charts-route.component.scss']
})
export class ChartsRouteComponent implements OnInit {

  allCountryRegions$: Observable<CountryRegion[]>;
  allDates$: Observable<string[]>;

  selectedCountries$: Observable<CountryRegion[]>;
  selectedMetric$: Observable<DailyReportMetric>;
  selectedInterpolation$: Observable<CountryInterpolation>;

  loadingChartData$ = new BehaviorSubject<boolean>(false);
  chartData$: Observable<AmChartDateSeries[]>;
  chartSerieNames$: Observable<string[]>;
  valueLabel$: Observable<string>;

  allMetrics: DailyReportMetric[] = ['confirmed', 'death', 'recovered', 'active'];
  allInterpolation: CountryInterpolation[] = ['none', 'population', 'surface'];


  constructor(
    private chartsDataService: ChartsDataService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef,
  ) {
  }

  ngOnInit(): void {
    this.allCountryRegions$ = this.chartsDataService.countriesRegions$;
    this.allDates$ = this.chartsDataService.dates$;
    const chartData = this.chartsDataService.reportsData$;

    const routeParams$ = this.activatedRoute.queryParams.pipe(
      publishReplay(1), refCount()
    );
    const regionsParam$ = routeParams$.pipe(
      map(p => p.regions || ''),
      map(p => p.split(',')),
    );
    this.selectedMetric$ = routeParams$.pipe(
      map(p => p.metric as DailyReportMetric || 'confirmed'),
      publishReplay(1), refCount()
    );
    this.selectedInterpolation$ = routeParams$.pipe(
      map(p => p.valueType as CountryInterpolation || 'population'),
      publishReplay(1), refCount()
    );

    this.selectedCountries$ = combineLatest(this.allCountryRegions$, regionsParam$).pipe(
      map(r => this.findSelection(r[0], r[1])),
      publishReplay(1), refCount()
    );
    this.chartData$ = combineLatest(chartData, this.selectedCountries$, this.selectedMetric$, this.selectedInterpolation$).pipe(
      debounceTime(50),
      switchMap(r => this.searchSeries$(r[0], r[1], r[2], r[3])),
      publishReplay(1), refCount()
    );
    this.chartSerieNames$ = this.selectedCountries$.pipe(
      map(list => list.map(c => c.idValue())),
      publishReplay(1), refCount()
    );
    this.valueLabel$ = combineLatest([this.selectedMetric$, this.selectedInterpolation$]).pipe(
      debounceTime(50),
      map(r => this.getValueLabel(r[0], r[1])),
      publishReplay(1), refCount()
    );
  }


  onConutrySelectionChange(countries: CountryRegion[]) {
    const paramValue = countries.reduce((c, n) => c == null ? n.idValue() : `${c},${n.idValue()}`, null as string);
    this.router.navigate([], {
      queryParams: {
        regions: paramValue
      },
      relativeTo: this.activatedRoute,
      queryParamsHandling: 'merge',
    });
  }

  onMetricChange(metric: DailyReportMetric) {
    this.router.navigate([], {
      queryParams: {
        metric,
      },
      relativeTo: this.activatedRoute,
      queryParamsHandling: 'merge',
    });
  }

  onInterpolationChange(valueType: CountryInterpolation) {
    this.router.navigate([], {
      queryParams: {
        valueType,
      },
      relativeTo: this.activatedRoute,
      queryParamsHandling: 'merge',
    });
  }

  private searchSeries$(data: DailyReports[], selection: CountryRegion[], metric: DailyReportMetric, interpolation: CountryInterpolation) {
    this.loadingChartData$.next(true);
    return this.chartsDataService.toSeriesPerCountryForCountries$(selection, data, {
      dailyMetric: metric,
      countryInterpolation: interpolation
    }).pipe(
      tap(a => this.loadingChartData$.next(false)),
      // delay(10),
    );
  }

  private findSelection(allRegions: CountryRegion[], idParamList: string[]) {
    return allRegions.filter(r => idParamList.includes(r.idValue()));
  }

  private getValueLabel(metric: DailyReportMetric, interpolation: CountryInterpolation) {
    let label = '';
    let unit = '';
    switch (metric) {
      case 'confirmed':
        label = `Confirmed cases`;
        break;
      case 'death':
        label = `Deaths`;
        break;
      case 'recovered':
        label = `Recovered cases`;
        break;
      case 'active':
        label = `Active cases`;
        break;
    }
    switch (interpolation) {
      case 'none':
        break;
      case 'population':
        unit = ' per 1000 people';
        break;
      case 'surface':
        unit = ' per km²';
        break;
    }
    return `${label}${unit}`;
  }

}
