export interface User {
  readonly id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "agent" | "customer";
  accountCreationDate: number;
  lastLogin: number;
}

export interface ChatThread {
  readonly id: string; // chatDataId
  createdAt: number;   // chatTimestamp
}

export interface ChatParticipant {
  readonly user_id: string;
  readonly thread_id: string;
}

export interface Message {
  readonly id: string;
  readonly thread_id: string;
  readonly sender_id: string;
  readonly content: string;
  readonly timestamp: number;
}

/* Interfaces for request payloads */

export interface CAI { // Create Account Interface
  name: string;
  email: string;
  hashedPassword: string;
  role: "agent" | "customer";
}

export interface LAI { // Login Account Interface
  email: string;
  hashedPassword: string;
  role: "agent" | "customer";
}

/* Legacy aliases retained for compatibility with older code */
export type AgentData = User;
export type CustomerData = User;
export type Chat = Message;
export type ChatData = ChatThread;