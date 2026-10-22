import { LogOut } from "lucide-react";
import { Form } from "react-router";

export function LogoutButton() {
    return (
        <Form method="post" action="/logout">
            <button
                type="submit"
                aria-label="Cerrar sesión"
                className="flex size-11 items-center justify-center rounded-full border border-line bg-surface text-ink-muted hover:text-brand-text"
            >
                <LogOut className="size-5" aria-hidden />
            </button>
        </Form>
    );
}