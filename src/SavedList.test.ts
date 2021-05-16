import SavedList from './SavedList';

describe('SavedList', () => {
  const title = 'Do you have a title?';
  let savedList: SavedList;

  beforeEach(() => {
    savedList = new SavedList(title);
  });

  it('has a title', () => {
    expect(savedList.dialog?.textContent).toContain(title);
  });

  it('has a cancel button', () => {
    expect(savedList.dialog?.textContent).toContain('Close');
  });

  it('is added to document', () => {
    savedList.open();
    expect(document.querySelectorAll('button')).toHaveLength(3);
  });

  it('can dismiss the dialog with the cancel button', () => {
    jest.spyOn(SavedList.prototype, 'close');
    savedList.closeButton.click();
    expect(savedList.close).toHaveBeenCalled();
  });

  it('calls onClose after close button click', () => {
    const onClose = jest.fn();
    savedList.onClose(onClose);
    savedList.closeButton.click();
    expect(onClose).toHaveBeenCalled();
  });
});
