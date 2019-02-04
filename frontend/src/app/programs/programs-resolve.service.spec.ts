import { TestBed } from '@angular/core/testing';

import { ProgramsResolve } from './programs-resolve.service';

describe('ProgramsResolve', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ProgramsResolve = TestBed.get(ProgramsResolve);
    expect(service).toBeTruthy();
  });
});
