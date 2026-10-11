import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CopyButton from './CopyButton';
import { cn } from '@/lib/utils';

function textOf(node) {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(textOf).join('');
  return node?.props?.children ? textOf(node.props.children) : '';
}

// Inverted block (ink background, page text) so it reads in both themes.
function CodeBlock({ children }) {
  return (
    <div className="relative my-3">
      <pre className="overflow-x-auto border-2 border-brutal-line bg-brutal-ink p-3 pr-24 font-mono text-[13px] leading-relaxed text-brutal-bg shadow-[3px_3px_0_var(--color-brutal-accent)] [&_code]:border-0 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit">
        {children}
      </pre>
      <CopyButton text={textOf(children).replace(/\n$/, '')} className="absolute right-2 top-2" />
    </div>
  );
}

const COMPONENTS = {
  h1: ({ node: _node, children, ...props }) => <h4 className="mb-2 mt-4 text-2xl font-heading first:mt-0" {...props}>{children}</h4>,
  h2: ({ node: _node, children, ...props }) => <h5 className="mb-2 mt-4 text-xl font-heading first:mt-0" {...props}>{children}</h5>,
  h3: ({ node: _node, children, ...props }) => <h6 className="mb-2 mt-3 text-lg font-heading first:mt-0" {...props}>{children}</h6>,
  p: ({ node: _node, ...props }) => <p className="mb-3 max-w-prose leading-relaxed last:mb-0" {...props} />,
  ul: ({ node: _node, ...props }) => <ul className="mb-3 list-disc pl-6" {...props} />,
  ol: ({ node: _node, ...props }) => <ol className="mb-3 list-decimal pl-6" {...props} />,
  li: ({ node: _node, ...props }) => <li className="mb-1" {...props} />,
  a: ({ node: _node, ...props }) => (
    <a className="font-semibold underline underline-offset-2" target="_blank" rel="noreferrer" {...props} />
  ),
  code: ({ node: _node, ...props }) => (
    <code className="border border-brutal-line bg-brutal-field px-1 font-mono text-[0.9em]" {...props} />
  ),
  pre: ({ node: _node, children }) => <CodeBlock>{children}</CodeBlock>,
  blockquote: ({ node: _node, ...props }) => <blockquote className="mb-3 border-l-4 border-brutal-pink pl-3" {...props} />,
  table: ({ node: _node, ...props }) => (
    <div className="mb-3 overflow-x-auto">
      <table className="border-collapse text-sm" {...props} />
    </div>
  ),
  th: ({ node: _node, ...props }) => <th className="border-2 border-brutal-line bg-brutal-field px-2 py-1 text-left" {...props} />,
  td: ({ node: _node, ...props }) => <td className="border-2 border-brutal-line px-2 py-1 align-top" {...props} />,
  img: ({ node: _node, alt, ...props }) => (
    <img alt={alt ?? ''} loading="lazy" className="my-2 max-w-full border-2 border-brutal-line" {...props} />
  ),
  hr: () => <hr className="my-4 border-t-2 border-brutal-line" />,
};

// Raw HTML in the source is not rendered (react-markdown's default), so host content cannot inject markup.
export default function Markdown({ children, className }) {
  return (
    <div className={cn('min-w-0 break-words', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
        {children ?? ''}
      </ReactMarkdown>
    </div>
  );
}
