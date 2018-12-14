import { TestBed } from '@angular/core/testing';

import { GncProgramsService } from './gnc-programs.service';

describe('GncProgramsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GncProgramsService = TestBed.get(GncProgramsService);
    expect(service).toBeTruthy();
  });
});
