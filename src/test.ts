import fetch, { RequestInit } from "node-fetch"; // Make sure 'node-fetch' is installed (npm install node-fetch @types/node-fetch)
import * as fs from "fs";
import * as path from "path";
import * as assert from "assert"; // Using Node's built-in assert for simple checks

// --- Configuration ---
const BASE_URL = "http://localhost:8888"; // Assuming wrangler runs on 8787
const TEST_DATA_FILE = path.join(__dirname, "test_data_state.json"); // Store test state
const TIMEOUT = 15000; // 15 seconds timeout for requests

// --- Interfaces ---
interface UserTestData {
  token: string;
  loginTime: number; // Timestamp of last successful login
  email: string;
  hashedPassword: string; // CORRECTED: Was passwordHash
  usertype: "agent" | "customer";
  id: string; // User ID from the database
}

interface ThreadTestData {
  threadId: string;
  participants: string[]; // Array of user IDs
}

interface TestState {
  users: Record<string, UserTestData>; // Keyed by email for easy lookup
  threads: Record<string, ThreadTestData>; // Keyed by threadId
}

// --- Test State Management ---
const readTestState = (): TestState => {
  try {
    if (fs.existsSync(TEST_DATA_FILE)) {
      return JSON.parse(fs.readFileSync(TEST_DATA_FILE, "utf-8"));
    }
  } catch (error) {
    console.warn("Could not read test state file, starting fresh.", error);
  }
  return { users: {}, threads: {} };
};

const writeTestState = (data: TestState) => {
  try {
    fs.mkdirSync(path.dirname(TEST_DATA_FILE), { recursive: true }); // Ensure directory exists
    fs.writeFileSync(TEST_DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Failed to write test state file:", error);
  }
};

// --- Helper Functions ---

// Simple logger with test names
const log = (testName: string, message: string, data?: any) => {
  console.log(`[${testName}] ${message}`, data || "");
};

// Generic request function
const makeRequest = async (url: string, options: RequestInit, testName: string = "Request") => {
  // Safely attempt to parse body only if it's a string
  let logBody = {};
  if (typeof options.body === 'string') {
      try {
          logBody = JSON.parse(options.body);
      } catch (e) {
          logBody = { rawBody: options.body }; // Log raw string if not JSON
      }
  } else if (options.body) {
       logBody = { bodyType: typeof options.body }; // Log type if not string
  }

  log(testName, `Sending ${options.method || "GET"} to ${url}`, logBody);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    const response = await fetch(url, { ...options, signal: controller.signal as any });
    clearTimeout(timeoutId);

    let responseBody: any;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      responseBody = await response.json();
    } else {
      responseBody = await response.text();
    }

    log(testName, `Received status ${response.status}`, responseBody);
    return { status: response.status, body: responseBody };

  } catch (error: any) {
    if (error.name === 'AbortError') {
      log(testName, `Request timed out after ${TIMEOUT / 1000}s`);
      throw new Error(`Request timed out: ${options.method || "GET"} ${url}`);
    }
    log(testName, "Request failed", error);
    throw error;
  }
};

// --- Test Setup: User Management ---

