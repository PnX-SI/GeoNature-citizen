import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import {RouterTestingModule} from '@angular/router/testing'
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing'
import { FormsModule } from '@angular/forms'
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap"

import { AuthService } from "../../auth/auth.service"
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        FormsModule,
      ],
      providers: [
        AuthService,
        NgbActiveModal,
      ],
      declarations: [ RegisterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
