import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SightsMapComponent } from './map.component';

describe('SightsMapComponent', () => {
  let component: SightsMapComponent;
  let fixture: ComponentFixture<SightsMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SightsMapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SightsMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