// Gets user data, signing up or logging in as needed. Manages state.
// CORRECTED: Parameter uses hashedPassword
async function ensureUser(user: { name: string; email: string; hashedPassword: string; usertype: "agent" | "customer"; }, testName: string): Promise<UserTestData> {
  const testState = readTestState();
  const existingUser = testState.users[user.email];

  if (existingUser && existingUser.token && (Date.now() - existingUser.loginTime < 10 * 60 * 1000)) {
    log(testName, `Using cached token for ${user.email}`);
    return existingUser;
  }

  log(testName, `Attempting login for ${user.email}...`);
  // CORRECTED: Payload uses hashedPassword
  const loginPayload = { email: user.email, hashedPassword: user.hashedPassword, usertype: user.usertype };
  const loginRes = await makeRequest(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(loginPayload),
  }, `${testName} - Login`);

  if (loginRes.status === 200 && loginRes.body.token && loginRes.body.userData?.id) {
    log(testName, `Login successful for ${user.email}`);
    const loggedInData: UserTestData = {
      ...existingUser,
      token: loginRes.body.token,
      loginTime: Date.now(),
      email: user.email,
      hashedPassword: user.hashedPassword, // CORRECTED: Storing hashedPassword
      usertype: user.usertype,
      id: loginRes.body.userData.id,
    };
    testState.users[user.email] = loggedInData;
    writeTestState(testState);
    return loggedInData;
  }

  if (loginRes.status === 401 || loginRes.status === 404) {
     log(testName, `Login failed for ${user.email}, attempting signup...`);
     // CORRECTED: Payload uses hashedPassword
     const signupPayload = { name: user.name, email: user.email, hashedPassword: user.hashedPassword, usertype: user.usertype };
     const signupRes = await makeRequest(`${BASE_URL}/api/auth/signup`, {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify(signupPayload),
     }, `${testName} - Signup`);

     if (signupRes.status === 201 && signupRes.body.userData?.id) { // Assuming 201 for signup based on backend code
        log(testName, `Signup successful for ${user.email}. Now logging in to get token...`);
        const postSignupLoginRes = await makeRequest(`${BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(loginPayload), // Uses corrected loginPayload
        }, `${testName} - Post-Signup Login`);

        if (postSignupLoginRes.status === 200 && postSignupLoginRes.body.token) {
            log(testName, `Post-signup login successful for ${user.email}`);
            const newUserData: UserTestData = {
                token: postSignupLoginRes.body.token,
                loginTime: Date.now(),
                email: user.email,
                hashedPassword: user.hashedPassword, // CORRECTED: Storing hashedPassword
                usertype: user.usertype,
                id: signupRes.body.userData.id,
            };
            testState.users[user.email] = newUserData;
            writeTestState(testState);
            return newUserData;
        } else {
             throw new Error(`Post-signup login failed for ${user.email}. Status: ${postSignupLoginRes.status}`);
        }
     } else if (signupRes.status === 409 || (signupRes.status === 500 && signupRes.body?.details?.includes('User already exists'))) { // Check for specific error message
        log(testName, `Signup failed (user likely exists), retrying login for ${user.email}...`);
        const retryLoginRes = await makeRequest(`${BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(loginPayload), // Uses corrected loginPayload
        }, `${testName} - Retry Login`);

         if (retryLoginRes.status === 200 && retryLoginRes.body.token && retryLoginRes.body.userData?.id) {
             log(testName, `Retry login successful for ${user.email}`);
             const loggedInDataRetry: UserTestData = {
                ...existingUser,
                token: retryLoginRes.body.token,
                loginTime: Date.now(),
                email: user.email,
                hashedPassword: user.hashedPassword, // CORRECTED: Storing hashedPassword
                usertype: user.usertype,
                id: retryLoginRes.body.userData.id,
             };
             testState.users[user.email] = loggedInDataRetry;
             writeTestState(testState);
             return loggedInDataRetry;
         } else {
             throw new Error(`Retry login failed unexpectedly for ${user.email}. Status: ${retryLoginRes.status}, Body: ${JSON.stringify(retryLoginRes.body)}`);
         }
     } else {
        throw new Error(`Signup failed for ${user.email}. Status: ${signupRes.status}, Body: ${JSON.stringify(signupRes.body)}`);
     }
  }

  throw new Error(`Initial login failed unexpectedly for ${user.email}. Status: ${loginRes.status}, Body: ${JSON.stringify(loginRes.body)}`);
}

// --- Test Suite ---

