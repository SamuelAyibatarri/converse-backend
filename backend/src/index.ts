import { Hono, Context } from 'hono'
import { cors } from 'hono/cors'
import { v4 as uuidv4 } from 'uuid'
import * as argon2 from "@node-rs/argon2";
import type * as Interfaces from './Interfaces.ts'
import { SignJWT, jwtVerify } from "jose";

type Variables = {
  user: {
    userId: string;
    userType: string;
  };
};

type Bindings = {
  chat_db: D1Database;
  JWT_SECRET: string;
};

type AppContext = Context<{ Bindings: Bindings; Variables: Variables }>;

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use(
  '/api/*',
  cors({
    origin: 'http://localhost:5173',
    allowMethods: ['POST', 'GET'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
)

app.use("/api/*", async (c, next) => {
  const authHeader = c.req.header("Authorization");
  const path = c.req.path;
  if (path === "/api/auth/signup" || path === "/api/auth/login") {
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
    .setExpirationTime("10m") // expires in 30 minutes
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
async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

// Verify password
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await argon2.verify(hash, password);
}

async function checkIfUserExists(c: AppContext, email: string): Promise<boolean> {
  const result = await c.env.chat_db
    .prepare('SELECT 1 FROM users WHERE email = ? LIMIT 1')
    .bind(email)
    .first<{ 1: number }>()
  return !!result
}

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
    .bind(id, data.name, data.email, hashedPassword, data.usertype, now, now)
    .run()

  return { id, ...data, accountCreationDate: now, lastLogin: now }
}

async function verifyThreadId(c: AppContext, chatId: string): Promise<boolean> {
  const chatData = await c.env.chat_db
    .prepare('SELECT thread_id FROM chat_participants WHERE thread_id = ?')
    .bind(chatId)
    .all();

  if (!chatData.results || chatData.results.length === 0) return false;
  return true;
}


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


async function verifyUserId(c: AppContext, userId: string): Promise<boolean> {
  const result = await c.env.chat_db
    .prepare('SELECT 1 FROM users WHERE id = ? LIMIT 1')
    .bind(userId)
    .first<{ 1: number }>()
  return !!result
}

async function createChat(
  c: AppContext,
  senderId: string,
  receiverId: string
): Promise<string> {
  const threadId = uuidv4()
  const now = Date.now()

  await c.env.chat_db
    .prepare('INSERT INTO chat_threads (id, createdAt) VALUES (?, ?)')
    .bind(threadId, now)
    .run()

  await c.env.chat_db.batch([
    c.env.chat_db.prepare('INSERT INTO chat_participants (user_id, thread_id) VALUES (?, ?)').bind(senderId, threadId),
    c.env.chat_db.prepare('INSERT INTO chat_participants (user_id, thread_id) VALUES (?, ?)').bind(receiverId, threadId),
  ])

  return threadId
}

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

/// ::::::::::::::::::: API Endpoints :::::::::::::::::::::

app.get('/', (c) => c.text('Hono API with D1 Database is running'))


/// ::::: AUTH :::::

app.post("/api/auth/signup", async (c) => {
  const formData = await c.req.json<Interfaces.CAI>();

  if (!formData.name || !formData.email || !formData.hashedPassword || !formData.usertype) {
    return c.json({ error: "Missing fields" }, 400);
  }

  if (formData.usertype !== "agent") {
    if (formData.usertype !== "customer") return c.json({ error: "Invalid user types"}, 400);
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email)) return c.json({error: "Invalid email format"}, 400); /// Should never really run this, just included this for tests

  try {
    const user = await createUser(c, formData);
    return c.json({ message: `${formData.usertype} ${formData.name} created successfully`, userData: user }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return c.json({ error: 'Failed to create user', details: message }, 500)
  }
});

app.post("/api/auth/login", async (c) => {
  const formData = await c.req.json<Interfaces.LAI>();

  if (!formData.email || !formData.hashedPassword || !formData.usertype) {
    return c.json({ error: "Missing fields" }, 400);
  }

  if (formData.usertype !== "agent") {
    if (formData.usertype !== "customer") return c.json({ error: "Invalid user types"}, 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email)) return c.json({error: "Invalid email format"}, 400); /// Should never really run this, just included this for tests

  try {
    const user = await verifyUser(c, formData.email, formData.hashedPassword, formData.usertype)
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

/// Send a chat
app.post('/api/chat/:chatId', async (c) => {
  const chatId = c.req.param('chatId');

  const threadIdVerified = await verifyThreadId(c, chatId);
  if (!threadIdVerified) return c.json({error: "This chat doesn't exist"}, 404);

  const { content, senderId, receiverId } = await c.req.json<{
    content: string
    senderId: string
    receiverId: string
  }>()

    // @ts-ignore
  const jwtData: { userId: string; userType: string } = c.get<{ userId: string; userType: string }>('user');

  if (senderId !== jwtData.userId) return c.json({error: "Unauthorized"}, 403);

  if (receiverId === null || receiverId === undefined) return c.json({error: "Invalid inputs"}, 400);
  if (content === null || content === undefined) return c.json({error: "Invalid inputs"}, 400);
  if (senderId === null || senderId === undefined) return c.json({error: "Invalid inputs"}, 400);

  const senderExists = await verifyUserId(c, senderId)
  const receiverExists = await verifyUserId(c, receiverId)

  const participantsVerified = await verifyParticipants(c, senderId, receiverId, chatId);
  if (!participantsVerified) return c.json({error: "Cannot view this resource"}, 403);

  if (!senderExists || !receiverExists)
    return c.json({ error: 'Invalid sender or receiver ID' }, 400)

  try {
    const message = await sendMessage(c, chatId, senderId, content, receiverId)
    return c.json({ message: 'Message sent successfully', data: message }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return c.json({ error: 'Failed to send message', details: message }, 500)
  }
})

/// Get chat data
app.post('/api/chatData/:threadId', async (c) => {
  const threadId = c.req.param('threadId')

  const threadIdVerified = await verifyThreadId(c, threadId);
  if (!threadIdVerified) return c.json({error: "This chat doesn't exist"}, 404);

  const { participantId } = await c.req.json<{ participantId: string }>()

    // @ts-ignore
  const jwtData: { userId: string; userType: string } = c.get<{ userId: string; userType: string }>('user');
  if (!jwtData) return c.json({ error: 'Unauthorized' }, 401);

  if (participantId !== jwtData.userId) return c.json({error: "Unauthorized"}, 403);

  const validUser = await verifyUserId(c, participantId)
  if (!validUser) return c.json({ error: 'Invalid participant ID' }, 400)
  
  const userAuthorized = await verifyParticipants(c, participantId, participantId, threadId);
  if (!userAuthorized) return c.json({error: "Cannot view this resourc"}, 403)

  try {
    const messages = await loadChat(c, threadId)
    return c.json({ threadId, messages }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return c.json({ error: 'Failed to load chat data', details: message }, 500)
  }
})

export default app
