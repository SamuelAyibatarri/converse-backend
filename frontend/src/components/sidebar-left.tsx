import * as React from "react"
import {
  Command,
  Inbox,
} from "lucide-react"

import {
  Bot,
  LifeBuoy,
  Send,
  History
} from "lucide-react"


import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "./nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter
} from "@/components/ui/sidebar"


import { Separator } from "@/components/ui/separator"
import { Button } from "./ui/button"
import { useNavigate } from "react-router-dom"


interface SidebarLeftProps extends React.ComponentProps<typeof Sidebar> {
  onUpdatePageState: (arg: "chat-page" | "chat-history-page" | "queue-page") => void;
}

const data = {
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ]
}

export function SidebarLeft({
  onUpdatePageState,
  ...props
}: SidebarLeftProps) {
  const navigate = useNavigate();
  const [userData, setUserData] = React.useState<{name: string; email: string; id: string; avatar: string;}>(
    {
      name: "random",
      email: "random@mail.com",
      avatar: "/avatars/shadcn.jpg",
      id: "1234-567-890"
    }
  );
  function handlePageClick (arg: "chat-page" | "chat-history-page" | "queue-page") {
    if (arg==="chat-page" || arg==="chat-history-page" || arg === "queue-page" ) {
    onUpdatePageState(arg);
    return
    } else {
      console.error("Invalid Page State")
      return
    }
  }

  const [userDataValid, setUserDataValid] = React.useState<boolean>(false);

  React.useEffect(() => {
    const localDataUnparsed: string = localStorage.getItem('user_data') ?? "";
    if (localDataUnparsed.length === 0 || localDataUnparsed == "") {
      navigate('/auth');
    } else {
      const localDataParsed = JSON.parse(localDataUnparsed);
      if (!localDataParsed.userData || !localDataParsed.userData.name || !localDataParsed.userData.email || !localDataParsed.userData.id) {
        console.error("User data invalid")
      } 
      setUserDataValid(true);
      setUserData(
        {
          name: localDataParsed.userData.name,
          email: localDataParsed.userData.email,
          id: localDataParsed.userData.id,
          avatar: "/avatars/shadcn.jpg",
        }
      )
  }

  }, [navigate])

  return (
        <Sidebar variant="inset" {...props}> 
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg w-auto">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Converse Inc</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <Separator 
        orientation="horizontal"
        className="mr-2 data-[orientation=horizontal]:w-full"      />
      <SidebarContent>
        <Button variant={"ghost"} className="justify-start mt-1" onClick={() => {handlePageClick("queue-page")}}><Bot /> Queue</Button>
        <Button variant={"ghost"} className="justify-start" onClick={() => {handlePageClick("chat-page")}}><Inbox /> Active Chats</Button>
        <Button variant={"ghost"} className="justify-start" onClick={() => {handlePageClick("chat-history-page")}}><History /> History</Button>
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