async function runTests() {
  console.log("\n--- Starting Test Suite ---");
  let testState = readTestState(); // Load initial state

  const runId = Date.now().toString().slice(-6);
  // CORRECTED: User definitions use hashedPassword
  const alice = { name: `Alice_${runId}`, email: `alice_${runId}@test.com`, hashedPassword: "alice123", usertype: "customer" as const };
  const bob = { name: `Bob_${runId}`, email: `bob_${runId}@test.com`, hashedPassword: "bob123", usertype: "agent" as const };
  const charlie = { name: `Charlie_${runId}`, email: `charlie_${runId}@test.com`, hashedPassword: "charlie123", usertype: "customer" as const };


  // --- Auth Tests ---
  log("Auth", "Running Authentication Tests...");

  await testSignupFailures(alice, "Auth Signup Failures");
  await testLoginFailures(alice, "Auth Login Failures Pre-Create");

  log("Auth", "Ensuring test users exist...");
  const aliceData = await ensureUser(alice, "Auth Ensure Alice");
  const bobData = await ensureUser(bob, "Auth Ensure Bob");
  const charlieData = await ensureUser(charlie, "Auth Ensure Charlie");
  log("Auth", "Test users ensured.", { aliceId: aliceData.id, bobId: bobData.id, charlieId: charlieData.id });
  testState = readTestState(); // Reload state after potential updates

  await testLoginFailures(alice, "Auth Login Failures Post-Create");

  // Assuming you have a /api/users/:id endpoint for testing auth
  const userApiEndpoint = `${BASE_URL}/api/users/${aliceData.id}`; // Define a dummy endpoint if needed
  // await testAuthRequired(userApiEndpoint, "GET", null, "Auth - Get User No Token");
  // await testAuthInvalidToken(userApiEndpoint, "GET", null, "Auth - Get User Invalid Token");
  log("Auth", "Skipping specific protected route tests as '/api/users/:id' not implemented.");


  // --- Chat Creation Tests ---
  log("Chat Creation", "Running Chat Creation Tests...");
  let threadId_AliceBob: string | undefined;

  await testCreateChatFailures(aliceData, bobData, "Chat Creation Failures");

  const createChatRes = await makeRequest(`${BASE_URL}/api/createChat/${aliceData.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${aliceData.token}` },
      body: JSON.stringify({ receiverId: bobData.id }),
  }, "Chat Creation Success");
  assert.strictEqual(createChatRes.status, 201, "Chat Creation Success: Expected status 201");
  assert.ok(createChatRes.body.chatDataId, "Chat Creation Success: Expected chatDataId in response");
  threadId_AliceBob = createChatRes.body.chatDataId;
  log("Chat Creation", `Successfully created chat between Alice and Bob: ${threadId_AliceBob}`);

   if (threadId_AliceBob) {
      testState.threads[threadId_AliceBob] = { threadId: threadId_AliceBob, participants: [aliceData.id, bobData.id] };
      writeTestState(testState);
   } else {
       throw new Error("Failed to get threadId_AliceBob after successful creation");
   }

  const createChatAgainRes = await makeRequest(`${BASE_URL}/api/createChat/${aliceData.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${aliceData.token}` },
      body: JSON.stringify({ receiverId: bobData.id }),
  }, "Chat Creation Duplicate");
   // Your backend might return 500 if UNIQUE constraint fails without specific handling
   assert.ok([200, 201, 409, 500].includes(createChatAgainRes.status), `Chat Creation Duplicate: Expected status 200, 201, 409 or 500, got ${createChatAgainRes.status}`);


  // --- Message Sending Tests ---
  log("Message Sending", "Running Message Sending Tests...");

  await testSendMessageFailures(aliceData, bobData, charlieData, threadId_AliceBob, "Message Sending Failures");

  const sendMsgResAlice = await makeRequest(`${BASE_URL}/api/chat/${threadId_AliceBob}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${aliceData.token}` },
    body: JSON.stringify({ senderId: aliceData.id, receiverId: bobData.id, content: "Hello Bob from Alice!" }),
  }, "Message Sending Alice->Bob");
  assert.strictEqual(sendMsgResAlice.status, 201, "Message Sending Alice->Bob: Expected status 201");
  assert.ok(sendMsgResAlice.body.data?.senderId, "Message Sending Alice->Bob: Expected message data in response"); // Check nested data based on backend response

   const sendMsgResBob = await makeRequest(`${BASE_URL}/api/chat/${threadId_AliceBob}`, {
     method: "POST",
     headers: { "Content-Type": "application/json", Authorization: `Bearer ${bobData.token}` },
     body: JSON.stringify({ senderId: bobData.id, receiverId: aliceData.id, content: "Hi Alice from Bob!" }),
   }, "Message Sending Bob->Alice");
   assert.strictEqual(sendMsgResBob.status, 201, "Message Sending Bob->Alice: Expected status 201");
   assert.ok(sendMsgResBob.body.data?.senderId, "Message Sending Bob->Alice: Expected message data in response");


  // --- Message Loading Tests ---
  log("Message Loading", "Running Message Loading Tests...");

  await testLoadMessagesFailures(aliceData, bobData, charlieData, threadId_AliceBob, "Message Loading Failures");

  const loadChatResAlice = await makeRequest(`${BASE_URL}/api/chatData/${threadId_AliceBob}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${aliceData.token}` },
    body: JSON.stringify({ participantId: aliceData.id }),
  }, "Message Loading Alice");
  assert.strictEqual(loadChatResAlice.status, 200, "Message Loading Alice: Expected status 200");
  assert.ok(Array.isArray(loadChatResAlice.body.messages), "Message Loading Alice: Expected messages array"); // Check 'messages' field based on backend response
  assert.strictEqual(loadChatResAlice.body.messages.length, 2, "Message Loading Alice: Expected 2 messages");
  assert.strictEqual(loadChatResAlice.body.messages[0].content, "Hello Bob from Alice!", "Message Loading Alice: Check message 1 content");
  assert.strictEqual(loadChatResAlice.body.messages[1].content, "Hi Alice from Bob!", "Message Loading Alice: Check message 2 content");

   const loadChatResBob = await makeRequest(`${BASE_URL}/api/chatData/${threadId_AliceBob}`, {
     method: "POST",
     headers: { "Content-Type": "application/json", Authorization: `Bearer ${bobData.token}` },
     body: JSON.stringify({ participantId: bobData.id }),
   }, "Message Loading Bob");
   assert.strictEqual(loadChatResBob.status, 200, "Message Loading Bob: Expected status 200");
   assert.ok(Array.isArray(loadChatResBob.body.messages), "Message Loading Bob: Expected messages array");
   assert.strictEqual(loadChatResBob.body.messages.length, 2, "Message Loading Bob: Expected 2 messages");


  console.log("\n--- Test Suite Finished Successfully ---");
}

