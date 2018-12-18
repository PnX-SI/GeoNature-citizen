import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutFixedComponent } from './fixed.component';

describe('AboutFixedComponent', () => {
  let component: AboutFixedComponent;
  let fixture: ComponentFixture<AboutFixedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AboutFixedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AboutFixedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
