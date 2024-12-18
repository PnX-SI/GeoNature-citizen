import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { geometryValidator, ngbDateMaxIsToday } from './formValidators';
import { MainConfig } from './../../../../conf/main.config';
import { BaseLayer } from '../../programs.models';
import * as L from 'leaflet';

import {
    AfterViewInit,
    Component,
    EventEmitter,
    Inject,
    Input,
    LOCALE_ID,
    Output,
    ViewEncapsulation,
} from '@angular/core';
import { AuthService } from './../../../auth/auth.service';
import {
    debounceTime,
    distinctUntilChanged,
    map,
    share,
    switchMap,
    tap,
} from 'rxjs/operators';
import { FeatureCollection } from 'geojson';
import { GncProgramsService } from '../../../api/gnc-programs.service';
import { LeafletMouseEvent } from 'leaflet';
import { NgbDate, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import {
    ObservationFeature,
    PostObservationResponse,
    TaxonomyList,
} from '../observation.model';
import 'leaflet-gesture-handling';
import 'leaflet-fullscreen/dist/Leaflet.fullscreen';
import 'leaflet-search';
import { ToastrService } from 'ngx-toastr';
import { ObservationsService } from '../observations.service';
import { MapService } from '../../base/map/map.service';

import { GNCFrameworkComponent } from '../../base/jsonform/framework/framework.component';
import { RefGeoService } from '../../../api/refgeo.service';
import { ControlPosition } from 'leaflet';
import { TaxhubService } from '../../../api/taxhub.service';

// declare let $: any;

const map_conf = {
    GEOLOCATION_CONTROL_POSITION: 'topright',
    GEOLOCATION_HIGH_ACCURACY: false,
    BASE_LAYERS: MainConfig['BASEMAPS'].reduce((acc, baseLayer: BaseLayer) => {
        const layerConf: BaseLayer = {
            name: baseLayer['name'],
            attribution: baseLayer['attribution'],
            detectRetina: baseLayer['detectRetina'],
            maxZoom: baseLayer['maxZoom'],
            bounds: baseLayer['bounds'],
            apiKey: baseLayer['apiKey'],
            layerName: baseLayer['layerName'],
        };
        if (baseLayer['subdomains']) {
            layerConf.subdomains = baseLayer['subdomains'];
        }
        acc[baseLayer['name']] = L.tileLayer(baseLayer['layer'], layerConf);
        return acc;
    }, {}),
    BASE_LAYER_CONTROL_POSITION: 'topright' as ControlPosition,
    BASE_LAYER_CONTROL_INIT_COLLAPSED: true,
    DEFAULT_BASE_MAP: () =>
        map_conf.BASE_LAYERS[MainConfig['DEFAULT_PROVIDER']],
    PROGRAM_AREA_STYLE: {
        fillColor: 'transparent',
        weight: 2,
        opacity: 0.8,
        color: 'red',
        dashArray: '4',
    },
};
const taxonSelectInputThreshold = MainConfig.taxonSelectInputThreshold;
const taxonAutocompleteInputThreshold =
    MainConfig.taxonAutocompleteInputThreshold;

//  TODO: [LIMIT100-TAXON-COMPAT-THV2] normalement à enlever
// const taxonAutocompleteFields = MainConfig.taxonAutocompleteFields;
const taxonAutocompleteMaxResults = 10;
const taxonDisplayImageWhenUnique =
    'taxonDisplayImageWhenUnique' in MainConfig
        ? MainConfig.taxonDisplayImageWhenUnique
        : true;

// TODO: migrate to conf
export const obsFormMarkerIcon = L.icon({
    iconUrl: MainConfig['NEW_OBS_POINTER'],
    iconSize: [33, 42],
    iconAnchor: [16, 42],
});

type TempTaxa = {
    cd_nom: number;
    nom_francais: string;
};

@Component({
    selector: 'app-obs-form',
    templateUrl: './form.component.html',
    styleUrls: ['./form.component.css'],
    encapsulation: ViewEncapsulation.None,
})
export class ObsFormComponent implements AfterViewInit {
    private readonly URL = MainConfig.API_ENDPOINT;
    @Input('data') data;
    @Output('newObservation')
    newObservation: EventEmitter<ObservationFeature> = new EventEmitter();
    today = new Date();
    program_id: number;
    coords: L.Point;
    municipality: string;
    modalflow;
    taxonSelectInputThreshold = taxonSelectInputThreshold;
    taxonAutocompleteInputThreshold = taxonAutocompleteInputThreshold;
    taxonDisplayImageWhenUnique = taxonDisplayImageWhenUnique;
    autocomplete = 'isOff';
    MainConfig = MainConfig;
    formMap: L.Map;
    program: FeatureCollection;
    taxonomyListID: number;
    taxa: TaxonomyList;
    surveySpecies$: Observable<TaxonomyList>;
    surveySpecies: TaxonomyList;
    species: Object[] = [];
    taxaCount: number;
    selectedTaxon: any;
    hasZoomAlert: boolean;
    zoomAlertTimeout: any;
    obsForm: FormGroup;
    customForm: any = {};
    GNCBootstrap4Framework: any = {
        framework: GNCFrameworkComponent,
    };
    jsfInputObject: object;
    formOptions: any = {
        loadExternalAssets: false,
        debug: false,
        returnEmptyFields: false,
        addSubmit: false,
    };
    jsonData: object;
    jsonErrors: any;
    jsonValid: boolean;
    photos: any[] = [];
    existing_photos: any[] = [];
    mapVars: any = {};
    isInvalidDirty = false;
    loading: boolean = true;

    constructor(
        @Inject(LOCALE_ID) readonly localeId: string,
        private observationsService: ObservationsService,
        private formBuilder: FormBuilder,
        private dateParser: NgbDateParserFormatter,
        private programService: GncProgramsService,
        private toastr: ToastrService,
        private auth: AuthService,
        private mapService: MapService,
        private _refGeoService: RefGeoService,
        private _taxhubService: TaxhubService
    ) {}

    ngOnInit(): void {
        this._taxhubService.loadAndCacheData();
        this.program_id = this.data.program_id;
        this.coords = this.data.coords;
        this.updateMunicipality();
        this.intiForm();
        if (this.data.updateData) {
            this.patchForm(this.data.updateData);
            this.jsonData = this.data.updateData.json_data;
        }
        this.mapService.coordsChange.subscribe((value) => {
            this.coords = value;
            this.obsForm.patchValue({ geometry: this.coords });
            if (this.mapVars.minimapMarker)
                this.formMap.removeLayer(this.mapVars.minimapMarker);
            this.mapVars.minimapMarker = L.marker(
                [this.coords.y, this.coords.x],
                {
                    icon: obsFormMarkerIcon,
                }
            ).addTo(this.formMap);
        });
    }

    ngAfterViewInit() {
        this.loading = true;
        this.programService
            .getProgram(this.program_id)
            .subscribe((result: FeatureCollection) => {
                this.program = result;
                this.taxonomyListID =
                    this.program.features[0].properties.taxonomy_list;
                this.surveySpecies$ = this.programService
                    .getProgramTaxonomyList(this.taxonomyListID)
                    .pipe(
                        tap((species) => {
                            this.taxa = this._taxhubService.setMediasAndAttributs(species);
                        }),
                        switchMap((species) => 
                            this.programService.getAllProgramTaxonomyList().pipe(
                              map((listsTaxonomy) => {
                                this.taxaCount = listsTaxonomy
                                  .filter((lt) => lt.id_liste === this.taxonomyListID)
                                  .map((lt) => lt.nb_taxons)[0];
                      
                                console.log('this.taxaCount', this.taxaCount);
                      
                                // TODO: [LIMIT100-TAXON-COMPAT-THV2] normalement à enlever
                                // if (this.taxaCount >= this.taxonAutocompleteInputThreshold) {
                                //   this.inputAutoCompleteSetup();
                                // } else 
                                if (this.taxaCount === 1) {
                                  this.onTaxonSelected(species[0]); 
                                }
                                console.log('species', species);
                                return species;
                              })
                            )
                          ),
                        map((species: TaxonomyList) =>{
                            if (this.taxaCount < this.taxonAutocompleteInputThreshold) {
                                return species.sort((a, b) => {
                                    const taxA = a.nom_francais !== null && a.nom_francais !== undefined
                                    ? a.nom_francais
                                    : a.taxref.nom_vern !== null && a.taxref.nom_vern !== undefined
                                      ? a.taxref.nom_vern
                                      : '';
                                  
                                  const taxB = b.nom_francais !== null && b.nom_francais !== undefined
                                    ? b.nom_francais
                                    : b.taxref.nom_vern !== null && b.taxref.nom_vern !== undefined
                                      ? b.taxref.nom_vern
                                      : '';
                                  
                                  return taxA.localeCompare(taxB);
                                });
                              } else {
                                // Si la condition n'est pas remplie, retourner les données sans les trier
                                return species;
                              }
                        }),
                        share()
                        );
                        this.surveySpecies$.subscribe((sortedSpecies) => {
                            console.log("sortedSpecies", sortedSpecies);
                            this.surveySpecies = sortedSpecies;
                            this.loading = false;
                          });

                if (this.program.features[0].properties.id_form) {
                    // Load custom form if one is attached to program
                    this.programService
                        .getCustomForm(
                            this.program.features[0].properties.id_form
                        )
                        .subscribe((result: object) => {
                            this.customForm = result;
                            if (this.customForm.json_schema)
                                this.updatejsfInputObject();
                        });
                }

                // build map control
                const formMap = L.map('formMap', {
                    layers: [map_conf.DEFAULT_BASE_MAP()],
                    gestureHandling: true,
                } as any);
                this.formMap = formMap;

                L.control
                    .layers(map_conf.BASE_LAYERS, null, {
                        collapsed: map_conf.BASE_LAYER_CONTROL_INIT_COLLAPSED,
                        position: map_conf.BASE_LAYER_CONTROL_POSITION,
                    })
                    .addTo(formMap);
                L.control['fullscreen']({
                    position: 'topright',
                    title: {
                        false: 'Voir en plein écran',
                        true: 'Sortir du plein écran',
                    },
                    pseudoFullscreen: true,
                }).addTo(formMap);
                console.log('LControl', L.control);

                L.control['search']({
                    url: 'https://nominatim.openstreetmap.org/search?format=json&accept-language=fr-FR&q={s}',
                    jsonpParam: 'json_callback',
                    propertyName: 'display_name',
                    position: 'topright',
                    propertyLoc: ['lat', 'lon'],
                    markerLocation: true,
                    autoType: true,
                    autoCollapse: true,
                    minLength: 3,
                    zoom: 15,
                    text: 'Recherche...',
                    textCancel: 'Annuler',
                    textErr: 'Erreur',
                }).addTo(formMap);

                L.control
                    .locate({
                        icon: 'fa fa-location-arrow',
                        position: map_conf.GEOLOCATION_CONTROL_POSITION,
                        strings: {
                            title: MainConfig.LOCATE_CONTROL_TITLE[
                                this.localeId
                            ]
                                ? MainConfig.LOCATE_CONTROL_TITLE[this.localeId]
                                : 'Me géolocaliser',
                        },
                        getLocationBounds: (locationEvent) =>
                            locationEvent.bounds.extend(L.LatLngBounds),
                        onLocationError: (locationEvent) => {
                            let msg =
                                'Vous semblez être en dehors de la zone du programme.';
                            this.toastr.error(msg, '', {
                                positionClass: 'toast-top-right',
                            });
                            //alert("Vous semblez être en dehors de la zone du programme")
                        },
                        locateOptions: {
                            enableHighAccuracy:
                                map_conf.GEOLOCATION_HIGH_ACCURACY,
                        },
                    } as any)
                    .addTo(formMap);

                let ZoomViewer = L.Control.extend({
                    onAdd: () => {
                        let container = L.DomUtil.create('div');
                        let gauge = L.DomUtil.create('div');
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
                let zv = new ZoomViewer();
                zv.addTo(formMap);
                zv.setPosition('bottomleft');

                const programArea = L.geoJSON(this.program, {
                    style: function (_feature) {
                        return map_conf.PROGRAM_AREA_STYLE;
                    },
                }).addTo(formMap);

                const maxBounds: L.LatLngBounds = programArea.getBounds();
                formMap.fitBounds(maxBounds);
                formMap.setMaxBounds(maxBounds.pad(0.01));

                // Set initial observation marker from main map if already spotted
                let myMarker = null;
                if (this.coords) {
                    this.obsForm.patchValue({ geometry: this.coords });

                    myMarker = L.marker([this.coords.y, this.coords.x], {
                        icon: obsFormMarkerIcon,
                    }).addTo(formMap);
                }

                // Update marker on click event
                formMap.on('click', (e: LeafletMouseEvent) => {
                    let z = formMap.getZoom();

                    if (z < MainConfig.ZOOM_LEVEL_RELEVE) {
                        // this.hasZoomAlert = true;
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
                        }, 2000);
                        return;
                    }
                    // PROBLEM: if program area is a concave polygon: one can still put a marker in the cavities.
                    // POSSIBLE SOLUTION: See ray casting algorithm for inspiration at https://stackoverflow.com/questions/31790344/determine-if-a-point-reside-inside-a-leaflet-polygon
                    if (maxBounds.contains([e.latlng.lat, e.latlng.lng])) {
                        if (myMarker) {
                            // TODO: update marker coods inplace.
                            // Implement draggable marker
                            formMap.removeLayer(myMarker);
                        }
                        myMarker = L.marker(e.latlng, {
                            icon: obsFormMarkerIcon,
                        }).addTo(formMap);
                        this.coords = L.point(e.latlng.lng, e.latlng.lat);
                        this.updateMunicipality();
                        this.obsForm.patchValue({ geometry: this.coords });
                    }
                });

                this.mapVars = {
                    minimapMarker: myMarker,
                };
            });
    }

    updatejsfInputObject() {
        this.jsfInputObject = {
            ...this.customForm.json_schema,
            data: this.jsonData,
        };
    }

    updateMunicipality() {
        if (this.coords) {
            this._refGeoService
                .getMunicipality(this.coords.y, this.coords.x)
                .toPromise()
                .then((municipality) => (this.municipality = municipality))
                .catch((err) => console.error(err));
        }
    }

    intiForm() {
        this.obsForm = this.formBuilder.group(
            {
                cd_nom: ['', Validators.required],
                count: [1, Validators.required],
                comment: [''],
                date: [
                    {
                        year: this.today.getFullYear(),
                        month: this.today.getMonth() + 1,
                        day: this.today.getDate(),
                    },
                    [Validators.required, ngbDateMaxIsToday()],
                ],
                geometry: [
                    this.data.coords ? this.coords : '',
                    [Validators.required, geometryValidator()],
                ],
                municipality: [''],
                id_program: [this.program_id],
                email: [{ value: '', disabled: true }],
                agreeContactRGPD: [''],
            }
            //{ updateOn: "submit" }
        );
    }

    patchForm(updateData) {
        console.log("updateData", updateData)
        const taxon = updateData.taxon || {
            media: updateData.taxref.media_url,
            taxref: updateData.taxref,
        };
        this.onTaxonSelected(taxon);
        updateData.photos.forEach((p) => {
            p.checked = false;
        });
        this.obsForm.patchValue({
            count: updateData.count,
            comment: updateData.comment,
            date: this.dateParser.parse(updateData.date),
            geometry: this.data.coords ? this.coords : '',
            id_program: updateData.program_id,
        });
    }


    // TODO: [LIMIT100-TAXON-COMPAT-THV2] normalement à enlever
    // inputAutoCompleteSetup = () => {
    //     for (let taxon in this.taxa) {
    //         for (let field of taxonAutocompleteFields) {
    //             if (this.taxa[taxon]['taxref'][field]) {
    //                 this.species.push({
    //                     name:
    //                         field === 'cd_nom'
    //                             ? `${this.taxa[taxon]['taxref']['cd_nom']} - ${this.taxa[taxon]['taxref']['nom_complet']}`
    //                             : this.taxa[taxon]['taxref'][field],
    //                     cd_nom: this.taxa[taxon]['taxref']['cd_nom'],
    //                     icon:
    //                         this.taxa[taxon]['medias'].length >= 1
    //                             ? // ? this.taxa[taxon]["medias"][0]["url"]
    //                               MainConfig.API_TAXHUB +
    //                               '/tmedias/thumbnail/' +
    //                               this.taxa[taxon]['medias'][0]['id_media'] +
    //                               '?h=20'
    //                             : 'assets/default_image.png',
    //                 });
    //             }
    //         }
    //     }
    //     this.autocomplete = 'isOn';
    // };

    // TODO: [LIMIT100-TAXON-COMPAT-THV2] normalement à enlever
    // inputAutoCompleteSearch = (text$: Observable<string>) =>
    //     text$.pipe(
    //         debounceTime(200),
    //         distinctUntilChanged(),
    //         map((term) =>
    //             term === '' // term.length < n
    //                 ? []
    //                 : this.species
    //                       .filter(
    //                           (v) =>
    //                               v['name']
    //                                   .toLowerCase()
    //                                   .indexOf(term.toLowerCase()) > -1
    //                           // v => new RegExp(term, "gi").test(v["name"])
    //                       )
    //                       .slice(0, taxonAutocompleteMaxResults)
    //         )
    //     );

    inputAutoCompleteFormatter = (x: { name: string }) => x.name;
    disabledDates = (date: NgbDate, current: { month: number }) => {
        const date_impl = new Date(date.year, date.month - 1, date.day);
        return date_impl > this.today;
    };

    onTaxonSelected(taxon: any): void {
        this.selectedTaxon = taxon;
        console.log('onTaxonSelected', taxon);
        this.obsForm.controls['cd_nom'].patchValue({
            cd_nom: taxon.taxref['cd_nom'],
            name: this.getPreferredName(taxon),
        });
    }

    onChangeContactCheckBoxRGPD(): void {
        this.obsForm.controls['agreeContactRGPD'].value
            ? this.obsForm.controls['email'].enable()
            : this.obsForm.controls['email'].disable();
        this.obsForm.controls['email'].setValue('');
    }

    isSelectedTaxon(taxon: any): boolean {
        if (this.selectedTaxon)
            return this.selectedTaxon.taxref.cd_nom === taxon.taxref.cd_nom;
    }

    onFormSubmit(): void {
        this.postObservation();
    }

    creatFromDataToPost(): FormData {
        this.obsForm.controls['id_program'].patchValue(this.program_id);
        let formData: FormData = new FormData();

        const files = this.photos;
        files.forEach((file) => {
            formData.append('file', file, file.name);
        });

        formData.append(
            'geometry',
            JSON.stringify(this.obsForm.get('geometry').value)
        );
        const taxon = this.obsForm.get('cd_nom').value;
        let cd_nom = Number.parseInt(taxon);
        if (isNaN(cd_nom)) {
            cd_nom = Number.parseInt(taxon.cd_nom);
        }
        // const taxon_name = this.selectedTaxon.nom_francais ? this.selectedTaxon.nom_francais : this.selectedTaxon.taxref.nom_vern;
        const taxon_name = taxon.name
        console.log('taxon_name', taxon_name);
        formData.append('cd_nom', cd_nom.toString());
        formData.append('name', taxon_name);
        const obsDateControlValue = NgbDate.from(
            this.obsForm.controls.date.value
        );
        const obsDate = new Date(
            obsDateControlValue.year,
            obsDateControlValue.month - 1,
            obsDateControlValue.day
        );
        const normDate = new Date(
            obsDate.getTime() - obsDate.getTimezoneOffset() * 60 * 1000
        )
            .toISOString()
            .match(/\d{4}-\d{2}-\d{2}/)[0];
        formData.append('date', normDate);
        if (this.municipality !== undefined && this.municipality != null) {
            // If municipality is not present, let the backend find
            // the municipality. So only append municipality if defined
            formData.append('municipality', this.municipality);
        }
        for (let item of ['count', 'comment', 'id_program', 'email']) {
            formData.append(item, this.obsForm.get(item).value);
        }
        return formData;
    }

    postObservation() {
        let obs: ObservationFeature;
        const formData = this.creatFromDataToPost();
        if (this.customForm.json_schema) {
            formData.append('json_data', JSON.stringify(this.jsonData));
        }
        this.observationsService.postObservation(formData).subscribe(
            (data: PostObservationResponse) => {
                obs = data.features[0];
                if (obs.properties.observer) {
                    obs.properties.observer.userAvatar =
                        localStorage.getItem('userAvatar');
                }
                this.newObservation.emit(obs);
                this.data.service.setModalCloseSatus('newObs');
            },
            (err) => console.error(err)
        );
    }

    onFormUpdate(): void {
        let formData = this.creatFromDataToPost();
        formData.append(
            'id_observation',
            this.data.updateData.id_observation.toString()
        );
        if (this.customForm.json_schema) {
            formData.append('json_data', JSON.stringify(this.jsonData));
        }
        const id_media_to_delete = this.data.updateData.photos
            .filter((p) => p.checked)
            .map((p) => p.id_media);
        formData.append('delete_media', JSON.stringify(id_media_to_delete));
        this.observationsService.updateObservation(formData).subscribe(() => {
            this.data.service.closeModal();
            this.data.service.setModalCloseSatus('updateObs');
        });
    }

    isLoggedIn(): Observable<boolean> {
        return this.auth.authorized$.pipe(
            map((value) => {
                return value;
            })
        );
    }

    customFormOnChange(e) {
        this.jsonData = e;
    }

    addImage(event) {
        this.photos.push(event.file);
    }
    deleteImage(event) {
        for (var i = 0; i < this.photos.length; i++) {
            if (this.photos[i] == event.file) {
                this.photos.splice(i, 1);
            }
        }
    }

    maxPhotos() {
        let resp = 5;
        if (this.data.updateData) {
            resp =
                resp -
                this.data.updateData.photos.filter((p) => !p.checked).length;
        }
        return resp;
    }

    jsonValidationErrors(data) {
        this.jsonErrors = data;
    }

    yourIsValidFn(data) {
        this.jsonValid = data;
    }

    isValid() {
        let resp = this.obsForm.valid;
        if (this.customForm.json_schema) resp = resp && this.jsonValid;
        return resp;
    }

    // TODO:  change this to reset objForm or remove this and check if form is invalid
    targetChanges() {
        // Subscribe to specific control changes
        this.obsForm.get('cd_nom').valueChanges.subscribe((cd_nom) => {
            // Handle changes to the 'firstName' control
            console.log('First cd_nom changed:', cd_nom);

            // Apply changes based on 'firstName' value (example)
            if (cd_nom === '') {
                this.selectedTaxon = '';
                // Apply specific changes
            }
        });
    }

    onSelectedTaxon(taxon) {
        this.programService
            .getTaxonInfoByCdNom(taxon.item['cd_nom'])
            .subscribe((taxonFullInfo) => {
                console.log('taxonFullInfo', taxonFullInfo);
                const taxonWithTaxhubInfos= this._taxhubService.setMediasAndAttributs(taxonFullInfo)
                this.selectedTaxon = taxonWithTaxhubInfos[0];
                this.obsForm.controls['cd_nom'].patchValue({
                    cd_nom: this.selectedTaxon['cd_nom'],
                    name:this.getPreferredName(this.selectedTaxon),
                    icon:
                        this.selectedTaxon['medias'].length >= 1
                            ? // ? this.taxa[taxon]["medias"][0]["url"]
                              MainConfig.API_TAXHUB +
                              '/tmedias/thumbnail/' +
                              this.selectedTaxon['medias']['id_media'] +
                              '?h=20'
                            : 'assets/default_image.png',
                });
            });
    }

    getPreferredName(taxon: any): string {
        const priorityAttributes = [
            'nom_francais',
            'taxref.nom_vern',
            'taxref.nom_valide',
            'taxref.nom_complet',
            'taxref.lb_nom',
            'taxref.cd_nom',
        ];
    
        for (const attributePath of priorityAttributes) {
            const value = this.getValueFromPath(taxon, attributePath);
            if (value) {
                return value;
            }
        }
    
        return 'Unknown';
    }
    
    private getValueFromPath(obj: any, path: string): any {
        return path.split('.').reduce((acc, key) => acc && acc[key], obj);
    }
}
