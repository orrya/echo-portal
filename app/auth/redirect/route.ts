export const dynamic = "force-dynamic";

export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID!;
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;

  const url = new URL("https://login.microsoftonline.com/common/oauth2/v2.0/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "openid email offline_access profile User.Read");
  url.searchParams.set("response_mode", "query");

  return Response.redirect(url.toString());
}
