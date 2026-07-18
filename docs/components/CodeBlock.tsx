import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import type { CSSProperties } from 'react';

// Custom theme matching Berget AI's dark design
const customTheme = {
  'code[class*="language-"]': {
    color: '#E5DDD5',
    background: 'none',
    fontFamily: '"DM Mono", monospace',
    fontSize: '0.875rem',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.5',
    tabSize: 2,
    hyphens: 'none',
  } as CSSProperties,
  'pre[class*="language-"]': {
    color: '#E5DDD5',
    background: '#1A1A1A',
    fontFamily: '"DM Mono", monospace',
    fontSize: '0.875rem',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.5',
    tabSize: 2,
    hyphens: 'none',
    padding: '1rem',
    margin: '0',
    overflow: 'auto',
    borderRadius: '0.5rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  } as CSSProperties,
  'comment': { color: '#6B7280', fontStyle: 'italic' } as CSSProperties,
  'prolog': { color: '#6B7280' } as CSSProperties,
  'doctype': { color: '#6B7280' } as CSSProperties,
  'cdata': { color: '#6B7280' } as CSSProperties,
  'punctuation': { color: '#9CA3AF' } as CSSProperties,
  'property': { color: '#74C69D' } as CSSProperties,
  'tag': { color: '#52B788' } as CSSProperties,
  'boolean': { color: '#CFFF8B' } as CSSProperties,
  'number': { color: '#CFFF8B' } as CSSProperties,
  'constant': { color: '#74C69D' } as CSSProperties,
  'symbol': { color: '#74C69D' } as CSSProperties,
  'deleted': { color: '#D1392E' } as CSSProperties,
  'selector': { color: '#52B788' } as CSSProperties,
  'attr-name': { color: '#CFFF8B' } as CSSProperties,
  'string': { color: '#CFFF8B' } as CSSProperties,
  'char': { color: '#CFFF8B' } as CSSProperties,
  'builtin': { color: '#74C69D' } as CSSProperties,
  'inserted': { color: '#52B788' } as CSSProperties,
  'operator': { color: '#9CA3AF' } as CSSProperties,
  'entity': { color: '#52B788', cursor: 'help' } as CSSProperties,
  'url': { color: '#E5DDD5' } as CSSProperties,
  '.language-css .token.string': { color: '#E5DDD5' } as CSSProperties,
  '.style .token.string': { color: '#E5DDD5' } as CSSProperties,
  'variable': { color: '#E5DDD5' } as CSSProperties,
  'atrule': { color: '#3975D6' } as CSSProperties,
  'attr-value': { color: '#CFFF8B' } as CSSProperties,
  'function': { color: '#52B788' } as CSSProperties,
  'class-name': { color: '#74C69D' } as CSSProperties,
  'keyword': { color: '#3975D6' } as CSSProperties,
  'regex': { color: '#CFFF8B' } as CSSProperties,
  'important': { color: '#3975D6', fontWeight: 'bold' } as CSSProperties,
  'bold': { fontWeight: 'bold' } as CSSProperties,
  'italic': { fontStyle: 'italic' } as CSSProperties,
};

interface CodeBlockProps {
  code: string;
  yaml?: string;
  language?: string;
}

export function CodeBlock({ code, yaml, language = 'tsx' }: CodeBlockProps) {
  const [showYaml, setShowYaml] = useState(false);
  const hasYaml = yaml && yaml.length > 0;

  return (
    <div className="rounded-lg border border-white/10 overflow-hidden">
      {hasYaml && (
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setShowYaml(false)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              !showYaml
                ? 'text-moss border-b-2 border-moss'
                : 'text-cloud/60 hover:text-cloud/80'
            }`}
          >
            TSX
          </button>
          <button
            onClick={() => setShowYaml(true)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              showYaml
                ? 'text-moss border-b-2 border-moss'
                : 'text-cloud/60 hover:text-cloud/80'
            }`}
          >
            YAML Output
          </button>
        </div>
      )}
      <SyntaxHighlighter
        language={showYaml ? 'yaml' : language}
        style={customTheme}
        customStyle={{
          margin: 0,
          padding: '1rem',
          background: '#1A1A1A',
          borderRadius: hasYaml ? '0' : '0.5rem',
          fontSize: '0.875rem',
          lineHeight: '1.5',
        }}
      >
        {showYaml ? yaml! : code}
      </SyntaxHighlighter>
    </div>
  );
}
