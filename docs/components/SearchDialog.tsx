import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { search, searchEntries } from '../data/search';
import type { SearchEntry } from '../data/search';

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORY_ORDER: SearchEntry['category'][] = ['Pages', 'Recipes', 'Components', 'Operators'];

function groupByCategory(results: SearchEntry[]): { category: SearchEntry['category']; items: SearchEntry[] }[] {
  const groups = new Map<SearchEntry['category'], SearchEntry[]>();
  for (const r of results) {
    if (!groups.has(r.category)) groups.set(r.category, []);
    groups.get(r.category)!.push(r);
  }
  return CATEGORY_ORDER.filter((c) => groups.has(c)).map((category) => ({ category, items: groups.get(category)! }));
}

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => search(searchEntries, query), [query]);
  const flatResults = results;
  const grouped = useMemo(() => groupByCategory(results), [results]);
  const maxIndex = flatResults.length - 1;

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLButtonElement>(`[data-idx="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  if (!open) return null;

  const go = (entry: SearchEntry | undefined) => {
    if (!entry) return;
    onClose();
    window.location.href = entry.href;
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (maxIndex <= 0 ? 0 : (i + 1) % (maxIndex + 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (maxIndex <= 0 ? 0 : (i - 1 + maxIndex + 1) % (maxIndex + 1)));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(flatResults[activeIndex]);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      setActiveIndex((i) => (maxIndex <= 0 ? 0 : e.shiftKey ? (i - 1 + maxIndex + 1) % (maxIndex + 1) : (i + 1) % (maxIndex + 1)));
    }
  };

  let runningIdx = -1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh] sm:pt-[15vh]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-night/80 backdrop-blur-sm" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search documentation"
        className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-white/10 bg-night shadow-2xl shadow-black/50"
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4">
          <svg
            className="h-5 w-5 shrink-0 text-cloud/50"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search docs, recipes, packages, operators…"
            className="w-full bg-transparent py-4 text-base text-peak placeholder:text-cloud/40 focus:outline-none"
            autoComplete="off"
            spellCheck={false}
            aria-label="Search query"
          />
          <button
            onClick={onClose}
            className="rounded border border-white/10 px-2 py-0.5 font-mono text-xs text-cloud/60 hover:text-peak transition-colors"
            aria-label="Close search"
          >
            Esc
          </button>
        </div>

        <div ref={listRef} className="max-h-[55vh] overflow-y-auto p-2">
          {flatResults.length === 0 ? (
            <div className="px-3 py-10 text-center text-sm text-cloud/50">
              No results for “<span className="text-cloud/80">{query}</span>”.
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.category} className="mb-2">
                <div className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-cloud/40">
                  {group.category}
                </div>
                {group.items.map((entry) => {
                  runningIdx += 1;
                  const idx = runningIdx;
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={`${entry.category}-${entry.href}-${idx}`}
                      data-idx={idx}
                      onMouseMove={() => setActiveIndex(idx)}
                      onClick={() => go(entry)}
                      className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                        isActive ? 'bg-moss/10 text-peak' : 'text-cloud/80 hover:bg-white/5'
                      }`}
                    >
                      <span className="min-w-0">
                        <span className={`block truncate text-sm ${isActive ? 'text-peak' : 'text-peak/90'}`}>
                          {entry.title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-cloud/50">
                          {entry.description}
                        </span>
                      </span>
                      <span className="hidden shrink-0 font-mono text-xs text-cloud/40 sm:block">
                        {entry.href}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-4 py-2 text-xs text-cloud/40">
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono">↑</kbd> <kbd className="font-mono">↓</kbd> navigate</span>
            <span><kbd className="font-mono">↵</kbd> select</span>
            <span><kbd className="font-mono">Esc</kbd> close</span>
          </div>
          <span className="text-cloud/30">{flatResults.length} results</span>
        </div>
      </div>
    </div>
  );
}
