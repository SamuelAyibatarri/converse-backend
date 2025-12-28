CREATE TABLE IF NOT EXISTS "users" (
	"id"	TEXT,
	"name"	TEXT NOT NULL,
	"email"	TEXT NOT NULL UNIQUE,
	"passwordHash"	TEXT NOT NULL,
	"role"	TEXT NOT NULL,
	"accountCreationDate"	INTEGER,
	"lastLogin"	INTEGER,
	PRIMARY KEY("id")
);
CREATE TABLE IF NOT EXISTS "chat_threads" (
	"id"	TEXT,
	"createdAt"	INTEGER,
	"resolved_status"	BOOLEAN NOT NULL DEFAULT TRUE,
	PRIMARY KEY("id")
);
CREATE TABLE IF NOT EXISTS "chat_participants" (
	"user_id"	TEXT NOT NULL,
	"thread_id"	TEXT NOT NULL,
	PRIMARY KEY("user_id","thread_id"),
	FOREIGN KEY("thread_id") REFERENCES "chat_threads"("id"),
	FOREIGN KEY("user_id") REFERENCES "users"("id")
);
CREATE TABLE IF NOT EXISTS "messages" (
	"id"	TEXT,
	"thread_id"	TEXT NOT NULL,
	"sender_id"	TEXT NOT NULL,
	"content"	TEXT NOT NULL,
	"timestamp"	INTEGER NOT NULL,
	PRIMARY KEY("id"),
	FOREIGN KEY("sender_id") REFERENCES "users"("id"),
	FOREIGN KEY("thread_id") REFERENCES "chat_threads"("id")
);
CREATE TABLE IF NOT EXISTS "free_agents" (
	"agent_id"	TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS "queue" (
	"customer_id"	TEXT NOT NULL UNIQUE,
	"thread_id"	TEXT NOT NULL,
	"assigned_agent"	TEXT NOT NULL,
	"wait_time"	INTEGER NOT NULL DEFAULT 0,
	"customer_name"	TEXT NOT NULL DEFAULT random
);
