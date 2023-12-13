import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MediaGaleryComponent } from './media-galery.component';

describe('MediaGaleryComponent', () => {
  let component: MediaGaleryComponent;
  let fixture: ComponentFixture<MediaGaleryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MediaGaleryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MediaGaleryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
