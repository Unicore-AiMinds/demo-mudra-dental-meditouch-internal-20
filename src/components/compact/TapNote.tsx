import { useState } from 'react';
import { Info } from 'lucide-react';

interface TapNoteProps {
  text: string;
  maxChars?: number;
  fallback?: string;
}

// Phones can't hover, so long notes that desktop shows on hover open on tap instead.
const TapNote = ({ text, maxChars = 30, fallback = 'N/A' }: TapNoteProps) => {
  const [open, setOpen] = useState(false);

  if (!text) return <span>{fallback}</span>;
  if (text.length <= maxChars) return <span>{text}</span>;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center text-left max-w-full"
        aria-expanded={open}
      >
        <span className="truncate">{text.slice(0, maxChars)}…</span>
        <Info className="ml-1 h-3 w-3 flex-shrink-0 text-blue-500" />
      </button>
      {open && (
        <div className="mt-1 rounded border border-gray-200 bg-white p-3 text-sm shadow-lg whitespace-pre-wrap break-words">
          {text}
        </div>
      )}
    </div>
  );
};

export default TapNote;
