import { TestBed } from '@angular/core/testing';

import { ProgramsResolveService } from './programs-resolve.service';

describe('ProgramsResolveService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ProgramsResolveService = TestBed.get(ProgramsResolveService);
    expect(service).toBeTruthy();
  });
});
