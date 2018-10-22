import { TestBed } from '@angular/core/testing';

import { TaxhubService } from './taxhub.service';

describe('TaxhubService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TaxhubService = TestBed.get(TaxhubService);
    expect(service).toBeTruthy();
  });
});
