import { useState } from 'react';
import { Calendar, ArrowDown, SearchIcon } from 'lucide-react';

// --- TYPE DEFINITIONS ---

interface ConversationData {
  id: string;
  name: string;
  profilePicUrl: string;
  messagePreview: string;
  date: string;
}

const mockConversations: ConversationData[] = [
  {
    id: 'c-1',
    name: 'Eleanor Pena',
    profilePicUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBV4aJy3Mt5esX4bbG_yLjW9SLVMLW2CgtZiQU_essZ_pdCgLyx-VQLEJiCSe3EPkapTEqim6RcUVvA2BwXxmF6L0UASuV-EOlPfiwai3BXSudDs42XDawbbotdt-5bbV6-FiRDtMKGKT1dnpXRK_vBG8N5CULiKQBnEwtTtCFeASHltCUG0QqYOgr_ji9jPQetK8Oo3SuLf8xCW2gEHTnFs9VsEcE0gcsRkSz4gs5qDaO6O08BC_laLqaS26y7797vf-GSifD1ASWW',
    messagePreview: 'Thank you so much! That solved the issue.',
    date: 'Oct 28',
  },
  {
    id: 'c-2',
    name: 'Cody Fisher',
    profilePicUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMTmSQ9dSrxjrWJh1RIi7JlQoc1nNjFHagzUNwCaoeo3Mrgr3LGdLxyy0QKKlKHRhNM6qAhAtbjNPVK7qcaVwCrDcN8_9hkAREDGm7KX_BoXZBFKDN4g_uXkPQlaXP0KY4ygoJ0vcFlFaGLq_20OX-oU6NhtbYy1BMU0i3NlNjWNB1M1mrEkdtNQvXhsECQ2ZnlSwO4SLITrsq3vVrHidiY44ddKIsDz9uzxjKbmgtgW-gTOSKrnidziQCHxqft_ky8O5KYasZu5rV',
    messagePreview: 'I have a question about my recent order...',
    date: 'Oct 27',
  },
  {
    id: 'c-3',
    name: 'Kristin Watson',
    profilePicUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAf9j1qCDdtuTwE9WM3zCoawKfZi9G6WnfZzXuTNtBssBA0SbVjKb4IBn41Ug0LMFKkY9D7uDw9VubI2oWz_3oTsBREgGmglnniFcAnMx2KxD3h1u-a1_-eCl4Nx4we1YD2Xtsjgqa7-quxQvBNUYMhubfKBddiPiTdLHO5NyCOoEgKYFhY-cmzMFmdCvq3sEtI5OjD1SrCyXWWU2zaPr7PLdlCUtIzw8UMLyzGLO5GtRb01ZxUX1kvSyh6aef6NfxBd3FjSosTloqC',
    messagePreview: 'Can you please provide an update on ticket #5829?',
    date: 'Oct 27',
  },
  {
    id: 'c-4',
    name: 'Jacob Jones',
    profilePicUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJ2QxBLtsdzaM_-OyJto21UZfs-bbUf47U_OYmFO76kCJdQTQtd6eIRNnmDzxn9nQ4QHEFCAuP-Juvyhh_0lfA3OZjJ88KjllDGvQorfAonrG79-a5CbxLMoE_hdgJb6ZUQjls7NSqgbme5gO8oWqzrHyhaMvBA5wauwS5mnPiEww4b5QfB9mYtVfdURLFRlZrQp3GJ3rYamqjaTX8GUbY4FvN7IE7l1jDMjCeCpX54Wd5lNgnxAIIvB-25WqUexNCufhMbAYlPTAn',
    messagePreview: 'My subscription is about to expire, I need help.',
    date: 'Oct 26',
  },
  {
    id: 'c-5',
    name: 'Jenny Wilson',
    profilePicUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuClk-_flCsX1dNoejPDqq35DlClcXGcmSakaU9QF-cnsL7SZYdFrEgkq4zdFDi8y7JOaP9IPk_cDDn-b4KaYn-qXJ_UH1Wd4vYFdMelMRtD-LN4eVH2Fj91_4rglVgO8SQc6ceTvnnDT11UtlgwQdlMfhn0-EqLaN1SPU0rhYNqq9PodbYK6D996ZRL_OJPIm79g_0PZEDxwlE-5jnYWsmfXtdQIZzrS81_KM44dNMyGnPnJMi5zKepLDof2Omw70i7BdJgAbthtYgI',
    messagePreview: "That's great, thank you for your help!",
    date: 'Oct 25',
  },
];

