import { redirect } from "react-router";
import { ForbiddenError } from "~/core/errors/app-error";
import { createSupabaseServerClient, type SupabaseServerClient } from "~/core/supabase/client.server";
import { AuthService } from "../model/auth.service.server";
import type { Role, SessionUser } from "../model/user.types";

export interface AuthContext {
  supabase: SupabaseServerClient;
  headers: Headers;
  user: SessionUser;
}

export class SessionGuard {
  /** Evita repetir getUser + perfil cuando varios loaders de la misma petición piden sesión. */
  private static readonly cache = new WeakMap<Request, Promise<AuthContext>>();

  static async require(request: Request, allowedRoles?: readonly Role[]): Promise<AuthContext> {
    let pending = SessionGuard.cache.get(request);
    if (!pending) {
      pending = SessionGuard.authenticate(request);
      SessionGuard.cache.set(request, pending);
    }

    const context = await pending;
    if (allowedRoles && !allowedRoles.includes(context.user.role)) {
      throw new ForbiddenError(undefined, context.headers).toResponse();
    }
    return context;
  }

  private static async authenticate(request: Request): Promise<AuthContext> {
    const { supabase, headers } = createSupabaseServerClient(request);
    const auth = new AuthService(supabase);
    const session = await auth.getSession();

    if (session.kind === "anonymous") throw redirect("/login", { headers });
    if (session.kind === "inactive") {
      await auth.signOut();
      throw redirect("/login?error=inactivo", { headers });
    }
    return { supabase, headers, user: session.user };
  }
}

/**
 * Exige sesión válida, perfil activo y, opcionalmente, uno de los roles permitidos.
 * Úsalo al inicio de CADA loader/action protegido.
 */
export const requireUser = (request: Request, allowedRoles?: readonly Role[]) =>
  SessionGuard.require(request, allowedRoles);