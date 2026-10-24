// Shared pieces for the phone/tablet (compact, < 1024px) layouts.

// DialogContent classes that turn a popup into a full-screen page. They also override
// the dialog's own sm:max-w-lg / sm:rounded-lg so tablets get the full screen too.
export const COMPACT_FULLSCREEN_DIALOG =
  "left-0 top-0 translate-x-0 translate-y-0 w-screen max-w-none sm:max-w-none h-[100dvh] max-h-none rounded-none sm:rounded-none p-0 gap-0 flex flex-col " +
  // cancel the centred slide-in of the normal dialog so the full-screen page just fades in
  "data-[state=open]:![--tw-enter-translate-x:0] data-[state=open]:![--tw-enter-translate-y:0] data-[state=closed]:![--tw-exit-translate-x:0] data-[state=closed]:![--tw-exit-translate-y:0]"

// Scrolling area between the title and the pinned buttons of a full-screen popup
export const COMPACT_DIALOG_BODY = "flex-1 overflow-y-auto px-4 py-4"

// Buttons pinned to the bottom of a full-screen popup or long form
export const COMPACT_STICKY_FOOTER =
  "sticky bottom-0 z-10 border-t bg-background px-4 py-3 flex flex-col gap-2 sm:flex-col sm:justify-start sm:space-x-0"

// First `limit` items plus how many are hidden, for "+N more" / "Collapse" lists
export function previewList<T>(items: T[], expanded: boolean, limit = 3): { visible: T[]; hiddenCount: number } {
  if (expanded || items.length <= limit) {
    return { visible: items, hiddenCount: 0 };
  }
  return { visible: items.slice(0, limit), hiddenCount: items.length - limit };
}
