import {
    Component,
    OnChanges,
    Input,
    EventEmitter,
    Output,
    ViewChild,
    ElementRef,
    OnInit,
} from '@angular/core';

import { FeatureCollection, Feature } from 'geojson';
import { AreaModalFlowService } from '../../modalflow/modalflow.service';
import { UserService } from '../../../../auth/user-dashboard/user.service.service';
import { AreaService } from '../../areas.service';
import { AppConfig } from '../../../../../conf/app.config';
import * as L from 'leaflet';
import { ModalsTopbarService } from '../../../../core/topbar/modalTopbar.service';
import { GncProgramsService } from '../../../../api/gnc-programs.service';
import { share, tap } from 'rxjs/operators';

@Component({
    selector: 'app-areas-list',
    templateUrl: './list.component.html',
    styleUrls: ['./list.component.css'],
})
export class AreasListComponent implements OnChanges, OnInit {
    @Input('areas') areasCollection: FeatureCollection;
    @Input('userDashboard') userDashboard = false;
    @Input('admin') admin = false;
    @Input('program_id') program_id: number;
    @Input('displayForm') display_form: boolean;
    @Output('areaSelect') areaSelect: EventEmitter<Feature> =
        new EventEmitter();
    @ViewChild('deleteAreaModal', { static: true }) deleteAreaModal: ElementRef;

    municipalities: string[] = [];
    areas = [];
    taxa: any[] = [];
    programs: any[] = [];
    apiEndpoint = AppConfig.API_ENDPOINT;
    deletionModalRef;
    selectedAreaId = 0;

    selectedProgram = null;
    selectedMunicipality = null;

    constructor(
        public flowService: AreaModalFlowService,
        private userService: UserService,
        private programService: GncProgramsService,
        private modalService: ModalsTopbarService,
        private areaService: AreaService
    ) {}

    ngOnInit() {
        this.programService
            .getAllPrograms()
            .subscribe((programs) => (this.programs = programs));
    }

    onDeleteAreaModalOpen(selectedAreaId: number) {
        this.selectedAreaId = selectedAreaId;
        this.deletionModalRef = this.modalService.open(this.deleteAreaModal, {
            windowClass: 'delete-modal',
            centered: true,
        });
    }

    onDeleteArea() {
        this.areaService.deleteArea(this.selectedAreaId).subscribe(() => {
            this.areaService.areaDeleted.emit();
            this.selectedAreaId = null;
            this.deletionModalRef.close();
        });
    }

    ngOnChanges() {
        if (this.areasCollection) {
            this.areas = this.areasCollection['features'];

            this.areas.forEach((area) => {
                const areaCenter = L.geoJSON(area).getBounds().getCenter();
                area.properties.coords = new L.Point(
                    areaCenter.lng,
                    areaCenter.lat
                );
            });

            this.municipalities = this.areasCollection.features
                .map((area) => area.properties.municipality_data)
                .filter(
                    (municipality) => municipality && municipality.area_name
                )
                .filter(
                    (municipality, index, array) =>
                        array
                            .map((city) => city.area_name)
                            .indexOf(municipality.area_name) === index
                )
                .sort((a, b) =>
                    a.area_name > b.area_name
                        ? 1
                        : b.area_name > a.area_name
                        ? -1
                        : 0
                );
        }
    }

    onAddSpeciesSiteClick(area_id) {
        this.programService
            .getProgramTaxonomyList(this.program_id)
            .pipe(
                tap((species) => {
                    this.flowService.addAreaSpeciesSite(area_id, species);
                }),
                share()
            )
            .subscribe();
    }

    onAreaClick(e): void {
        this.areaSelect.emit(e);
    }

    onFilterChange(): void {
        this.areas = this.areasCollection['features'].filter((area) => {
            const sameMunicipality =
                !this.selectedMunicipality ||
                (area.properties.municipality_data &&
                    area.properties.municipality_data.area_code ===
                        this.selectedMunicipality.area_code);

            const sameProgram =
                !this.selectedProgram ||
                area.properties.id_program === this.selectedProgram.id_program;

            return sameMunicipality && sameProgram;
        });
    }
}
