DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS chat_participants;
DROP TABLE IF EXISTS chat_threads;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,     
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL,            
  accountCreationDate INTEGER,
  lastLogin INTEGER
);


CREATE TABLE chat_threads (
  id TEXT PRIMARY KEY,            
  createdAt INTEGER,
  resolved_status BOOLEAN NOT NULL            
);

CREATE TABLE chat_participants (
  user_id TEXT NOT NULL,
  thread_id TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (thread_id) REFERENCES chat_threads(id),
  PRIMARY KEY (user_id, thread_id)  
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,           
  thread_id TEXT NOT NULL,        
  sender_id TEXT NOT NULL,         
  content TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (thread_id) REFERENCES chat_threads(id),
  FOREIGN KEY (sender_id) REFERENCES users(id)
);

CREATE TABLE queue (
  customer_id TEXT UNIQUE
)
