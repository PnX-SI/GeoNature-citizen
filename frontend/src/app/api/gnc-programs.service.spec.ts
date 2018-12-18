import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing'

import { GncProgramsService } from './gnc-programs.service';

describe('GncProgramsService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [
      HttpClientTestingModule,
    ]
  }));

  it('should be created', () => {
    const service: GncProgramsService = TestBed.get(GncProgramsService);
    expect(service).toBeTruthy();
  });
});
