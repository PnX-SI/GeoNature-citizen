import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import {
    HttpClientTestingModule,
    HttpTestingController,
} from '@angular/common/http/testing';
import {
    NgbModule,
    NgbActiveModal,
    NgbModal,
} from '@ng-bootstrap/ng-bootstrap';

import { UtilsService } from '../api/utils.service';
import { GncProgramsService } from '../api/gnc-programs.service';

import { ProgramsComponent } from './programs.component';

describe('ProgramsComponent', () => {
    let component: ProgramsComponent;
    let fixture: ComponentFixture<ProgramsComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, RouterTestingModule],
            providers: [UtilsService, GncProgramsService, NgbModal],
            declarations: [ProgramsComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ProgramsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
