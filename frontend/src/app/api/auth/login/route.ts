
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(request: NextRequest) {
  try {
    if (!API_URL) {
      throw new Error("Не указан NEXT_PUBLIC_API_URL");
    }

    const { phone, password } = await request.json();

    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone, password }),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || data.error?.message || "Ошибка входа" },
        { status: response.status }
      );
    }

    const result = NextResponse.json({
      message: "Вход выполнен успешно",
    });

    result.cookies.set("access_token", data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: data.expires_in || 3600,
    });

    return result;
  } catch {
    return NextResponse.json(
      { message: "Не удалось выполнить вход" },
      { status: 500 }
    );
  }
}
