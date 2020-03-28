import {AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, NgZone, OnDestroy, OnInit, ViewChild} from '@angular/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import * as am4core from '@amcharts/amcharts4/core';
import {AmChartDateSeries} from './am-chart-date-series';
import {CountryRegion} from '../../domain/country-region';
import {BehaviorSubject, combineLatest, Subscription} from 'rxjs';
import {debounceTime} from 'rxjs/operators';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss']
})
export class ChartComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input()
  set data(value: AmChartDateSeries[]) {
    this.data$.next(value || []);
  }

  @Input()
  set regions(value: CountryRegion[]) {
    this.series$.next(value || []);
  }

  @Input()
  set valueLabel(value: string) {
    this.valueLabel$.next(value);
  }

  @ViewChild('chartDiv')
  private chartDiv: ElementRef;

  chart: am4charts.XYChart;

  series$ = new BehaviorSubject<CountryRegion[]>([]);
  data$ = new BehaviorSubject<AmChartDateSeries[]>([]);
  valueLabel$ = new BehaviorSubject<string>('Cases');
  private subscription: Subscription;

  constructor(private zone: NgZone,
              private changeDetectorRef: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    this.subscription = new Subscription();

    const inputSubscription = combineLatest(this.series$, this.data$, this.valueLabel$).pipe(
      debounceTime(50)
    ).subscribe(r => {
      if (this.chart) {
        this.chart.yAxes.getIndex(0).title.text = r[2];
        this.chart.data = r[1];
        this.updateSeries(this.chart, r[0]);
      }
    });

    this.subscription.add(inputSubscription);
  }

  ngAfterViewInit() {
    this.createChart();
  }

  ngOnDestroy() {
    this.destroyCHart();
    this.subscription.unsubscribe();
  }

  private destroyCHart() {
    this.zone.runOutsideAngular(() => {
      if (this.chart) {
        this.chart.dispose();
      }
    });
  }

  private createChart() {
    this.zone.runOutsideAngular(() => {
      const chart = am4core.create(this.chartDiv.nativeElement, am4charts.XYChart);


      // ... chart code goes here ...
      chart.data = this.data$.getValue();

      const dateAxis = chart.xAxes.push(new am4charts.DateAxis());
      dateAxis.title.text = 'Date';
      dateAxis.renderer.grid.template.location = 0;
      dateAxis.renderer.minGridDistance = 60;
      dateAxis.dateFormats.setKey('day', 'dd');
      dateAxis.periodChangeDateFormats.setKey('day', 'dd MMM');

      const yAxis = chart.yAxes.push(new am4charts.ValueAxis());
      yAxis.title.text = this.valueLabel$.getValue();


      chart.cursor = new am4charts.XYCursor();
      chart.cursor.behavior = 'zoomXY';
      chart.cursor.maxTooltipDistance = 20;

      chart.legend = new am4charts.Legend();

      this.chart = chart;
    });
    if (this.series$.getValue()) {
      this.updateSeries(this.chart, this.series$.getValue());
    }

  }

  private updateSeries(chart: am4charts.XYChart, value: CountryRegion[]) {
    this.zone.runOutsideAngular(() => {
      chart.series.clear();
      value.forEach(countryRegion => {
        const series = chart.series.push(new am4charts.LineSeries());
        series.dataFields.dateX = 'date';
        series.dataFields.valueY = countryRegion.idValue();
        series.name = countryRegion.labelValue();
        series.strokeWidth = 2;
        series.tooltipText = '{name}: [b]{valueY}[/]';
        series.legendSettings.itemValueText = '[bold]{valueY}[/bold]';

        const bullet = series.bullets.push(new am4charts.CircleBullet());
        bullet.circle.stroke = am4core.color('#fff');
        bullet.circle.strokeWidth = 2;

        // this.data$.next(this.data$.getValue());
      });
    });
    // this.changeDetectorRef.detectChanges();
  }
}
