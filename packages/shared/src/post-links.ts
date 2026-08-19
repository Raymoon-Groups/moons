const POST_ID_IN_QUERY =
  /[?&]post=([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/i;
const POST_SHARE_URL =
  /https?:\/\/[^\s]*\/dashboard\?post=[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[^\s]*/gi;
const POST_SHARE_PATH =
  /(?:^|\s)\/dashboard\?post=[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;

export function extractForwardedPostId(text: string): string | null {
  const match = text.match(POST_ID_IN_QUERY);
  return match?.[1] ?? null;
}

/** Remove the raw post URL from chat text so media can show instead. */
export function stripForwardedPostUrl(text: string): string {
  return text
    .replace(POST_SHARE_URL, '')
    .replace(POST_SHARE_PATH, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
