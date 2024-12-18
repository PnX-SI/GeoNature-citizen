import {
    Component,
    ElementRef,
    EventEmitter,
    HostListener,
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
import { TaxonBase } from '../programs/observations/observation.model';



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
    @Input() displayedLabel = 'search_name';
    /** Afficher ou non les filtres par regne et groupe INPN qui controle l'autocomplétion */
    @Input() placeholder = '';
    isInvalidDirty = false;
    noResult: boolean;
    isTouched:boolean;
    isLoading = false;
    isValid = false; 
    value: string = ''; // Valeur actuelle du champ
    @Output() onChange = new EventEmitter<NgbTypeaheadSelectItemEvent>(); // renvoie l'evenement, le taxon est récupérable grâce à e.item
    
    public config = MainConfig;
    constructor(private _dfService: DataFormService) {}

    ngOnInit() {
        if (!this.apiEndPoint) {
            this.setApiEndPoint(this.idList);
        }
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

    formatter = (taxon: any) => {

    // Liste des priorités pour les labels
    const priorityAttributes = [
        this.displayedLabel,
        'nom_vern',
        'nom_valide',
        'lb_nom',
        'search_name',
        'name',
    ];

    // Trouver le premier attribut valide
    const validLabel = priorityAttributes.find(attr => taxon[attr]);
    this.displayedLabel = validLabel || 'No name associated';

    if (!validLabel) {
        return '';
    }

    // Supprimer les balises HTML avant de retourner la valeur
    return taxon[validLabel].replace(/<[^>]*>/g, '');
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
                            limit: this.listLength.toString(),
                        })
                        .pipe(
                            catchError(() => {
                                return of([]);
                            })
                        );
                } else {
                    this.isLoading = false;
                    this.noResult = true; 
                    return [[]];
                }
            }),
            map((response) => {
                this.noResult = response.length === 0;
                this.isLoading = false;
                return response;
            })
        );

taxonSelected(event: any) {
    this.isValid = true;
    this.onChange.emit(event);
  }

  onInputBlur() {
    if (!this.isValid) {
      this.isTouched = true;
      this.parentFormControl.setValue('');
    }
  }

  onInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.value = input.value;
    if (this.value.trim().length === 0) {
      this.isValid = false;
      this.parentFormControl.setValue('');
    }
  }



}
