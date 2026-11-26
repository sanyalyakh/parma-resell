
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

    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || data.error || "Ошибка получения профиля" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { message: "Не удалось получить профиль" },
      { status: 500 }
    );
  }
}
