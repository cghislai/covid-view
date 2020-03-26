import {Component, Input, OnInit, Output} from '@angular/core';
import {CountryRegion} from '../../domain/country-region';
import {BehaviorSubject, combineLatest, Observable, Subject} from 'rxjs';
import {debounceTime, map, publishReplay, refCount} from 'rxjs/operators';
import {RegionItem} from './region-item';
import {ChartsDataService} from '../charts-route/charts-data.service';
import {DailyReports} from '../../domain/daily-reports';
import moment from 'moment-es6';

@Component({
  selector: 'app-region-select',
  templateUrl: './region-select.component.html',
  styleUrls: ['./region-select.component.scss']
})
export class RegionSelectComponent implements OnInit {

  @Input()
  set allCountryRegions(value: CountryRegion[]) {
    this.allCountryRegionsSource$.next(value || []);
  }

  @Input()
  set selection(value: CountryRegion[]) {
    this.countryRegionSelectionSource$.next(value || []);
  }

  @Output()
  selectionChange = new Subject<CountryRegion[]>();

  allCountryRegionsSource$ = new BehaviorSubject<CountryRegion[]>([]);
  countryRegionSelectionSource$ = new BehaviorSubject<CountryRegion[]>([]);

  filterQuery$ = new BehaviorSubject<string>('');
  filterWithInfo$ = new BehaviorSubject<boolean>(null);
  filteredCountries$: Observable<RegionItem[]>;

  constructor(
    private chartsDataService: ChartsDataService,
  ) {
  }

  ngOnInit(): void {
    const debouncedFilterQuery$ = this.filterQuery$.pipe(
      debounceTime(300)
    );
    const debouncedFilterWithInfo$ = this.filterWithInfo$.pipe(
      debounceTime(300)
    );


    const chartData$ = this.chartsDataService.reportsData$;
    this.filteredCountries$ = combineLatest(
      this.allCountryRegionsSource$, this.countryRegionSelectionSource$, chartData$,
      debouncedFilterQuery$, debouncedFilterWithInfo$)
      .pipe(
        debounceTime(0),
        map(r => this.createItems(r[0], r[1], r[2], r[3], r[4])),
        publishReplay(1), refCount(),
      );
  }

  onSwitchSelectionClick(row: RegionItem) {
    if (row.selected) {
      const newSelection = this.countryRegionSelectionSource$.getValue()
        .filter(c => c.idValue() !== row.countryRegion.idValue());
      this.setSelection(newSelection);
    } else {
      const newSelection = this.countryRegionSelectionSource$.getValue();
      newSelection.push(row.countryRegion);
      this.setSelection(newSelection);
    }
  }

  onToggleWithInfoFilterClick() {
    const curValue = this.filterWithInfo$.getValue();
    this.filterWithInfo$.next(!curValue);
  }

  private createItems(countryRegions: CountryRegion[], selection: CountryRegion[], chartData: DailyReports[],
                      filterQuery: string, filterWithInfo: boolean) {
    const lastReports = chartData[chartData.length - 1];

    return countryRegions
      .filter(r => this.filterMatches(r, filterQuery, filterWithInfo))
      .map(c => this.createGroupWithData(c, selection, lastReports))
      .sort((a, b) => a.region.localeCompare(b.region));
  }

  private createGroupWithData(region: CountryRegion, selection: CountryRegion[], lastDailyReports: DailyReports): RegionItem {
    const population = region.info == null ? null : region.info.population;
    const area = region.info == null ? null : region.info.area;
    const selected = selection.find(r => r.idValue() === region.idValue()) != null;

    const dailyReport = this.findRegionReport(lastDailyReports, region);
    const hasReport = dailyReport != null;
    const reportDate: Date = dailyReport == null ? null : moment(lastDailyReports.dateString, 'YYYY-MM-DD').toDate();
    const confirmed: number = dailyReport == null ? 0 : dailyReport.confirmed;
    const deaths: number = dailyReport == null ? 0 : dailyReport.death;

    return {
      countryRegion: region,
      country: region.country,
      region: region.region,
      hasInfo: region.info != null,
      population,
      area,
      selected,
      hasReport,
      reportDate,
      confirmed,
      deaths,
    };
  }

  private filterMatches(region: CountryRegion, filter: string, filterWithInfo: boolean) {
    return this.filterQueryMatches(filter, region)
      && this.filterWithInfoMatches(filterWithInfo, region);
  }

  private filterQueryMatches(filter: string, region: CountryRegion) {
    if (filter == null || filter.length < 1) {
      return true;
    }
    return region.country.toLowerCase().indexOf(filter.toLowerCase()) >= 0
      || region.region.toLowerCase().indexOf(filter.toLowerCase()) >= 0;
  }

  private filterWithInfoMatches(filterWithInfo: boolean, region: CountryRegion) {
    if (filterWithInfo !== true) {
      return true;
    }
    return region.info != null;
  }

  private setSelection(newSelection: CountryRegion[]) {
    const safeSelection = newSelection.slice(0, 16);
    this.selectionChange.next(safeSelection);
  }

  private findRegionReport(lastDailyReports: DailyReports, region: CountryRegion) {
    if (lastDailyReports == null) {
      return null;
    }
    return lastDailyReports.reports
      .find(r => {
        return r.country === region.country
          && r.region === region.region;
      });
  }
}
