export const APP_NAME = 'LangChain + Hugging Face AI';
export const APP_DESCRIPTION =
  'Modern real-time AI infrastructure with Convex.';

export const DEFAULT_CONVERSATION_TITLE = 'New Chat';
export const SIDEBAR_LABEL_CONVERSATIONS = 'Conversations';
export const SIDEBAR_LABEL_RECENT_CHATS = 'Recent Chats';
export const SIDEBAR_LABEL_NO_SEARCH_RESULTS = 'No matching chats';

export function getSidebarSearchResultsLabel(count: number): string {
  return `${count} result${count === 1 ? '' : 's'}`;
}
