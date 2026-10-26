import type { PostgrestError } from "@supabase/supabase-js";
import {
    AppError,
    BadRequestError,
    ConflictError,
    ForbiddenError,
} from "~/core/errors/app-error";
import type { SupabaseServerClient } from "~/core/supabase/client.server";
import type { NewPatientInput } from "./patient.schema";
import type { PatientOptions } from "./patient.types";

export class PatientRepository {
    constructor(private readonly supabase: SupabaseServerClient) { }

    /** Crea dueño (o reutiliza el existente por documento) y paciente en UNA transacción. */
    /** Crea dueño + paciente, o agrega la mascota a un dueño existente (ownerId). */
    async create(input: NewPatientInput): Promise<string> {
        const patient = {
            name: input.name,
            species: input.species,
            breed: input.breed,
            sex: input.sex,
            birth_date: input.birthDate,
            weight_kg: input.weightKg,
            microchip: input.microchip,
        };

        const { data, error } = input.ownerId
            ? await this.supabase.rpc("add_patient_to_owner", { p_owner_id: input.ownerId, p_patient: patient })
            : await this.supabase.rpc("create_patient_with_owner", {
                p_owner: {
                    full_name: input.ownerName,
                    phone: input.ownerPhone,
                    email: input.ownerEmail,
                    document_number: input.ownerDocument,
                    address: input.ownerAddress,
                },
                p_patient: patient,
            });

        if (error) throw PatientRepository.toError(error);
        return data as string;
    }

    async getOptions(): Promise<PatientOptions> {
        const { data, error } = await this.supabase.rpc("get_patient_options");
        if (error) throw new Response("No se pudieron cargar las opciones", { status: 500 });

        const options = data as Partial<PatientOptions> | null;
        return { species: options?.species ?? [], sex: options?.sex ?? [] };
    }

    private static toError(error: PostgrestError): AppError {
        switch (error.code) {
            case "23505":
                return new ConflictError("Ya existe un paciente con ese microchip.");
            case "42501":
                return new ForbiddenError("No tienes permiso para registrar pacientes.");
            case "22P02":
            case "23514":
                return new BadRequestError("Revisa los datos ingresados.");
            default:
                return new AppError("No se pudo registrar el paciente. Intenta nuevamente.");
        }
    }
}