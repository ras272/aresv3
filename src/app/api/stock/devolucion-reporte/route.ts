import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/jwt";
import { devolverRepuestosAlStockReporte } from "@/lib/database/stock";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !user.activo) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["admin", "super_admin", "tecnico"].includes(user.rol)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    await devolverRepuestosAlStockReporte(body);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error("/api/stock/devolucion-reporte POST error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

