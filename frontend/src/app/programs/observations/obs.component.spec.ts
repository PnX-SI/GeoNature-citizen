import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing'
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing'
import { ReactiveFormsModule } from '@angular/forms'
import {
  NgbModule ,
  NgbModal,
} from "@ng-bootstrap/ng-bootstrap"

import { SightsFormComponent } from "./form/form.component"
import { SightsListComponent } from "./list/list.component"
import { ObsMapComponent } from "./map/map.component"
import { ObsComponent } from './obs.component'

describe('ObsComponent', () => {
  let component: ObsComponent;
  let fixture: ComponentFixture<ObsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        ReactiveFormsModule,
        RouterTestingModule,
        NgbModule.forRoot(),
      ],
      providers: [
        NgbModal,
      ],
      declarations: [
        ObsComponent,
        SightsFormComponent,
        SightsListComponent,
        ObsMapComponent,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ObsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
