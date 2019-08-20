import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap"

import { DescModalComponent } from './desc-modal.component';

describe('DescModalComponent', () => {
  let component: DescModalComponent;
  let fixture: ComponentFixture<DescModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
      ],
      providers: [
        NgbActiveModal,
      ],
      declarations: [ DescModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DescModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
