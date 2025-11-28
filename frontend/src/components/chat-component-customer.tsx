import { useState, useEffect, type FormEvent, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "./ui/scroll-area"
import { InputFile } from "./file-input"
import { ChatList, ChatBubble, ChatBubbleAvatar, ChatBubbleMessage, ChatBubbleAvatarImage } from "./ui/chat"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar"
import { Info, Send, ArrowLeft, Search, CheckCircle, Loader } from "lucide-react"
import * as data from "./data"
import { formatShortTime, initials } from "./utils"
import { useNavigate } from "react-router-dom"
import { HTTP_API_URL, WEBSOCKET_URL } from "@/lib/data"

type Stage = "welcome" | "faq-search" | "faq-results" | "resolved" | "issue-detail" | "queue" | "agent-chat"

interface ComponentProps {
  onBackButtonClick: (arg: "main") => void
}

export default function ChatComponent({ onBackButtonClick }: ComponentProps) {
  const navigate = useNavigate()

  // State
  const [stage, setStage] = useState<Stage>("welcome")
  const [freeAgentId, setFreeAgentId] = useState<string>("")
  const [agentData, setAgentData] = useState<data.User>(data.aiAgent)
  const [messages, setMessages] = useState<data.Message[]>([
    {
      message:
        "Hi, I'm Jeffery, your friendly Agent With Me support assistant 👋, click the 'Get Started' button below 👇 to get started.",
      senderId: data.aiAgent.id,
      sentAt: formatShortTime(new Date()),
    },
  ])
  const [userData, setUserData] = useState<data.APIResponseUserData>(data.defaultAPIResponseUserData)
  const [userDataSet, setUserDataSet] = useState<boolean>(false)
  const [message, setMessage] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<typeof data.faqData>([])
  const [issueDescription, setIssueDescription] = useState("")
  const [supportAssitant, setSupportAssistant] = useState<"ai-agent" | "chat-agent">("ai-agent")
  const [freeAgentsList, setFreeAgentsList] = useState<string[]>([])
  const [authToken, setAuthToken] = useState<string>("")
  const [wsConnection, setWSConnection] = useState<boolean>(false)

  ///:::::::::::::::: Refs ::::::::::::::::::
  const currentThreadIdRef = useRef<string>("")
  const socketRef = useRef<WebSocket | null>(null)
  const freeAgentIdRef = useRef<string>("")
  const messagesRef = useRef<data.Message[]>(messages)
  const issueDescriptionRef = useRef<string>(issueDescription)
  const currentUserIdRef = useRef<string>("")
  const unmountedRef = useRef<boolean>(false)
  const scrollBottomRef = useRef<HTMLDivElement>(null)

// Add this useEffect to trigger scroll whenever messages change
useEffect(() => {
  if (scrollBottomRef.current) {
    scrollBottomRef.current.scrollIntoView({ behavior: "smooth" })
  }
}, [messages])

  // Keep refs in sync with state
  useEffect(() => { messagesRef.current = messages }, [messages])
  useEffect(() => { issueDescriptionRef.current = issueDescription }, [issueDescription])
  useEffect(() => { freeAgentIdRef.current = freeAgentId }, [freeAgentId])

  // Load stored user data on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user_data")
      if (!raw) {
        navigate("/auth", { replace: true })
        return
      }
      const parsed = JSON.parse(raw)
      if (!parsed?.isLoggedIn) {
        navigate("/auth", { replace: true })
        return
      }
      // Set initial user data + refs
      setUserData(parsed)
      setUserDataSet(true)
      setAuthToken(parsed.token ?? "")
      currentUserIdRef.current = parsed?.userData?.id ?? parsed?.id ?? ""
      // initial list fetch
      void updateList()
    } catch (err) {
      console.error("ChatComponent: Failed to parse user_data! Error:", err)
      navigate("/auth", { replace: true })
    }
    // cleanup on unmount
    return () => { unmountedRef.current = true }
  }, [navigate])

  useEffect(() => {
    if (!userDataSet) return
  }, [userDataSet])


  // ---------- Helpers ----------
  const getStoredUser = () => {
    try {
      const raw = localStorage.getItem("user_data") ?? "{}"
      return JSON.parse(raw)
    } catch {
      return {}
    }
  }

  // ---------- API & queue functions ----------
  async function updateList() {
    try {
      const response = await fetch(`${HTTP_API_URL}/api/freeagentlist`)
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`)
      const dataResp = await response.json()
      setFreeAgentsList(dataResp.agents as string[])
    } catch (error) {
      console.error("Failed to fetch agent list:", error)
    }
  }

  async function createChatThread(): Promise<string | undefined> {
    if (freeAgentsList.length === 0) return
    try {
      const parsed = getStoredUser()
      if (!parsed?.token || !parsed?.userData) {
        console.error("Invalid user details")
        return
      }
      const auth = parsed.token
      const userId = parsed.userData.id
      const randomIndex = Math.floor(Math.random() * freeAgentsList.length)
      const pickedAgent = freeAgentsList[randomIndex] as string
      setFreeAgentId(pickedAgent)
      freeAgentIdRef.current = pickedAgent

      const payload = { receiverId: pickedAgent }
      const response = await fetch(`${HTTP_API_URL}/api/createChat/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth}`,
        },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.details || `Server error: ${response.status}`)
      }
      const dataResp = await response.json()
      return dataResp.chatDataId
    } catch (error) {
      console.error("Failed to create chat thread:", error)
      throw error
    }
  }

  async function addUserToQueue() {
    try {
      const parsed = getStoredUser()
      if (!parsed?.token || !parsed?.userData) {
        console.error("Invalid user details")
        return
      }
      const auth = parsed.token
      const userId = parsed.userData.id
      const payload = {
        customerId: userId,
        role: "customer",
        threadId: currentThreadIdRef.current,
        assignedAgent: freeAgentIdRef.current,
        name: userData.userData.name
      }
      const res = await fetch(`${HTTP_API_URL}/api/joinqueue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth}`,
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.details || `Server error: ${res.status}`)
      }
    } catch (error) {
      console.error("Failed to join queue:", error)
      throw error
    }
  }

  // ---------- Agent details ----------
  async function getAgentDetails() {
    try {
      const parsed = getStoredUser()
      if (!parsed?.token) {
        console.error("Invalid user details")
        return
      }
      const auth = parsed.token
      const agentId = freeAgentIdRef.current
      if (!agentId) return

      const res = await fetch(`${HTTP_API_URL}/api/agent/${agentId}/${auth}`)
      if (!res.ok) throw new Error("Something went wrong fetching agent details")
      const rawAgentData = await res.json()
      const parsedAgentData: data.User = {
        id: rawAgentData.agentData.id,
        name: rawAgentData.agentData.name,
        username: rawAgentData.agentData.email,
        img:
          // rawAgentData.agentData.avatar ||
          "https://lh3.googleusercontent.com/aida-public/AB6AXuBV4aJy3Mt5esX4bbG_yLjW9SLVMLW2CgtZiQU_essZ_pdCgLyx-VQLEJiCSe3EPkapTEqim6RcUVvA2BwXxmF6L0UASuV-EOlPfiwai3BXSudDs42XDawbbotdt-5bbV6-FiRDtMKGKT1dnpXRK_vBG8N5CULiKQBnEwtTtCFeASHltCUG0QqYOgr_ji9jPQetK8Oo3SuLf8xCW2gEHTnFs9VsEcE0gcsRkSz4gs5qDaO6O08BC_laLqaS26y7797vf-GSifD1ASWW",
      }
      setAgentData(parsedAgentData)
    } catch (error) {
      console.error("Failed to get agent details:", error)
    }
  }

  /// ::::::: WebSocket connect :::::::::
  async function connectWebSockets(msg: string) {
    try {
      const parsed = getStoredUser()
      if (!parsed?.token) {
        console.error("Invalid user details")
        return
      }
      const auth = parsed.token
      const threadId = currentThreadIdRef.current
      if (!threadId) {
        console.error("No thread id available for websocket connect")
        return
      }
      const wsUrl = `${WEBSOCKET_URL}/${threadId}/ws?token=${auth}`
      // Close existing socket if present
      if (socketRef.current) {
        try { socketRef.current.close() } catch {}
        socketRef.current = null
      }

      socketRef.current = new WebSocket(wsUrl)

      socketRef.current.addEventListener("open", () => {
        console.log("WebSocket connected (customer). Waiting for agent.")
        sendMessage(msg)
        setWSConnection(true)
      })


      socketRef.current.addEventListener("message", async (ev) => {
        console.log("Received this: ", ev.data)
        // protect against using state after unmount
        // if (unmountedRef.current) return
        console.log("The conditional above deosn't run")

        let parsedMsg: any
        try { parsedMsg = JSON.parse(ev.data) } catch (err) { console.error(err); return }

        // When server sends history, replace messages with server history
        if (parsedMsg.type === "history" && Array.isArray(parsedMsg.messages)) {
          const historyArr: data.Message[] = parsedMsg.messages.map((m: any) => ({
            message: m.content,
            senderId: m.sender_id,
            sentAt: formatShortTime(new Date(m.timestamp)),
          }))
          setMessages(() => historyArr)
          return
        }

        if (parsedMsg.type === "message") {
          // ignore echo from current user
          const currentUserId = currentUserIdRef.current
          if (parsedMsg.sender_id === currentUserId) {
            return
          }

          // ensure agent details available (use ref for agent id)
          if (!freeAgentIdRef.current) {
            // if for some reason agentId wasn't set earlier, try to set it from incoming message or keep trying
            // not assuming incoming payload carries thread/agent mapping, but we still attempt to fetch agent details
            // if available in the message (optional)
          }

          void getAgentDetails()
          setSupportAssistant("chat-agent")
          setStage("agent-chat")

          const incoming: data.Message = {
            message: parsedMsg.content,
            senderId: parsedMsg.sender_id,
            sentAt: formatShortTime(new Date(parsedMsg.timestamp)),
          }
          setMessages(prev => [...prev, incoming])
        }
      })

      socketRef.current.addEventListener("close", () => {
        console.log("WebSocket closed")
        setWSConnection(false)
      })

      socketRef.current.addEventListener("error", (err) => {
        console.error("WebSocket error", err)
      })
    } catch (error) {
      console.error("connectWebSockets error", error)
    }
  }

  // cleanup on unmount
  useEffect(() => {
    return () => {
      unmountedRef.current = true
      if (socketRef.current) {
        try { socketRef.current.close() } catch {}
        socketRef.current = null
      }
    }
  }, [])

  // ---------- Send functions ----------
  function sendMessage(messageText: string) {
    const ws = socketRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      const parsed = getStoredUser()
      const userId = parsed?.userData?.id ?? parsed?.id ?? ""
      const payload = {
        content: messageText,
        senderId: userId,
        receiverId: freeAgentIdRef.current,
      }
      try {
        ws.send(JSON.stringify(payload))
      } catch (err) {
        console.error("Failed to send ws message", err)
      }
    } else {
      console.log("WebSocket not ready", socketRef.current?.readyState)
    }
  }

  // ---------- Handlers ----------
  const handleNavButtonsClick = () => {
    setStage("faq-search")
    setMessages(prev => [
      ...prev,
      {
        message: "The fastest way to find an answer is to search our help articles",
        senderId: agentData.id,
        sentAt: formatShortTime(new Date()),
      },
    ])
  }

  const handleSearch = () => {
    if (!searchQuery.trim()) return
    const results = data.faqData.filter(
      (faq) =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
    )
    setSearchResults(results)
    setStage("faq-results")
    setMessages(prev => [
      ...prev,
      {
        message: `I found ${results.length} article(s) that might help:`,
        senderId: agentData.id,
        sentAt: formatShortTime(new Date()),
      },
    ])
    setSearchQuery("")
  }

  const handleThatHelped = () => {
    setStage("resolved")
    setMessages(prev => [
      ...prev,
      {
        message: "We're happy that you could resolve your issues! 🎉",
        senderId: agentData.id,
        sentAt: formatShortTime(new Date()),
      },
    ])
  }

  const handleGetMoreHelp = async () => {
    setStage("issue-detail")
    setMessages(prev => [
      ...prev,
      {
        message: "I understand. Please describe your issue in detail so we can better assist you.",
        senderId: agentData.id,
        sentAt: formatShortTime(new Date()),
      },
    ])
    const thread = (await createChatThread()) ?? ""
    currentThreadIdRef.current = thread
  }

  const handleSendToAgent = async () => {
    if (!wsConnection) {
      // ensure thread exists and user is queued
      try {
        await addUserToQueue()
      } catch (err) {
        console.error("Failed to add user to queue:", err)
      }
      await connectWebSockets(issueDescriptionRef.current)
      console.log("WebSocket connect attempted")
      console.log("Issue description ref: ", issueDescriptionRef.current)
    }
    // optimistic UI for user message
    setMessages(prev => [
      ...prev,
      {
        message: issueDescriptionRef.current,
        senderId: currentUserIdRef.current,
        sentAt: formatShortTime(new Date()),
      },
    ])
    sendMessage(issueDescriptionRef.current)
  }

  const handleSubmitIssue = (e: FormEvent) => {
    e.preventDefault()
    if (!issueDescription.trim()) return
    setMessages(prev => [
      ...prev,
      {
        message: issueDescription,
        senderId: currentUserIdRef.current,
        sentAt: formatShortTime(new Date()),
      },
      {
        message: "Thank you for the details! You've been added to the queue. An agent will be with you shortly.",
        senderId: currentUserIdRef.current,
        sentAt: formatShortTime(new Date()),
      },
    ])
    // setIssueDescription("")
    setStage("queue")
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    const payloadMessage = message.trim()
    // optimistic UI
    setMessages(prev => [
      ...prev,
      {
        message: payloadMessage,
        senderId: currentUserIdRef.current,
        sentAt: formatShortTime(new Date()),
      },
    ])
    sendMessage(payloadMessage)
    console.log("Message to send from sendMessage function: ", payloadMessage)
    setMessage("")
  }

  function handleButtonClick() {
    onBackButtonClick("main")
  }

  // ---------- Render ----------
  const renderContent = () => {
    return (
      <ScrollArea className="grow" style={{ height: "50%", overflowY: "auto" }}>
        <ChatList className="space-y-5 p-4">
          {messages.map((msg, idx) => {
            const isSent = msg.senderId === currentUserIdRef.current
            const key = `${msg.sentAt}-${idx}`
            return (
              <ChatBubble key={key} variant={isSent ? "sent" : "received"}>
                <ChatBubbleAvatar>
                  <ChatBubbleAvatarImage
                    src={isSent ? userData.img : agentData.img}
                    alt={isSent ? userData.username : agentData.username}
                  />
                </ChatBubbleAvatar>
                <ChatBubbleMessage className="border">
                  <p className="text-[14px]">{msg.message}</p>
                  <div className="w-full text-xs mt-2">{msg.sentAt}</div>
                </ChatBubbleMessage>
              </ChatBubble>
            )
          })}

          {stage === "faq-results" && searchResults.length > 0 && (
            <div className="space-y-2 mt-4">
              {searchResults.map((faq) => (
                <div key={faq.id} className="bg-muted p-3 rounded-lg border">
                  <p className="font-semibold text-sm">{faq.question}</p>
                  <p className="text-xs text-muted-foreground mt-2">{faq.answer}</p>
                </div>
              ))}
            </div>
          )}

          {stage === "queue" && (
            <div className="flex flex-col items-center justify-center space-y-3 py-6">
              <Loader className="w-8 h-8 animate-spin text-muted-foreground" />
              <div className="text-center">
                <p className="font-semibold text-sm">You're in the queue</p>
                <p className="text-xs text-muted-foreground">Average wait: 5-10 minutes</p>
              </div>
            </div>
          )}

          {stage === "resolved" && (
            <div className="flex flex-col items-center justify-center space-y-3 py-6">
              <CheckCircle className="w-8 h-8 text-primary" />
              <p className="font-semibold text-sm">Issue resolved! Thank you for using our support.</p>
            </div>
          )}
          <div ref={scrollBottomRef} />
        </ChatList>
      </ScrollArea>
    )
  }

  const renderActionArea = () => {
    if (stage === "welcome") {
      return (
        <div className="w-full flex flex-row-reverse p-2">
          <Button className="w-auto" variant="default" onClick={handleNavButtonsClick}>
            Get Started
          </Button>
        </div>
      )
    }

    if (stage === "faq-search") {
      return (
        <div className="w-full flex gap-2 p-2 bg-white border-t">
          <Input
            placeholder="Search help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button size="icon" onClick={handleSearch}>
            <Search className="w-4 h-4" />
          </Button>
        </div>
      )
    }

    if (stage === "faq-results") {
      return (
        <div className="w-full flex gap-2 p-2 bg-white border-t">
          <Button className="flex-1" variant="default" onClick={handleThatHelped}>
            That Helped ✓
          </Button>
          <Button className="flex-1 bg-transparent" variant="outline" onClick={handleGetMoreHelp}>
            Get More Help
          </Button>
        </div>
      )
    }

    if (stage === "issue-detail") {
      return (
        <form onSubmit={handleSubmitIssue} className="w-full flex flex-col gap-2 p-2 bg-white border-t">
          <textarea
            placeholder="Describe your issue..."
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            className="rounded border p-2 text-sm resize-none"
            rows={3}
          />
          <Button type="submit" disabled={!issueDescription.trim()} className="gap-2" onClick={handleSendToAgent}>
            <Send />
            Send to Agent
          </Button>
        </form>
      )
    }

    if (stage === "agent-chat") {
      return (
        <form onSubmit={handleSubmit} className="flex flex-row gap-2 p-2 bg-white border-t">
          <InputFile />
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="rounded-full"
            placeholder="Type a message..."
          />
          <Button
            type="submit"
            variant="default"
            size="icon"
            className="shrink-0 rounded-full"
            disabled={message === ""}
          >
            <Send />
          </Button>
        </form>
      )
    }

    return null
  }

  return (
    <div className="w-full h-[80vh] flex flex-col grow">
      <div className="bg-background flex place-items-center justify-between border-b p-2">
        <div className="flex place-items-center gap-2">
          <Avatar>
            <AvatarImage src={agentData.img || "/placeholder.svg"} alt={agentData.username} />
            <AvatarFallback>{initials(agentData.name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{agentData.name}</span>
            <span className="text-xs">{stage === "queue" ? "Connecting to an agent..." : "Active"}</span>
          </div>
        </div>
        <div className="flex place-items-center">
          <Button variant="ghost" className="mr-3 bg-transparent border" onClick={handleButtonClick}>
            <ArrowLeft />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger>
              <Info className="w-5 h-5" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Communication Disclaimer: Quality Assurance Notice</AlertDialogTitle>
                <AlertDialogDescription>
                  By continuing this conversation, you acknowledge and agree that messages sent through this service are
                  NOT end-to-end encrypted, meaning the message contents are accessible to the system operator (the
                  service provider) on our secure servers. All messages and conversation transcripts are automatically
                  recorded and saved for purposes strictly limited to Quality Assurance (QA), system diagnosis,
                  improving customer service, and model training.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction>I Understand</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {renderContent()}
      {renderActionArea()}
    </div>
  )
}
