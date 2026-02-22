import { Modal, ModalBody } from "@ui/modal";

interface KeyboardShortcutsModalProps {
  show: boolean;
  onHide: () => void;
}

export function KeyboardShortcutsModal({ show, onHide }: KeyboardShortcutsModalProps) {
  return (
    <Modal
      show={show}
      onHide={onHide}
      title="Keyboard Shortcuts"
      centered
    >
      <ModalBody>
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-[--text-color]">Message Composition</h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between py-1">
                <span className="text-[--text-muted]">Send message</span>
                <kbd className="rounded bg-[--background-color] px-2 py-1 text-xs font-mono border border-[--border-color]">
                  Enter
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-[--text-muted]">New line</span>
                <kbd className="rounded bg-[--background-color] px-2 py-1 text-xs font-mono border border-[--border-color]">
                  Shift + Enter
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-[--text-muted]">New line (alt)</span>
                <kbd className="rounded bg-[--background-color] px-2 py-1 text-xs font-mono border border-[--border-color]">
                  Ctrl/⌘ + Enter
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-[--text-muted]">Edit last message</span>
                <kbd className="rounded bg-[--background-color] px-2 py-1 text-xs font-mono border border-[--border-color]">
                  ↑ (when input empty)
                </kbd>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-[--text-color]">Navigation</h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between py-1">
                <span className="text-[--text-muted]">Focus search</span>
                <kbd className="rounded bg-[--background-color] px-2 py-1 text-xs font-mono border border-[--border-color]">
                  Ctrl/⌘ + K
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-[--text-muted]">Cancel edit/reply</span>
                <kbd className="rounded bg-[--background-color] px-2 py-1 text-xs font-mono border border-[--border-color]">
                  Esc
                </kbd>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-[--text-color]">Formatting</h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between py-1">
                <span className="text-[--text-muted]">Mention user</span>
                <kbd className="rounded bg-[--background-color] px-2 py-1 text-xs font-mono border border-[--border-color]">
                  @username
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-[--text-muted]">Insert emoji</span>
                <kbd className="rounded bg-[--background-color] px-2 py-1 text-xs font-mono border border-[--border-color]">
                  :emoji_name:
                </kbd>
              </div>
            </div>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
