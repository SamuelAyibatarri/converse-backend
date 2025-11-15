import { Hono, Context } from 'hono'
import { cors } from 'hono/cors'
import { v4 as uuidv4 } from 'uuid'
import * as argon2 from "@node-rs/argon2";
import bcrypt from 'bcryptjs';
import type * as Interfaces from './Interfaces.ts'
import { SignJWT, jwtVerify } from "jose";
import { userInfo } from 'os';
import { ChatRoom } from './ChatRoom';

type Variables = {
  user: {
    userId: string;
    userType: string;
  };
};

type Bindings = {
  chat_db: D1Database;
  JWT_SECRET: string;
  CHAT_ROOM: DurableObjectNamespace;
};

type AppContext = Context<{ Bindings: Bindings; Variables: Variables }>;

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use(
  '/api/*',
  cors({
    origin: ['http://localhost:5173', 'null'],
    allowMethods: ['POST', 'GET'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
)

app.use("/api/*", async (c, next) => {
  console.log("This jwt middleware gets triggerd")
  const authHeader = c.req.header("Authorization");
  console.log("Auth header: ", authHeader)
  const path = c.req.path;

  const isWebSocketUpgrade = path.startsWith('/api/chat/') && path.endsWith('/ws');

  if (path === "/api/auth/signup" || path === "/api/auth/login" || isWebSocketUpgrade || path.startsWith("/api/chatData/") || path.startsWith("/api/history/")) { /// DON'T FORGET, MAKE /api/chatData a post request not a get, I just did this for testing, ALSO the HISTORY ENDPOINT
    await next();
    return;
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid token" }, 401);
  }


  try {
    const token = authHeader.split(" ")[1];
    const payload = await verifyJWT(token, c);
    if (!payload || payload === null) return c.json({ error: "Invalid or expired token"}, 401);
    c.set('user', payload as {userId: string; userType: string;});
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
});


/// ::::::::::::::::::: Helper Functions :::::::::::::::::::::

async function generateJWT(userId: string, userType: string, c: AppContext): Promise<string> {
    const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(c.env.JWT_SECRET), // convert string → Uint8Array
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  return await new SignJWT({ userId, userType })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("100h") // expires in 60 minutes
    .sign(key);
}

async function verifyJWT(
  token: string,
  c: AppContext
): Promise<{ userId: string; userType: string } | null> {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(c.env.JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );

    const { payload } = await jwtVerify(token, key);
    return payload as { userId: string; userType: string };
  } catch (err) {
    console.warn("Invalid or expired token:", err);
    return null; // explicitly return null for fake/invalid tokens
  }
}

// Hash password
// async function hashPassword(password: string): Promise<string> {
//   return await argon2.hash(password, {
//     memoryCost: 19456,
//     timeCost: 2,
//     parallelism: 1,
//   });
// }

// // Verify password
// async function verifyPassword(password: string, hash: string): Promise<boolean> {
//   return await argon2.verify(hash, password);
// }

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10; 
  return await bcrypt.hash(password, saltRounds);
}

// Verify password
async function verifyPassword(plaintext_password: string, dbpassword: string): Promise<boolean> {
  // The order is (plaintext_password, hash_from_db)
  console.log("This is the recieved pass: ", plaintext_password);
  console.log("This is the hashed password from the database: ", dbpassword)
  return await bcrypt.compare(plaintext_password, dbpassword);
}


async function checkIfUserExists(c: AppContext, email: string): Promise<boolean> {
  const result = await c.env.chat_db
    .prepare('SELECT 1 FROM users WHERE email = ? LIMIT 1')
    .bind(email)
    .first<{ 1: number }>()
  return !!result
}

/// Create a user
async function createUser(c: AppContext, data: Interfaces.CAI) {
  const exists = await checkIfUserExists(c, data.email)
  if (exists) throw new Error('User already exists, try logging in instead')

  const id = uuidv4()
  const now = Date.now()
  const hashedPassword = await hashPassword(data.hashedPassword);

  await c.env.chat_db
    .prepare(`
      INSERT INTO users (id, name, email, passwordHash, role, accountCreationDate, lastLogin)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(id, data.name, data.email, hashedPassword, data.role, now, now)
    .run()

  return { id, ...data, accountCreationDate: now, lastLogin: now }
}

/// Verify thread Id
async function verifyThreadId(c: AppContext, chatId: string): Promise<boolean> {
  const chatData = await c.env.chat_db
    .prepare('SELECT thread_id FROM chat_participants WHERE thread_id = ?')
    .bind(chatId)
    .all();

  if (!chatData.results || chatData.results.length === 0) return false;
  return true;
}

/// Verify User
async function verifyUser(
  c: AppContext,
  email: string,
  hashedPassword: string, // client-side SHA256 hash
  role: 'agent' | 'customer'
): Promise<Interfaces.AgentData | Interfaces.CustomerData | null> {
  const user = await c.env.chat_db
    .prepare('SELECT * FROM users WHERE email = ? AND role = ?')
    .bind(email, role)
    .first<Interfaces.AgentData | Interfaces.CustomerData>();

  if (!user) return null;

  const valid = await verifyPassword(hashedPassword, user.passwordHash);
  if (!valid) return null;

  await c.env.chat_db
    .prepare('UPDATE users SET lastLogin = ? WHERE id = ?')
    .bind(Date.now(), user.id)
    .run();

  user.passwordHash = '[hidden]';
  return user;
}

/// Add User to queue
async function addUserToQueue(
  c: AppContext,
  customerId: string,
  role: 'customer'
): Promise<{success: boolean; errorMessage?: string}| null> {
  if (role !== 'customer') throw Error("An agent can't join a queue");
  const user =   await c.env.chat_db
    .prepare('SELECT * FROM users WHERE id = ? AND ROLE = ?')
    .bind(customerId, role)
    .first();

  if (!user) return {success: false, errorMessage: "User does not exist"}
  
  try {
    await c.env.chat_db
      .prepare('INSERT INTO queue (customer_id) VALUES(?)')
      .bind(customerId)
      .run();

    return {success: true}
  } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed')) {
            return { success: false, errorMessage: 'User is already in the queue' };
          }
    return ({success: false, errorMessage: "An unknown error occured"});
  }
}

/// Remove a user from queue
async function removeUserFromQueue(
  c: AppContext,
  customerId: string,
  role: 'customer'
): Promise<{success: boolean; errorMessage?: string}| null> {
  if (role !== 'customer') throw Error("An agent can't leave or join a queue");
  const user =   await c.env.chat_db
    .prepare('SELECT * FROM users WHERE id = ? AND ROLE = ?')
    .bind(customerId, role)
    .first();

  if (!user) return {success: false, errorMessage: "User does not exist"}
  
  try {
    await c.env.chat_db
      .prepare('DELETE FROM queue WHERE customer_id = ?')
      .bind(customerId)
      .run();

    return {success: true}
  } catch (error: any) {
    return ({success: false, errorMessage: "An unknown error occured"});
  }
}

/// Verify the number of participants
async function verifyParticipants(c: AppContext, senderId: string, receiverId: string, chatId: string): Promise<boolean> {
    const chatData = await c.env.chat_db
    .prepare('SELECT user_id FROM chat_participants WHERE thread_id = ?')
    .bind(chatId)
    .all();

  if (chatData.success) {
    const userIdsArray = chatData.results; 
    const senderIdVerified: boolean = userIdsArray.filter(x => x.user_id === senderId).length === 1;
    const receiverIdVerified: boolean = userIdsArray.filter(x => x.user_id === receiverId).length === 1;

    return senderIdVerified && receiverIdVerified
  }
  return false
}

/// Verify user id
async function verifyUserId(c: AppContext, userId: string): Promise<boolean> {
  const result = await c.env.chat_db
    .prepare('SELECT 1 FROM users WHERE id = ? LIMIT 1')
    .bind(userId)
    .first<{ 1: number }>()
  return !!result
}

/// Create chat
async function createChat(
  c: AppContext,
  senderId: string,
  receiverId: string
): Promise<string> {
  const threadId = uuidv4()
  const now = Date.now()

  await c.env.chat_db
    .prepare('INSERT INTO chat_threads (id, createdAt, resolved_status) VALUES (?, ?, 0)')
    .bind(threadId, now)
    .run()

  await c.env.chat_db.batch([
    c.env.chat_db.prepare('INSERT INTO chat_participants (user_id, thread_id) VALUES (?, ?)').bind(senderId, threadId),
    c.env.chat_db.prepare('INSERT INTO chat_participants (user_id, thread_id) VALUES (?, ?)').bind(receiverId, threadId),
  ])

  return threadId
}

/// Resolve a chat
async function resolveChat(c: AppContext, threadId: string ): Promise<{success: boolean; errorMessage?: string; details?:Error;}> {
  try {
    await c.env.chat_db
    .prepare('UPDATE chat_threads SET resolved_status = 1 WHERE id = ?')
    .bind(threadId)
    .run();
    
    return {success: true};
  } catch (error) {
    if (error instanceof Error) {
      return ({success: false, errorMessage: error.message, details: error});
    }
    return ({success: false, errorMessage: "An unknown error occured"});
  }
} 

/// Send a message
async function sendMessage(
  c: AppContext,
  threadId: string,
  senderId: string,
  content: string,
  receiverId: string
): Promise<Interfaces.Chat> {
  const msgId = uuidv4()
  const now = Date.now()

  await c.env.chat_db
    .prepare(`
      INSERT INTO messages (id, thread_id, sender_id, content, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `)
    .bind(msgId, threadId, senderId, content, now)
    .run()

  return { timestamp: now, content, senderId, receiverId }
}

async function loadChat(
  c: AppContext,
  threadId: string
): Promise<Interfaces.Chat[]> {
  const result = await c.env.chat_db
    .prepare('SELECT * FROM messages WHERE thread_id = ? ORDER BY timestamp ASC')
    .bind(threadId)
    .all<Interfaces.Chat>()
  return result.results || []
}

/// Load history
async function loadHistory(
  c: AppContext,
  userId: string
): Promise<string[]> {
  try {
    const result = await c.env.chat_db
    .prepare('SELECT * FROM chat_participants where user_id = ?')
    .bind(userId)
    .all<string>();
    return result.results
  } catch (error) {
    if (error instanceof Error) throw error
  }
  return [];
} 

/// ::::::::::::::::::: API Endpoints :::::::::::::::::::::

app.get('/', (c) => c.text('Hono API with D1 Database and Durable Objects is running'))


/// ::::: AUTH :::::

app.post("/api/auth/signup", async (c) => {
  const formData = await c.req.json<Interfaces.CAI>();

  if (!formData.name || !formData.email || !formData.hashedPassword || !formData.role) {
    return c.json({ error: "Missing fields" }, 400);
  }

  if (formData.role !== "agent") {
    if (formData.role !== "customer") return c.json({ error: "Invalid roles"}, 400);
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email)) return c.json({error: "Invalid email format"}, 400); /// Should never really run this, just included this for tests

  try {
    console.log("This is the form data sent: ", formData)
    const user = await createUser(c, formData);
    const token = await generateJWT(user.id, user.role, c);
    return c.json({ message: `${formData.role} ${formData.name} created successfully`, userData: user, token: token }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return c.json({ error: 'Failed to create user', details: message }, 500)
  }
});

app.post("/api/auth/login", async (c) => {
  const formData = await c.req.json<Interfaces.LAI>();

  if (!formData.email || !formData.hashedPassword || !formData.role) {
    return c.json({ error: "Missing fields" }, 400);
  }

  if (formData.role !== "agent") {
    if (formData.role !== "customer") return c.json({ error: "Invalid user types"}, 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email)) return c.json({error: "Invalid email format"}, 400); /// Should never really run this, just included this for tests

  try {
    const user = await verifyUser(c, formData.email, formData.hashedPassword, formData.role)
    if (!user) throw new Error('Invalid email or password')
    const token = await generateJWT(user.id, user.role, c);
    return c.json({ message: 'Login successful', userData: user, token: token }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return c.json({ error: 'Login failed', details: message }, 401)
  }
});

/// ::::: CHAT :::::

app.post('/api/createChat/:senderId', async (c) => {
  const { receiverId } = await c.req.json<{ receiverId: string }>()
  const senderId = c.req.param('senderId')

  const senderIdVerified = await verifyUserId(c, senderId);
  console.log("Sender Id verified: ", senderIdVerified, senderId)
  if (!senderIdVerified) return c.json({error: "Invalid id"}, 401)

  // @ts-ignore
  const jwtData: { userId: string; userType: string } = c.get<{ userId: string; userType: string }>('user');
  console.log(jwtData)

  if (senderId !== jwtData.userId) return c.json({error: "Unauthorized"}, 403);
  
  if (receiverId === null || receiverId === undefined) return c.json({error: "Invalid inputs"}, 400);

  if (receiverId === senderId) return c.json({error: "Can't create a chat between the same Ids"}, 400);

  const senderExists = await verifyUserId(c, senderId)
  const receiverExists = await verifyUserId(c, receiverId)

  if (receiverId === null || receiverId === undefined) return c.json({error: "Invalid inputs"}, 400);

  if (!senderExists || !receiverExists)
    return c.json({ error: 'Invalid user ID(s)' }, 401)

  try {
    const chatId = await createChat(c, senderId, receiverId)
    return c.json({ message: 'Chat created', chatDataId: chatId }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return c.json({ error: 'Failed to create chat', details: message }, 500)
  }
})

// Get chat data
app.get('/api/chatData/:threadId', async (c) => {
  console.log("This endpoint gets triggered")
  const threadId = c.req.param('threadId');

  const token = c.req.query('token'); // JWT should come from query or Authorization header
  console.log("This is the token recieved: ", token)
  if (!token) return c.json({ error: 'No token provided' }, 401);

  // Verify JWT
  let jwtData: { userId: string; userType: string } | null;
  try {
    jwtData = await verifyJWT(token, c);
    if (!jwtData) return c.json({ error: 'Unauthorized' }, 401);
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }

  const participantId = jwtData.userId;

  // Verify thread exists
  const threadIdVerified = await verifyThreadId(c, threadId);
  if (!threadIdVerified) return c.json({ error: "This chat doesn't exist" }, 404);

  // Verify user
  const validUser = await verifyUserId(c, participantId);
  if (!validUser) return c.json({ error: 'Invalid participant ID' }, 400);

  const userAuthorized = await verifyParticipants(c, participantId, participantId, threadId);
  if (!userAuthorized) return c.json({ error: "Cannot view this resource" }, 403);

  try {
    const messages = await loadChat(c, threadId); // loadChat should fetch messages from your DB
    return c.json({ threadId, messages }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: 'Failed to load chat data', details: message }, 500);
  }
});

// 1. POST a message to the chat
app.post('/api/chat/:chatId', async (c) => {
  const chatId = c.req.param('chatId');

  const threadIdVerified = await verifyThreadId(c, chatId);
  if (!threadIdVerified) return c.json({ error: "This chat doesn't exist" }, 404);

  const { content, senderId, receiverId } = await c.req.json<{
    content: string;
    senderId: string;
    receiverId: string;
  }>();

  const jwtData: { userId: string } = c.get('user');
  if (senderId !== jwtData.userId) return c.json({ error: "Unauthorized" }, 403);
  if (!content || !senderId || !receiverId) return c.json({ error: "Invalid inputs" }, 400);

  const participantsVerified = await verifyParticipants(c, senderId, receiverId, chatId);
  if (!participantsVerified) return c.json({ error: "Cannot view this resource" }, 403);

  const message = { sender_id: senderId, content, timestamp: Date.now() };

  try {
    const doId = c.env.CHAT_ROOM.idFromName(chatId);
    const stub = c.env.CHAT_ROOM.get(doId);

    const doResponse = await stub.fetch(`https://do.internal/messages?threadId=${chatId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (doResponse.status === 201) {
      return c.json({ message: 'Message sent successfully', data: message }, 201);
    } else {
      const err = await doResponse.text();
      return c.json({ error: 'Failed to send message via DO', details: err }, 500);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return c.json({ error: 'Failed to send message', details: msg }, 500);
  }
});

// 2. GET WebSocket connection
app.get('/api/chat/:chatId/ws', async (c) => {
  const chatId = c.req.param('chatId');
  const token = c.req.query('token');

  if (!token) return c.json({ error: 'No token provided' }, 401);

  // 1. VERIFY JWT TOKEN
  let jwtData: { userId: string; userType: string };
  try {
    jwtData = await verifyJWT(token, c) as { userId: string; userType: string };
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }

  const userId = jwtData.userId;

  // 2. VERIFY CHAT EXISTS
  const threadIdVerified = await verifyThreadId(c, chatId);
  if (!threadIdVerified) return c.json({ error: "This chat doesn't exist" }, 404);

  // 3. VERIFY USER EXISTS
  const validUser = await verifyUserId(c, userId);
  if (!validUser) return c.json({ error: 'Invalid participant ID' }, 400);

  // 4. VERIFY USER IS PART OF THE CHAT
  const authorized = await verifyParticipants(c, userId, userId, chatId);
  if (!authorized) return c.json({ error: 'Cannot view this resource' }, 403);

  try {
    // 5. CONNECT TO DURABLE OBJECT
    const doId = c.env.CHAT_ROOM.idFromName(chatId);
    const stub = c.env.CHAT_ROOM.get(doId);

    // Forward WS request to DO
    const url = new URL(
      `/websocket?threadId=${chatId}&userId=${userId}`,
      'https://do.internal'
    );

    const request = new Request(url, c.req.raw);

    return stub.fetch(request);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return c.json({ error: 'Failed to connect to chat WebSocket', details: msg }, 500);
  }
});



/// Join Queue
app.post('/api/joinqueue', async (c) => {
  const formData: {customerId: string; role: 'customer' } = await c.req.json();
      // @ts-ignore
  const jwtData: { userId: string; userType: string } = c.get<{ userId: string; userType: string }>('user');
  if (jwtData.userId !== formData.customerId || jwtData.userType !== formData.role) return c.json({error: "Forbidden"}, 403);
  try {
    const addedUser = await addUserToQueue(c, formData.customerId, formData.role)
    if (addedUser?.success) return c.json({message: "You've been successfully added to the queue"}, 201);
    if (!addedUser?.success) throw new Error("Couldn't add you to the queue");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return c.json({ error: 'Failed to send message', details: message }, 500)
  }
});

/// Join queue
app.post('/api/leavequeue', async (c) => {
  const formData: {customerId: string; role: 'customer' } = await c.req.json();
      // @ts-ignore
  const jwtData: { userId: string; userType: string } = c.get<{ userId: string; userType: string }>('user');
  if (jwtData.userId !== formData.customerId || jwtData.userType !== formData.role) return c.json({error: "Forbidden"}, 403);
  try {
    const removedUser = await removeUserFromQueue(c, formData.customerId, formData.role)
    if (removedUser?.success) return c.json({message: "You've been successfully removed from the queue"}, 201);
    if (!removedUser?.success) throw new Error("Couldn't remove you from the queue");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return c.json({ error: 'Failed to leave queue', details: message }, 500)
  }
});

/// Resolve a chat
app.post('/api/resolvechat', async (c) => {
  const { customerId, role, threadId } = await c.req.json();
  // @ts-ignore
  const jwtData = c.get<{ userId: string; userType: string }>('user');
  // @ts-ignore
  if (jwtData.userId !== customerId || jwtData.userType !== role)
    return c.json({ error: 'Forbidden' }, 403);

  try {
    const resolvedChat = await resolveChat(c, threadId);

    if (resolvedChat.success) {
      return c.json({ success: true, message: 'Chat resolved' }, 201);
    }

    return c.json(
      { success: false, error: resolvedChat.errorMessage },
      400
    );

  } catch (error) {
    return c.json({ error: 'Internal error', details: error }, 500);
  }
});

/// Get chat history
app.get('/api/history/:userId/:token', async (c) => {
  const userId: string = c.req.param("userId");
  const token = c.req.param('token');

  if (!token) return c.json({ error: 'No token provided' }, 401);
  console.log("Token valid: ", true)

  // @ts-ignore
  const jwtData = await verifyJWT(token, c)
  // @ts-ignore
  if (jwtData.userId !== userId)
    return c.json({ error: 'Forbidden' }, 403);

  try {
    const result: string[] = await loadHistory(c, userId)
    return c.json({success: true, data: result}, 200)
  } catch (error) {
    if (error instanceof Error) return c.json({success: false, details: error.message}, 500)
    return c.json({success: false, message: "An unknown error occured"}, 500);
  }
})


export { ChatRoom };

export default app;
