import * as React from "react"
import { ArrowRight } from "lucide-react"
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from "@/components/ui/button"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item"
import { Badge } from "@/components/ui/badge"

const chatData = [
  {
    chatId: "123-456-7890",
    date: "5th August 2024"
  },
  {
    chatId: "123-456-7890",
    date: "5th August 2024"
  },
  {
    chatId: "123-456-7890",
    date: "5th August 2024"
  },
  {
    chatId: "123-456-7890",
    date: "5th August 2024"
  },
  {
    chatId: "123-456-7890",
    date: "5th August 2024"
  },
  {
    chatId: "123-456-7890",
    date: "5th August 2024"
  },
  {
    chatId: "123-456-7890",
    date: "5th August 2024"
  },
  {
    chatId: "123-456-7890",
    date: "5th August 2024"
  },
  {
    chatId: "123-456-7890",
    date: "5th August 2024"
  },
  {
    chatId: "123-456-7890",
    date: "5th August 2024"
  },
  {
    chatId: "123-456-7890",
    date: "5th August 2024"
  },
]

export function ItemGroupExample() {
  return (
    // <ScrollArea className="grow">
     <div className="flex w-full h-[85vh] flex-col gap-1 border rounded-[12px]">
        <ScrollArea className="grow min-h-0">
      <ItemGroup>
        {chatData.map((chat, index) => (
          <React.Fragment key={chat.chatId}>
            <Item>
              <ItemMedia>
                <Badge className="bg-green-400">resolved</Badge>
              </ItemMedia>
              <ItemContent className="gap-1">
                <ItemTitle>{chat.chatId}</ItemTitle>
                <ItemDescription>{chat.date}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ArrowRight />
                </Button>
              </ItemActions>
            </Item>
            {index !== chatData.length - 1 && <ItemSeparator />}
          </React.Fragment>
        ))}
      </ItemGroup>
        </ScrollArea>
    </div>
    // </ScrollArea>
  )
}
