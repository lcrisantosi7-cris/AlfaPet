import { createClient } from "@supabase/supabase-js";

type StaffRole = "admin" | "veterinario" | "recepcion";
type StaffSeed = { name: string; email: string; password: string; role: StaffRole; jobTitle: string };

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta la variable ${name} en .env`);
  return value;
}

function readSeed(prefix: string, role: StaffRole, defaultTitle: string): StaffSeed {
  const name = required(`${prefix}_NAME`);
  const email = required(`${prefix}_EMAIL`).toLowerCase();
  const password = required(`${prefix}_PASSWORD`);
  const jobTitle = process.env[`${prefix}_JOB_TITLE`]?.trim() || defaultTitle;
  if (password.length < 12) throw new Error(`${prefix}_PASSWORD debe tener al menos 12 caracteres`);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error(`${prefix}_EMAIL no parece válido`);
  return { name, email, password, role, jobTitle };
}

async function main() {
  const supabase = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const staff: StaffSeed[] = [
    readSeed("TEST_ADMIN", "admin", "Administrador de prueba"),
    readSeed("TEST_VET", "veterinario", "Médico veterinario"),
    readSeed("TEST_RECEPCION", "recepcion", "Recepcionista"),
  ];

  for (const person of staff) {
    const { data: existing, error: lookupError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (lookupError) throw new Error(`No se pudo consultar Auth: ${lookupError.message}`);
    const found = existing.users.find(user => user.email?.toLowerCase() === person.email);
    let userId = found?.id;

    if (!userId) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: person.email,
        password: person.password,
        email_confirm: true,
        user_metadata: { full_name: person.name },
      });
      if (error || !data.user) throw new Error(`No se pudo crear ${person.email}: ${error?.message ?? "usuario vacío"}`);
      userId = data.user.id;
      console.log(`Auth creado: ${person.email}`);
    } else {
      console.log(`Auth ya existe; no se cambia su contraseña: ${person.email}`);
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      full_name: person.name,
      job_title: person.jobTitle,
      role: person.role,
      is_active: true,
    }, { onConflict: "id" });
    if (profileError) throw new Error(`No se pudo guardar el perfil de ${person.email}: ${profileError.message}`);
    console.log(`Perfil verificado: ${person.email} -> ${person.role}`);
  }
  console.log("Listo. Comprueba los tres accesos usando ventanas de incógnito separadas.");
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
