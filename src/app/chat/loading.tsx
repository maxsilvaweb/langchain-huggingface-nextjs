/**
 * Intentionally empty: chat chrome lives in the layout, and conversation
 * switches keep the previous thread visible via deferred commit in useChat.
 * A loading.tsx here would flash a full-pane skeleton on every soft nav.
 */
export default function Loading() {
  return null;
}
