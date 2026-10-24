import { LogOut } from "lucide-react";
import { ConfirmForm } from "~/core/feedback/ConfirmForm";

export function LogoutButton() {
    return (
        <ConfirmForm
            method="post"
            action="/logout"
            confirm={{
                title: "¿Cerrar sesión?",
                description: "Tendrás que volver a ingresar tus credenciales para entrar al panel.",
                confirmLabel: "Sí, salir",
            }}
        >
            <button
                type="submit"
                aria-label="Cerrar sesión"
                className="ui-icon-button group flex size-11 items-center justify-center rounded-full border border-line bg-surface text-ink-muted hover:border-tone-red-fg/40 hover:text-tone-red-fg"
            >
                <LogOut className="size-5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
            </button>
        </ConfirmForm>
    );
}