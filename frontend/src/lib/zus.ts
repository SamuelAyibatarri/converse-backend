import { create } from 'zustand';

type TriggerStore = {
  connectWsSignal: number;
  triggerConnectWs: () => void;
}

type AgentDashboardPages = "chat-page" | "chat-history-page" | "queue-page";

type AgentDashboardState = {
  pageState: AgentDashboardPages;
  updateState: (page: AgentDashboardPages) => void;
}

type AgentChatState = {
  currentThreadId: string;
  currentCustomerId: string;
  update: (customerId: string, threadId: string) => void;
}

type UD = { /// I ran out of names, UD -> User Data
  email: string
  id: string
  lastLogin: number
  name: string
  role: 'agent' | 'customer' | '';
  token: string;
}

type UserDataState = {
  userData: UD;
  updateState: (email: string, id: string, lastLogin: number, name: string, role: "agent" | "customer", token: string) => void
}

// type queueDataZus = {
//     customer_id: string;
//     thread_id: string;
//     assigned_agent: string;
//   }

export const UseAgentChatState = create<AgentChatState>((set) => ({
  currentCustomerId: "random",
  currentThreadId: "random",
  update: (customerId: string, threadId: string) => set(() => ({ 
    currentCustomerId: customerId,
    currentThreadId: threadId
  }))
}))

export const UseAgentDashboardState = create<AgentDashboardState>((set) => ({
  pageState: "chat-page",
  updateState: (page: AgentDashboardPages) => set(() => ({ pageState: page})),
}));

export const useTriggerStore = create<TriggerStore>((set) => ({
  connectWsSignal: 0,
  triggerConnectWs: () => set((state) => ({ connectWsSignal: state.connectWsSignal + 1 })),
}));

export const UseUserDataState = create<UserDataState>((set) => ({
  userData: {
    email: "",
    id: "",
    lastLogin: 0,
    name: "",
    role: "",
    token: ""
},
  updateState: (email, id, lastLogin, name, role, token) => set(() => ({
    userData: {
      email: email,
      id: id,
      lastLogin: lastLogin,
      name: name,
      role: role,
     token: token
    }
  }))
}))