// --- CHILD COMPONENTS ---

/**
 * Renders the search bar and filter buttons
 */
interface HistoryControlsProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
}

function HistoryControls({
  searchValue,
  onSearchChange,
}: HistoryControlsProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
      {/* SearchBar */}
      <div className="flex-1">
        <label className="flex flex-col min-w-40 h-10 w-full">
          <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
            <div className="flex items-center justify-center rounded-l-lg border border-r-0 border-slate-300 dark:border-slate-700 bg-white dark:bg-background-dark pl-4 text-slate-500 dark:text-slate-400">
              <SearchIcon className='h-4 w-4'/>
            </div>
            <input
              className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary h-full border border-l-0 border-slate-300 dark:border-slate-700 bg-white dark:bg-background-dark focus:border-primary dark:focus:border-primary placeholder:text-slate-500 dark:placeholder:text-slate-400 px-4 text-base font-normal leading-normal"
              placeholder="Search by keyword, customer name..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </label>
      </div>
      {/* Chips */}
      <div className="flex gap-3">
        <button className="flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-white dark:bg-[#151d27] border border-slate-300 dark:border-slate-700 px-4 hover:bg-slate-100 dark:hover:bg-background-dark">
            <div className="flex items-center justify-center rounded-l-lg border-r-0 border-slate-300 dark:border-slate-700 bg-white dark:bg-background-dark text-slate-500 dark:text-slate-400">
              <Calendar className='h-4 w-4'/>
            </div>
          <p className="text-slate-800 dark:text-slate-200 text-sm font-medium leading-normal">
            Date
          </p>
        </button>
      </div>
    </div>
  );
}

/**
 * Renders a single conversation item in the list
 */
interface ConversationItemProps {
  item: ConversationData;
  onClick: (id: string) => void;
}

function ConversationItem({ item, onClick }: ConversationItemProps) {
  return (
    <div
      className="flex cursor-pointer items-center gap-4 px-4 min-h-[72px] py-2 justify-between hover:bg-slate-50 dark:hover:bg-slate-800/20"
      onClick={() => onClick(item.id)}
    >
      <div className="flex items-center gap-4 overflow-hidden">
        {' '}
        {/* Added overflow-hidden */}
        <div
          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-10 w-10 shrink-0" // Added shrink-0
          aria-label={`Avatar for ${item.name}`}
          style={{ backgroundImage: `url("${item.profilePicUrl}")` }}
        ></div>
        <div className="flex flex-col justify-center overflow-hidden">
          {' '}
          {/* Added overflow-hidden */}
          <p className="text-slate-900 dark:text-white text-sm font-medium leading-normal line-clamp-1">
            {item.name}
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-normal leading-normal line-clamp-1">
            {item.messagePreview}
          </p>
        </div>
      </div>
      <div className="shrink-0">
        <p className="text-slate-500 dark:text-slate-400 text-xs font-normal leading-normal">
          {item.date}
        </p>
      </div>
    </div>
  );
}

/**
 * Renders a placeholder when no conversations are found
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-16 text-center">
      <span className="material-symbols-outlined text-6xl text-slate-400 dark:text-slate-600">
        chat_bubble_outline
      </span>
      <h3 className="text-slate-800 dark:text-slate-200 text-lg font-semibold">
        No conversations found
      </h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">
        Try adjusting your search or filter criteria to find the conversation
        you're looking for.
      </p>
    </div>
  );
}

// --- PARENT COMPONENT ---

/**
 * The main component that renders the entire Chat History section
 */
export default function ChatHistorySection() {
  const [conversations, setConversations] =
    useState<ConversationData[]>(mockConversations);
  const [searchTerm, setSearchTerm] = useState('');

  const handleConversationClick = (id: string) => {
    console.log('Opening conversation:', id);
    // Add logic here to navigate to the chat
  };

  // Filter logic
  const filteredConversations = conversations.filter(
    (convo) =>
      convo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      convo.messagePreview.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex w-full max-w-5xl flex-col gap-6">
      {/* Search and Filters */}
      <HistoryControls
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* Conversation List */}
      <div className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151d27]">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((item) => (
            <ConversationItem
              key={item.id}
              item={item}
              onClick={handleConversationClick}
            />
          ))
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}