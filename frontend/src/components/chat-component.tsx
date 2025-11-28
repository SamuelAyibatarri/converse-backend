"use client"

import { useEffect, useState, useRef } from "react"
import { ScrollArea } from "./ui/scroll-area"
import type { FormEvent } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { InputFile } from "./file-input"
import {
  ChatList,
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
  ChatBubbleAvatarImage,
  ChatBadge
} from "./ui/chat"
import { EmptyOutline } from "./no-active-chat"
import { Send } from "lucide-react"
import * as data from "./data"
import { formatShortTime } from "./utils"
import { HTTP_API_URL } from "@/lib/data"
import { useTriggerStore, UseAgentChatState, UseAgentDashboardState } from "@/lib/zus"

const ChatComponent = () => {
  const [message, setMessage] = useState<string>("");
  // const [currentThreadId, setCurrentThreadId] = useState<string>("")
  const [userData, setUserData] = useState<data.APIResponseUserData>(data.defaultAPIResponseUserData);
  const [userDataSet, setUserDataSet] = useState<boolean>(false)
  const [authToken, setAuthToken] = useState<string>("")
  const [messagesState, setMessages] = useState<data.Message[]>([]);
  const [status, setStatus] = useState<boolean>(false);
  //const [queueData, setQueueData] = useState<data.QueueItem[]>([]);
  // const [webSocketsConnected, setWebSocketsConnected] = useState<boolean>(false);
  // const [chatHistory, setChatHistory] = useState<object>([]);

  /// :::::::::::::::::::: Refs ::::::::::::::::::::::
  const socketRef = useRef<WebSocket | null>(null);
  const messagesRef = useRef(messagesState);
  const currentThreadId = useRef("");
  const currentCustomerIdRef = useRef("");
  const scrollBottomRef = useRef<HTMLDivElement>(null)
  
  /// Zustand
  const connectWsSignal = useTriggerStore((state) => state.connectWsSignal);
  const currentCustomerIdZus = UseAgentChatState((state) => state.currentCustomerId);
  const currentThreadIdZus = UseAgentChatState((state) => state.currentThreadId);
  const redirectToChat = UseAgentDashboardState((state) => state.updateState);

  useEffect(() => {
    redirectToChat("chat-page")
  },[currentCustomerIdZus, currentThreadIdZus])

  useEffect(() => {
    if (connectWsSignal > 0) {
      connectAgentToCustomer();
    }
  }, [connectWsSignal]);

  useEffect(() => {
    if (scrollBottomRef.current) {
      scrollBottomRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messagesState])
  

  useEffect(() => {
    messagesRef.current = messagesState;
  }, [messagesState])

  useEffect(() => {
    
  },[messagesState])

  function connectWebSocket() {
        socketRef.current = new WebSocket(`ws://localhost:8787/api/chat/${currentThreadIdZus}/ws?token=${userData.token}`)
        socketRef.current.addEventListener('open', () => {
          setStatus(true);
          //alert("Successfully connected!");
      });
      socketRef.current.addEventListener('message', (msg) => {
        console.log("This is the received data: ", msg.data);
        // {"type":"message","id":"e5f1e2cf-6b47-4d08-aa69-084a52094978","thread_id":"d6f52826-6ae1-48e2-a72e-48f25aa6b417","timestamp":1763634569422,"content":"boot options","sender_id":"9f7c1ecb-f8bb-4cc3-9479-9ca749a475ad"}
        const parsed = JSON.parse(msg.data);
        console.log("This is the parsed version: ", parsed)
        if (parsed.type === 'history') {
          //@ts-expect-error msg has any any type
          const historyArr = parsed.messages.map((msg) => {
            const update = {
              message: msg.content,
              senderId: msg.sender_id,
              sentAt: formatShortTime(new Date(msg.timestamp))
            }
            return update;
          })

          setMessages(historyArr)

        } 
        if (parsed.type === 'message') {
          if (parsed.sender_id === userData.userData.id) {
            // This is your own message echoed back → ignore it
            return;
          }
        const message: data.Message = {
          message: parsed.content,
          senderId: parsed.sender_id,
          sentAt: formatShortTime( new Date(parsed.timestamp))
        }
        setMessages([...messagesRef.current, message]);
      }
      })
  };

  /// Load user data
  async function loadUserData(): Promise<boolean> {
    const raw = localStorage.getItem("user_data") ?? "";
    if (!raw || raw.length < 0) throw new Error("Invalid User Data")
    const parsed = JSON.parse(raw);
    if (parsed) {
      setUserData(parsed);
      setUserDataSet(true)
      setAuthToken(parsed.token as string);
      return true;
    } 
    return false;
  }


  /// Load chat history
  async function loadChatHistory(threadId: string): Promise<boolean> {
    try {
      const res = await fetch(`${HTTP_API_URL}/api/chatData/${threadId}/${authToken}`);
      if (!res.ok) throw new Error("Something went wrong");
      const rawThreadHistory: data.API_CHAT_DATA= await res.json() ?? []

      if (!rawThreadHistory?.messages) throw new Error("Something went wrong");
      const threadHistory: data.Message[] =  [];
      for (const msg of rawThreadHistory.messages) {
        const item: data.Message = {
          message: msg.content,
          senderId: msg.sender_id,
          sentAt: formatShortTime( new Date(msg.timestamp))
        }
        threadHistory.push(item)
      }
      setMessages(threadHistory); /// This will probably cause a bug in the future
    } catch (error) {
      if (error instanceof Error) throw new Error("An error occurred")
    }
    return true
  }

  /// Send messages
    async function sendMessage(message: string) {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && userData?.userData) {
      const userId = userData.userData.id;
      const msg = JSON.stringify({
        content: message,
        senderId: userId,     
        receiverId: currentCustomerIdRef.current   
    })
      socketRef.current.send(msg);
      console.log(
        "This is the message that was sent: ", msg
      )
      console.log("WebSocket message sent successfully");
    } else {
      console.log("WebSocket not ready", socketRef.current?.readyState);
    }
  }

  /// Picks a random thread id from queue data -> It shouldn't really be random, it should be ordered based on urgency
  // async function updateCurrentThreadIdAndCustomerId(queueDataParam: data.QueueItem[]) {
  //   if (queueDataParam.length == 0) throw new Error("No queue data");
  //   const queueChat: data.QueueItem= queueDataParam[Math.floor(Math.random() * queueData.length)]
  //   if (!queueChat.thread_id) throw new Error("Something went wrong")
  //   const randomQueueChat: string = queueChat.thread_id;
  //   currentThreadId.current = randomQueueChat;
  //   currentCustomerIdRef.current = queueChat.customer_id;
  // }

  // async function loadCustomerQueue() {
  //   console.log("Trying to load queue data")
  //   if (!userData) loadUserData();
  //   const response = await fetch(`${HTTP_API_URL}/api/getagentspecificqueue/${userData.userData.id}/${userData.token}`)
  //   const responseParsed = await response.json() as data.QueueResponse;
  //   const queueData = responseParsed.queueData;
  //   setQueueData(queueData)
  //   return queueData
  // }

  /// Connect agent to customer
  async function connectAgentToCustomer() {
    if (!currentCustomerIdZus && !currentCustomerIdZus) return;
    // await loadCustomerQueue(); /// -> Loads customer queue first
    // const queue = await loadCustomerQueue()
    // console.log("This queue data should run with this queue data: ", queue) /// Using queue data doesn't work here, i guess its because of the stale closure bug in react
    // await updateCurrentThreadIdAndCustomerId(queue);
    connectWebSocket(); /// -> Connects to the chat room
    loadChatHistory(currentThreadId.current); /// -> Loads chat history, obviously
  }

  /// Load received messages 
// let messagesCollection; /// -> Really really bad names SMH
//   useEffect(() => { 
//       function loadReceivedMessages() {
//         console.log("messages updated!!: ", messages)
//     if (messages) {
//     return 
//         } else {
//           console.error("No messages yet!")
//         }
//   }
//     messagesCollection = loadReceivedMessages()
//   }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (message.trim() === "") return

    const newMessage: data.Message = {
      message,
      senderId: data.agent.id,
      sentAt: formatShortTime(new Date()),
    }

    console.log("This is the message: ", message)
    await sendMessage(message); /// I thought it best to make the sendMessage an async function
    setMessages([...messagesState, newMessage])
    setMessage("")
  }

  useEffect(() => {
    if (!userDataSet) loadUserData();
  }, [userData, userDataSet])

  const chatArea =  <ScrollArea className="grow rounded-xl *:data-radix-scroll-area-viewport:h-full [&>[data-radix-scroll-area-viewport]>div]:h-full"
        style={{
            height: '50%',
          }}>
        <ChatList className="space-y-5 bg-gray-100 flex-1 h-full">
          <ChatBadge />
          {messagesState.map((msg: data.Message, index: number) => {
            console.log("Individual messages: ", msg)
            const sender: data.Agent | undefined = data.participants.find((u: data.User) => u.id === msg.senderId)
            const isSent: boolean = msg.senderId === userData.userData.id;
            return (
              <ChatBubble key={index} variant={isSent ? "sent" : "received"}>
                <ChatBubbleAvatar>
                  <ChatBubbleAvatarImage src={sender?.img} alt={sender?.username} />
                  {/* <ChatBubbleAvatarFallback>{initials(sender?.name ?? "")}</ChatBubbleAvatarFallback> */}
                </ChatBubbleAvatar>
                <ChatBubbleMessage className="flex flex-col gap-1">
                  <p className="text-[14px]">{msg.message}</p>
                  <div className="w-full text-xs group-data-[variant='sent']/chat-bubble:text-end">{msg.sentAt}</div>
                </ChatBubbleMessage>
              </ChatBubble>
            )
          })}
          <div ref={scrollBottomRef} />
        </ChatList>
      </ScrollArea>

  const inactiveChat = <EmptyOutline />;

  return (
    <div className="w-full h-[85vh] flex flex-col">
      {status ? chatArea : inactiveChat}
      <form onSubmit={handleSubmit} className="flex relative bottom-0 left-0 right-0 place-items-center gap-2 pt-2 bg-white">
        <InputFile />
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="rounded-full"
          placeholder="Type a message..."
        />
        <Button type="submit" variant="default" size="icon" className="shrink-0 rounded-full" disabled={!status}>
          <Send />
        </Button>
      </form>
    </div>
  )
}

export default ChatComponent
