import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SpeciesSiteFormComponent } from './species_site_form.component';

describe('SpeciesSiteFormComponent', () => {
    let component: SpeciesSiteFormComponent;
    let fixture: ComponentFixture<SpeciesSiteFormComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [SpeciesSiteFormComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SpeciesSiteFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
