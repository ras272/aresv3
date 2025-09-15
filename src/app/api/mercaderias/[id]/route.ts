import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/jwt";
import { deleteCargaMercaderia } from "@/lib/database/mercaderias";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(_request);
    if (!user || !user.activo) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Basic role guard: allow only privileged roles to delete cargas
    if (!["admin", "super_admin"].includes(user.rol)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const cargaId = params.id;
    if (!cargaId) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await deleteCargaMercaderia(cargaId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error(`/api/mercaderias/${params?.id} DELETE error:`, error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

