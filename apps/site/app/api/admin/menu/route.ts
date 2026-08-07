import { listAdminMenu, saveMenu } from "@/db/repositories/d1-admin-repository";
import { adminFailure, isAdminResponse, requireAdminRead, requireAdminWrite } from "@/server/admin-api";
import { parseMenuItems } from "@/server/admin-input";

export async function GET(request: Request): Promise<Response> {
  const context = requireAdminRead(request, "home.read");
  if (isAdminResponse(context)) return context;
  try {
    return Response.json({ items: await listAdminMenu(context.database) });
  } catch (error) {
    return adminFailure(error, "menu.list");
  }
}

export async function PUT(request: Request): Promise<Response> {
  const context = requireAdminWrite(request, "home.write");
  if (isAdminResponse(context)) return context;
  try {
    const body = await request.json();
    const items = typeof body === "object" && body !== null && "items" in body ? parseMenuItems(body.items) : parseMenuItems(null);
    await saveMenu(context, items);
    return Response.json({ ok: true });
  } catch (error) {
    return adminFailure(error, "menu.save");
  }
}
