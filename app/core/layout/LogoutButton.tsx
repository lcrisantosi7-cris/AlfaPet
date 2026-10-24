import { LogOut } from "lucide-react";
import { Form } from "react-router";

export function LogoutButton() {
    return (
        <Form method="post" action="/logout">
            <button
                type="submit"
                aria-label="Cerrar sesión"
                className="ui-icon-button flex size-11 items-center justify-center rounded-full border border-line bg-surface text-ink-muted hover:border-brand/50 hover:text-brand-text"
            >
                <LogOut className="size-5" aria-hidden />
            </button>
        </Form>
    );
}