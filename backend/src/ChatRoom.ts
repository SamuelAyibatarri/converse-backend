import type * as Interfaces from './Interfaces.ts'; 
import { DurableObject } from 'cloudflare:workers';

type Bindings = {
  chat_db: D1Database;
  JWT_SECRET: string;
  CHAT_ROOM: DurableObjectNamespace;
};

export class ChatRoom extends DurableObject<Bindings> {
  state: DurableObjectState;
  env: Bindings;
  sessions: WebSocket[] = [];
  messages: Interfaces.Chat[] = [];
  isInitialized = false;

  constructor(state: DurableObjectState, env: Bindings) {
    super(state, env); // <-- required
    this.state = state;
    this.env = env;
  }

  /**
   * Initializes the in-memory message cache by loading from D1.
   * This runs only on the first request to a "sleeping" DO instance.
   */
  async initialize(threadId: string): Promise<void> {
    if (this.isInitialized) {
      return; // Already initialized
    }

    try {
      // Load all messages for this thread from D1
      const { results } = await this.env.chat_db
        .prepare('SELECT * FROM messages WHERE thread_id = ? ORDER BY timestamp ASC')
        .bind(threadId)
        .all<Interfaces.Chat>();

      if (results) {
        this.messages = results; // Populate the in-memory cache
      }
    } catch (e: any) {
      console.error(`D1 Error on initialize: ${e.message}`);
    }

    this.isInitialized = true;
  }

  /**
   * The main fetch handler for the Durable Object.
   * This acts as a "mini-router" for requests from the Hono worker.
   */
  async fetch(request: Request): Promise<Response> {
    // We need the threadId to know *which* chat to load from D1
    const url = new URL(request.url);
    const threadId = url.searchParams.get('threadId');

    if (!threadId) {
      return new Response('threadId query param is required', { status: 400 });
    }

    // Ensure we've loaded the history from D1 before proceeding
    await this.initialize(threadId);

    // Route the request based on the URL pathname
    switch (url.pathname) {
      case '/websocket': {
        // Handle WebSocket upgrade requests
        if (request.headers.get('Upgrade') !== 'websocket') {
          return new Response('Expected websocket', { status: 400 });
        }
        const [client, server] = Object.values(new WebSocketPair());
        server.accept();
        this.handleSession(server, threadId); // Pass threadId to the session
        return new Response(null, { status: 101, webSocket: client });
      }

      case '/messages': {
        if (request.method === 'GET') {
          // Return the cached message history
          return new Response(JSON.stringify(this.messages), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (request.method === 'POST') {
          // Handle a new message sent via HTTP
          const message = await request.json<Interfaces.Chat>();
          
          // Persist (save) the message
          await this.persistAndBroadcast(message, threadId);
          
          return new Response(JSON.stringify({ success: true }), { status: 201 });
        }
        break; // Fall through to 404
      }
    }

    return new Response('Not found in Durable Object', { status: 404 });
  }

  /**
   * Manages a new WebSocket connection.
   */
  handleSession(socket: WebSocket, threadId: string) {
    this.sessions.push(socket);

    // Send the full chat history to the newly connected client
    socket.send(JSON.stringify({ type: 'history', messages: this.messages }));

    // Listen for new messages *from* this client
    socket.addEventListener('message', async (msg) => {
      try {
        // Parse the incoming message from the client
        // Assume client sends: { content: "hi", senderId: "..." }
        const clientMsg = JSON.parse(msg.data) as { content: string; senderId: string; receiverId: string };

        // Create the full, official message object
        const message: Interfaces.Chat = {
          id: crypto.randomUUID(), // Generate a new UUID for the message
          thread_id: threadId,
          timestamp: Date.now(),
          content: clientMsg.content,
          sender_id: clientMsg.senderId,
        };

        // Save this message to D1 and broadcast it to all clients
        await this.persistAndBroadcast(message, threadId);

      } catch (err: any) {
        socket.send(JSON.stringify({ error: 'Failed to parse message', details: err.message }));
      }
    });

    // Handle the client disconnecting
    socket.addEventListener('close', () => {
      this.sessions = this.sessions.filter(s => s !== socket);
    });

    socket.addEventListener('error', (err) => {
      console.error('Socket Error:', err);
      this.sessions = this.sessions.filter(s => s !== socket);
    });
  }

  /**
   * A central helper to:
   * 1. Save a message to the D1 database
   * 2. Add the message to the in-memory cache
   * 3. Broadcast the message to all connected WebSocket clients
   */
  async persistAndBroadcast(message: Interfaces.Chat, threadId: string) {
    // 1. Write to D1 (the Source of Truth)
    try {
      await this.env.chat_db
        .prepare(
          'INSERT INTO messages (id, thread_id, sender_id, content, timestamp) VALUES (?, ?, ?, ?, ?)'
        )
        // Ensure the message object has all these properties
        .bind(
          message.id || crypto.randomUUID(),
          threadId,
          message.sender_id,
          message.content,
          message.timestamp
        )
        .run();
    } catch (e: any) {
      console.error('D1 Error on persist:', e.message);
      // Don't stop here, we can still broadcast to live clients
    }

    // 2. Add to in-memory cache
    this.messages.push(message);

    // 3. Broadcast to all connected clients
    this.broadcast(JSON.stringify({ type: 'message', ...message }));
  }

  /**
   * Sends a message to every active WebSocket client.
   */
  broadcast(message: string) {
    // Iterate in reverse to safely remove disconnected clients
    for (let i = this.sessions.length - 1; i >= 0; i--) {
      const socket = this.sessions[i];
      console.log("Connected clients: ", this.sessions)
      try {
        socket.send(message);
      } catch (e) {
        // Failed to send (e.g., socket closed), remove from list
        this.sessions.splice(i, 1);
      }
    }
  }
}