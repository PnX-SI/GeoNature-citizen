import { TestBed } from '@angular/core/testing'

import { AuthService } from './auth.service'
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing'
import {RouterTestingModule} from '@angular/router/testing'


describe('AuthService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [
      HttpClientTestingModule,
      RouterTestingModule,
    ],
    providers: [
      AuthService
    ],
  }));

  it('should be created', () => {
    const service: AuthService = TestBed.get(AuthService);
    expect(service).toBeTruthy();
  });
});
