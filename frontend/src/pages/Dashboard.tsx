import { SidebarLeft } from "@/components/sidebar-left"
import { SidebarRight } from "@/components/sidebar-right"
import ChatHistorySection from "@/components/chat-history"
import QueueSection from "@/components/chat-queue"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import ChatComponent from "@/components/chat-component"
import { useEffect, useState } from "react"
import { UseAgentDashboardState } from "@/lib/zus"


export default function Dashboard() {
  const [pageTitle, setPageTitle] = useState<"Chat Panel" | "History" | "Queue">("Chat Panel")

  ///:::::::::::::; Zustand :::::::::::::;
  const updateGlobalAgentPageState = UseAgentDashboardState((state) => state.updateState);
  const pageState = UseAgentDashboardState((state) => state.pageState)

  function updatePageState(arg: "chat-page" | "chat-history-page" | "queue-page") {
    updateGlobalAgentPageState(arg);
  }

  useEffect(() => {
    switch (pageState) {
      case "chat-page":
        setPageTitle("Chat Panel");
        break;
      case "chat-history-page":
        setPageTitle("History");
        break;
      case "queue-page":
        setPageTitle("Queue")
        break; 
      default:
    }
  }, [pageState])

  return (
    <SidebarProvider>
      <SidebarLeft onUpdatePageState={updatePageState}/>
        <SidebarInset className="pl-5 pr-5 h-auto shadow-none">
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <p>{pageTitle}</p>
            </div>
          </header>
          <div style={{ display: pageState === "chat-page" ? "block" : "none"}}><ChatComponent /></div>
          <div style={{ display: pageState === "chat-history-page" ? "block" : "none"}}><ChatHistorySection /></div>
          <div style={{ display: pageState === "queue-page" ? "block" : "none"}}><QueueSection /></div>
        </SidebarInset>
      <SidebarRight />
    </SidebarProvider>
  )
}
