import { useEffect, useRef, type FormEvent, type ReactNode } from 'react';

interface DialogProps {
  title: string;
  /** Called for Esc and the cancel button; the parent then stops rendering the dialog. */
  onClose: () => void;
  /** Called when the form is submitted (Enter or the submit button). */
  onSubmit: () => void;
  children: ReactNode;
  /** Buttons at the bottom; the submit button needs type="submit". */
  actions: ReactNode;
}

/**
 * Modal dialog based on the native <dialog> element: it keeps the keyboard focus inside,
 * closes with Esc and blocks the page behind it. Rendered only while it is open.
 */
export default function Dialog({ title, onClose, onSubmit, children, actions }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="dialog-title"
      onCancel={(event) => {
        // Esc: let React close the dialog, so its state stays in sync.
        event.preventDefault();
        onClose();
      }}
    >
      <form className="dialog__form" onSubmit={submit}>
        <h2 id="dialog-title" className="dialog__title">
          {title}
        </h2>
        <div className="dialog__body">{children}</div>
        <div className="dialog__actions">{actions}</div>
      </form>
    </dialog>
  );
}
