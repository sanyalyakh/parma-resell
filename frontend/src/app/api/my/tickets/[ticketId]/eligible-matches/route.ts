import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type RouteContext = {
  params: Promise<{
    ticketId: string;
  }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    if (!API_URL) {
      throw new Error("Не указан NEXT_PUBLIC_API_URL");
    }

    const token = request.cookies.get("access_token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Необходима авторизация" },
        { status: 401 }
      );
    }

    const { ticketId } = await params;

    const response = await fetch(
      `${API_URL}/my/tickets/${encodeURIComponent(ticketId)}/eligible-matches`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            data.message ||
            data.error ||
            "Не удалось получить подходящие матчи",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { message: "Не удалось загрузить подходящие матчи" },
      { status: 500 }
    );
  }
}