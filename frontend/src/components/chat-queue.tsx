import { ScrollArea } from "./ui/scroll-area"
import { useEffect, useState } from 'react';
import { useTriggerStore, UseAgentChatState } from '@/lib/zus';
import { HTTP_API_URL } from "@/lib/data";
import * as data from "@/components/data"
import { Button } from "@/components/ui/button";

/// Types
interface QueueItemData {
  id: string;
  name: string;
  profilePicUrl: string;
  waitTime: string;
  waitLevel: 'low' | 'medium' | 'high'; // Use levels instead of hardcoded colors
  messagePreview: string;
  threadId: string;
}

// const mockQueueData: QueueItemData[] = [
//   {
//     id: 'q-1',
//     name: 'Jane Doe',
//     profilePicUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbWuFpe2LETiEuICL1-NbOlxcaN1n4VnkDPbdalR6WsOlUc7sjbnLsFWs8lBJardxmmyCgv8NS7UHyMz6iQGSNo4YiT_SGCd4t3NI9j46MV6JN7thedQBXbLV64-1y9z7A9ZlQsOWoNW9ZphKRPniQUX90xwYccps7ZRvuNM0cTjGHpNaePygHD18hA9veUwqlgY_-bAvTaz7EcdUH2TeA9qgVdCIJD7vcVERAZTv5zNuBT9YXSC_MEXXaJbI7OHRhXuf2tYWa3pI0',
//     waitTime: '05:12',
//     waitLevel: 'high',
//     messagePreview: "Hi, I'm having trouble with my recent order...",
//     threadId: "string",
//   },
//   {
//     id: 'q-2',
//     name: 'John Smith',
//     profilePicUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-rADO3yDjsx5oIm6mcI3XUKE6jfx6IY_-Xev8aBClo9D5rzV0OaZtw03D3ZQoFaQB9XM3pQ8ovc-LIola7X9v5hv6BKhHbPf-nkMmYSMLOZK1pFir4ivJqe7Rd-ilIxPc7HStzG47I1WLqSV7__nuuKhdRRLFX80cCsdhv_QZmS-NQy_4cqCw8ZnrNLOI33qIN09wmB8yFEJXhBpn1YyIF_z5prMUWmV-actRC_9CIdsmZWODBLnxpr4WC0TELKN8o9eAyUI-komV',
//     waitTime: '02:45',
//     waitLevel: 'medium',
//     messagePreview: 'I need to reset my password, can you help?',
//     threadId: "string",
//   },
//   {
//     id: 'q-3',
//     name: 'Emily White',
//     profilePicUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-g0mTYSx0vQAlmHlcHrthEBTRnskeg1dRc3e96LM04-3kdFXIxBFz1hSbJEe7EDVw0H-Lyoif3_vWYjrcUMofYc-lM8cWW26huYQ6mOigsFZL_nOGFsErulUE-fDiB8BcxrZlVAMBNAj-lwv9ruCJ8SugFclZOvFRh0BkyKgIVodNnmZdgC86IuW8tlTvyp9mD2xvy0MnisEfqGRWSyvx8oKdiHaI0N6SwYkDjZCXSfFK2nzjceEnWyOCQ2Y9uhAXz7CPtyd_eVcV',
//     waitTime: '01:32',
//     waitLevel: 'low',
//     messagePreview: 'Question about shipping times.',
//     threadId: "string",
//   },
//   {
//     id: 'q-4',
//     name: 'Michael Brown',
//     profilePicUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGB0dOZrvtW6_bNnb44CfCE-NypLhVSwEo4doIK7v-HbfAuC--GtFhhjHtfuaiuVr3RDu-RaqAyWXEz69kEExfwHHY2FoS-Jv8ox4delrRZEf9lQURjV85JDOEety1WVZVkqMjjUUPdyRiTIbFBSgqiq0w-rvkVL3LR9mr_BAMNDxajuttQuYViul3sf2Lb0Jm5goORMHCNKLem0eC9IVDsJc0ASQ74IZdfH5XhOjH9a8ytg2Sd8rqKStUeGTrLhHI99lLvAi_Upfn',
//     waitTime: '00:59',
//     waitLevel: 'low',
//     messagePreview: "My discount code isn't working.",
//     threadId: "string",
//   },
//   {
//     id: 'q-5',
//     name: 'Sarah Johnson',
//     profilePicUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6pQ-XjNj36l2uyD8ATLQu99yTmQQ3R-wCby89IcI4siYM0WA-iyJDHq-5_Bhsyp3sF7QNv1uhRaTAfZqGzq2gEHPAsMTC3i_E44O41IuqVLa4riBWh1PpHNKox1umZhbUQtTX8YkULwEcyXudgMc6hwzyX7c8hIUoWvUieNbs7pRY_yHo5JdaBhLfPBefHwGzzkgZKLVYdc9dZxW_dxRU8r8tT13-V-wznQ1lkjktnZ2z8Hmoo6I8P-rmK_YtKguULcgM-mBVmyRv',
//     waitTime: '00:21',
//     waitLevel: 'low',
//     messagePreview: 'Hello, I have a quick question about product features.',
//     threadId: "string",
//   },
//     {
//     id: 'q-6',
//     name: 'Sarah Johnson',
//     profilePicUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6pQ-XjNj36l2uyD8ATLQu99yTmQQ3R-wCby89IcI4siYM0WA-iyJDHq-5_Bhsyp3sF7QNv1uhRaTAfZqGzq2gEHPAsMTC3i_E44O41IuqVLa4riBWh1PpHNKox1umZhbUQtTX8YkULwEcyXudgMc6hwzyX7c8hIUoWvUieNbs7pRY_yHo5JdaBhLfPBefHwGzzkgZKLVYdc9dZxW_dxRU8r8tT13-V-wznQ1lkjktnZ2z8Hmoo6I8P-rmK_YtKguULcgM-mBVmyRv',
//     waitTime: '00:21',
//     waitLevel: 'low',
//     messagePreview: 'Hello, I have a quick question about product features.',
//     threadId: "string",
//   },
//     {
//     id: 'q-7',
//     name: 'Sarah Johnson',
//     profilePicUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6pQ-XjNj36l2uyD8ATLQu99yTmQQ3R-wCby89IcI4siYM0WA-iyJDHq-5_Bhsyp3sF7QNv1uhRaTAfZqGzq2gEHPAsMTC3i_E44O41IuqVLa4riBWh1PpHNKox1umZhbUQtTX8YkULwEcyXudgMc6hwzyX7c8hIUoWvUieNbs7pRY_yHo5JdaBhLfPBefHwGzzkgZKLVYdc9dZxW_dxRU8r8tT13-V-wznQ1lkjktnZ2z8Hmoo6I8P-rmK_YtKguULcgM-mBVmyRv',
//     waitTime: '00:21',
//     waitLevel: 'low',
//     messagePreview: 'Hello, I have a quick question about product features.',
//     threadId: "string",
//   }
// ];