// --- Specific Failure Test Functions ---

async function testSignupFailures(userData: { name: string, email: string, hashedPassword: string, usertype: string }, testName: string) {
  log(testName, "Testing signup failures...");
  const { email, ...missingEmail } = userData;
  const resMissingEmail = await makeRequest(`${BASE_URL}/api/auth/signup`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(missingEmail) }, testName);
  assert.strictEqual(resMissingEmail.status, 400, `${testName}: Missing email should return 400`);

  // CORRECTED: Check for hashedPassword
  const { hashedPassword, ...missingPassword } = userData;
  const resMissingPassword = await makeRequest(`${BASE_URL}/api/auth/signup`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(missingPassword) }, testName);
  assert.strictEqual(resMissingPassword.status, 400, `${testName}: Missing password should return 400`);

  const invalidEmail = { ...userData, email: "invalid-email" };
  const resInvalidEmail = await makeRequest(`${BASE_URL}/api/auth/signup`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(invalidEmail) }, testName);
  assert.strictEqual(resInvalidEmail.status, 400, `${testName}: Invalid email format should return 400`);

   const invalidUserType = { ...userData, usertype: "admin" };
   const resInvalidUserType = await makeRequest(`${BASE_URL}/api/auth/signup`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(invalidUserType) }, testName);
   assert.strictEqual(resInvalidUserType.status, 400, `${testName}: Invalid usertype should return 400`);

  log(testName, "Signup failure tests passed.");
}

