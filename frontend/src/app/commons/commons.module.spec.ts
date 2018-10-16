import { CommonsModule } from './commons.module';

describe('CommonsModule', () => {
  let commonsModule: CommonsModule;

  beforeEach(() => {
    commonsModule = new CommonsModule();
  });

  it('should create an instance', () => {
    expect(commonsModule).toBeTruthy();
  });
});
