import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardMapComponent } from './map.component';

describe('DashboardMapComponent', () => {
    let component: DashboardMapComponent;
    let fixture: ComponentFixture<DashboardMapComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [DashboardMapComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DashboardMapComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
