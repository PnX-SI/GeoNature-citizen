import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing'
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing'

import { ObsMapComponent } from './map.component';

describe('ObsMapComponent', () => {
  let component: ObsMapComponent;
  let fixture: ComponentFixture<ObsMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
      ],
      declarations: [ ObsMapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ObsMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
