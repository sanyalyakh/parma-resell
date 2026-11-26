
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(request: NextRequest) {
  try {
    if (!API_URL) {
      throw new Error("Не указан NEXT_PUBLIC_API_URL");
    }

    const { first_name, last_name, phone, password, email } =
      await request.json();

    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        first_name,
        last_name,
        phone,
        password,
        email: email || null,
      }),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      const messages: Record<string, string> = {
        identity_already_registered: "Этот номер телефона или email уже зарегистрирован",
        invalid_first_name: "Проверь имя",
        invalid_last_name: "Проверь фамилию",
        invalid_credentials: "Проверь номер телефона и пароль",
        invalid_email: "Проверь адрес электронной почты",
      };

      return NextResponse.json(
        {
          message:
            messages[data.error] ||
            data.message ||
            "Не удалось зарегистрироваться",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(
      {
        message: "Регистрация прошла успешно",
        user: data.user,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { message: "Не удалось выполнить регистрацию" },
      { status: 500 }
    );
  }
}
