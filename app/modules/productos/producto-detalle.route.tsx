import type { Route } from "./+types/producto-detalle.route";
import { productoDetailAction, productoDetailLoader } from "./controller/producto-detail.controller.server";
import { ProductDetailView } from "./view/ProductDetailView";

export const loader = productoDetailLoader;
export const action = productoDetailAction;
export const meta: Route.MetaFunction = ({ loaderData }) => [{ title: `${loaderData?.product.name ?? "Producto"} | AlfaPet` }];

export default function ProductoDetalleRoute({ loaderData }: Route.ComponentProps) {
    return <ProductDetailView product={loaderData.product} categories={loaderData.categories} />;
}