// Realtime API event types
export interface ServerEvent {
  type: string;
  [key: string]: any;
}

export interface ResponseTextDelta {
  type: "response.text.delta";
  delta: {
    text: string;
  };
}

export interface ResponseDone {
  type: "response.done";
  response: {
    output: Array<{
      text: string;
    }>;
  };
}

// WebSocket connection management
export class RealtimeConnection {
  private ws: WebSocket | null = null;
  private ephemeralToken: string | null = null;
  private messageHandler: ((event: ServerEvent) => void) | null = null;
  private isConnecting: boolean = false;
  private connectionPromise: Promise<void> | null = null;

  constructor() {}

  async getEphemeralToken(): Promise<string> {
    try {
      const response = await fetch("/api/token");
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      return data.client_secret.value;
    } catch (error) {
      console.error("Error getting ephemeral token:", error);
      throw error;
    }
  }

  async connect(): Promise<void> {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return this.connectionPromise;
    }

    if (this.isConnecting) {
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.connectionPromise = new Promise(async (resolve, reject) => {
      try {
        // Get a new ephemeral token
        this.ephemeralToken = await this.getEphemeralToken();

        const baseUrl = "wss://api.openai.com/v1/realtime";
        const model = "gpt-4o-realtime-preview-2024-12-17";

        this.ws = new WebSocket(`${baseUrl}?model=${model}`, [
          "realtime",
          // Auth with ephemeral token
          "openai-insecure-api-key." + this.ephemeralToken,
          // Beta protocol
          "openai-beta.realtime-v1",
        ]);

        this.ws.onopen = () => {
          console.log("Connected to Realtime API");
          this.isConnecting = false;
          resolve();
        };

        this.ws.onclose = (event) => {
          console.log("WebSocket closed:", event.code, event.reason);
          this.isConnecting = false;
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          this.isConnecting = false;
          reject(error);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (this.messageHandler) {
              this.messageHandler(data);
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  setMessageHandler(handler: (event: ServerEvent) => void): void {
    this.messageHandler = handler;
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  sendMessage(message: string): void {
    if (!this.isConnected()) {
      throw new Error("WebSocket not connected");
    }

    const event = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: message,
          },
        ],
      },
    };

    this.ws?.send(JSON.stringify(event));
  }

  generateResponse(): void {
    if (!this.isConnected()) {
      throw new Error("WebSocket not connected");
    }

    const event = {
      type: "response.create",
    };

    this.ws?.send(JSON.stringify(event));
  }

  updateSession(instructions: string): void {
    if (!this.isConnected()) {
      throw new Error("WebSocket not connected");
    }

    const event = {
      type: "session.update",
      session: {
        instructions,
      },
    };

    this.ws?.send(JSON.stringify(event));
  }
}

// Create a singleton instance
export const realtimeConnection = new RealtimeConnection();