async function testLoginFailures(userData: { email: string, hashedPassword: string, usertype: string }, testName: string) {
  log(testName, "Testing login failures...");
  // CORRECTED: Use hashedPassword throughout
  const { email, ...missingEmail } = { email: userData.email, hashedPassword: userData.hashedPassword, usertype: userData.usertype };
  const resMissingEmail = await makeRequest(`${BASE_URL}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(missingEmail) }, testName);
  assert.strictEqual(resMissingEmail.status, 400, `${testName}: Missing email should return 400`);

  const { hashedPassword, ...missingPassword } = { email: userData.email, hashedPassword: userData.hashedPassword, usertype: userData.usertype };
  const resMissingPassword = await makeRequest(`${BASE_URL}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(missingPassword) }, testName);
  assert.strictEqual(resMissingPassword.status, 400, `${testName}: Missing password should return 400`);

  const incorrectPassword = { email: userData.email, hashedPassword: "wrongpassword", usertype: userData.usertype };
  const resIncorrectPassword = await makeRequest(`${BASE_URL}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(incorrectPassword) }, testName);
  assert.strictEqual(resIncorrectPassword.status, 401, `${testName}: Incorrect password should return 401`);

  const nonExistentUser = { email: `nonexistent_${Date.now()}@test.com`, hashedPassword: "anypass", usertype: "customer" as const };
  const resNonExistent = await makeRequest(`${BASE_URL}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nonExistentUser) }, testName);
  if (testName.includes("Pre-Create")) {
     // Your backend returns 401 for non-existent user based on verifyUser returning null
    assert.strictEqual(resNonExistent.status, 401, `${testName}: Non-existent user should return 401 (based on backend logic)`);
  } else {
    log(testName, "Skipping non-existent user check post-creation.");
  }

  log(testName, "Login failure tests passed.");
}

async function testAuthRequired(url: string, method: string, body: any, testName: string) {
   log(testName, `Testing auth required for ${method} ${url}...`);
   const res = await makeRequest(url, { method: method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined }, testName);
   // Your middleware returns 401 for missing token
   assert.strictEqual(res.status, 401, `${testName}: Expected 401 Unauthorized without token`);
   log(testName, "Auth required test passed.");
}

async function testAuthInvalidToken(url: string, method: string, body: any, testName: string) {
  log(testName, `Testing invalid token for ${method} ${url}...`);
  const res = await makeRequest(url, {
    method: method,
    headers: { "Content-Type": "application/json", Authorization: "Bearer invalidtoken123" },
    body: body ? JSON.stringify(body) : undefined
  }, testName);
  // Your middleware returns 401 for invalid token
  assert.strictEqual(res.status, 401, `${testName}: Expected 401 Unauthorized with invalid token`);
  log(testName, "Invalid token test passed.");
}

