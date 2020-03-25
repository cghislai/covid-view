import {Component, Input, OnInit, Output} from '@angular/core';
import {BehaviorSubject, combineLatest, Observable, Subject} from 'rxjs';
import {debounceTime, map, publishReplay, refCount} from 'rxjs/operators';
import {CountryRegion} from '../../domain/country-region';
import {CountryRegionGroup} from './country-region-group';
import {CountryInfo} from '../../domain/country-info';
import {CountriesService} from '../countries.service';

@Component({
  selector: 'app-country-list',
  templateUrl: './country-list.component.html',
  styleUrls: ['./country-list.component.scss']
})
export class CountryListComponent implements OnInit {

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
  countryInfoSource$: Observable<CountryInfo[]>;

  query$ = new BehaviorSubject<string>('');

  filteredCountries$: Observable<CountryRegionGroup[]>;

  constructor(
    private countryService: CountriesService,
  ) {
  }

  ngOnInit(): void {
    this.countryInfoSource$ = this.countryService.listCountries$();
    const deouncedQuery = this.query$.pipe(
      debounceTime(300)
    );
    this.filteredCountries$ = combineLatest(
      this.allCountryRegionsSource$, this.countryRegionSelectionSource$,
      deouncedQuery, this.countryInfoSource$)
      .pipe(
        debounceTime(0),
        map(r => this.createRegionGroups(r[0], r[1], r[2])),
        publishReplay(1), refCount()
      );
  }

  switchCOuntrySelection(countryRegionGroup: CountryRegionGroup) {
    if (countryRegionGroup.selected !== false) {
      const newSelection = this.countryRegionSelectionSource$.getValue()
        .filter(c => c.country !== countryRegionGroup.country);
      this.setSelection(newSelection);
    } else {
      const allCountryregions = this.allCountryRegionsSource$.getValue()
        .filter(c => c.country === countryRegionGroup.country);
      const newSelection = this.countryRegionSelectionSource$.getValue().filter(c => c.country !== countryRegionGroup.country);
      newSelection.push(...allCountryregions);
      this.setSelection(newSelection);
    }
  }

  switchRegionSelection(countryRegionGroup: CountryRegionGroup, region: CountryRegion) {
    // if (region.region === region.country) {
    //   this.switchCOuntrySelection(countryRegionGroup);
    //   return;
    // }
    if (region.selected) {
      const newSelection = this.countryRegionSelectionSource$.getValue()
        .filter(c => c.idValue() !== region.idValue());
      this.setSelection(newSelection);
    } else {
      const newSelection = this.countryRegionSelectionSource$.getValue();
      newSelection.push(region);
      this.setSelection(newSelection);
    }
  }

  private createRegionGroups(countryRegions: CountryRegion[], selection: CountryRegion[], filter: string) {
    const groups = countryRegions.reduce((c, n) => this.reduceregionGroups(c, n, filter), [])
      .map(group => this.setGroupData(group, selection))
      .sort((a, b) => a.country.localeCompare(b.country));
    return groups;
  }

  private reduceregionGroups(groups: CountryRegionGroup[], next: CountryRegion, filter: string) {
    if (next == null) {
      return groups;
    }
    const countryMatch = (filter == null || next.country == null) ? true : next.country.toLowerCase().indexOf(filter.toLowerCase()) >= 0;
    const regionMatch = (filter == null || next.region == null) ? true : next.region.toLowerCase().indexOf(filter.toLowerCase()) >= 0;
    if (!countryMatch && !regionMatch) {
      return groups;
    }

    let countryGroup = groups.find(g => g.country === next.country);
    if (countryGroup == null) {
      countryGroup = {
        country: next.country,
        regions: [],
        selected: false,
      };
      groups.push(countryGroup);
    }

    countryGroup.regions.push(next);
    return groups;
  }

  private setGroupData(group: CountryRegionGroup, selection: CountryRegion[]) {
    const newGroup = new CountryRegionGroup(group.country);
    newGroup.regions = group.regions.map(r => new CountryRegion(r.country, r.region, r.info));
    newGroup.regions.forEach(r => {
      r.selected = selection.find(s => s.idValue() === r.idValue()) != null;
    });
    const anyUnselected = newGroup.regions.find(r => r.selected) != null;
    const anySelected = newGroup.regions.find(r => r.selected) != null;
    if (anyUnselected && anySelected) {
      newGroup.selected = 'partial';
    } else {
      newGroup.selected = anySelected;
    }

    if (newGroup.regions.length === 1) {
      newGroup.info = newGroup.regions[0].info;
    }


    return newGroup;
  }

  private setSelection(newSelection: CountryRegion[]) {
    const safeSelection = newSelection.slice(0, 16);
    this.selectionChange.next(safeSelection);
  }

}
