import { Button } from "./ui/button";
import { PlusCircle, Redo2, CircleSlashIcon, XCircle } from "lucide-react";

const ActionTray = () => {
    return (
        <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Action Tray</h3>
            <div className="grid grid-cols-2 gap-3">
                <Button variant="outline"> <PlusCircle /> Add Note </Button>
                <Button variant={"outline"}> <Redo2 />Reset Link </Button>
                <Button variant="outline" className="border-red-400 text-red-400"> <CircleSlashIcon className="text-red-500"/>Block Acc. </Button>
                <Button variant="outline" className="border-red-400 text-red-400"> <XCircle className="text-red-500"/>Delete Acc. </Button>
            </div>
        </div>
    )
}

export default ActionTray;