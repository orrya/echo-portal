// lib/getUser.ts
const DEMO_USER_ID = "75925360-ebf2-4542-a672-2449d2cf84a1";

// Minimal shape used by your pages: only `id` is required.
export async function getUser() {
  return { id: DEMO_USER_ID };
}
