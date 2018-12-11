import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeCustomComponent } from './custom.component';

describe('HomeCustomComponent', () => {
  let component: HomeCustomComponent;
  let fixture: ComponentFixture<HomeCustomComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HomeCustomComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeCustomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
