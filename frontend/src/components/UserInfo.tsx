import { IdCard, MapPin} from "lucide-react"

const UserInfo = () => {
  return (
    <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
          JD
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">John Doe</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">john.doe@example.com</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm pt-2">
        <div className="flex flex-col gap-1">
            <IdCard className="text-gray-500 dark:text-gray-400 h-4 w-4"/>
          <p className="font-medium text-gray-900 dark:text-white">1234-567-890</p>
        </div>
        <div className="flex flex-col gap-1">
          <MapPin className="text-gray-500 dark:text-gray-400 h-4 w-4"/>
          <p className="font-medium text-gray-900 dark:text-white">Nigeria</p>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;
