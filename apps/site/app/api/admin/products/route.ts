import { createProductDraft, listAdminProducts, setProductArchived } from "@/db/repositories/d1-admin-repository";
import { adminFailure, isAdminResponse, requireAdminRead, requireAdminWrite } from "@/server/admin-api";
import { parseProductDraftInput } from "@/server/admin-input";

export async function GET(request: Request): Promise<Response> {
  const context = requireAdminRead(request, "catalog.read");
  if (isAdminResponse(context)) return context;
  try {
    return Response.json({ products: await listAdminProducts(context.database) });
  } catch (error) {
    return adminFailure(error, "products.list");
  }
}

export async function POST(request: Request): Promise<Response> {
  const context = requireAdminWrite(request, "catalog.write");
  if (isAdminResponse(context)) return context;
  try {
    const input = parseProductDraftInput(await request.json());
    return Response.json({ product: await createProductDraft(context, input) }, { status: 201 });
  } catch (error) {
    return adminFailure(error, "products.create");
  }
}

export async function PATCH(request: Request): Promise<Response> {
  const context = requireAdminWrite(request, "catalog.write");
  if (isAdminResponse(context)) return context;
  try {
    const body = await request.json();
    if (typeof body !== "object" || body === null || !("id" in body) || !("archived" in body)) throw new Error("Entrada invÃ¡lida.");
    if (typeof body.id !== "string" || typeof body.archived !== "boolean") throw new Error("Entrada invÃ¡lida.");
    await setProductArchived(context, body.id, body.archived);
    return Response.json({ ok: true });
  } catch (error) {
    return adminFailure(error, "products.archive");
  }
}
