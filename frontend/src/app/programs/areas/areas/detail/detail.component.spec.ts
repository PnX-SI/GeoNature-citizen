import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AreaDetailComponent } from './detail.component';

describe('AreaDetailComponent', () => {
    let component: AreaDetailComponent;
    let fixture: ComponentFixture<AreaDetailComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [AreaDetailComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AreaDetailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
