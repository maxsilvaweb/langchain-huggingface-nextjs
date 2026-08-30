'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, FileText, Loader2, MessageSquare, Plus, Upload } from 'lucide-react';
import { AppPagination } from '@/components/app-pagination';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/page-header';
import { PageProgressLoader } from '@/components/page-progress-loader';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const DOCUMENTS_PAGE_SIZE = 5;

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<'paste' | 'upload'>('paste');
  const [page, setPage] = useState(1);

  const ACCEPTED_UPLOAD_TYPES =
    '.txt,.md,.markdown,.csv,.json,.html,.htm,.pdf';
  const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
  const TEXT_LIKE_EXTENSIONS = new Set([
    '.txt',
    '.md',
    '.markdown',
    '.csv',
    '.json',
    '.html',
    '.htm',
  ]);

  const resetForm = () => {
    setText('');
    setSource('');
    setSelectedFile(null);
    setInputMode('paste');
  };

  const extensionOf = (filename: string) => {
    const idx = filename.lastIndexOf('.');
    return idx >= 0 ? filename.slice(idx).toLowerCase() : '';
  };

  const handleFileChange = async (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error('File too large (max 5 MB)');
      return;
    }

    const ext = extensionOf(file.name);
    const allowed = new Set([
      ...TEXT_LIKE_EXTENSIONS,
      '.pdf',
    ]);
    if (!allowed.has(ext)) {
      toast.error('Unsupported file type. Use txt, md, csv, json, html, or pdf.');
      return;
    }

    setSelectedFile(file);
    setSource((current) => current.trim() || file.name);
    setInputMode('upload');

    if (TEXT_LIKE_EXTENSIONS.has(ext)) {
      try {
        const content = await file.text();
        setText(content);
      } catch {
        toast.error('Could not read file as text');
      }
    } else {
      // PDF is parsed server-side; clear paste buffer so we don't double-send.
      setText('');
    }
  };

  // Group documents by source
  const groupedDocuments: GroupedDocument[] = useMemo(() => {
    const groups = new Map<string, Document[]>();

    for (const doc of documents) {
      const docSource = doc.metadata?.source || 'Unknown source';
      if (!groups.has(docSource)) {
        groups.set(docSource, []);
      }
      groups.get(docSource)!.push(doc);
    }

    return Array.from(groups.entries())
      .map(([docSource, chunks]) => ({
        source: docSource,
        chunks: chunks.sort(
          (a, b) =>
            (a.metadata?.chunk_index ?? 0) - (b.metadata?.chunk_index ?? 0),
        ),
        totalChunks: chunks.length,
        createdAt: Math.min(...chunks.map((c) => c._creationTime)),
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [documents]);

  const pageCount = Math.max(
    1,
    Math.ceil(groupedDocuments.length / DOCUMENTS_PAGE_SIZE),
  );

  const pagedDocuments = useMemo(() => {
    const start = (page - 1) * DOCUMENTS_PAGE_SIZE;
    return groupedDocuments.slice(start, start + DOCUMENTS_PAGE_SIZE);
  }, [groupedDocuments, page]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

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

    const trimmedSource = source.trim();
    if (!trimmedSource) {
      toast.error('Please provide a source name');
      return;
    }

    const isPdfUpload =
      selectedFile !== null && extensionOf(selectedFile.name) === '.pdf';
    const hasPasteText = text.trim().length > 0;

    if (!isPdfUpload && !hasPasteText && !selectedFile) {
      toast.error('Paste text or choose a file to upload');
      return;
    }

    setIsSubmitting(true);

    try {
      let response: Response;

      if (isPdfUpload && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('source', trimmedSource);
        response = await fetch('/api/documents/ingest-file', {
          method: 'POST',
          body: formData,
        });
      } else {
        response = await fetch('/api/documents/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text.trim(),
            source: trimmedSource,
          }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.detail || 'Failed to ingest document');
      }

      toast.success(`Document ingested: ${data.chunk_count} chunk(s) created`);
      resetForm();
      setShowForm(false);
      setPage(1);

      const listResponse = await fetch('/api/documents');
      const listData = await listResponse.json();
      if (listResponse.ok) {
        setDocuments(listData.documents || []);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to ingest document';
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
      <PageHeader
        title="Knowledge Base"
        description={`${documents.length} document${documents.length !== 1 ? 's' : ''} indexed`}
        actions={
          <Button
            onClick={() => {
              if (showForm) {
                resetForm();
              }
              setShowForm(!showForm);
            }}
            className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
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
        }
      />

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
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <Upload className="h-5 w-5" />
              <span className="font-medium">Add New Document</span>
            </div>

            <div className="flex gap-2 rounded-lg border border-white/10 bg-black/20 p-1">
              <button
                type="button"
                onClick={() => setInputMode('paste')}
                disabled={isSubmitting}
                className={cn(
                  'flex-1 rounded-md px-3 py-1.5 text-sm transition-colors cursor-pointer',
                  inputMode === 'paste'
                    ? 'bg-emerald-700/60 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/5',
                )}
              >
                Paste text
              </button>
              <button
                type="button"
                onClick={() => setInputMode('upload')}
                disabled={isSubmitting}
                className={cn(
                  'flex-1 rounded-md px-3 py-1.5 text-sm transition-colors cursor-pointer',
                  inputMode === 'upload'
                    ? 'bg-emerald-700/60 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/5',
                )}
              >
                Upload file
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/70">Source Name</label>
              <Input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g., clinical_trial_results.pdf"
                disabled={isSubmitting}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>

            {inputMode === 'upload' ? (
              <div className="space-y-2">
                <label className="text-sm text-white/70">File</label>
                <Input
                  type="file"
                  accept={ACCEPTED_UPLOAD_TYPES}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    void handleFileChange(e.target.files?.[0] ?? null);
                  }}
                  className="cursor-pointer bg-white/5 border-white/10 text-white file:mr-3 file:rounded-md file:border-0 file:bg-emerald-800/60 file:px-3 file:py-1 file:text-sm file:text-emerald-100"
                />
                <p className="text-xs text-white/40">
                  Supports .txt, .md, .csv, .json, .html, .pdf — max 5 MB
                </p>
                {selectedFile ? (
                  <p className="text-xs text-emerald-300/80">
                    Selected: {selectedFile.name} (
                    {(selectedFile.size / 1024).toFixed(1)} KB)
                    {extensionOf(selectedFile.name) === '.pdf'
                      ? ' — text will be extracted on upload'
                      : ' — preview below, edit before ingesting if needed'}
                  </p>
                ) : null}
                {selectedFile &&
                TEXT_LIKE_EXTENSIONS.has(extensionOf(selectedFile.name)) ? (
                  <div className="space-y-2 pt-2">
                    <label className="text-sm text-white/70">Preview</label>
                    <Textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      disabled={isSubmitting}
                      rows={8}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-y"
                    />
                    <p className="text-xs text-white/40">
                      {text.length.toLocaleString()} characters
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
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
            )}

            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !source.trim() ||
                (inputMode === 'paste'
                  ? !text.trim()
                  : !selectedFile ||
                    (extensionOf(selectedFile.name) !== '.pdf' &&
                      !text.trim()))
              }
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
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
          <PageProgressLoader label="Loading documents" />
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
              className="gap-2 bg-emerald-600 hover:bg-emerald-500 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Your First Document
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              {pagedDocuments.map((group) => {
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

            <AppPagination
              page={page}
              pageCount={pageCount}
              onPageChange={(next) => {
                setPage(next);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              summary={`${groupedDocuments.length} document${groupedDocuments.length !== 1 ? 's' : ''} · ${DOCUMENTS_PAGE_SIZE} per page`}
            />
          </div>
        )}
      </main>
    </div>
  );
}
