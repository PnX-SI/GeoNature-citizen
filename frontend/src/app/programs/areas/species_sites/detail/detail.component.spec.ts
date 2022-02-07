import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SpeciesSiteDetailComponent } from './detail.component';

describe('AreaDetailComponent', () => {
    let component: SpeciesSiteDetailComponent;
    let fixture: ComponentFixture<SpeciesSiteDetailComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [SpeciesSiteDetailComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SpeciesSiteDetailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
