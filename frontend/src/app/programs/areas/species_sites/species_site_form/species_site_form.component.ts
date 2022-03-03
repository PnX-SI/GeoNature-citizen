import {
    Component,
    ViewEncapsulation,
    AfterViewInit,
    ViewChild,
    ElementRef,
    Input,
    Inject,
    LOCALE_ID,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
// import { map, tap } from 'rxjs/operators';

import { NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { Position, Point } from 'geojson';
import * as L from 'leaflet';
import { ControlPosition, LeafletMouseEvent } from 'leaflet';
import 'leaflet-gesture-handling';

import { MainConfig } from '../../../../../conf/main.config';
import { MAP_CONFIG } from '../../../../../conf/map.config';
import { MapService } from '../../../base/map/map.service';
import { GNCFrameworkComponent } from '../../../base/jsonform/framework/framework.component';
import { TaxonomyList } from '../../../observations/observation.model';
import {
    debounceTime,
    distinctUntilChanged,
    map,
    share,
    tap,
} from 'rxjs/operators';
import { GncProgramsService } from '../../../../api/gnc-programs.service';
import { conf } from '../map/map.component';

// declare let $: any;

const AREA_STYLE = {
    fillColor: 'transparent',
    weight: 2,
    opacity: 0.8,
    color: 'red',
    dashArray: '4',
};

// TODO: migrate to conf
const taxonSelectInputThreshold = MainConfig.taxonSelectInputThreshold;
const taxonAutocompleteInputThreshold =
    MainConfig.taxonAutocompleteInputThreshold;
const taxonAutocompleteFields = MainConfig.taxonAutocompleteFields;
const taxonAutocompleteMaxResults = 10;

export const speciesSiteFormMarkerIcon = L.icon({
    iconUrl: MainConfig.SPECIES_SITE_POINTER,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
});

export const myMarkerTitle =
    '<i class="fa fa-eye"></i> Partagez votre observation';

@Component({
    selector: 'app-species-site-form',
    templateUrl: './species_site_form.component.html',
    styleUrls: ['./species_site_form.component.css'],
    encapsulation: ViewEncapsulation.None,
})
export class SpeciesSiteFormComponent implements AfterViewInit {
    private readonly URL = MainConfig.API_ENDPOINT;
    @Input('data') data;
    @Input('coords') coords: L.Point;
    @Input('species') species = [];
    @Input('area_id') area_id: number;
    @ViewChild('photo', { static: true }) photo: ElementRef;

    area: any;
    formMap: L.Map;
    speciesSiteForm = new FormGroup({
        name: new FormControl('', Validators.required),
        geometry: new FormControl('', Validators.required),
        cd_nom: new FormControl(null, Validators.required),
        id_area: new FormControl(),
        id_species_site: new FormControl(),
    });
    hasZoomAlert: boolean;
    zoomAlertTimeout: any;
    mapVars: any = {};
    MainConfig = MainConfig;

    photos: any[] = [];
    jsonData: any = {};
    formOptions: any = {
        loadExternalAssets: false,
        debug: false,
        returnEmptyFields: false,
        addSubmit: false,
    };
    jsonSchema: any = {};
    GNCBootstrap4Framework: any = {
        framework: GNCFrameworkComponent,
    };
    formInputObject: any;
    readyToDisplay = false;
    partialLayout: any[] = [];
    advancedMode = false;

    taxonSelectInputThreshold = taxonSelectInputThreshold;
    taxonAutocompleteInputThreshold = taxonAutocompleteInputThreshold;
    autocomplete = 'isOff';
    // taxonomyListID: number;
    taxa: TaxonomyList;
    surveySpecies$: Observable<TaxonomyList>;

    taxaCount: number;
    selectedTaxon: any;
    jsonFormIsValid: any;

    constructor(
        @Inject(LOCALE_ID) readonly localeId: string,
        private http: HttpClient,
        private mapService: MapService,
        private dateParser: NgbDateParserFormatter,
        private programService: GncProgramsService
    ) {}

    ngOnInit(): void {
        if (this.data.speciesSiteUpdateData) {
            this.patchForm(this.data.speciesSiteUpdateData);
        }

        this.mapService.coordsChange.subscribe((value) => {
            this.coords = value;
            const geo_coords = <Point>{
                type: 'Point',
                coordinates: <Position>[this.coords.x, this.coords.y],
            };
            this.speciesSiteForm.patchValue({ geometry: geo_coords });

            if (this.mapVars.minimapMarker)
                this.formMap.removeLayer(this.mapVars.minimapMarker);

            this.mapVars.minimapMarker = L.marker(
                [this.coords.y, this.coords.x],
                {
                    icon: speciesSiteFormMarkerIcon,
                }
            ).addTo(this.formMap);
        });

        this.loadJsonSchema().subscribe((data: any) => {
            this.initForm(data);
        });
    }

    initForm(json_schema) {
        this.jsonSchema = json_schema;
        this.updatePartialLayout();
        this.updateFormInput();
        this.readyToDisplay = true;
    }
    loadJsonSchema() {
        return this.http.get(
            `${this.URL}/areas/${this.area_id}/species_site/jsonschema`
        );
    }
    updateFormInput() {
        this.updatePartialLayout();
        this.formInputObject = {
            schema: this.jsonSchema.schema,
            data: this.jsonData,
            layout: this.partialLayout,
        };
        console.log('this.json', this.formInputObject);
    }
    updatePartialLayout() {
        this.partialLayout = this.jsonSchema.layout;
        this.partialLayout[this.partialLayout.length - 1].expanded =
            this.advancedMode;
    }
    yourOnChangesFn(e) {
        this.jsonData = e;
    }

    addImage($event) {
        const img = document.createElement('img');
        img.onload = (event) => {
            let newImage = null;
            if (event.target) {
                newImage = event.target;
            } else if (!event['path'] || !event['path'].length) {
                newImage = event['path'][0];
            }
            if (!newImage) {
                console.error('No image found on this navigator');
                return;
            }
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            let resizeTimeNumber = 1;
            const maxHeightRatio =
                newImage.height / MainConfig.imageUpload.maxHeight;
            if (maxHeightRatio > 1) {
                resizeTimeNumber = maxHeightRatio;
            }
            const maxWidthRatio =
                newImage.width / MainConfig.imageUpload.maxWidth;
            if (maxWidthRatio > 1 && maxWidthRatio > maxHeightRatio) {
                resizeTimeNumber = maxWidthRatio;
            }

            canvas.width = newImage.width / resizeTimeNumber;
            canvas.height = newImage.height / resizeTimeNumber;

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const resizedImage = canvas.toDataURL(
                'image/jpeg',
                MainConfig.imageUpload.quality
            );

            this.photos.push(resizedImage);
        };
        img.src = window.URL.createObjectURL($event.file);
    }
    deleteImage(event) {
        for (let i = 0; i < this.photos.length; i++) {
            if (this.photos[i] == event.file) {
                this.photos.splice(i, 1);
            }
        }
    }

    ngAfterViewInit(): void {
        this.http
            .get(`${MainConfig.API_ENDPOINT}/areas/${this.area_id}`)
            .subscribe((result) => {
                this.area = result;

                if (this.species && this.species.length) {
                    this.updateTaxa(this.species);
                } else {
                    this.surveySpecies$ = this.programService
                        .getProgramTaxonomyList(
                            this.area.features[0].properties.id_program
                        )
                        .pipe(
                            tap((species) => {
                                this.updateTaxa(species);
                            }),
                            share()
                        );
                    this.surveySpecies$.subscribe();
                }

                // build map control
                const formMap = L.map('formMap', {
                    gestureHandling: true,
                } as any);
                this.formMap = formMap;

                L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: 'OpenStreetMap',
                }).addTo(formMap);

                const ZoomViewer = L.Control.extend({
                    onAdd: () => {
                        const container = L.DomUtil.create('div');
                        const gauge = L.DomUtil.create('div');
                        container.style.width = '200px';
                        container.style.background = 'rgba(255,255,255,0.5)';
                        container.style.textAlign = 'left';
                        container.className = 'mb-0';
                        formMap.on('zoomstart zoom zoomend', function (_e) {
                            gauge.innerHTML =
                                'Zoom level: ' + formMap.getZoom();
                        });
                        container.appendChild(gauge);

                        return container;
                    },
                });
                const zv = new ZoomViewer();
                zv.addTo(formMap);
                zv.setPosition('bottomleft');

                L.control
                    .layers(conf.BASE_LAYERS, null, {
                        collapsed: conf.BASE_LAYER_CONTROL_INIT_COLLAPSED,
                        position:
                            conf.BASE_LAYER_CONTROL_POSITION as ControlPosition,
                    })
                    .addTo(this.formMap);

                const leafletArea = L.geoJSON(this.area, {
                    style: function (_feature) {
                        return AREA_STYLE;
                    },
                }).addTo(formMap);

                const maxBounds = leafletArea.getBounds();
                L.control
                    .locate({
                        icon: 'fa fa-compass',
                        position: 'topleft',
                        strings: {
                            title: MAP_CONFIG.LOCATE_CONTROL_TITLE[
                                this.localeId
                            ]
                                ? MAP_CONFIG.LOCATE_CONTROL_TITLE[this.localeId]
                                : 'Me géolocaliser',
                        },
                        getLocationBounds: (locationEvent) =>
                            locationEvent.bounds.extend(maxBounds),
                        locateOptions: {
                            enableHighAccuracy: true,
                        },
                    } as any)
                    .addTo(formMap);

                formMap.fitBounds(maxBounds);
                formMap.setMaxBounds(maxBounds);

                // Set initial observation marker from main map if already spotted
                let myMarker = null;
                if (this.coords) {
                    const geo_coords = <Point>{
                        type: 'Point',
                        coordinates: <Position>[this.coords.x, this.coords.y],
                    };
                    this.speciesSiteForm.patchValue({ geometry: geo_coords });

                    myMarker = L.marker([this.coords.y, this.coords.x], {
                        icon: speciesSiteFormMarkerIcon,
                    }).addTo(formMap);
                }

                // Update marker on click event
                formMap.on('click', (e: LeafletMouseEvent) => {
                    const z = formMap.getZoom();

                    if (z < MAP_CONFIG.ZOOM_LEVEL_RELEVE) {
                        // this.hasZoomAlert = true;
                        console.debug('ZOOM ALERT', formMap);
                        L.DomUtil.addClass(
                            formMap.getContainer(),
                            'observation-zoom-statement-warning'
                        );
                        if (this.zoomAlertTimeout) {
                            clearTimeout(this.zoomAlertTimeout);
                        }
                        this.zoomAlertTimeout = setTimeout(() => {
                            L.DomUtil.removeClass(
                                formMap.getContainer(),
                                'observation-zoom-statement-warning'
                            );
                            console.debug('Deactivating overlay', formMap);
                        }, 2000);
                        return;
                    }
                    // PROBLEM: if program speciesSite is a concave polygon: one can still put a marker in the cavities.
                    // POSSIBLE SOLUTION: See ray casting algorithm for inspiration at https://stackoverflow.com/questions/31790344/determine-if-a-point-reside-inside-a-leaflet-polygon
                    if (maxBounds.contains([e.latlng.lat, e.latlng.lng])) {
                        if (myMarker) {
                            // TODO: update marker coods inplace.
                            // Implement draggable marker
                            formMap.removeLayer(myMarker);
                        }
                        myMarker = L.marker(e.latlng, {
                            icon: speciesSiteFormMarkerIcon,
                        }).addTo(formMap);
                        this.coords = L.point(e.latlng.lng, e.latlng.lat);
                        // this.speciesSiteForm.patchValue({ geometry: this.coords });
                        const coords = <Point>{
                            type: 'Point',
                            coordinates: <Position>[e.latlng.lng, e.latlng.lat],
                        };
                        this.speciesSiteForm.patchValue({ geometry: coords });
                    }
                });
                this.mapVars = {
                    minimapMarker: myMarker,
                };
            });
    }

    updateTaxa(species) {
        this.taxa = species;
        this.taxaCount = Object.keys(this.taxa).length;
        console.log('updateTaxa species', this.taxaCount, species);
        if (this.taxaCount >= this.taxonAutocompleteInputThreshold) {
            this.inputAutoCompleteSetup();
        } else if (this.taxaCount == 1) {
            this.onTaxonSelected(this.taxa[0]);
        }
    }

    setJsonFormIsValid(isValid) {
        this.jsonFormIsValid = isValid;
    }

    patchForm(speciesSiteUpdateData): void {
        this.area_id = speciesSiteUpdateData.id_area;
        this.jsonData = speciesSiteUpdateData.json_data;
        this.speciesSiteForm.patchValue({
            name: speciesSiteUpdateData.name,
            cd_nom: speciesSiteUpdateData.cd_nom,
            geometry: this.data.coords ? this.coords : '',
            area_id: speciesSiteUpdateData.area_id,
            id_species_site: speciesSiteUpdateData.id_species_site,
        });
    }

    onFormSubmit(): Promise<any> {
        const formData: FormData = new FormData();
        const formValues = this.speciesSiteForm.value;
        console.log('formValues', formValues);

        ['name', 'cd_nom', 'id_species_site'].forEach((key) => {
            if (formValues[key]) {
                formData.append(key, formValues[key]);
            }
        });

        formData.append('geometry', JSON.stringify(formValues['geometry']));

        if (this.jsonData) {
            formData.append('json_data', JSON.stringify(this.jsonData));
        }

        if (this.speciesSiteForm.value.cd_nom.cd_nom) {
            formData.append('cd_nom', this.speciesSiteForm.value.cd_nom.cd_nom);
        }

        let index = 0;
        for (const photoData of this.photos) {
            formData.append('photos[' + index + ']', photoData);
            index++;
        }

        return this.postSpeciesSite(formData)
            .toPromise()
            .then(
                (data) => {
                    return data;
                },
                (err) => console.error(err)
            );
    }

    postSpeciesSite(formData): Observable<any> {
        if (this.data.speciesSiteUpdateData) {
            const id_media_to_delete = this.data.speciesSiteUpdateData.photos
                ? this.data.speciesSiteUpdateData.photos
                      .filter((p) => p.checked)
                      .map((p) => p.id_media)
                : [];
            formData.append('delete_media', JSON.stringify(id_media_to_delete));

            return this.http.patch<any>(
                `${this.URL}/areas/species_sites/`,
                formData
            );
        } else {
            formData.append('id_area', this.area_id);
            return this.http.post<any>(
                `${this.URL}/areas/species_sites/`,
                formData
            );
        }
    }

    inputAutoCompleteSetup = () => {
        for (const taxon in this.taxa) {
            for (const field of taxonAutocompleteFields) {
                if (this.taxa[taxon]['taxref'][field]) {
                    this.species.push({
                        name:
                            field === 'cd_nom'
                                ? `${this.taxa[taxon]['taxref']['cd_nom']} - ${this.taxa[taxon]['taxref']['nom_complet']}`
                                : this.taxa[taxon]['taxref'][field],
                        cd_nom: this.taxa[taxon]['taxref']['cd_nom'],
                        icon:
                            this.taxa[taxon]['medias'].length >= 1
                                ? // ? this.taxa[taxon]["medias"][0]["url"]
                                  MainConfig.API_TAXHUB +
                                  '/tmedias/thumbnail/' +
                                  this.taxa[taxon]['medias'][0]['id_media'] +
                                  '?h=20'
                                : 'assets/default_image.png',
                    });
                }
            }
        }
        this.autocomplete = 'isOn';
    };

    inputAutoCompleteSearch = (text$: Observable<string>) =>
        text$.pipe(
            debounceTime(200),
            distinctUntilChanged(),
            map((term) =>
                term === '' // term.length < n
                    ? []
                    : this.species
                          .filter(
                              (v) =>
                                  v['name']
                                      .toLowerCase()
                                      .indexOf(term.toLowerCase()) > -1
                              // v => new RegExp(term, "gi").test(v["name"])
                          )
                          .slice(0, taxonAutocompleteMaxResults)
            )
        );

    inputAutoCompleteFormatter = (x: { name: string }) => x.name;

    onTaxonSelected(taxon: any): void {
        this.selectedTaxon = taxon;
        this.speciesSiteForm.controls['cd_nom'].patchValue(
            taxon.taxref['cd_nom']
        );
    }

    isSelectedTaxon(taxon: any): boolean {
        if (this.selectedTaxon)
            return this.selectedTaxon.taxref.cd_nom === taxon.taxref.cd_nom;
    }
}
