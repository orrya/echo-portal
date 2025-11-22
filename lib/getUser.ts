// lib/getUser.ts
import { cookies } from "next/headers";

export async function getUser() {
  try {
    const cookieStore = cookies();
    const raw = cookieStore.get("echo-auth");

    if (!raw) return null;

    const parsed = JSON.parse(raw.value);

    if (!parsed?.user_id) return null;

    return {
      id: parsed.user_id,
      email: parsed.email ?? null,
    };
  } catch (err) {
    console.error("getUser parse error:", err);
    return null;
  }
}
