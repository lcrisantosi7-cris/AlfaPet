import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables del archivo .env
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Faltan variables de entorno (SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY).');
    process.exit(1);
}

// Cliente con privilegios de administrador (Service Role)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
});

async function crearAdministrador() {
    const emailAdmin = 'admin.alfapet@sullana.com'; // Cambia por el correo que deseas
    const passwordAdmin = 'Admin123*#';             // Cambia por una contraseña segura
    const nombreCompleto = 'Administrador AlfaPet';

    console.log('Creando usuario administrador en Supabase Auth...');

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: emailAdmin,
        password: passwordAdmin,
        email_confirm: true, // Auto-confirmar el correo
    });

    if (authError) {
        console.error('Error al crear usuario en Auth:', authError.message);
        return;
    }

    const userId = authData.user.id;
    console.log(`Usuario Auth creado con ID: ${userId}`);

    // 2. Insertar o actualizar su rol en la tabla public.profiles
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            full_name: nombreCompleto,
            job_title: 'Gerente de Operaciones',
            role: 'admin',
            is_active: true,
        });

    if (profileError) {
        console.error('Error al asignar el perfil de administrador:', profileError.message);
    } else {
        console.log('¡Administrador creado y configurado exitosamente en la base de datos!');
        console.log(`Correo: ${emailAdmin}`);
        console.log(`Contraseña: ${passwordAdmin}`);
    }
}

crearAdministrador();