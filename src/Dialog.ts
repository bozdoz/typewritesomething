import createElement from "./utils/createElement";

let inputCount = 0;

// TODO: add click on backdrop to close
class Dialog {
  backdrop = createElement("div", {
    className: "backdrop dialog-backdrop",
  });

  dialog = createElement("div", {
    className: "popup dialog",
  });

  dialogForm = createElement("form", {
    onsubmit: (e: Event) => {
      e.preventDefault();
      this.handleSubmit();
    },
  });

  dialogFooter = createElement("div", {
    className: "dialog-footer",
  });

  /** used for tests */
  submitButton: HTMLButtonElement;

  /** used for tests */
  cancelButton: HTMLButtonElement;

  // deno-lint-ignore no-explicit-any
  submitCallback: (a: any) => void | boolean = () => {};

  cancelCallback: () => void | boolean = () => {};

  closeCallback: () => void = () => {};

  constructor(
    title: string,
    {
      submit = "OK",
      cancel = "Cancel",
    }: {
      submit?: string;
      cancel?: string;
    } = { submit: "OK", cancel: "Cancel" },
  ) {
    this.dialog.setAttribute("role", "dialog");

    this.dialog.appendChild(
      createElement("header", {
        className: "dialog-header",
        innerHTML: title,
      }),
    );

    const dialogBody = createElement("div", {
      className: "dialog-body",
    });

    dialogBody.appendChild(this.dialogForm);

    this.dialog.appendChild(dialogBody);

    this.submitButton = createElement("button", {
      className: "button button-primary",
      type: "button",
      innerHTML: submit,
      onclick: this.handleSubmit,
    });

    this.cancelButton = createElement("button", {
      className: "button",
      type: "button",
      innerHTML: cancel,
      onclick: () => {
        // TODO: test this is called
        this.cancelCallback();
        this.close();
      },
    });

    this.dialogFooter.appendChild(this.cancelButton);
    this.dialogFooter.appendChild(this.submitButton);

    this.dialog.appendChild(this.dialogFooter);
    this.backdrop.appendChild(this.dialog);
  }

  get formData() {
    const inputs = Array.from(this.dialogForm.elements) as HTMLInputElement[];
    // deno-lint-ignore no-explicit-any
    const obj: Record<string, any> = {};

    for (const input of inputs) {
      obj[input.name] = input.value;
    }

    return obj;
  }

  addFormElement = (label: string, elem: HTMLElement): this => {
    inputCount += 1;
    elem.setAttribute("id", `dialog-input-${inputCount}`);

    const labelElem = createElement("label", {
      htmlFor: elem.id,
      innerHTML: label,
    });

    this.dialogForm.appendChild(labelElem);
    this.dialogForm.appendChild(elem);

    return this;
  };

  addInput(label: string, atts?: Partial<Writable<HTMLInputElement>>): this {
    const input = createElement("input", atts);

    return this.addFormElement(label, input);
  }

  addTextArea(
    label: string,
    atts?: Partial<Writable<HTMLTextAreaElement>>,
  ): this {
    const textarea = createElement("textarea", atts);

    return this.addFormElement(label, textarea);
  }

  handleSubmit = () => {
    if (this.submitCallback(this.formData) !== false) {
      this.close();
    }
  };

  // deno-lint-ignore no-explicit-any
  onSubmit = <T extends Record<string, any>>(
    cb: (arg: T) => boolean | void,
  ): this => {
    this.submitCallback = cb;

    return this;
  };

  onCancel = (cb: this["cancelCallback"]): this => {
    this.cancelCallback = cb;

    return this;
  };

  onClose = (cb: () => void): this => {
    this.closeCallback = cb;

    return this;
  };

  open() {
    document.body.appendChild(this.backdrop);

    const firstInput = this.dialogForm.querySelector("input, textarea") as
      | HTMLInputElement
      | HTMLTextAreaElement;

    firstInput?.focus();
    firstInput?.select();
  }

  close() {
    this.closeCallback();
    this.backdrop?.parentNode?.removeChild(this.backdrop);
  }
}

export default Dialog;
