import * as React from "react"
import UserInfo from "./UserInfo"

import { Calendars } from "@/components/calendars"
import { DatePicker } from "@/components/date-picker"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import ActionTray from "./action-tray"
import PaymentHistory from "./payment-history"

export function SidebarRight({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="none"
      className="sticky top-0 hidden h-svh lg:flex bg-white"
      {...props}
    >
      {/* <SidebarHeader className="border-sidebar-border h-10 border-b">
        User Details
      </SidebarHeader> */}
      <SidebarContent className="mt-4 mr-2 flex scroll-m-0 pl-2 pr-2" style={{
        scrollbarWidth: "none"
      }}>

        {/* <section className="w-full flex flex-col h-auto bg-white rounded-xl shadow p-2 gap-1">
          <div className="flex flex-row text-sm mt-1 mb-1"><span className="font-bold flex flex-row justify-center items-center mr-1"><User className="w-4 h-4 mr-1"/>Name: </span>Customer Name </div>
          <div className="flex flex-row text-sm mt-1 mb-1"><span className="font-bold flex flex-row justify-center items-center mr-1"><IdCard className="w-4 h-4 mr-1"/> Id: </span> 1234-567-890 </div>
          <div className="flex flex-row text-sm mt-1 mb-1"><span className="font-bold flex flex-row justify-center items-center mr-1"><Mail className="w-4 h-4 mr-1"/> Email: </span> customer@gmail.com </div>
          <div className="flex flex-row text-sm mt-1 mb-1"><span className="font-bold flex flex-row justify-center items-center mr-1"><LocationEdit className="w-4 h-4 mr-1" /> Location: </span> Nigeria</div>
        </section> */}
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Customer Details</h3>
        <UserInfo />
        <PaymentHistory />
        <ActionTray />
      </SidebarContent>
      {/* <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter> */}
    </Sidebar>
  )
}
