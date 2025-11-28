import image1 from '@/assets/avatar1.png';
import image2 from '@/assets/avatar2.png';
import ai_icon from '@/assets/ai-icon.png'

export interface User {
  id: string;
  name: string;
  username: string;
  img: string;
}

export interface Agent {
  id: string;
  name: string;
  username: string;
  img: string;
}

export interface Message {
  message: string;
  senderId: string;
  sentAt: string;
}

export interface API_MESSAGES {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  timestamp: number;
}

export interface API_CHAT_DATA {
    threadId: string;
    messages: API_MESSAGES[];
} 

export interface APIResponseUserData {
  isLoggedIn: boolean
  token: string
  userData: UserData
}

export interface UserData {
  accountCreationDate: number
  email: string
  id: string
  lastLogin: number
  name: string
  passwordHash: string
  role: string
}

export interface QueueResponse {
  success: boolean
  queueData: QueueItem[]
}

export interface QueueItem {
  customer_id: string
  thread_id: string
  assigned_agent: string
  customer_name: string;
  wait_time: number
}


export const defaultAPIResponseUserData: APIResponseUserData = {
  isLoggedIn: false,
  token: "",
  userData: {
    accountCreationDate: 0,
    email: "",
    id: "",
    lastLogin: 0,
    name: "",
    passwordHash: "",
    role: ""
  }
}


export const user: User = {
  id: "1",
  name: "Customer John Doe",
  username: "johndoe",
  img: image1,
};

export const customer: User = {
  id: "1",
  name: "Customer John Doe",
  username: "johndoe",
  img: image1,
};

export const friend: User = {
  id: "2",
  name: "Support Agent Jane",
  username: "jane_support",
  img: image2,
};

export const agent: User = {
  id: "2",
  name: "Support Agent Jane",
  username: "jane_support",
  img: image2,
};

export const aiAgent: User = {
  id: "3",
  name: "Jeffery - AI Support Assistant",
  username: "jeffery_ai_support",
  img: ai_icon,
};

export const users2: User[] = [user, friend];
export const participants: User[] = [customer, agent];

export const messages: Message[] = [
  {
    message: "Hi there. I'm having trouble logging into my account. It says my password is incorrect even though I'm sure it's right.",
    senderId: "1",
    sentAt: "10:30 AM",
  },
  {
    message: "Hello! Thank you for contacting us. I'm sorry to hear you're having login issues. Can you please confirm the email address associated with your account?",
    senderId: "2",
    sentAt: "10:32 AM",
  },
  {
    message: "The email is john.doe@example.com.",
    senderId: "1",
    sentAt: "10:33 AM",
  },
  {
    message: "Thank you. I've located your account. It appears there may be a synchronization issue. I can send you a password reset link to resolve this. Would you like me to do that?",
    senderId: "2",
    sentAt: "10:35 AM",
  },
  {
    message: "Yes, please. That would be a great help!",
    senderId: "1",
    sentAt: "10:36 AM",
  },
  {
    message: "The password reset link has been sent to your email. Please check your inbox and spam folder. Let me know if you receive it.",
    senderId: "2",
    sentAt: "10:38 AM",
  },
];

export const faqData = [
  {
    id: 1,
    question: "How do I reset my password?",
    answer:
      "To reset your password, click on 'Forgot Password' on the login page. Enter your email and follow the reset link sent to your inbox.",
    tags: ["account", "password"],
  },
  {
    id: 2,
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for enterprise customers.",
    tags: ["billing", "payment"],
  },
  {
    id: 3,
    question: "How do I cancel my subscription?",
    answer:
      "You can cancel anytime from your account settings under 'Billing'. Your access will continue until the end of your current billing period.",
    tags: ["subscription", "billing"],
  },
  {
    id: 4,
    question: "Is my data secure?",
    answer:
      "Yes, we use end-to-end encryption and comply with GDPR, CCPA, and other data protection regulations. Your data is stored on secure servers with daily backups.",
    tags: ["security", "privacy"],
  },
  {
    id: 5,
    question: "How long does it take to set up?",
    answer:
      "Most users can set up their account in less than 5 minutes. Our onboarding wizard guides you through the process step by step.",
    tags: ["setup", "getting-started"],
  },
  {
    id: 6,
    question: "Do you offer customer support?",
    answer: "Yes! We offer 24/7 email support and live chat for all plans. Premium plans include phone support.",
    tags: ["support"],
  },
]
