import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/jwt";
import { createCargaMercaderia } from "@/lib/database/mercaderias";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !user.activo) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Basic role guard: allow only privileged roles to create cargas
    if (!["admin", "super_admin"].includes(user.rol)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = await createCargaMercaderia(body);

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    console.error("/api/mercaderias POST error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

