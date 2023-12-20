import { Injectable, Optional, SkipSelf, OnInit } from '@angular/core';
import {
    DomSanitizer,
    TransferState,
    makeStateKey,
} from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';
import { catchError, map, pluck, tap } from 'rxjs/operators';

import { FeatureCollection, Feature } from 'geojson';

import { MainConfig } from '../../conf/main.config';
import { Program } from '../programs/programs.models';
import { TaxonomyList } from '../programs/observations/observation.model';
import { MediaItem, MediaList } from '../programs/media-galery/media-galery.model';

const PROGRAMS_KEY = makeStateKey('programs');

export interface IGncProgram extends Feature {
    properties: Program;
}

export interface IGncFeatures extends FeatureCollection {
    features: IGncProgram[];
    count: number;
}

const sorted = (property: string) => {
    if (!property) return undefined;
    let sortOrder = 1;

    if (property[0] === '-') {
        sortOrder = -1;
        property = property.substr(1);
    }

    return (a, b) => {
        return sortOrder === -1
            ? b[property].localeCompare(a[property])
            : a[property].localeCompare(b[property]);
    };
};

@Injectable({
    deps: [
        [new Optional(), new SkipSelf(), GncProgramsService],
        HttpClient,
        TransferState,
        DomSanitizer,
    ],
    providedIn: 'root',
    useFactory: (
        instance: GncProgramsService | null,
        http: HttpClient,
        state: TransferState,
        domSanitizer: DomSanitizer
    ) => instance || new GncProgramsService(http, state, domSanitizer),
})
export class GncProgramsService implements OnInit {
    private readonly URL = MainConfig.API_ENDPOINT;
    programs: Program[];
    programs$ = new Subject<Program[]>();

    constructor(
        protected http: HttpClient,
        private state: TransferState,
        protected domSanitizer: DomSanitizer
    ) { }

    ngOnInit(): void {
        this.programs = this.state.get(PROGRAMS_KEY, null as Program[]);
        this.programs$.next(this.programs);
    }

    getAllPrograms(): Observable<Program[]> {
        if (!this.programs) {
            return this.http.get<IGncFeatures>(`${this.URL}/programs`).pipe(
                pluck('features'),
                map((features: IGncProgram[]) =>
                    features.map((feature) => feature.properties)
                ),
                map((programs: Program[]) =>
                    programs.map((program) => {
                        program.html_short_desc =
                            this.domSanitizer.bypassSecurityTrustHtml(
                                program.short_desc
                            );
                        program.html_long_desc =
                            this.domSanitizer.bypassSecurityTrustHtml(
                                program.long_desc
                            );
                        return program;
                    })
                ),
                map((programs) =>
                    programs.sort(sorted(MainConfig['program_list_sort']))
                ),
                tap((programs) => {
                    this.state.set(PROGRAMS_KEY, programs as Program[]);
                    this.programs$.next(programs);
                }),
                catchError(this.handleError<Program[]>('getAllPrograms', []))
            );
        } else {
            return this.programs$;
        }
    }

    getProgram(id: number): Observable<FeatureCollection> {
        return this.http
            .get<FeatureCollection>(`${this.URL}/programs/${id}`)
            .pipe(
                catchError(
                    this.handleError<FeatureCollection>(`getProgram id=${id}`, {
                        type: 'FeatureCollection',
                        features: [],
                    })
                )
            );
    }

    getProgramObservations(id: number): Observable<FeatureCollection> {
        return this.http
            .get<FeatureCollection>(`${this.URL}/programs/${id}/observations`)
            .pipe(
                catchError(
                    this.handleError<FeatureCollection>(
                        `getProgramObservations id=${id}`,
                        { type: 'FeatureCollection', features: [] }
                    )
                )
            );
    }

    getNotValidatedbservations(id: number): Observable<FeatureCollection> {
        return this.http
            .get<FeatureCollection>(`${this.URL}/observations/not_validated`)
            .pipe(
                catchError(
                    this.handleError<FeatureCollection>(
                        `getProgramObservations id=${id}`,
                        { type: 'FeatureCollection', features: [] }
                    )
                )
            );
    }

    getProgramSites(id: number): Observable<FeatureCollection> {
        return this.http
            .get<FeatureCollection>(`${this.URL}/sites/programs/${id}`)
            .pipe(
                catchError(
                    this.handleError<FeatureCollection>(
                        `getProgramObservations id=${id}`
                    )
                )
            );
    }

    getSiteDetails(id: number): Observable<FeatureCollection> {
        return this.http
            .get<FeatureCollection>(`${this.URL}/sites/${id}`)
            .pipe(
                catchError(
                    this.handleError<FeatureCollection>(
                        `getProgramObservations id=${id}`
                    )
                )
            );
    }

    getObsDetails(id: number): Observable<FeatureCollection> {
        return this.http
            .get<FeatureCollection>(`${this.URL}/observations/${id}`)
            .pipe(
                catchError(
                    this.handleError<FeatureCollection>(
                        `getProgramObservations id=${id}`
                    )
                )
            );
    }

    getProgramTaxonomyList(taxonomy_list: number): Observable<TaxonomyList> {
        return this.http.get<TaxonomyList>(
            `${this.URL}/taxonomy/lists/${taxonomy_list}/species`
        );
    }

    getCustomForm(id_form): Observable<object> {
        return this.http
            .get<object>(`${this.URL}/customform/${id_form}`)
            .pipe(
                catchError(
                    this.handleError<object>(`getCustomForm id=${id_form}`)
                )
            );
    }

    getMedias(params): Observable<MediaList> {
        Object.keys(params).forEach(key => params[key] === undefined ? delete params[key] : {});
        return this.http.get<MediaList>(`${this.URL}/medias`, {
            params,
        });
    }

    private handleError<T>(operation = 'operation', result?: T) {
        return (error: any): Observable<T> => {
            // API errors are caught within the interceptor and handled by our
            // ErrorHandler in frontend/src/app/api/error_handler.ts .
            console.error(
                `${operation} failed: ${error.message ? error.message : error}`
            );
            return of(result as T);
        };
    }

    // public createProgram(program: Program): Observable<Program> {
    //   return this.http
    //     .post<Program>(`${this.URL}/programs`, program)
    //     .map(response => response.json() || []);
    // }

    // public updateProgram(program: Program): Observable<Program> {
    // return this.http
    //   .put<Program>(`${this.URL}/programs/${program.id_program}`, program)
    //   .map(response => response.json() || []);
    // }

    // public deleteProgram(program: Program): Observable<Program> {
    //   return this.http
    //     .delete<Program>(`${this.URL}/programs/${program.id_program}`)
    //     .map(response => response.json() || []);
    // }
}
