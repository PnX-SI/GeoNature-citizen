import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { MainConfig } from './conf/main.config';

if (MainConfig.FRONTEND.PROD_MOD) {
    enableProdMode();
}

document.addEventListener('DOMContentLoaded', () => {
    platformBrowserDynamic()
        .bootstrapModule(AppModule)
        .catch((err) => console.error(err));
});
