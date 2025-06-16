import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {

  // Supported locales, adjust as needed
  private supportedLocales = ['fr', 'en', 'de'];
  private defaultLocale = 'fr';


  getCurrentLocale(): string {
    const seg = window.location.pathname.split('/')[1];
    return this.supportedLocales.includes(seg) ? seg : this.defaultLocale;
  }

  switchLanguage(newLocale: string):void {
   if (!this.supportedLocales.includes(newLocale)) { return; }

    // full pathname, including current locale & base-href
    const parts = window.location.pathname.split('/');   // ["", "fr", "home"]
    const maybeLocale = parts[1];

    if (this.supportedLocales.includes(maybeLocale)) {
      parts[1] = newLocale;
    } else {
      parts.splice(1, 0, newLocale);
    }

    const newPath =
      parts.join('/') + window.location.search + window.location.hash;

    /* Hard reload so Angular picks up the right bundle & base-href */
    window.location.assign(newPath);
  }

  getSupportedLocales(): string[] {
    return this.supportedLocales;
  }
}
