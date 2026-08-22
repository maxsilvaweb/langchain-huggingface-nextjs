export class MessageContent {
  private readonly value: string;
  private static readonly MAX_LENGTH = 10000;
  private static readonly EMPTY_ERROR = 'Message content cannot be empty';
  private static readonly TOO_LONG_ERROR = `Message content exceeds maximum length of ${MessageContent.MAX_LENGTH} characters`;

  constructor(value: string) {
    const trimmed = value?.trim() ?? '';
    
    if (trimmed.length === 0) {
      throw new Error(MessageContent.EMPTY_ERROR);
    }
    
    if (trimmed.length > MessageContent.MAX_LENGTH) {
      throw new Error(MessageContent.TOO_LONG_ERROR);
    }
    
    this.value = trimmed;
  }

  getValue(): string {
    return this.value;
  }

  getLength(): number {
    return this.value.length;
  }

  equals(other: MessageContent): boolean {
    return this.value === other.getValue();
  }

  toString(): string {
    return this.value;
  }

  /**
   * Factory method to safely create a MessageContent, returning null if invalid
   */
  static createSafe(value: string): MessageContent | null {
    try {
      return new MessageContent(value);
    } catch {
      return null;
    }
  }

  /**
   * Creates a truncated preview of the message content for display
   */
  static createPreview(value: string, maxLength: number = 50): string {
    const trimmed = value?.trim() ?? '';
    if (trimmed.length <= maxLength) return trimmed;
    const cut = trimmed.lastIndexOf(' ', maxLength - 1);
    return trimmed.slice(0, cut > 0 ? cut : maxLength - 1).trimEnd() + '…';
  }
}
