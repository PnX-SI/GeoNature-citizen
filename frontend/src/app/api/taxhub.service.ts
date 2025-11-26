import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { map, catchError } from 'rxjs/operators';
import { forkJoin, Observable, of } from 'rxjs';

import { MainConfig } from '../../conf/main.config';
import { GlobalCacheService } from './global-cache.service';
import {
    TaxonomyList,
    Taxon,
    Media,
    Attribut,
    MediaBase,
    ObservationFeature,
    TaxonomyListItem,
} from '../programs/observations/observation.model';

@Injectable({
    providedIn: 'root',
})
export class TaxhubService {
    private readonly URL = MainConfig.API_ENDPOINT;
    taxon: Taxon;
    MEDIAS_TYPES_ALLOWED = ['Photo_gncitizen', 'Photo_principale', 'Photo'];
    ATTRIBUTS_ALLOWED = ['Nom_francais', 'nom_francais'];

    constructor(
        protected http: HttpClient,
        protected domSanitizer: DomSanitizer,
        private cacheService: GlobalCacheService
    ) { }

    getTaxon(cd_nom: number): Observable<Taxon> {
        return this.http
            .get<Taxon>(`${this.URL}/taxonomy/taxon/${cd_nom}`)
            .pipe(
                map((taxon) => {
                    taxon.nom_complet_html_sanitized =
                        this.domSanitizer.bypassSecurityTrustHtml(
                            taxon.nom_complet_html
                        );
                    return taxon;
                }),
                catchError(this.handleError<Taxon>(`getTaxon(${cd_nom})`))
            );
    }

    getMediasTypesTaxhub(): Observable<MediaBase[]> {
        return this.http
            .get<MediaBase[]>(`${this.URL}/taxonomy/tmedias/types`)
            .pipe(
                catchError(
                    this.handleError<MediaBase[]>(`getMediasTypesTaxhub()`)
                )
            );
    }

    getBibAttributesTaxhub(): Observable<Attribut[]> {
        return this.http
            .get<Attribut[]>(`${this.URL}/taxonomy/bibattributs`)
            .pipe(
                catchError(
                    this.handleError<Attribut[]>(`getBibAttributesTaxhub()`)
                )
            );
    }

    loadAndCacheData(forceReload = false): void {
        // Vérifie si le cache est valide
        const isMediasCacheValid = this.cacheService.isMediasCacheValid();
        const isAttributesCacheValid =
            this.cacheService.isAttributesCacheValid();

        // Si les deux caches sont valides, ne pas recharger
        if (!forceReload && isMediasCacheValid && isAttributesCacheValid) {
            return;
        }
        forkJoin({
            medias: this.getMediasTypesTaxhub(),
            attributes: this.getBibAttributesTaxhub(),
        }).subscribe({
            next: ({ medias, attributes }) => {
                // Transformer les données en Records basés sur IDs
                const mediasRecord = this.mapById(medias, 'id_type');
                const attributesRecord = this.mapById(
                    attributes,
                    'id_attribut'
                );

                // Stocker les données dans le cache
                this.cacheService.setMediasCache(mediasRecord);
                this.cacheService.setAttributesCache(attributesRecord);
            },
            error: (error) => console.error('Error loading data:', error),
        });
    }

    private mapById(array: any[], idKey: string): Record<string, any> {
        return array.reduce((acc, item) => {
            acc[item[idKey]] = item;
            return acc;
        }, {});
    }

    private handleError<T>(operation = 'operation', result?: T) {
        return (error: Error): Observable<T> => {
            console.error(`${operation} failed: ${error.message}`, error);
            return of(result as T);
        };
    }

    setMediasAndAttributs(response: TaxonomyList): TaxonomyList {
        if (!Array.isArray(response)) {
            console.error('Response should be an array', response);
            return response;
        }
        return (response = response.map((item: TaxonomyListItem) => {
            // Ajouter "nom_type_media" à chaque média
            if (item.medias) {
                item.medias = item.medias.map((media: MediaBase) => {
                    const typeMedias = this.cacheService.getMediaById(
                        media.id_type
                    );
                    const nomTypeMedia = this.MEDIAS_TYPES_ALLOWED.includes(
                        typeMedias.nom_type_media
                    )
                        ? typeMedias.nom_type_media
                        : null;
                    return { ...media, nom_type_media: nomTypeMedia };
                });
                item.medias = this.sort_medias_by_type(item.medias);
            }

            // Set attributs
            item.nom_francais = null;
            if (item.attributs && item.attributs.length > 0) {
                // Trouver l'attribut "nom_francais" si existe
                const attrId = this.cacheService.findAttributId(this.ATTRIBUTS_ALLOWED)

                // Peupler la clé "nom_francais" si valeur
                const frAttribute = item.attributs.find((attr) => attrId === attr.id_attribut);
                item.nom_francais = frAttribute ? frAttribute.valeur_attribut : null;
            }
            return { ...item };
        }));
    }

    filterMediasTaxhub(
        items: ObservationFeature | ObservationFeature[]
    ): ObservationFeature | ObservationFeature[] {
        const processMedias = (medias: Media[]) => {
            medias = medias.map((media: Media) => {
                const typeMedias = this.cacheService.getMediaById(
                    media.id_type
                );
                const nomTypeMedia = this.MEDIAS_TYPES_ALLOWED.includes(
                    typeMedias.nom_type_media
                )
                    ? typeMedias.nom_type_media
                    : null;
                return { ...media, nom_type_media: nomTypeMedia };
            });

            // Appel de la fonction sort_medias_by_type pour trier les médias
            return this.sort_medias_by_type(medias);
        };

        if (Array.isArray(items)) {
            items.forEach(
                (item: ObservationFeature) =>
                    item.properties.medias &&
                    (item.properties.medias = processMedias(
                        item.properties.medias
                    ))
            );
        } else {
            items.properties.medias &&
                (items.properties.medias = processMedias(
                    items.properties.medias
                ));
        }

        return items;
    }

    sort_medias_by_type(medias: Media[]): Media[] {
        return medias.sort((a: Media, b: Media) => {
            const indexA = this.MEDIAS_TYPES_ALLOWED.indexOf(a.nom_type_media);
            const indexB = this.MEDIAS_TYPES_ALLOWED.indexOf(b.nom_type_media);
            if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
            }
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;

            return 0;
        });
    }
}
