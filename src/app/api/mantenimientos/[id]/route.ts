import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/jwt";
import { updateMantenimiento, deleteMantenimiento } from "@/lib/database/mantenimientos";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !user.activo) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["admin", "super_admin", "tecnico"].includes(user.rol)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const updates = await request.json();
    await updateMantenimiento(id, updates);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`/api/mantenimientos/${params?.id} PATCH error:`, error);
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
    if (!["admin", "super_admin", "tecnico"].includes(user.rol)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await deleteMantenimiento(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`/api/mantenimientos/${params?.id} DELETE error:`, error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

