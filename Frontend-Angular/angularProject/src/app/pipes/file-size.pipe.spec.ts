import { DocumentSizePipe } from './file-size.pipe';

describe('DocumentSizePipe', () => {
  it('create an instance', () => {
    const pipe = new DocumentSizePipe();
    expect(pipe).toBeTruthy();
  });
});
