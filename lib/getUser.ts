// lib/getUser.ts
import { cookies } from "next/headers";

export async function getUser() {
  try {
    const cookieStore = cookies();
    const raw = cookieStore.get("echo-auth");

    if (!raw?.value) return null;

    let parsed: any = null;

    try {
      // First parse attempt
      parsed = JSON.parse(raw.value);

      // If cookie was double-encoded, parsed will itself be a string
      if (typeof parsed === "string") {
        parsed = JSON.parse(parsed);
      }
    } catch (err) {
      console.error("echo-auth cookie parse error:", err, raw.value);
      return null;
    }

    if (!parsed?.user_id) return null;

    return {
      id: parsed.user_id,
      email: parsed.email ?? null,
    };
  } catch (err) {
    console.error("getUser() error:", err);
    return null;
  }
}
