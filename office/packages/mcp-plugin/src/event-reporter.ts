export class EventReporter {
  constructor(
    private relayUrl: string,
    private teamId: string,
    private userId: string,
  ) {}

  private async send(
    sessionId: string,
    agentName: string,
    eventType: string,
    toolName?: string,
    extra?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await fetch(`${this.relayUrl}/api/relay/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: this.teamId,
          sessionId,
          userId: this.userId,
          agentName,
          eventType,
          toolName,
          timestamp: Date.now(),
          payload: extra,
        }),
      });
    } catch (err) {
      console.error('[EventReporter] Failed to send event:', err);
    }
  }

  async reportToolStart(
    sessionId: string,
    agentName: string,
    toolName: string,
  ): Promise<void> {
    await this.send(sessionId, agentName, 'tool_start', toolName);
  }

  async reportToolDone(
    sessionId: string,
    agentName: string,
    toolName: string,
  ): Promise<void> {
    await this.send(sessionId, agentName, 'tool_done', toolName);
  }

  async reportStatusChange(
    sessionId: string,
    agentName: string,
    status: string,
  ): Promise<void> {
    await this.send(sessionId, agentName, 'status_change', undefined, { status });
  }
}
