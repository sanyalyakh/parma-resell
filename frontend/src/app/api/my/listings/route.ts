import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET(request: NextRequest) {
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

    const response = await fetch(`${API_URL}/my/listings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            data.message || data.error || "Не удалось получить предложения",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { message: "Не удалось получить предложения продавца" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const payload: unknown = await request.json().catch(() => null);

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return NextResponse.json(
        { message: "Некорректные данные предложения" },
        { status: 400 }
      );
    }

    const body = payload as Record<string, unknown>;

    if (
      typeof body.season_ticket_id !== "string" ||
      typeof body.match_id !== "string" ||
      typeof body.price_kopecks !== "number" ||
      !Number.isInteger(body.price_kopecks) ||
      body.price_kopecks < 1 ||
      body.price_kopecks > 100_000_000
    ) {
      return NextResponse.json(
        { message: "Проверьте абонемент, матч и цену" },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_URL}/my/listings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        season_ticket_id: body.season_ticket_id,
        match_id: body.match_id,
        price_kopecks: body.price_kopecks,
      }),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            data.message || data.error || "Не удалось создать предложение",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: "Ошибка при создании предложения" },
      { status: 500 }
    );
  }
}