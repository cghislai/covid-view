import {enableProdMode} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {AppModule} from './app/app.module';
import {environment} from './environments/environment';
import {APP_BASE_HREF, PlatformLocation} from '@angular/common';

if (environment.production) {
  enableProdMode();
}

export function hrefProviderFactory(platformLocation: PlatformLocation) {
  return platformLocation.getBaseHrefFromDOM();
}

platformBrowserDynamic([
  {
    provide: APP_BASE_HREF,
    useFactory: hrefProviderFactory,
    deps: [PlatformLocation],
  },
]).bootstrapModule(AppModule)
  .catch(err => console.error(err));
