import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteDetailComponent } from './detail.component';

describe('SiteDetailComponent', () => {
    let component: SiteDetailComponent;
    let fixture: ComponentFixture<SiteDetailComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [SiteDetailComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SiteDetailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
