import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/jwt";
import { createEquipo } from "@/lib/database/equipos";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !user.activo) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["admin", "super_admin"].includes(user.rol)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const data = await createEquipo(body);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    console.error("/api/equipos POST error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

