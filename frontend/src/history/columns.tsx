import type { ColumnDef } from "@tanstack/react-table"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type ChatHistory = {
  id: string
  date: number
  status: "pending" | "processing" | "resolved" 
  chatId: string
}

export const columns: ColumnDef<ChatHistory>[] = [
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "chatId",
    header: "ChatId",
  },
  {
    accessorKey: "date",
    header: "Date",
  },
]