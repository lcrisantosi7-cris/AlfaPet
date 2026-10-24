import type { InputHTMLAttributes } from "react";
import { ConfirmForm } from "~/core/feedback/ConfirmForm";
interface AdminFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  name: string;
  title: string;
}

function FieldTitle({ title, required }: { title: string; required?: boolean }) {
  return (
    <span className="flex min-h-4 items-center gap-1.5">
      <span>{title}</span>
      {required ? <span className="font-bold text-tone-red-fg" aria-hidden="true">*</span> : null}
      {required ? <span className="sr-only">, obligatorio</span> : null}
    </span>
  );
}

export function AdminField({ name, title, className, required, ...input }: AdminFieldProps) {
  return (
    <label className={"group flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-ink-muted " + (className ?? "")}>
      <FieldTitle title={title} required={required} />
      <input
        name={name}
        required={required}
        aria-required={required || undefined}
        {...input}
        className="ui-field h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm font-normal text-ink placeholder:text-ink-muted/75"
      />
    </label>
  );
}

interface AdminSelectOption {
  id: string | number;
  name: string;
}

interface AdminSelectFieldProps {
  name: string;
  title: string;
  options: AdminSelectOption[];
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}

export function AdminSelectField({
  name,
  title,
  options,
  required = false,
  placeholder = "Selecciona una opción…",
  defaultValue = "",
}: AdminSelectFieldProps) {
  return (
    <label className="group flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-ink-muted">
      <FieldTitle title={title} required={required} />
      <select
        name={name}
        required={required}
        aria-required={required || undefined}
        defaultValue={defaultValue}
        className="ui-field h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm font-normal text-ink"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>{option.name}</option>
        ))}
      </select>
    </label>
  );
}
