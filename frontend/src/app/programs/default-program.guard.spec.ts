import { TestBed, async, inject } from '@angular/core/testing';

import { UniqueProgramGuard } from './default-program.guard';

describe('UniqueProgramGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UniqueProgramGuard]
    });
  });

  it('should ...', inject([UniqueProgramGuard], (guard: UniqueProgramGuard) => {
    expect(guard).toBeTruthy();
  }));
});