// --- CHILD COMPONENTS ---

interface QueueHeaderProps {
  queueCount: number;
}

function QueueHeader({ queueCount }: QueueHeaderProps) {
  return (
    <div className="flex flex-wrap justify-between items-center gap-4 mb-3">
      <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
        Queue ({queueCount})
      </h1>
      <button className="flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 pl-4 pr-2 hover:bg-gray-50 dark:hover:bg-gray-700">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Sort by: Oldest First
        </p>
      </button>
    </div>
  );
}

interface QueueItemProps {
  item: QueueItemData;
  onAccept: () => void;
  threadId: string;
}

function QueueItem({ item, onAccept, threadId }: QueueItemProps) {
  // Map wait levels to their corresponding Tailwind classes
  const waitTimeClasses = {
    high: 'text-red-500 dark:text-red-400',
    medium: 'text-amber-500 dark:text-amber-400',
    low: 'text-green-500 dark:text-green-400',
  };

  function threadIdconnected(itemId: string): boolean {
    if (threadId === "random") return false;
    return threadId === itemId
  }

  return (
    <div className="flex flex-col lg:h-19 sm:flex-row gap-4 bg-white dark:bg-gray-900/50 pl-3 pr-3 pt-2 pb-2 justify-between items-center rounded-xl border border-gray-200 dark:border-gray-800 mb-2">
      <div className="flex items-center gap-4 w-full">
        <div
          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-10 w-10"
          aria-label={`${item.name}'s profile picture`}
          style={{ backgroundImage: `url("${item.profilePicUrl}")` }}
        ></div>
        <div className="flex-1 overflow-hidden">
          {' '}
          {/* Added overflow-hidden for long names */}
          <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
            {item.name}
          </p>
          <p className={`text-sm font-normal ${waitTimeClasses[item.waitLevel]}`}>
            Wait Time: {item.waitTime}
          </p>
          <p className="text-sm font-normal text-gray-500 dark:text-gray-400 truncate mt-1">
            {item.messagePreview}
          </p>
        </div>
      </div>
      <div className="shrink-0 w-full sm:w-auto">
        <Button
          onClick={onAccept}
          className="flex w-full sm:w-auto min-w-16 cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-medium leading-normal hover:bg-primary/90 transition-colors"
          disabled={threadIdconnected(item.threadId)}
        >
          <span className="truncate">{threadId === item.threadId ? "Connected" : "Connect"}</span>
        </Button>
      </div>
    </div>
  );
}

