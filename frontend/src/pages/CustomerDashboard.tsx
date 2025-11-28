import { useState, useEffect } from 'react'
import { MessageSquare, BadgeQuestionMark, Send } from "lucide-react"
///import { Separator } from "@radx-ui/react-separator"
import ChatComponent from "@/components/chat-component-customer"
import { Button } from "@/components/ui/button"

export default function CustomerDashboard() {
  const [pageState, setPageState] = useState<"history" | "chat" | "help" | "main">("main");
  const [page, setPage] = useState(<div>Default Page</div>);
  useEffect(() => {
    /// Pages 
    const main =
      <div className="w-[90%] flex flex-col p-2 gap-1.5">
        <Button variant="secondary" size="lg" className="flex flex-row justify-between items-center" onClick={() => { handlePages("history") }}>
          Messages
          <MessageSquare />
        </Button>
        <Button variant="secondary" size="lg" className="flex flex-row justify-between items-center" onClick={() => { handlePages("help") }}>
          Help
          <BadgeQuestionMark />
        </Button>
        <Button variant="default" size="lg" className="flex flex-row justify-between items-center" onClick={() => { handlePages("chat") }}>
          Contact Support
          <Send />
        </Button>
      </div>

    const help = <div>This is the help page <Button variant="default" onClick={() => { handlePages("main") }}>Go back</Button></div>;
    const chat = <div className='flex '><ChatComponent onBackButtonClick={handlePages} /></div>;
    const history = <div>This is the history page <Button variant="default" onClick={() => { handlePages("main") }}>Go back</Button></div>;

    function handlePages(arg: "main" | "chat" | "help" | "history") {
      switch (arg) {
        case "history":
          setPageState("history");
          break;
        case "chat":
          setPageState("chat");
          break;
        case "help":
          setPageState("help");
          break;
        case "main":
          setPageState("main");
          break;
        default:
        /// Do nothing
      }
    }


    function loadPage(arg: "history" | "chat" | "help" | "main") {
      switch (arg) {
        case "history":
          setPage(history);
          break;
        case "chat":
          setPage(chat);
          break;
        case "help":
          setPage(help);
          break;
        case "main":
          setPage(main);
          break;
        default:
        // Do nothing
      }
    }

    loadPage(pageState);
  }, [pageState])

  return (
    <div className="w-screen h-screen flex justify-center items-center">
      <div className="w-md max-h-[90vh] min-h-[85vh] p-5 flex justify-center items-center border rounded-xl shadown-neutral-400">
        {page}
      </div>
    </div >
  )
}

