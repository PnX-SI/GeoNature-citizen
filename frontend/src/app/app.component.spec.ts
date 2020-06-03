import { TestBed, async } from '@angular/core/testing';
import {RouterTestingModule} from '@angular/router/testing'
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing'

import { AppConfig } from "../conf/app.config";
import { AppComponent } from './app.component'
import { TopbarComponent } from "./core/topbar/topbar.component"
import { AuthService } from "./auth/auth.service";
import { FooterComponent } from "./core/footer/footer.component"


// class MockRouter { public navigate() {}; }

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService
      ],
      declarations: [
        AppComponent,
        TopbarComponent,
        FooterComponent
      ],
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
      ]
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title '${AppConfig.appName}'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual(AppConfig.appName);
  });

  it('should render title in an anchor tag', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('header nav a').textContent).toContain(AppConfig.appName);
  });
});