/// ::::::: PARENT COMPONENT ::::::::

export default function QueueSection() {
  const [queueData, setQueueData] = useState<data.QueueItem[]>([]);
  const [queueItems, setQueueItems] = useState<QueueItemData[]>([]); /// It used mockQueueData as the default before
  const [userData, setUserData] = useState<data.APIResponseUserData>(data.defaultAPIResponseUserData);
  // const [userDataSet, setUserDataSet] = useState<boolean>(false)
  // const [authToken, setAuthToken] = useState<string>("")

    /// -> Just load the data first
  useEffect(() => {
  loadUserData();
}, [])

  useEffect(() => {
    function formatSince(epochSeconds: number): string {
        const now = Math.floor(Date.now()/1000);
        const old = Math.floor(epochSeconds/1000);
        const diff = now - old;

        const h = Math.floor(diff/3600);
        const m = Math.floor(diff/60);
        const s = diff % 60;

        if (h > 0) return `${h}:${m}:${s} hrs`;
        if (m > 0) return `${m}:${s} mins`;
        return `${s} sec`;
      }
    const data = queueData.map((x) => {
      const d: QueueItemData =   {
          id: x.customer_id,
          name: x.customer_name,/// I'll use this generic name for now
          profilePicUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbWuFpe2LETiEuICL1-NbOlxcaN1n4VnkDPbdalR6WsOlUc7sjbnLsFWs8lBJardxmmyCgv8NS7UHyMz6iQGSNo4YiT_SGCd4t3NI9j46MV6JN7thedQBXbLV64-1y9z7A9ZlQsOWoNW9ZphKRPniQUX90xwYccps7ZRvuNM0cTjGHpNaePygHD18hA9veUwqlgY_-bAvTaz7EcdUH2TeA9qgVdCIJD7vcVERAZTv5zNuBT9YXSC_MEXXaJbI7OHRhXuf2tYWa3pI0',
          waitTime: formatSince(x.wait_time),
          waitLevel: 'high',
          messagePreview: "Hi, I'm having trouble with my recent order...",
          threadId: x.thread_id,
      };

      return d;
    })
    setQueueItems(data);
  }, [queueData])

useEffect(() => {
  if (!userData) {
    loadUserData();
  }
}, [userData]); 


useEffect(() => {
  if (!userData || !userData.userData) return;

  const fetchData = async () => {
    try {
      const url = `${HTTP_API_URL}/api/getagentspecificqueue/${userData.userData.id}/${userData.token}`;
      
      const response = await fetch(url);
      const responseParsed = await response.json() as data.QueueResponse;
      setQueueData(responseParsed.queueData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  fetchData();

  const intervalId = setInterval(fetchData, 60000);

  return () => clearInterval(intervalId);
  
},[userData]);

  /// ::::::::::::; Zustand :::::::::::::::;
  const triggerConnectWs = useTriggerStore((state) => state.triggerConnectWs);
  const updateCurrentThreadIdAndCustomerIdInGlobalState = UseAgentChatState((state) => state.update)
  const currentThreadIdZus = UseAgentChatState((state) => state.currentThreadId);

  /// Load user data
  async function loadUserData(): Promise<boolean> {
    const raw = localStorage.getItem("user_data") ?? "";
    if (!raw || raw.length < 0) throw new Error("Invalid User Data")
    const parsed = JSON.parse(raw);
    if (parsed) {
      setUserData(parsed);
      // setUserDataSet(true)
      // setAuthToken(parsed.token as string);
      return true;
    } 
    return false;
  }

  const handleAcceptChat = (itemId: string, customerId: string, threadId: string) => {
    console.log('Accepting chat from item:', itemId);
    triggerConnectWs(); /// -> Connect WebSocket in the chat component
    // setQueueItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    updateCurrentThreadIdAndCustomerId(customerId, threadId);
  };

  async function updateCurrentThreadIdAndCustomerId(customerId: string, threadId: string) {
      updateCurrentThreadIdAndCustomerIdInGlobalState(customerId, threadId);
  }

  return (
    <div className="p-0">
      {/* PageHeading */}
      <QueueHeader queueCount={queueItems.length} />

      {/* Chat Queue List */}
      <div className="flex flex-col h-[76vh]">
          <ScrollArea className="grow rounded-xl flex"   
        style={{
            height: '50%',
            overflowY: 'auto'
          }}>
        {queueItems.length > 0 ? (
          queueItems.map((item) => (
            <QueueItem
              key={item.id}
              item={item}
              threadId={currentThreadIdZus}
              onAccept={() => handleAcceptChat(item.id, item.id, item.threadId)}
            />
          ))
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            The queue is empty.
          </p>
        )}
              </ScrollArea>
      </div>
    </div>
  );
}