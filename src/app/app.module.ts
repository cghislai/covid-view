import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {HttpClientModule} from '@angular/common/http';
import {ChartComponent} from './chart/chart.component';
import {ChartsRouteComponent} from './charts-route/charts-route.component';
import {FormsModule} from '@angular/forms';
import {RegionSelectComponent} from './region-select/region-select.component';

@NgModule({
  declarations: [
    AppComponent,
    ChartComponent,
    ChartsRouteComponent,
    RegionSelectComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
