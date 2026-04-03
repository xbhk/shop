import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { getAllOrders } from "@/lib/db-queries";

export async function GET(request: NextRequest) {
  const user = getCurrentUserFromRequest(request);

  if (!user || !user.is_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const orders = getAllOrders();
  return NextResponse.json(orders);
}
