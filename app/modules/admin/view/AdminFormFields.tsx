import type { InputHTMLAttributes } from "react";

interface AdminFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  name: string;
  title: string;
}

export function AdminField({ name, title, className, ...input }: AdminFieldProps) {
  return (
    <label className={"flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-ink-muted " + (className ?? "")}>
      {title}
      <input
        name={name}
        {...input}
        className="ui-field h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm font-normal text-ink"
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
  placeholder = "Selecciona...",
  defaultValue = "",
}: AdminSelectFieldProps) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-ink-muted">
      {title}
      <select
        name={name}
        required={required}
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