import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type RouteContext = {
  params: Promise<{
    listingId: string;
  }>;
};

export async function POST(
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

    const { listingId } = await params;

    if (!listingId) {
      return NextResponse.json(
        { message: "Не указан ID предложения" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${API_URL}/my/listings/${encodeURIComponent(listingId)}/withdraw`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        data.message ||
        data.error ||
        "Не удалось снять предложение";

      return NextResponse.json(
        { message },
        { status: response.status }
      );
    }

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { message: "Ошибка при снятии предложения" },
      { status: 500 }
    );
  }
}
