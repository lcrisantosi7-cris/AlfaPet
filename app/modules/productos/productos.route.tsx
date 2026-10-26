import type { Route } from "./+types/productos.route";
import { productosAction, productosLoader } from "./controller/productos.controller.server";
import { ProductosView } from "./view/ProductosView";

export const loader = productosLoader;
export const action = productosAction;
export const meta: Route.MetaFunction = () => [{ title: "Productos e inventario | AlfaPet" }];

export default function ProductosRoute({ loaderData }: Route.ComponentProps) {
    return <ProductosView {...loaderData} />;
}