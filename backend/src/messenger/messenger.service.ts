const GRAPH_API_VERSION = 'v21.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export class MessengerService {
  constructor(private pageAccessToken: string) {}

  /**
   * Send a text reply to a user via Send API.
   */
  async sendText(recipientPsid: string, text: string): Promise<void> {
    // Messenger text limit is 2000 chars per message; chunk if needed.
    const chunks: string[] = [];
    let remaining = text;
    while (remaining.length > 0) {
      chunks.push(remaining.slice(0, 1900));
      remaining = remaining.slice(1900);
    }

    for (const chunk of chunks) {
      const res = await fetch(
        `${GRAPH_BASE}/me/messages?access_token=${encodeURIComponent(this.pageAccessToken)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: { id: recipientPsid },
            message: { text: chunk },
            messaging_type: 'RESPONSE',
          }),
        }
      );
      if (!res.ok) {
        const body = await res.text();
        console.error('[messenger] sendText failed', res.status, body);
      }
    }
  }

  /**
   * Download an attachment from Facebook CDN as bytes.
   */
  async downloadAttachment(url: string): Promise<{
    bytes: ArrayBuffer;
    contentType: string;
  }> {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to download attachment: ${res.status}`);
    }
    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    const bytes = await res.arrayBuffer();
    return { bytes, contentType };
  }
}
