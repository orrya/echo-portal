// lib/getUser.ts
import { cookies } from "next/headers";

export async function getUser() {
  try {
    const cookieStore = cookies();
    const raw = cookieStore.get("echo-auth");

    if (!raw?.value) return null;

    let value = raw.value;

    // Decode URL-encoded cookie values
    try {
      value = decodeURIComponent(value);
    } catch {
      // If not encoded, that's fine
    }

    let parsed: any = null;

    try {
      parsed = JSON.parse(value);

      // In case of double-encoded JSON
      if (typeof parsed === "string") {
        parsed = JSON.parse(parsed);
      }
    } catch (err) {
      console.error("Failed to parse echo-auth cookie:", value);
      return null;
    }

    return {
      id: parsed.user_id,
      email: parsed.email,
    };
  } catch (err) {
    console.error("getUser() error:", err);
    return null;
  }
}
