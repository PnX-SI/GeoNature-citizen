import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AreaFormComponent } from './areaform.component';

describe('AreaFormComponent', () => {
    let component: AreaFormComponent;
    let fixture: ComponentFixture<AreaFormComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [AreaFormComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AreaFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
