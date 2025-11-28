import type { ChatHistory } from "./columns"
import { columns } from "./columns"
import { DataTable } from "./data-table"

function getData(): ChatHistory[] {
  // Fetch data from your API here.
  return [
    {
      id: "728ed52f",
      date: 102312,
      status: "resolved",
      chatId: "123-456-7890",
    },
    {
      id: "728ed52g",
      date: 102314,
      status: "pending",
      chatId: "123-456-7890",
    },
    // ...
  ]
}

export default function DemoPage() {
  const data = getData()

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  )
}