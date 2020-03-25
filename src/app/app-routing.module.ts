import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {ChartsRouteComponent} from './charts-route/charts-route.component';


const routes: Routes = [{
  path: '',
  pathMatch: 'full',
  component: ChartsRouteComponent,
}];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
