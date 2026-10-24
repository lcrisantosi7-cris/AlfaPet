import { useRef, useState, type ComponentProps } from "react";
import { createPortal } from "react-dom";
import { Form } from "react-router";
import { ConfirmDialog, type ConfirmCopy } from "./ConfirmDialog";

interface ConfirmFormProps extends ComponentProps<typeof Form> {
    confirm: ConfirmCopy;
}

export function ConfirmForm({ confirm, onSubmit, children, ...props }: ConfirmFormProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const approved = useRef(false);
    const [open, setOpen] = useState(false);

    return (
        <>
            <Form
                {...props}
                ref={formRef}
                onSubmit={(event) => {
                    if (approved.current) {
                        approved.current = false;
                        onSubmit?.(event);
                        return;
                    }
                    event.preventDefault();
                    setOpen(true);
                }}
            >
                {children}
            </Form>
            {open &&
                createPortal(
                    <ConfirmDialog
                        {...confirm}
                        onCancel={() => setOpen(false)}
                        onConfirm={() => {
                            setOpen(false);
                            approved.current = true;
                            formRef.current?.requestSubmit();
                        }}
                    />,
                    document.body,
                )}
        </>
    );
}