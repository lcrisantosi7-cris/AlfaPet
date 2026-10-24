import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { cn } from "~/core/lib/cn";
import { capitalize } from "~/core/lib/format";

const CONTROL =
    "ui-field h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm placeholder:text-ink-muted aria-[invalid=true]:border-tone-orange-fg";

interface A11yProps {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby"?: string;
}

interface FieldProps {
    label: string;
    error?: string;
    required?: boolean;
    className?: string;
    children: (a11y: A11yProps) => ReactNode;
}

function Field({ label, error, required, className, children }: FieldProps) {
    const id = useId();
    const errorId = `${id}-error`;

    return (
        <div className={cn("flex flex-col gap-1.5", className)}>
            <label htmlFor={id} className="text-sm font-semibold">
                {label}
                {required && (
                    <span aria-hidden className="text-tone-orange-fg">
                        {" *"}
                    </span>
                )}
            </label>
            {children({ id, "aria-invalid": Boolean(error), "aria-describedby": error ? errorId : undefined })}
            {error && (
                <p id={errorId} className="text-xs text-tone-orange-fg">
                    {error}
                </p>
            )}
        </div>
    );
}

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    error?: string;
};

export function TextField({ label, error, className, ...input }: TextFieldProps) {
    return (
        <Field label={label} error={error} required={input.required} className={className}>
            {(a11y) => <input className={CONTROL} {...a11y} {...input} />}
        </Field>
    );
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
    label: string;
    options: readonly string[];
    error?: string;
};

export function SelectField({ label, options, error, className, ...select }: SelectFieldProps) {
    return (
        <Field label={label} error={error} required={select.required} className={className}>
            {(a11y) => (
                <select className={CONTROL} {...a11y} {...select}>
                    <option value="">Seleccionar</option>
                    {options.map((option) => (
                        <option key={option} value={option}>
                            {capitalize(option)}
                        </option>
                    ))}
                </select>
            )}
        </Field>
    );
}