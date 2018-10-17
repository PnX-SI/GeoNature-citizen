import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SurveysComponent } from './programs.component';

describe('SurveysComponent', () => {
  let component: SurveysComponent;
  let fixture: ComponentFixture<SurveysComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SurveysComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SurveysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
