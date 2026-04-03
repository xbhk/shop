import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { getUserOrders } from "@/lib/db-queries";

export async function GET(request: NextRequest) {
  const user = getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json([], { status: 401 });
  }

  const orders = getUserOrders(user.userid, 5);
  return NextResponse.json(orders);
}
