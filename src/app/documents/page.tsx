'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight, FileText, Loader2, MessageSquare, Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Document {
  _id: string;
  text: string;
  metadata: {
    source?: string;
    chunk_index?: number;
    total_chunks?: number;
  };
  _creationTime: number;
}

interface GroupedDocument {
  source: string;
  chunks: Document[];
  totalChunks: number;
  createdAt: number;
}

export default function DocumentsPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const [suggestedQueries, setSuggestedQueries] = useState<string[]>([]);
  const [isLoadingQueries, setIsLoadingQueries] = useState(false);
  
  const [text, setText] = useState('');
  const [source, setSource] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Group documents by source
  const groupedDocuments: GroupedDocument[] = (() => {
    const groups = new Map<string, Document[]>();
    
    for (const doc of documents) {
      const source = doc.metadata?.source || 'Unknown source';
      if (!groups.has(source)) {
        groups.set(source, []);
      }
      groups.get(source)!.push(doc);
    }
    
    return Array.from(groups.entries())
      .map(([source, chunks]) => ({
        source,
        chunks: chunks.sort((a, b) => 
          (a.metadata?.chunk_index ?? 0) - (b.metadata?.chunk_index ?? 0)
        ),
        totalChunks: chunks.length,
        createdAt: Math.min(...chunks.map(c => c._creationTime)),
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  })();

  const toggleExpanded = (source: string) => {
    setExpandedSources((prev) => {
      const next = new Set(prev);
      if (next.has(source)) {
        next.delete(source);
      } else {
        next.add(source);
      }
      return next;
    });
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  // Fetch documents
  useEffect(() => {
    if (!isSignedIn) return;
    
    const fetchDocuments = async () => {
      try {
        const response = await fetch('/api/documents');
        const data = await response.json();
        if (response.ok) {
          setDocuments(data.documents || []);
        }
      } catch (error) {
        console.error('Failed to fetch documents:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, [isSignedIn]);

  // Fetch suggested queries from the knowledge base
  useEffect(() => {
    if (!isSignedIn || documents.length === 0) return;

    const fetchSuggestions = async () => {
      setIsLoadingQueries(true);
      try {
        const response = await fetch('/api/documents/suggest-queries');
        const data = await response.json();
        if (response.ok) {
          setSuggestedQueries(data.queries || []);
        }
      } catch (error) {
        console.error('Failed to fetch suggested queries:', error);
      } finally {
        setIsLoadingQueries(false);
      }
    };

    fetchSuggestions();
  }, [isSignedIn, documents.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim() || !source.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/documents/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), source: source.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to ingest document');
      }

      toast.success(`Document ingested: ${data.chunk_count} chunk(s) created`);
      setText('');
      setSource('');
      setShowForm(false);

      // Refresh document list
      const listResponse = await fetch('/api/documents');
      const listData = await listResponse.json();
      if (listResponse.ok) {
        setDocuments(listData.documents || []);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to ingest document';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/chat')}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-white">Knowledge Base</h1>
              <p className="text-sm text-white/50">
                {documents.length} document{documents.length !== 1 ? 's' : ''} indexed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              onClick={() => setShowForm(!showForm)}
              className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {showForm ? (
                'Cancel'
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Document
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* How RAG Works - Moved to top */}
        <div className="mb-6 rounded-lg border border-white/10 bg-emerald-900/20 p-4">
          <h3 className="font-medium text-emerald-300 mb-2">How RAG Works</h3>
          <ul className="text-sm text-white/60 space-y-1">
            <li>• Documents are split into chunks and converted to embeddings</li>
            <li>• When you ask a question, relevant chunks are retrieved</li>
            <li>• The AI uses this context to provide accurate, sourced answers</li>
            <li>• Sources are cited in the response (e.g., "[Source 1]")</li>
          </ul>

          <div className="mt-4 pt-4 border-t border-white/10">
            <h4 className="text-sm font-medium text-emerald-300 mb-2">
              Try these queries in chat
            </h4>
            {isLoadingQueries ? (
              <div className="flex items-center gap-2 text-sm text-white/40">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Generating questions from your documents...
              </div>
            ) : suggestedQueries.length > 0 ? (
              <div className="space-y-1.5">
                {suggestedQueries.map((query) => (
                  <button
                    key={query}
                    type="button"
                    onClick={() => {
                      sessionStorage.setItem('chat-pending-prompt', query);
                      router.push('/chat');
                    }}
                    className="flex w-full items-center gap-2 rounded-md bg-white/5 px-3 py-1.5 text-left text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white cursor-pointer group"
                  >
                    <span className="text-emerald-400 shrink-0">→</span>
                    <span className="flex-1 truncate">{query}</span>
                    <MessageSquare className="h-3.5 w-3.5 text-white/30 shrink-0 transition-colors group-hover:text-emerald-400" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/40">
                Add documents to see suggested queries.
              </p>
            )}
            {suggestedQueries.length > 0 && (
              <p className="mt-2 text-xs text-white/40">
                Generated from your current knowledge base.
              </p>
            )}
          </div>
        </div>

        {/* Upload Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-8 rounded-xl border border-white/10 bg-white/5 p-6 space-y-4"
          >
            <div className="flex items-center gap-2 text-emerald-400 mb-4">
              <Upload className="h-5 w-5" />
              <span className="font-medium">Add New Document</span>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/70">Source Name</label>
              <Input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g., clinical_trial_results.txt"
                disabled={isSubmitting}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/70">Document Content</label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your document text here..."
                disabled={isSubmitting}
                rows={8}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-y"
              />
              <p className="text-xs text-white/40">
                {text.length.toLocaleString()} characters
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !text.trim() || !source.trim()}
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Ingest Document
                </>
              )}
            </Button>
          </form>
        )}

        {/* Document List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-white/40" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-white/20 mb-4" />
            <h2 className="text-lg font-medium text-white/60 mb-2">
              No documents yet
            </h2>
            <p className="text-sm text-white/40 mb-6">
              Add documents to enable RAG-powered responses in chat
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="gap-2 bg-emerald-600 hover:bg-emerald-500"
            >
              <Plus className="h-4 w-4" />
              Add Your First Document
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {groupedDocuments.map((group) => {
              const isExpanded = expandedSources.has(group.source);
              const previewText = group.chunks[0]?.text || '';
              
              return (
                <div
                  key={group.source}
                  className={cn(
                    'rounded-lg border border-white/10 bg-white/5',
                    'hover:bg-white/[0.07] transition-colors'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleExpanded(group.source)}
                    className="w-full p-4 text-left cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-emerald-400 shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-emerald-400 shrink-0" />
                          )}
                          <FileText className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span className="font-medium text-white truncate">
                            {group.source}
                          </span>
                          <span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded">
                            {group.totalChunks} chunk{group.totalChunks !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {!isExpanded && (
                          <p className="text-sm text-white/60 line-clamp-2 ml-6">
                            {previewText}
                          </p>
                        )}
                      </div>
                      <time className="text-xs text-white/30 shrink-0">
                        {new Date(group.createdAt).toLocaleDateString()}
                      </time>
                    </div>
                  </button>
                  
                  {/* Expanded content - all chunks combined with scrollbar */}
                  {isExpanded && (
                    <div className="px-4 pb-4">
                      <div className="ml-6 p-3 rounded-lg bg-black/20 border border-white/5 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                        {group.chunks.map((chunk, index) => (
                          <div key={chunk._id} className={index > 0 ? 'mt-4 pt-4 border-t border-white/10' : ''}>
                            {group.totalChunks > 1 && (
                              <p className="text-xs text-emerald-400/70 mb-2">
                                Chunk {index + 1} of {group.totalChunks}
                              </p>
                            )}
                            <p className="text-sm text-white/70 whitespace-pre-wrap">
                              {chunk.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
