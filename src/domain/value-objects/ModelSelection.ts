export interface ModelConfig {
  id: string;
  name: string;
  provider: 'huggingface' | 'openai' | 'anthropic' | 'google';
  description?: string;
}

export class ModelSelection {
  private readonly model: ModelConfig;

  constructor(model: ModelConfig) {
    if (!model?.id) {
      throw new Error('Model ID is required');
    }
    if (!model?.provider) {
      throw new Error('Model provider is required');
    }
    this.model = { ...model };
  }

  getId(): string {
    return this.model.id;
  }

  getName(): string {
    return this.model.name;
  }

  getProvider(): ModelConfig['provider'] {
    return this.model.provider;
  }

  getConfig(): ModelConfig {
    return { ...this.model };
  }

  equals(other: ModelSelection): boolean {
    return this.model.id === other.getId();
  }

  toString(): string {
    return `${this.model.name} (${this.model.provider})`;
  }

  /**
   * Checks if this model supports streaming
   */
  supportsStreaming(): boolean {
    // All current providers support streaming
    return true;
  }

  /**
   * Factory method for safe creation
   */
  static createSafe(model: Partial<ModelConfig>): ModelSelection | null {
    try {
      return new ModelSelection(model as ModelConfig);
    } catch {
      return null;
    }
  }

  /**
   * Creates a selection from a model ID and available models list
   */
  static fromId(
    modelId: string,
    availableModels: ModelConfig[]
  ): ModelSelection | null {
    const model = availableModels.find((m) => m.id === modelId);
    if (!model) return null;
    return new ModelSelection(model);
  }
}
