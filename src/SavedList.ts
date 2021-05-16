import createElement from './utils/createElement';
import * as Storage from './Storage';
import prettyDate from './utils/prettyDate';
import { exportSaved, importSaved } from './utils/importExportSaved';

// TODO: This should just extend from Dialog
// TODO: add search
class SavedList {
  // TODO: might need to separate these backdrops into a new class
  backdrop = createElement('div', {
    className: 'backdrop dialog-backdrop',
  });

  dialog = createElement('div', {
    className: 'popup dialog saved-list',
  });

  dialogBody = createElement('div', {
    className: 'dialog-body',
  });

  dialogFooter = createElement('footer', {
    className: 'dialog-footer',
  });

  exportButton: HTMLButtonElement;

  importButton: HTMLButtonElement;

  /** used for tests */
  closeButton: HTMLButtonElement;

  clickCallback: (si: Storage.SavedItem) => void | boolean = () => {};

  editCallback: (si: Storage.SavedItem) => void | boolean = () => {};

  deleteCallback: (si: Storage.SavedItem) => void | boolean = () => {};

  closeCallback: () => void = () => {};

  // TODO: might be able to extend from Dialog.ts
  constructor(title: string) {
    this.dialog.setAttribute('role', 'dialog');

    this.dialog.appendChild(
      createElement('header', {
        className: 'dialog-header',
        innerHTML: title,
      })
    );

    this.backdrop.addEventListener('click', ({ target }) => {
      if (target === this.backdrop) {
        this.close();
      }
    });

    // add action buttons to footer
    this.exportButton = createElement('button', {
      className: 'button',
      type: 'button',
      innerHTML: 'Export',
      onclick: exportSaved,
    });

    this.importButton = createElement('button', {
      className: 'button',
      type: 'button',
      innerHTML: 'import',
      onclick: async () => {
        try {
          await importSaved();
          window.gtag('event', 'menu:view-saved:import', {
            event_category: 'menu',
          });
        } catch (e) {
          // TODO: add sentry
          window.gtag('event', 'menu:view-saved:import-failed', {
            event_category: 'menu',
          });
        } finally {
          this.refreshList();
        }
      },
    });

    this.closeButton = createElement('button', {
      className: 'button',
      type: 'button',
      innerHTML: 'Close',
      onclick: () => {
        this.close();
      },
    });

    this.refreshList();

    this.dialogFooter.appendChild(this.exportButton);
    this.dialogFooter.appendChild(this.importButton);
    this.dialogFooter.appendChild(this.closeButton);
    this.dialog.appendChild(this.dialogBody);
    this.dialog.appendChild(this.dialogFooter);
    this.backdrop.appendChild(this.dialog);
  }

  getSaved = (): HTMLElement[] => {
    const saved = Storage.getInfo();

    return saved.data.map(this.formatSaved);
  };

  formatSaved = (savedItem: Storage.SavedItem) => {
    const { name, created } = savedItem;
    const listitem = createElement('li', {
      className: 'saved-item',
      onclick: () => {
        this.clickCallback(savedItem);
        this.close();
      },
    });

    const loadButton = createElement('span', {
      className: 'saved-title-container',
    });

    const title = createElement('span', {
      className: 'saved-title',
      innerHTML: name,
    });

    const createdElem = createElement('span', {
      className: 'saved-date-created',
      innerHTML: prettyDate(created),
      title: new Date(created).toLocaleString(),
    });

    loadButton.appendChild(title);
    loadButton.appendChild(createdElem);

    const edit = createElement('button', {
      className: 'edit-saved',
      innerHTML: '✏️',
      onclick: (e) => {
        // button is inside of view button :D
        e.stopImmediatePropagation();
        this.editCallback(savedItem);
      },
    });

    const deleteItem = createElement('button', {
      className: 'delete-saved',
      innerHTML: '🗑',
      onclick: (e) => {
        // button is inside of view button :D
        e.stopImmediatePropagation();
        this.deleteCallback(savedItem);
      },
    });

    listitem.appendChild(loadButton);
    listitem.appendChild(edit);
    listitem.appendChild(deleteItem);

    return listitem;
  };

  destroy() {
    this.backdrop.parentNode?.removeChild(this.backdrop);
  }

  onClick = (cb: this['clickCallback']): this => {
    this.clickCallback = cb;

    return this;
  };

  onEdit = (cb: this['editCallback']): this => {
    this.editCallback = cb;

    return this;
  };

  onDelete = (cb: this['deleteCallback']): this => {
    this.deleteCallback = cb;

    return this;
  };

  onClose = (cb: () => void): this => {
    this.closeCallback = cb;

    return this;
  };

  open() {
    document.body.appendChild(this.backdrop);
  }

  close() {
    this.closeCallback();
    this.destroy();
  }

  clearList() {
    for (const child of Array.from(this.dialogBody.children)) {
      child.parentNode?.removeChild(child);
    }
  }

  refreshList() {
    const savedItems = this.getSaved();
    const isEmpty = savedItems.length === 0;

    this.exportButton.disabled = isEmpty;

    this.clearList();

    if (isEmpty) {
      const emptyList = createElement('div', {
        className: 'empty-list',
        innerHTML: 'Nothing saved',
      });

      this.dialogBody.appendChild(emptyList);
    } else {
      // add list
      const savedList = createElement('ul', {
        className: 'saved-list',
      });

      for (const item of savedItems) {
        savedList.appendChild(item);
      }

      this.dialogBody.appendChild(savedList);
    }
  }
}

export default SavedList;
