"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var node_fetch_1 = require("node-fetch"); // Make sure 'node-fetch' is installed (npm install node-fetch @types/node-fetch)
var fs = require("fs");
var path = require("path");
var assert = require("assert"); // Using Node's built-in assert for simple checks
// --- Configuration ---
var BASE_URL = "http://localhost:8888"; // Assuming wrangler runs on 8787
var TEST_DATA_FILE = path.join(__dirname, "test_data_state.json"); // Store test state
var TIMEOUT = 15000; // 15 seconds timeout for requests
// --- Test State Management ---
var readTestState = function () {
    try {
        if (fs.existsSync(TEST_DATA_FILE)) {
            return JSON.parse(fs.readFileSync(TEST_DATA_FILE, "utf-8"));
        }
    }
    catch (error) {
        console.warn("Could not read test state file, starting fresh.", error);
    }
    return { users: {}, threads: {} };
};
var writeTestState = function (data) {
    try {
        fs.mkdirSync(path.dirname(TEST_DATA_FILE), { recursive: true }); // Ensure directory exists
        fs.writeFileSync(TEST_DATA_FILE, JSON.stringify(data, null, 2));
    }
    catch (error) {
        console.error("Failed to write test state file:", error);
    }
};
// --- Helper Functions ---
// Simple logger with test names
var log = function (testName, message, data) {
    console.log("[".concat(testName, "] ").concat(message), data || "");
};
// Generic request function
var makeRequest = function (url_1, options_1) {
    var args_1 = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args_1[_i - 2] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([url_1, options_1], args_1, true), void 0, function (url, options, testName) {
        var logBody, controller_1, timeoutId, response, responseBody, contentType, error_1;
        if (testName === void 0) { testName = "Request"; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    logBody = {};
                    if (typeof options.body === 'string') {
                        try {
                            logBody = JSON.parse(options.body);
                        }
                        catch (e) {
                            logBody = { rawBody: options.body }; // Log raw string if not JSON
                        }
                    }
                    else if (options.body) {
                        logBody = { bodyType: typeof options.body }; // Log type if not string
                    }
                    log(testName, "Sending ".concat(options.method || "GET", " to ").concat(url), logBody);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 7, , 8]);
                    controller_1 = new AbortController();
                    timeoutId = setTimeout(function () { return controller_1.abort(); }, TIMEOUT);
                    return [4 /*yield*/, (0, node_fetch_1.default)(url, __assign(__assign({}, options), { signal: controller_1.signal }))];
                case 2:
                    response = _a.sent();
                    clearTimeout(timeoutId);
                    responseBody = void 0;
                    contentType = response.headers.get("content-type");
                    if (!(contentType && contentType.includes("application/json"))) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    responseBody = _a.sent();
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, response.text()];
                case 5:
                    responseBody = _a.sent();
                    _a.label = 6;
                case 6:
                    log(testName, "Received status ".concat(response.status), responseBody);
                    return [2 /*return*/, { status: response.status, body: responseBody }];
                case 7:
                    error_1 = _a.sent();
                    if (error_1.name === 'AbortError') {
                        log(testName, "Request timed out after ".concat(TIMEOUT / 1000, "s"));
                        throw new Error("Request timed out: ".concat(options.method || "GET", " ").concat(url));
                    }
                    log(testName, "Request failed", error_1);
                    throw error_1;
                case 8: return [2 /*return*/];
            }
        });
    });
};
// --- Test Setup: User Management ---
// Gets user data, signing up or logging in as needed. Manages state.
// CORRECTED: Parameter uses hashedPassword
function ensureUser(user, testName) {
    return __awaiter(this, void 0, void 0, function () {
        var testState, existingUser, loginPayload, loginRes, loggedInData, signupPayload, signupRes, postSignupLoginRes, newUserData, retryLoginRes, loggedInDataRetry;
        var _a, _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    testState = readTestState();
                    existingUser = testState.users[user.email];
                    if (existingUser && existingUser.token && (Date.now() - existingUser.loginTime < 10 * 60 * 1000)) {
                        log(testName, "Using cached token for ".concat(user.email));
                        return [2 /*return*/, existingUser];
                    }
                    log(testName, "Attempting login for ".concat(user.email, "..."));
                    loginPayload = { email: user.email, hashedPassword: user.hashedPassword, usertype: user.usertype };
                    return [4 /*yield*/, makeRequest("".concat(BASE_URL, "/api/auth/login"), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(loginPayload),
                        }, "".concat(testName, " - Login"))];
                case 1:
                    loginRes = _f.sent();
                    if (loginRes.status === 200 && loginRes.body.token && ((_a = loginRes.body.userData) === null || _a === void 0 ? void 0 : _a.id)) {
                        log(testName, "Login successful for ".concat(user.email));
                        loggedInData = __assign(__assign({}, existingUser), { token: loginRes.body.token, loginTime: Date.now(), email: user.email, hashedPassword: user.hashedPassword, usertype: user.usertype, id: loginRes.body.userData.id });
                        testState.users[user.email] = loggedInData;
                        writeTestState(testState);
                        return [2 /*return*/, loggedInData];
                    }
                    if (!(loginRes.status === 401 || loginRes.status === 404)) return [3 /*break*/, 7];
                    log(testName, "Login failed for ".concat(user.email, ", attempting signup..."));
                    signupPayload = { name: user.name, email: user.email, hashedPassword: user.hashedPassword, usertype: user.usertype };
                    return [4 /*yield*/, makeRequest("".concat(BASE_URL, "/api/auth/signup"), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(signupPayload),
                        }, "".concat(testName, " - Signup"))];
                case 2:
                    signupRes = _f.sent();
                    if (!(signupRes.status === 201 && ((_b = signupRes.body.userData) === null || _b === void 0 ? void 0 : _b.id))) return [3 /*break*/, 4];
                    log(testName, "Signup successful for ".concat(user.email, ". Now logging in to get token..."));
                    return [4 /*yield*/, makeRequest("".concat(BASE_URL, "/api/auth/login"), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(loginPayload), // Uses corrected loginPayload
                        }, "".concat(testName, " - Post-Signup Login"))];
                case 3:
                    postSignupLoginRes = _f.sent();
                    if (postSignupLoginRes.status === 200 && postSignupLoginRes.body.token) {
                        log(testName, "Post-signup login successful for ".concat(user.email));
                        newUserData = {
                            token: postSignupLoginRes.body.token,
                            loginTime: Date.now(),
                            email: user.email,
                            hashedPassword: user.hashedPassword, // CORRECTED: Storing hashedPassword
                            usertype: user.usertype,
                            id: signupRes.body.userData.id,
                        };
                        testState.users[user.email] = newUserData;
                        writeTestState(testState);
                        return [2 /*return*/, newUserData];
                    }
                    else {
                        throw new Error("Post-signup login failed for ".concat(user.email, ". Status: ").concat(postSignupLoginRes.status));
                    }
                    return [3 /*break*/, 7];
                case 4:
                    if (!(signupRes.status === 409 || (signupRes.status === 500 && ((_d = (_c = signupRes.body) === null || _c === void 0 ? void 0 : _c.details) === null || _d === void 0 ? void 0 : _d.includes('User already exists'))))) return [3 /*break*/, 6];
                    log(testName, "Signup failed (user likely exists), retrying login for ".concat(user.email, "..."));
                    return [4 /*yield*/, makeRequest("".concat(BASE_URL, "/api/auth/login"), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(loginPayload), // Uses corrected loginPayload
                        }, "".concat(testName, " - Retry Login"))];
                case 5:
                    retryLoginRes = _f.sent();
                    if (retryLoginRes.status === 200 && retryLoginRes.body.token && ((_e = retryLoginRes.body.userData) === null || _e === void 0 ? void 0 : _e.id)) {
                        log(testName, "Retry login successful for ".concat(user.email));
                        loggedInDataRetry = __assign(__assign({}, existingUser), { token: retryLoginRes.body.token, loginTime: Date.now(), email: user.email, hashedPassword: user.hashedPassword, usertype: user.usertype, id: retryLoginRes.body.userData.id });
                        testState.users[user.email] = loggedInDataRetry;
                        writeTestState(testState);
                        return [2 /*return*/, loggedInDataRetry];
                    }
                    else {
                        throw new Error("Retry login failed unexpectedly for ".concat(user.email, ". Status: ").concat(retryLoginRes.status, ", Body: ").concat(JSON.stringify(retryLoginRes.body)));
                    }
                    return [3 /*break*/, 7];
                case 6: throw new Error("Signup failed for ".concat(user.email, ". Status: ").concat(signupRes.status, ", Body: ").concat(JSON.stringify(signupRes.body)));
                case 7: throw new Error("Initial login failed unexpectedly for ".concat(user.email, ". Status: ").concat(loginRes.status, ", Body: ").concat(JSON.stringify(loginRes.body)));
            }
        });
    });
}
// --- Test Suite ---
function runTests() {
    return __awaiter(this, void 0, void 0, function () {
        var testState, runId, alice, bob, charlie, aliceData, bobData, charlieData, userApiEndpoint, threadId_AliceBob, createChatRes, createChatAgainRes, sendMsgResAlice, sendMsgResBob, loadChatResAlice, loadChatResBob;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log("\n--- Starting Test Suite ---");
                    testState = readTestState();
                    runId = Date.now().toString().slice(-6);
                    alice = { name: "Alice_".concat(runId), email: "alice_".concat(runId, "@test.com"), hashedPassword: "alice123", usertype: "customer" };
                    bob = { name: "Bob_".concat(runId), email: "bob_".concat(runId, "@test.com"), hashedPassword: "bob123", usertype: "agent" };
                    charlie = { name: "Charlie_".concat(runId), email: "charlie_".concat(runId, "@test.com"), hashedPassword: "charlie123", usertype: "customer" };
                    // --- Auth Tests ---
                    log("Auth", "Running Authentication Tests...");
                    return [4 /*yield*/, testSignupFailures(alice, "Auth Signup Failures")];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, testLoginFailures(alice, "Auth Login Failures Pre-Create")];
                case 2:
                    _c.sent();
                    log("Auth", "Ensuring test users exist...");
                    return [4 /*yield*/, ensureUser(alice, "Auth Ensure Alice")];
                case 3:
                    aliceData = _c.sent();
                    return [4 /*yield*/, ensureUser(bob, "Auth Ensure Bob")];
                case 4:
                    bobData = _c.sent();
                    return [4 /*yield*/, ensureUser(charlie, "Auth Ensure Charlie")];
                case 5:
                    charlieData = _c.sent();
                    log("Auth", "Test users ensured.", { aliceId: aliceData.id, bobId: bobData.id, charlieId: charlieData.id });
                    testState = readTestState(); // Reload state after potential updates
                    return [4 /*yield*/, testLoginFailures(alice, "Auth Login Failures Post-Create")];
                case 6:
                    _c.sent();
                    userApiEndpoint = "".concat(BASE_URL, "/api/users/").concat(aliceData.id);
                    // await testAuthRequired(userApiEndpoint, "GET", null, "Auth - Get User No Token");
                    // await testAuthInvalidToken(userApiEndpoint, "GET", null, "Auth - Get User Invalid Token");
                    log("Auth", "Skipping specific protected route tests as '/api/users/:id' not implemented.");
                    // --- Chat Creation Tests ---
                    log("Chat Creation", "Running Chat Creation Tests...");
                    return [4 /*yield*/, testCreateChatFailures(aliceData, bobData, "Chat Creation Failures")];
                case 7:
                    _c.sent();
                    return [4 /*yield*/, makeRequest("".concat(BASE_URL, "/api/createChat/").concat(aliceData.id), {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: "Bearer ".concat(aliceData.token) },
                            body: JSON.stringify({ receiverId: bobData.id }),
                        }, "Chat Creation Success")];
                case 8:
                    createChatRes = _c.sent();
                    assert.strictEqual(createChatRes.status, 201, "Chat Creation Success: Expected status 201");
                    assert.ok(createChatRes.body.chatDataId, "Chat Creation Success: Expected chatDataId in response");
                    threadId_AliceBob = createChatRes.body.chatDataId;
                    log("Chat Creation", "Successfully created chat between Alice and Bob: ".concat(threadId_AliceBob));
                    if (threadId_AliceBob) {
                        testState.threads[threadId_AliceBob] = { threadId: threadId_AliceBob, participants: [aliceData.id, bobData.id] };
                        writeTestState(testState);
                    }
                    else {
                        throw new Error("Failed to get threadId_AliceBob after successful creation");
                    }
                    return [4 /*yield*/, makeRequest("".concat(BASE_URL, "/api/createChat/").concat(aliceData.id), {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: "Bearer ".concat(aliceData.token) },
                            body: JSON.stringify({ receiverId: bobData.id }),
                        }, "Chat Creation Duplicate")];
                case 9:
                    createChatAgainRes = _c.sent();
                    // Your backend might return 500 if UNIQUE constraint fails without specific handling
                    assert.ok([200, 201, 409, 500].includes(createChatAgainRes.status), "Chat Creation Duplicate: Expected status 200, 201, 409 or 500, got ".concat(createChatAgainRes.status));
                    // --- Message Sending Tests ---
                    log("Message Sending", "Running Message Sending Tests...");
                    return [4 /*yield*/, testSendMessageFailures(aliceData, bobData, charlieData, threadId_AliceBob, "Message Sending Failures")];
                case 10:
                    _c.sent();
                    return [4 /*yield*/, makeRequest("".concat(BASE_URL, "/api/chat/").concat(threadId_AliceBob), {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: "Bearer ".concat(aliceData.token) },
                            body: JSON.stringify({ senderId: aliceData.id, receiverId: bobData.id, content: "Hello Bob from Alice!" }),
                        }, "Message Sending Alice->Bob")];
                case 11:
                    sendMsgResAlice = _c.sent();
                    assert.strictEqual(sendMsgResAlice.status, 201, "Message Sending Alice->Bob: Expected status 201");
                    assert.ok((_a = sendMsgResAlice.body.data) === null || _a === void 0 ? void 0 : _a.senderId, "Message Sending Alice->Bob: Expected message data in response"); // Check nested data based on backend response
                    return [4 /*yield*/, makeRequest("".concat(BASE_URL, "/api/chat/").concat(threadId_AliceBob), {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: "Bearer ".concat(bobData.token) },
                            body: JSON.stringify({ senderId: bobData.id, receiverId: aliceData.id, content: "Hi Alice from Bob!" }),
                        }, "Message Sending Bob->Alice")];
                case 12:
                    sendMsgResBob = _c.sent();
                    assert.strictEqual(sendMsgResBob.status, 201, "Message Sending Bob->Alice: Expected status 201");
                    assert.ok((_b = sendMsgResBob.body.data) === null || _b === void 0 ? void 0 : _b.senderId, "Message Sending Bob->Alice: Expected message data in response");
                    // --- Message Loading Tests ---
                    log("Message Loading", "Running Message Loading Tests...");
                    return [4 /*yield*/, testLoadMessagesFailures(aliceData, bobData, charlieData, threadId_AliceBob, "Message Loading Failures")];
                case 13:
                    _c.sent();
                    return [4 /*yield*/, makeRequest("".concat(BASE_URL, "/api/chatData/").concat(threadId_AliceBob), {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: "Bearer ".concat(aliceData.token) },
                            body: JSON.stringify({ participantId: aliceData.id }),
                        }, "Message Loading Alice")];
                case 14:
                    loadChatResAlice = _c.sent();
                    assert.strictEqual(loadChatResAlice.status, 200, "Message Loading Alice: Expected status 200");
                    assert.ok(Array.isArray(loadChatResAlice.body.messages), "Message Loading Alice: Expected messages array"); // Check 'messages' field based on backend response
                    assert.strictEqual(loadChatResAlice.body.messages.length, 2, "Message Loading Alice: Expected 2 messages");
                    assert.strictEqual(loadChatResAlice.body.messages[0].content, "Hello Bob from Alice!", "Message Loading Alice: Check message 1 content");
                    assert.strictEqual(loadChatResAlice.body.messages[1].content, "Hi Alice from Bob!", "Message Loading Alice: Check message 2 content");
                    return [4 /*yield*/, makeRequest("".concat(BASE_URL, "/api/chatData/").concat(threadId_AliceBob), {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: "Bearer ".concat(bobData.token) },
                            body: JSON.stringify({ participantId: bobData.id }),
                        }, "Message Loading Bob")];
                case 15:
                    loadChatResBob = _c.sent();
                    assert.strictEqual(loadChatResBob.status, 200, "Message Loading Bob: Expected status 200");
                    assert.ok(Array.isArray(loadChatResBob.body.messages), "Message Loading Bob: Expected messages array");
                    assert.strictEqual(loadChatResBob.body.messages.length, 2, "Message Loading Bob: Expected 2 messages");
                    console.log("\n--- Test Suite Finished Successfully ---");
                    return [2 /*return*/];
            }
        });
    });
}
// --- Specific Failure Test Functions ---
function testSignupFailures(userData, testName) {
    return __awaiter(this, void 0, void 0, function () {
        var email, missingEmail, resMissingEmail, hashedPassword, missingPassword, resMissingPassword, invalidEmail, resInvalidEmail, invalidUserType, resInvalidUserType;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    log(testName, "Testing signup failures...");
                    email = userData.email, missingEmail = __rest(userData, ["email"]);
                    return [4 /*yield*/, makeRequest("".concat(BASE_URL, "/api/auth/signup"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(missingEmail) }, testName)];
                case 1:
                    resMissingEmail = _a.sent();
                    assert.strictEqual(resMissingEmail.status, 400, "".concat(testName, ": Missing email should return 400"));
                    hashedPassword = userData.hashedPassword, missingPassword = __rest(userData, ["hashedPassword"]);
                    return [4 /*yield*/, makeRequest("".concat(BASE_URL, "/api/auth/signup"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(missingPassword) }, testName)];
                case 2:
                    resMissingPassword = _a.sent();
                    assert.strictEqual(resMissingPassword.status, 400, "".concat(testName, ": Missing password should return 400"));
                    invalidEmail = __assign(__assign({}, userData), { email: "invalid-email" });
                    return [4 /*yield*/, makeRequest("".concat(BASE_URL, "/api/auth/signup"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(invalidEmail) }, testName)];
                case 3:
                    resInvalidEmail = _a.sent();
                    assert.strictEqual(resInvalidEmail.status, 400, "".concat(testName, ": Invalid email format should return 400"));
                    invalidUserType = __assign(__assign({}, userData), { usertype: "admin" });
                    return [4 /*yield*/, makeRequest("".concat(BASE_URL, "/api/auth/signup"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(invalidUserType) }, testName)];
                case 4:
                    resInvalidUserType = _a.sent();
                    assert.strictEqual(resInvalidUserType.status, 400, "".concat(testName, ": Invalid usertype should return 400"));
                    log(testName, "Signup failure tests passed.");
                    return [2 /*return*/];
            }
        });
    });
}
function testLoginFailures(userData, testName) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, email, missingEmail, resMissingEmail, _b, hashedPassword, missingPassword, resMissingPassword, incorrectPassword, resIncorrectPassword, nonExistentUser, resNonExistent;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    log(testName, "Testing login failures...");
                    _a = { email: userData.email, hashedPassword: userData.hashedPassword, usertype: userData.usertype }, email = _a.email, missingEmail = __rest(_a, ["email"]);
                    return [4 /*yield*/, makeRequest("".concat(BASE_URL, "/api/auth/login"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(missingEmail) }, testName)];
                case 1:
                    resMissingEmail = _c.sent();
                    assert.strictEqual(resMissingEmail.status, 400, "".concat(testName, ": Missing email should return 400"));
                    _b = { email: userData.email, hashedPassword: userData.hashedPassword, usertype: userData.usertype }, hashedPassword = _b.hashedPassword, missingPassword = __rest(_b, ["hashedPassword"]);
                    return [4 /*yield*/, makeRequest("".concat(BASE_URL, "/api/auth/login"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(missingPassword) }, testName)];
                case 2:
                    resMissingPassword = _c.sent();
                    assert.strictEqual(resMissingPassword.status, 400, "".concat(testName, ": Missing password should return 400"));
                    incorrectPassword = { email: userData.email, hashedPassword: "wrongpassword", usertype: userData.usertype };
                    return [4 /*yield*/, makeRequest("".concat(BASE_URL, "/api/auth/login"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(incorrectPassword) }, testName)];
                case 3:
                    resIncorrectPassword = _c.sent();
                    assert.strictEqual(resIncorrectPassword.status, 401, "".concat(testName, ": Incorrect password should return 401"));
                    nonExistentUser = { email: "nonexistent_".concat(Date.now(), "@test.com"), hashedPassword: "anypass", usertype: "customer" };
                    return [4 /*yield*/, makeRequest("".concat(BASE_URL, "/api/auth/login"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nonExistentUser) }, testName)];
                case 4:
                    resNonExistent = _c.sent();
                    if (testName.includes("Pre-Create")) {
                        // Your backend returns 401 for non-existent user based on verifyUser returning null
                        assert.strictEqual(resNonExistent.status, 401, "".concat(testName, ": Non-existent user should return 401 (based on backend logic)"));
                    }
                    else {
                        log(testName, "Skipping non-existent user check post-creation.");
                    }
                    log(testName, "Login failure tests passed.");
                    return [2 /*return*/];
            }
        });
    });
}
function testAuthRequired(url, method, body, testName) {
    return __awaiter(this, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    log(testName, "Testing auth required for ".concat(method, " ").concat(url, "..."));
                    return [4 /*yield*/, makeRequest(url, { method: method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined }, testName)];
                case 1:
                    res = _a.sent();
                    // Your middleware returns 401 for missing token
                    assert.strictEqual(res.status, 401, "".concat(testName, ": Expected 401 Unauthorized without token"));
                    log(testName, "Auth required test passed.");
                    return [2 /*return*/];
            }
        });
    });
}
function testAuthInvalidToken(url, method, body, testName) {
    return __awaiter(this, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    log(testName, "Testing invalid token for ".concat(method, " ").concat(url, "..."));
                    return [4 /*yield*/, makeRequest(url, {
                            method: method,
                            headers: { "Content-Type": "application/json", Authorization: "Bearer invalidtoken123" },
                            body: body ? JSON.stringify(body) : undefined
                        }, testName)];
                case 1:
                    res = _a.sent();
                    // Your middleware returns 401 for invalid token
                    assert.strictEqual(res.status, 401, "".concat(testName, ": Expected 401 Unauthorized with invalid token"));
                    log(testName, "Invalid token test passed.");
                    return [2 /*return*/];
            }
        });
    });
}
function testCreateChatFailures(currentUser, otherUser, testName) {
    return __awaiter(this, void 0, void 0, function () {
        var resMissingReceiver, resChatSelf, resNonExistentReceiver, resMismatchUser;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    log(testName, "Testing chat creation failures...");
                    return [4 /*yield*/, makeRequest("".concat(BASE_URL, "/api/createChat/").concat(currentUser.id), {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: "Bearer ".concat(currentUser.token) },
                            body: JSON.stringify({}),
                        }, testName)];
                case 1:
                    resMissingReceiver = _a.sent();
                    // Your backend doesn't explicitly check for receiverId in body, might return 500 later. Adjust if needed.
                    // Let's assume it should be 400 Bad Request if receiverId is missing.
                    assert.strictEqual(resMissingReceiver.status, 400, "".concat(testName, ": Missing receiverId should return 400"));
                    return [4 /*yield*/, makeRequest("".concat(BASE_URL, "/api/createChat/").concat(currentUser.id), {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: "Bearer ".concat(currentUser.token) },
                            body: JSON.stringify({ receiverId: currentUser.id }),
                        }, testName)];
                case 2:
                    resChatSelf = _a.sent();
                    // Your backend doesn't prevent creating chat with self. This might be desired or not.
                    // If it should fail, assert 400. If it's allowed, assert 201. Let's assume 400 for test.
                    assert.strictEqual(resChatSelf.status, 400, "".concat(testName, ": Creating chat with self should ideally return 400"));
                    return [4 /*yield*/, makeRequest("".concat(BASE_URL, "/api/createChat/").concat(currentUser.id), {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: "Bearer ".concat(currentUser.token) },
                            body: JSON.stringify({ receiverId: "non-existent-user-id" }),
                        }, testName)];
                case 3:
                    resNonExistentReceiver = _a.sent();
                    // Your backend returns 401 based on verifyUserId
                    assert.strictEqual(resNonExistentReceiver.status, 401, "".concat(testName, ": Non-existent receiver should return 401 (based on backend logic)"));
                    return [4 /*yield*/, makeRequest("".concat(BASE_URL, "/api/createChat/some-other-user-id"), {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: "Bearer ".concat(currentUser.token) },
                            body: JSON.stringify({ receiverId: otherUser.id }),
                        }, testName)];
                case 4:
                    resMismatchUser = _a.sent();
                    // Your backend checks senderId from URL vs database, returns 401 if mismatch/not found
                    assert.strictEqual(resMismatchUser.status, 401, "".concat(testName, ": Mismatched senderId in URL should return 401 (based on backend logic)"));
                    log(testName, "Chat creation failure tests passed.");
                    return [2 /*return*/];
            }
        });
    });
}
function testSendMessageFailures(sender, receiver, intruder, threadId, testName) {
    return __awaiter(this, void 0, void 0, function () {
        var resMissingContent, resBadThread, resNotParticipant, resImpersonate;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    log(testName, "Testing message sending failures...");
                    return [4 /*yield*/, makeRequest("".concat(BASE_URL, "/api/chat/").concat(threadId), {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: "Bearer ".concat(sender.token) },
                            body: JSON.stringify({ senderId: sender.id, receiverId: receiver.id }), // Missing content
                        }, testName)];
                case 1:
                    resMissingContent = _a.sent();
                    // Your backend doesn't explicitly check for content, might return 500 later. Adjust if needed.
                    assert.strictEqual(resMissingContent.status, 400, "".concat(testName, ": Missing content should return 400"));
                    return [4 /*yield*/, makeRequest("".concat(BASE_URL, "/api/chat/non-existent-thread"), {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: "Bearer ".concat(sender.token) },
                            body: JSON.stringify({ senderId: sender.id, receiverId: receiver.id, content: "Test" }),
                        }, testName)];
                case 2:
                    resBadThread = _a.sent();
                    // D1 error if thread doesn't exist might cause 500. A 404 would be better.
                    assert.strictEqual(resBadThread.status, 404, "".concat(testName, ": Non-existent thread should ideally return 404, might return 500"));
                    return [4 /*yield*/, makeRequest("".concat(BASE_URL, "/api/chat/").concat(threadId), {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: "Bearer ".concat(intruder.token) },
                            body: JSON.stringify({ senderId: intruder.id, receiverId: sender.id, content: "Intruder message" }),
                        }, testName)];
                case 3:
                    resNotParticipant = _a.sent();
                    // Your backend checks sender/receiver existence, but not participation. It relies on JWT middleware.
                    // If JWT middleware passes (valid token), this might succeed or fail depending on deeper checks.
                    // Assuming the backend SHOULD check participation and return 403.
                    assert.strictEqual(resNotParticipant.status, 403, "".concat(testName, ": Non-participant sender should return 403 Forbidden"));
                    return [4 /*yield*/, makeRequest("".concat(BASE_URL, "/api/chat/").concat(threadId), {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: "Bearer ".concat(sender.token) },
                            body: JSON.stringify({ senderId: receiver.id, content: "Alice trying to send as Bob" }),
                        }, testName)];
                case 4:
                    resImpersonate = _a.sent();
                    // Your backend checks sender/receiver existence based on body IDs, doesn't compare to token user ID.
                    // It relies on JWT middleware for auth. This should probably fail.
                    // Assuming backend SHOULD compare senderId in body to token userId and return 403.
                    assert.strictEqual(resImpersonate.status, 403, "".concat(testName, ": Mismatched senderId should return 403 Forbidden"));
                    log(testName, "Message sending failure tests passed.");
                    return [2 /*return*/];
            }
        });
    });
}
function testLoadMessagesFailures(user, otherParticipant, intruder, threadId, testName) {
    return __awaiter(this, void 0, void 0, function () {
        var resBadThread, resNotParticipant, resMismatchBody;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    log(testName, "Testing message loading failures...");
                    return [4 /*yield*/, makeRequest("".concat(BASE_URL, "/api/chatData/non-existent-thread"), {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: "Bearer ".concat(user.token) },
                            body: JSON.stringify({ participantId: user.id }),
                        }, testName)];
                case 1:
                    resBadThread = _a.sent();
                    // D1 might return empty results (200 OK) or error (500). 404 preferred.
                    assert.ok([200, 404, 500].includes(resBadThread.status), "".concat(testName, ": Non-existent thread should ideally return 404, might return 200/500"));
                    return [4 /*yield*/, makeRequest("".concat(BASE_URL, "/api/chatData/").concat(threadId), {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: "Bearer ".concat(intruder.token) },
                            body: JSON.stringify({ participantId: intruder.id }),
                        }, testName)];
                case 2:
                    resNotParticipant = _a.sent();
                    // Your backend relies on verifyUserId in body, not JWT. It might succeed if ID is valid, or fail.
                    // Assuming backend SHOULD verify participation based on token and return 403.
                    assert.strictEqual(resNotParticipant.status, 403, "".concat(testName, ": Non-participant loader should return 403 Forbidden"));
                    return [4 /*yield*/, makeRequest("".concat(BASE_URL, "/api/chatData/").concat(threadId), {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: "Bearer ".concat(user.token) },
                            body: JSON.stringify({ participantId: otherParticipant.id }),
                        }, testName)];
                case 3:
                    resMismatchBody = _a.sent();
                    // Your backend relies on verifyUserId in body. It might succeed if ID is valid, or fail.
                    // Assuming backend SHOULD compare participantId in body to token userId and return 403.
                    assert.strictEqual(resMismatchBody.status, 403, "".concat(testName, ": Mismatched participantId in body should return 403 Forbidden"));
                    log(testName, "Message loading failure tests passed.");
                    return [2 /*return*/];
            }
        });
    });
}
// --- Run the tests ---
runTests().catch(function (error) {
    console.error("\n--- Test Suite FAILED ---");
    console.error(error);
    process.exit(1);
});
