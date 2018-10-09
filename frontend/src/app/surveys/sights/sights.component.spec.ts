import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SightsComponent } from './sights.component';

describe('SightsComponent', () => {
  let component: SightsComponent;
  let fixture: ComponentFixture<SightsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SightsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SightsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
