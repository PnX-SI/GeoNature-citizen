import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement, NO_ERRORS_SCHEMA } from '@angular/core'
import { RouterTestingModule } from '@angular/router/testing'
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import {
  NgbModule ,
  NgbActiveModal,
  NgbDateStruct
} from "@ng-bootstrap/ng-bootstrap";

import { ObsFormComponent } from './form.component';

describe('ObsFormComponent', () => {
  let component: ObsFormComponent;
  let fixture: ComponentFixture<ObsFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        ReactiveFormsModule,
        FormsModule,
      ],
      providers: [
        NgbActiveModal,
      ],
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [ ObsFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ObsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
