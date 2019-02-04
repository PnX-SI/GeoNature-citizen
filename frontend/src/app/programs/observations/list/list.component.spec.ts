import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing'
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import {
  NgbModule ,
  NgbModal,
} from "@ng-bootstrap/ng-bootstrap";

import { SightsListComponent } from './list.component';

describe('SightsListComponent', () => {
  let component: SightsListComponent;
  let fixture: ComponentFixture<SightsListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        NgbModule.forRoot(),
        HttpClientTestingModule,
        RouterTestingModule,],
      providers: [
        NgbModal,
      ],
      declarations: [ SightsListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SightsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
