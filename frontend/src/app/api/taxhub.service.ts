import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { map, catchError, tap } from "rxjs/operators";
import { Observable, of } from "rxjs";

import { AppConfig } from "../../conf/app.config";

export interface Taxon {
  cd_nom: number;
  id_statut: string;
  id_habitat: number;
  id_rang: string;
  regne: string;
  phylum: string;
  classe: string;
  ordre: string;
  famille: string;
  sous_famille: string;
  tribu: string;
  cd_taxsup: number;
  cd_sup: number;
  cd_ref: number;
  lb_nom: string;
  lb_auteur: string;
  nom_complet: string;
  nom_complet_html: string;
  nom_complet_html_sanitized: SafeHtml;
  nom_vern: string;
  nom_valide: string;
  nom_vern_eng: string;
  group1_inpn: string;
  group2_inpn: string;
  url: string;
}

@Injectable({
  providedIn: "root"
})
export class TaxhubService {
  private readonly URL = AppConfig.API_ENDPOINT;
  taxon: any;

  constructor(
    protected http: HttpClient,
    protected domSanitizer: DomSanitizer
  ) {}

  getTaxon(cd_nom: number): Observable<Taxon> {
    return this.http.get<Taxon>(`${this.URL}/taxonomy/taxon/${cd_nom}`).pipe(
      map(taxon => {
        taxon.nom_complet_html_sanitized = this.domSanitizer.bypassSecurityTrustHtml(
          taxon.nom_complet_html
        );
        return taxon;
      }),
      // tap(taxon => {
      //   // this.state.set(TAXON_KEY, taxon as any);
      //   console.debug("taxhub taxon", taxon);
      //   return taxon;
      // }),
      catchError(this.handleError<Taxon>(`getTaxon(${cd_nom})`))
    );
  }

  private handleError<T>(operation = "operation", result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`, error);
      return of(result as T);
    };
  }
}
