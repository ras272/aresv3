import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/jwt";
import { createMantenimiento } from "@/lib/database/mantenimientos";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !user.activo) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["admin", "super_admin", "tecnico"].includes(user.rol)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const data = await createMantenimiento(body);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    console.error("/api/mantenimientos POST error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

