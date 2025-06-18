import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MainConfig } from '../../../conf/main.config';
@Injectable({
  providedIn: 'root'
})
export class LanguageService {

  private supportedLocales = MainConfig.supportedLocales;
  private defaultLocale   = MainConfig.defaultLocale;

constructor(
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  /**
   * À appeler au bootstrap de l'app pour :
   * - si aucune locale dans l'URL, rediriger vers la locale
   *   du navigateur (si supportée) ou la locale par défaut.
   */
  init(): void {
    if (!isPlatformBrowser(this.platformId)) {
      // ne rien faire côté serveur
      return;
    }
    // Si mono-locale, on n’a rien à faire (pas de switcher ni de redirection)
    if (this.supportedLocales.length < 2) {
      return;
    }
    const parts = window.location.pathname.split('/');
    const maybeLocale = parts[1];

    // si l'URL comporte déjà une locale valide : OK
    if (this.supportedLocales.includes(maybeLocale)) {
      return;
    }

    // sinon, on récupère la langue du navigateur
    const browserLang = navigator.language.split('-')[0];
    const target = this.supportedLocales.includes(browserLang)
      ? browserLang
      : this.defaultLocale;

    // on redirige vers /<target>/...
    this.switchLanguage(target);
  }

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
