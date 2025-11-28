import { CigaretteIcon  } from "lucide-react"
import { UseAgentDashboardState } from "@/lib/zus"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export function EmptyOutline() {
  const redirect = UseAgentDashboardState((state) => state.updateState);
  function onButtonClick() {
    redirect("queue-page");
  };
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CigaretteIcon />
        </EmptyMedia>
        <EmptyTitle>No Active Chats</EmptyTitle>
        <EmptyDescription>
            Visit the queue page to check for available chats.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm" onClick={onButtonClick}>
          Queue
        </Button>
      </EmptyContent>
    </Empty>
  )
}
