import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/jwt";
import { updateRemision, deleteRemisionConRestauracion } from "@/lib/database/remisiones";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !user.activo) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["admin", "super_admin"].includes(user.rol)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const updates = await request.json();
    await updateRemision(id, updates);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`/api/remisiones/${params?.id} PATCH error:`, error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !user.activo) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["admin", "super_admin"].includes(user.rol)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    // Motivo puede venir en query (?motivo=) o en el cuerpo
    const url = new URL(request.url);
    let motivo = url.searchParams.get("motivo") || undefined;
    if (!motivo) {
      try {
        const body = await request.json();
        motivo = body?.motivo;
      } catch {}
    }
    const resultado = await deleteRemisionConRestauracion(id, motivo || "Eliminación por API");
    return NextResponse.json({ success: true, data: resultado });
  } catch (error: any) {
    console.error(`/api/remisiones/${params?.id} DELETE error:`, error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

