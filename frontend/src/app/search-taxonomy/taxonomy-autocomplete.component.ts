import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnInit,
    Output,
    ViewEncapsulation,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbTypeaheadSelectItemEvent } from '@ng-bootstrap/ng-bootstrap';
import { Observable, of } from 'rxjs';
import {
    catchError,
    debounceTime,
    distinctUntilChanged,
    filter,
    map,
    switchMap,
    tap,
} from 'rxjs/operators';
import { DataFormService } from './data-form.service';
import { MainConfig } from '../../conf/main.config';
import { Taxref } from '../programs/observations/observation.model';



/**
 * Ce composant permet de créer un "input" de type "typeahead" pour rechercher des taxons à partir d'une liste définit dans schéma taxonomie. Table ``taxonomie.bib_listes`` et ``taxonomie.cor_nom_listes``.
 *
 *  @example
 * <taxonomy-autocomplete #taxon
 * label="{{ 'Taxon.Taxon' | translate }}
 * [parentFormControl]="occurrenceForm.controls.cd_nom"
 * [idList]="occtaxConfig.id_taxon_list"
 * [charNumber]="3"
 *  [listLength]="occtaxConfig.taxon_result_number"
 * (onChange)="fs.onTaxonChanged($event);"
 * [displayAdvancedFilters]=true>
 * <taxonomy-autocomplete>
 *
 * */
@Component({
    selector: 'taxonomy-autocomplete',
    templateUrl: './taxonomy-autocomplete.component.html',
    styleUrls: ['./taxonomy-autocomplete.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class SearchAutocompleteTaxonomyComponent implements OnInit, OnChanges {
    /**
     * Reactive form
     */
    @Input() parentFormControl: FormControl;
    @Input() label: string;
    // api endpoint for the automplete ressource
    @Input() apiEndPoint: string;
    /*** Id de la liste de taxon */
    @Input() idList: string;
    /** Nombre de charactere avant que la recherche AJAX soit lançé (obligatoire) */
    @Input() charNumber: number;
    // **ombre de résultat affiché */
    @Input() listLength = 20;
    // ** Pour changer la valeur affichée */
    @Input() displayedLabel = 'nom_vern';
    /** Afficher ou non les filtres par regne et groupe INPN qui controle l'autocomplétion */
    @Input() displayAdvancedFilters = false;
    @Input() isRequired = true;
    @Input() placeholder = '';
    isInvalidDirty = false;
    searchString: any;
    filteredTaxons: any;
    regnes = [];
    regneControl = new FormControl(null);
    groupControl = new FormControl(null);
    regnesAndGroup: any;
    noResult: boolean;
    isLoading = false;
    @Output() onChange = new EventEmitter<NgbTypeaheadSelectItemEvent>(); // renvoie l'evenement, le taxon est récupérable grâce à e.item
    @Output() onDelete = new EventEmitter<Taxref>();
    @Output() emptyInput: EventEmitter<boolean> = new EventEmitter<boolean>();

    public isCollapseTaxonomy = true;
    public config = MainConfig;
    constructor(private _dfService: DataFormService) {}

    ngOnInit() {
        if (!this.apiEndPoint) {
            this.setApiEndPoint(this.idList);
        }
        this.parentFormControl.valueChanges
            .pipe(
                tap((value: unknown) => {
                    if (
                        value === null ||
                        (typeof value === 'string' && value === '') ||
                        (Array.isArray(value) && value.length === 0)
                    ) {
                        this.markFormControlDirtyIfEmpty();
                        this.checkInputValidity();
                    }
                })
            )
            .subscribe((value: string | any[]) => {
                if (
                    !(
                        value === null ||
                        (typeof value === 'string' && value === '') ||
                        (Array.isArray(value) && value.length === 0)
                    )
                ) {
                    this.onDelete.emit();
                }
            });

        if (this.displayAdvancedFilters) {
            // get regne and group2
            this._dfService.getRegneAndGroup2Inpn().subscribe((data) => {
                this.regnesAndGroup = data;
                for (const regne in data) {
                    this.regnes.push(regne);
                }
            });
        }

        // put group to null if regne = null
        this.regneControl.valueChanges.subscribe((value) => {
            if (value === '') {
                this.groupControl.patchValue(null);
            }
        });
    }

    ngOnChanges(changes) {
        if (changes && changes.idList) {
            this.setApiEndPoint(changes.idList.currentValue);
        }
    }

    setApiEndPoint(idList) {
        if (idList) {
            this.apiEndPoint = `${this.config.API_TAXHUB}/taxref/allnamebylist/${idList}`;
        } else {
            this.apiEndPoint = `${this.config.API_TAXHUB}/taxref/allnamebylist`;
        }
    }

    taxonSelected(e: NgbTypeaheadSelectItemEvent) {
        this.onChange.emit(e);
    }

    formatter = (taxon: any) => {
        return taxon ? taxon[this.displayedLabel].replace(/<[^>]*>/g, ''): ''; // supprime les balises HTML
    };

    searchTaxon = (text$: Observable<string>) =>
        text$.pipe(
            distinctUntilChanged(),
            debounceTime(400),
            tap(() => (this.isLoading = true)),
            switchMap((search_name_) => {
                const search_name = search_name_.toString();
                if (search_name.length >= this.charNumber) {
                    return this._dfService
                        .autocompleteTaxon(this.apiEndPoint, search_name, {
                            regne: this.regneControl.value,
                            group2_inpn: this.groupControl.value,
                            limit: this.listLength.toString(),
                        })
                        .pipe(
                            catchError(() => {
                                return of([]);
                            })
                        );
                } else {
                    this.isLoading = false;
                    this.refreshAllInput();
                    return [[]];
                }
            }),
            map((response) => {
                this.noResult = response.length === 0;
                this.isLoading = false;
                return response;
            })
        );

    onInputBlur() {
        if (
            this.parentFormControl.value === '' ||
            this.parentFormControl.value === null
        ) {
            this.emptyInput.emit(true);
            this.checkInputValidity();
        } else {
            this.emptyInput.emit(false);
        }
    }

    refreshAllInput() {
        this.parentFormControl.reset();
        this.regneControl.reset();
        this.groupControl.reset();
    }

    markFormControlDirtyIfEmpty() {
        this.parentFormControl.markAsDirty();
    }

    checkInputValidity() {
        // Replace 'parentFormControl' with your actual FormControl name
        this.isInvalidDirty =
            this.parentFormControl.invalid && this.parentFormControl.dirty;
    }
}
