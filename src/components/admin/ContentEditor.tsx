import { useState, useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, Code, Type } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';

interface ContentEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}

/**
 * Converts plain English text to styled HTML:
 * - Detects headings (lines ending with :, or ALL CAPS short lines)
 * - Detects bullet points (lines starting with - or *)
 * - Detects numbered lists (lines starting with digits)
 * - Wraps regular paragraphs in <p> tags
 * - Handles bold (**text**) and italic (*text*)
 * - Preserves existing HTML
 */
export function plainTextToHtml(text: string): string {
  if (!text.trim()) return '';

  // If text already contains HTML tags, return as-is
  if (/<[a-z][\s\S]*>/i.test(text)) {
    return text;
  }

  const lines = text.split('\n');
  const htmlParts: string[] = [];
  let inList: 'ul' | 'ol' | null = null;

  const processInline = (line: string): string => {
    // Bold: **text** or __text__
    line = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    line = line.replace(/__(.+?)__/g, '<strong>$1</strong>');
    // Italic: *text* or _text_ (but not inside bold)
    line = line.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
    line = line.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>');
    return line;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      // Close any open list
      if (inList) {
        htmlParts.push(inList === 'ul' ? '</ul>' : '</ol>');
        inList = null;
      }
      continue;
    }

    // Detect headings: lines starting with #
    if (line.startsWith('# ')) {
      if (inList) { htmlParts.push(inList === 'ul' ? '</ul>' : '</ol>'); inList = null; }
      htmlParts.push(`<h2>${processInline(line.substring(2))}</h2>`);
      continue;
    }
    if (line.startsWith('## ')) {
      if (inList) { htmlParts.push(inList === 'ul' ? '</ul>' : '</ol>'); inList = null; }
      htmlParts.push(`<h3>${processInline(line.substring(3))}</h3>`);
      continue;
    }
    if (line.startsWith('### ')) {
      if (inList) { htmlParts.push(inList === 'ul' ? '</ul>' : '</ol>'); inList = null; }
      htmlParts.push(`<h4>${processInline(line.substring(4))}</h4>`);
      continue;
    }

    // Detect heading: SHORT line ending with colon
    if (line.endsWith(':') && line.length < 60 && !line.startsWith('-') && !line.startsWith('*')) {
      if (inList) { htmlParts.push(inList === 'ul' ? '</ul>' : '</ol>'); inList = null; }
      htmlParts.push(`<h3>${processInline(line.slice(0, -1))}</h3>`);
      continue;
    }

    // Detect heading: ALL CAPS short line
    if (line === line.toUpperCase() && line.length < 50 && /[A-Z]/.test(line) && !/^\d/.test(line)) {
      if (inList) { htmlParts.push(inList === 'ul' ? '</ul>' : '</ol>'); inList = null; }
      htmlParts.push(`<h3>${processInline(line.charAt(0) + line.slice(1).toLowerCase())}</h3>`);
      continue;
    }

    // Detect bullet lists
    const bulletMatch = line.match(/^[-*•]\s+(.+)/);
    if (bulletMatch) {
      if (inList !== 'ul') {
        if (inList) htmlParts.push('</ol>');
        htmlParts.push('<ul>');
        inList = 'ul';
      }
      htmlParts.push(`<li>${processInline(bulletMatch[1])}</li>`);
      continue;
    }

    // Detect numbered lists
    const numberMatch = line.match(/^\d+[.)]\s+(.+)/);
    if (numberMatch) {
      if (inList !== 'ol') {
        if (inList) htmlParts.push('</ul>');
        htmlParts.push('<ol>');
        inList = 'ol';
      }
      htmlParts.push(`<li>${processInline(numberMatch[1])}</li>`);
      continue;
    }

    // Regular paragraph
    if (inList) {
      htmlParts.push(inList === 'ul' ? '</ul>' : '</ol>');
      inList = null;
    }
    htmlParts.push(`<p>${processInline(line)}</p>`);
  }

  // Close any open list
  if (inList) {
    htmlParts.push(inList === 'ul' ? '</ul>' : '</ol>');
  }

  return htmlParts.join('\n');
}

export function ContentEditor({
  value,
  onChange,
  label = 'Content',
  placeholder = 'Write your content here...',
  required = false,
  rows = 15,
}: ContentEditorProps) {
  const [mode, setMode] = useState<'visual' | 'html' | 'preview'>('visual');

  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image'],
      ['clean']
    ],
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image'
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label} {required && '*'}</Label>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          <Button
            type="button"
            variant={mode === 'visual' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setMode('visual')}
          >
            <Type className="h-3 w-3" />
            Visual
          </Button>
          <Button
            type="button"
            variant={mode === 'html' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setMode('html')}
          >
            <Code className="h-3 w-3" />
            HTML
          </Button>
          <Button
            type="button"
            variant={mode === 'preview' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setMode('preview')}
          >
            <Eye className="h-3 w-3" />
            Preview
          </Button>
        </div>
      </div>

      {mode === 'visual' && (
        <div className="bg-background rounded-md border min-h-[400px] flex flex-col">
          <ReactQuill 
            theme="snow"
            value={value || ''}
            onChange={onChange}
            modules={modules}
            formats={formats}
            placeholder={placeholder}
            className="flex-1 flex flex-col"
          />
          <style>{`
            .quill { display: flex; flex-direction: column; }
            .ql-container { flex: 1; min-h: 300px; font-size: 16px; }
            .ql-editor { min-h: 300px; }
            .ql-toolbar { border-top: none; border-left: none; border-right: none; border-bottom: 1px solid hsl(var(--border)); }
          `}</style>
        </div>
      )}

      {mode === 'html' && (
        <>
          <Textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="<p>Your HTML content here...</p>"
            rows={rows}
            required={required}
            className="font-mono text-sm min-h-[400px]"
          />
          <p className="text-xs text-muted-foreground">
            Direct HTML editing mode. Use HTML tags for formatting.
          </p>
        </>
      )}

      {mode === 'preview' && (
        <div
          className={cn(
            'border rounded-lg p-4 min-h-[400px] prose prose-sm max-w-none dark:prose-invert',
            'prose-headings:font-bold prose-h2:text-xl prose-h3:text-lg prose-h4:text-base',
            'prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5',
          )}
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(value.includes('<') ? value : plainTextToHtml(value)),
          }}
        />
      )}
    </div>
  );
}
