import { listAdminHomeSections, saveHomeOrder } from "@/db/repositories/d1-admin-repository";
import { adminFailure, isAdminResponse, requireAdminRead, requireAdminWrite } from "@/server/admin-api";
import { parseHomeSections } from "@/server/admin-input";

export async function GET(request: Request): Promise<Response> {
  const context = requireAdminRead(request, "home.read");
  if (isAdminResponse(context)) return context;
  try {
    return Response.json({ sections: await listAdminHomeSections(context.database) });
  } catch (error) {
    return adminFailure(error, "home.list");
  }
}

export async function PUT(request: Request): Promise<Response> {
  const context = requireAdminWrite(request, "home.write");
  if (isAdminResponse(context)) return context;
  try {
    const body = await request.json();
    const sections = typeof body === "object" && body !== null && "sections" in body ? parseHomeSections(body.sections) : parseHomeSections(null);
    await saveHomeOrder(context, sections);
    return Response.json({ ok: true });
  } catch (error) {
    return adminFailure(error, "home.save");
  }
}
