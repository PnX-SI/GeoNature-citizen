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
import { SightsMapComponent } from "./map/map.component"
import { SightsComponent } from './sights.component'

describe('SightsComponent', () => {
  let component: SightsComponent;
  let fixture: ComponentFixture<SightsComponent>;

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
        SightsComponent,
        SightsFormComponent,
        SightsListComponent,
        SightsMapComponent,
      ]
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
