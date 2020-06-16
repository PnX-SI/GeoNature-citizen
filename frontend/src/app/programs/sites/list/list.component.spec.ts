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

import { SitesListComponent } from './list.component';

describe('SitesListComponent', () => {
  let component: SitesListComponent;
  let fixture: ComponentFixture<SitesListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        NgbModule.forRoot(),
        HttpClientTestingModule,
        RouterTestingModule,],
      providers: [
        NgbModal,
      ],
      declarations: [ SitesListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SitesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
