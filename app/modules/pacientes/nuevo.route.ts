import { redirect } from "react-router";
import { useActionToast } from "~/core/feedback/use-action-toast";
import { createPatientAction } from "./controller/patient.controller.server";

export const action = createPatientAction;
export const loader = () => redirect("/");