import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SiteformComponent } from './siteform.component';

describe('SiteformComponent', () => {
  let component: SiteformComponent;
  let fixture: ComponentFixture<SiteformComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SiteformComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SiteformComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
