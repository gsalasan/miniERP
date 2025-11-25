interface NotificationPayload {
  userId: string;
  message: string;
  link?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

export class NotificationService {
  /**
   * Sends notification to external channel(s). Priority:
   * 1) Slack/Webhook if NOTIFICATION_WEBHOOK_URL is set
   * 2) Fallback to console log
   */
  static async send(payload: NotificationPayload): Promise<void> {
    const webhook = process.env.NOTIFICATION_WEBHOOK_URL;
    if (webhook) {
      try {
        const text = `:bell: ${payload.message}${payload.link ? `\n<${payload.link}|Open>` : ''}`;
        // Use global fetch available in Node 18+
        await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        return;
      } catch (err) {
        console.warn('[NotificationService] Webhook failed, falling back to console');
      }
    }

    // Fallback
    console.log('📬 Notification:', {
      userId: payload.userId,
      message: payload.message,
      link: payload.link,
      type: payload.type || 'info',
    });
  }

  static async sendToMultiple(userIds: string[], message: string, link?: string): Promise<void> {
    await Promise.all(
      userIds.map(userId => this.send({ userId, message, link }))
    );
  }
}
