import { redirect } from "react-router";
import { createPatientAction } from "./controller/patient.controller.server";

export const action = createPatientAction;
export const loader = () => redirect("/");