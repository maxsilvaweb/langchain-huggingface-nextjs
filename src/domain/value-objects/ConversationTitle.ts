import { MessageContent } from './MessageContent';

export class ConversationTitle {
  private readonly value: string;
  private static readonly MAX_LENGTH = 60;
  private static readonly DEFAULT_TITLE = 'New Chat';

  constructor(value: string) {
    // Sanitize and truncate
    const sanitized = this.sanitize(value);
    this.value = this.truncate(sanitized);
  }

  private sanitize(value: string): string {
    return value
      .replace(/\s+/g, ' ')        // Collapse whitespace
      .replace(/[^\w\s-]/g, '')    // Remove special chars except hyphen
      .trim();
  }

  private truncate(value: string): string {
    if (value.length <= ConversationTitle.MAX_LENGTH) {
      return value || ConversationTitle.DEFAULT_TITLE;
    }
    
    // Try to break at word boundary
    const cut = value.lastIndexOf(' ', ConversationTitle.MAX_LENGTH - 1);
    if (cut > 0) {
      return value.slice(0, cut).trimEnd() + '…';
    }
    
    // Hard truncate
    return value.slice(0, ConversationTitle.MAX_LENGTH - 1) + '…';
  }

  getValue(): string {
    return this.value;
  }

  equals(other: ConversationTitle): boolean {
    return this.value.toLowerCase() === other.getValue().toLowerCase();
  }

  toString(): string {
    return this.value;
  }

  /**
   * Creates a title from the first message content
   */
  static fromFirstMessage(message: string): ConversationTitle {
    const preview = MessageContent.createPreview(message, 50);
    return new ConversationTitle(preview);
  }

  /**
   * Factory method for safe creation
   */
  static createSafe(value: string): ConversationTitle | null {
    try {
      return new ConversationTitle(value);
    } catch {
      return null;
    }
  }

  /**
   * Gets the default title value
   */
  static getDefault(): string {
    return ConversationTitle.DEFAULT_TITLE;
  }
}
