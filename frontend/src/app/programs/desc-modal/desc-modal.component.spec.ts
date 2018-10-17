import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DescModalComponent } from './desc-modal.component';

describe('DescModalComponent', () => {
  let component: DescModalComponent;
  let fixture: ComponentFixture<DescModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
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