async function testCreateChatFailures(currentUser: UserTestData, otherUser: UserTestData, testName: string) {
    log(testName, "Testing chat creation failures...");
    const resMissingReceiver = await makeRequest(`${BASE_URL}/api/createChat/${currentUser.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${currentUser.token}` },
        body: JSON.stringify({}),
    }, testName);
    // Your backend doesn't explicitly check for receiverId in body, might return 500 later. Adjust if needed.
    // Let's assume it should be 400 Bad Request if receiverId is missing.
     assert.strictEqual(resMissingReceiver.status, 400, `${testName}: Missing receiverId should return 400`);


    const resChatSelf = await makeRequest(`${BASE_URL}/api/createChat/${currentUser.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${currentUser.token}` },
        body: JSON.stringify({ receiverId: currentUser.id }),
    }, testName);
    // Your backend doesn't prevent creating chat with self. This might be desired or not.
    // If it should fail, assert 400. If it's allowed, assert 201. Let's assume 400 for test.
    assert.strictEqual(resChatSelf.status, 400, `${testName}: Creating chat with self should ideally return 400`);

    const resNonExistentReceiver = await makeRequest(`${BASE_URL}/api/createChat/${currentUser.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${currentUser.token}` },
        body: JSON.stringify({ receiverId: "non-existent-user-id" }),
    }, testName);
    // Your backend returns 401 based on verifyUserId
    assert.strictEqual(resNonExistentReceiver.status, 401, `${testName}: Non-existent receiver should return 401 (based on backend logic)`);

    const resMismatchUser = await makeRequest(`${BASE_URL}/api/createChat/some-other-user-id`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${currentUser.token}` },
        body: JSON.stringify({ receiverId: otherUser.id }),
    }, testName);
     // Your backend checks senderId from URL vs database, returns 401 if mismatch/not found
     assert.strictEqual(resMismatchUser.status, 401, `${testName}: Mismatched senderId in URL should return 401 (based on backend logic)`);

    log(testName, "Chat creation failure tests passed.");
}

async function testSendMessageFailures(sender: UserTestData, receiver: UserTestData, intruder: UserTestData, threadId: string, testName: string) {
    log(testName, "Testing message sending failures...");
    const resMissingContent = await makeRequest(`${BASE_URL}/api/chat/${threadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sender.token}` },
        body: JSON.stringify({ senderId: sender.id, receiverId: receiver.id }), // Missing content
    }, testName);
    // Your backend doesn't explicitly check for content, might return 500 later. Adjust if needed.
    assert.strictEqual(resMissingContent.status, 400, `${testName}: Missing content should return 400`);

    const resBadThread = await makeRequest(`${BASE_URL}/api/chat/non-existent-thread`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sender.token}` },
        body: JSON.stringify({ senderId: sender.id, receiverId: receiver.id, content: "Test" }),
    }, testName);
    // D1 error if thread doesn't exist might cause 500. A 404 would be better.
     assert.strictEqual(resBadThread.status, 404, `${testName}: Non-existent thread should ideally return 404, might return 500`);

    const resNotParticipant = await makeRequest(`${BASE_URL}/api/chat/${threadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${intruder.token}` },
        body: JSON.stringify({ senderId: intruder.id, receiverId: sender.id, content: "Intruder message" }),
    }, testName);
    // Your backend checks sender/receiver existence, but not participation. It relies on JWT middleware.
    // If JWT middleware passes (valid token), this might succeed or fail depending on deeper checks.
    // Assuming the backend SHOULD check participation and return 403.
    assert.strictEqual(resNotParticipant.status, 403, `${testName}: Non-participant sender should return 403 Forbidden`);

     const resImpersonate = await makeRequest(`${BASE_URL}/api/chat/${threadId}`, {
         method: "POST",
         headers: { "Content-Type": "application/json", Authorization: `Bearer ${sender.token}` },
         body: JSON.stringify({ senderId: receiver.id, content: "Alice trying to send as Bob" }),
     }, testName);
     // Your backend checks sender/receiver existence based on body IDs, doesn't compare to token user ID.
     // It relies on JWT middleware for auth. This should probably fail.
     // Assuming backend SHOULD compare senderId in body to token userId and return 403.
     assert.strictEqual(resImpersonate.status, 403, `${testName}: Mismatched senderId should return 403 Forbidden`);

    log(testName, "Message sending failure tests passed.");
}

async function testLoadMessagesFailures(user: UserTestData, otherParticipant: UserTestData, intruder: UserTestData, threadId: string, testName: string) {
    log(testName, "Testing message loading failures...");
    const resBadThread = await makeRequest(`${BASE_URL}/api/chatData/non-existent-thread`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ participantId: user.id }),
    }, testName);
    // D1 might return empty results (200 OK) or error (500). 404 preferred.
    assert.ok([200, 404, 500].includes(resBadThread.status), `${testName}: Non-existent thread should ideally return 404, might return 200/500`);

    const resNotParticipant = await makeRequest(`${BASE_URL}/api/chatData/${threadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${intruder.token}` },
        body: JSON.stringify({ participantId: intruder.id }),
    }, testName);
    // Your backend relies on verifyUserId in body, not JWT. It might succeed if ID is valid, or fail.
    // Assuming backend SHOULD verify participation based on token and return 403.
    assert.strictEqual(resNotParticipant.status, 403, `${testName}: Non-participant loader should return 403 Forbidden`);

     const resMismatchBody = await makeRequest(`${BASE_URL}/api/chatData/${threadId}`, {
         method: "POST",
         headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
         body: JSON.stringify({ participantId: otherParticipant.id }),
     }, testName);
     // Your backend relies on verifyUserId in body. It might succeed if ID is valid, or fail.
     // Assuming backend SHOULD compare participantId in body to token userId and return 403.
     assert.strictEqual(resMismatchBody.status, 403, `${testName}: Mismatched participantId in body should return 403 Forbidden`);

    log(testName, "Message loading failure tests passed.");
}


// --- Run the tests ---
runTests().catch(error => {
  console.error("\n--- Test Suite FAILED ---");
  console.error(error);
  process.exit(1);
});

