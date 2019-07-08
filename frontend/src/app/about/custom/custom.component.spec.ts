import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutCustomComponent } from './custom.component';

describe('AboutCustomComponent', () => {
  let component: AboutCustomComponent;
  let fixture: ComponentFixture<AboutCustomComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AboutCustomComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AboutCustomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
