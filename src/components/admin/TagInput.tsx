import { useState, useRef, useEffect } from 'react';
import { X, Plus, Tag as TagIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TagItem {
  name: string;
  type: 'major' | 'minor';
}

interface TagInputProps {
  selectedTags: TagItem[];
  onChange: (tags: TagItem[]) => void;
  suggestedMajor?: string[];
  suggestedMinor?: string[];
  label?: string;
  /** If true, only allow a single tag (for module/video head tag) */
  singleTag?: boolean;
}

const DEFAULT_MAJOR = ['Markets', 'Investing', 'Fintech', 'Planning', 'Economy'];
const DEFAULT_MINOR = ['Analysis', 'Weekly', 'Beginners', 'Career', 'Banking', 'Tax', 'Trends', 'Deep Dive'];

/** Normalize tag name: trim, title-case */
function normalizeTag(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/** Case-insensitive check if tag exists in list */
function tagExists(tags: TagItem[], name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return tags.some(t => t.name.toLowerCase() === normalized);
}

export function TagInput({
  selectedTags,
  onChange,
  suggestedMajor = DEFAULT_MAJOR,
  suggestedMinor = DEFAULT_MINOR,
  label = 'Tags',
  singleTag = false,
}: TagInputProps) {
  const [newTagName, setNewTagName] = useState('');
  const [newTagType, setNewTagType] = useState<'major' | 'minor'>('major');
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);

  const toggleTag = (tagName: string, type: 'major' | 'minor') => {
    if (singleTag) {
      // For single-tag mode, replace the current tag
      const exists = selectedTags.length > 0 && selectedTags[0].name.toLowerCase() === tagName.toLowerCase();
      if (exists) {
        onChange([]);
      } else {
        onChange([{ name: normalizeTag(tagName), type }]);
      }
      return;
    }

    const exists = tagExists(selectedTags, tagName);
    if (exists) {
      onChange(selectedTags.filter(t => t.name.toLowerCase() !== tagName.toLowerCase()));
    } else {
      onChange([...selectedTags, { name: normalizeTag(tagName), type }]);
    }
  };

  const addCustomTag = () => {
    if (!newTagName.trim()) return;
    const normalized = normalizeTag(newTagName);
    if (tagExists(selectedTags, normalized)) {
      setNewTagName('');
      return;
    }

    if (singleTag) {
      onChange([{ name: normalized, type: newTagType }]);
    } else {
      onChange([...selectedTags, { name: normalized, type: newTagType }]);
    }
    setNewTagName('');
    setShowInput(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomTag();
    }
    if (e.key === 'Escape') {
      setShowInput(false);
      setNewTagName('');
    }
  };

  const removeTag = (tagName: string) => {
    onChange(selectedTags.filter(t => t.name.toLowerCase() !== tagName.toLowerCase()));
  };

  // Combine suggested + custom tags that are already selected
  const allMajorSuggestions = [...new Set([
    ...suggestedMajor,
    ...selectedTags.filter(t => t.type === 'major' && !suggestedMajor.some(s => s.toLowerCase() === t.name.toLowerCase())).map(t => t.name),
  ])];

  const allMinorSuggestions = [...new Set([
    ...suggestedMinor,
    ...selectedTags.filter(t => t.type === 'minor' && !suggestedMinor.some(s => s.toLowerCase() === t.name.toLowerCase())).map(t => t.name),
  ])];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowInput(!showInput)}
          className="text-xs"
        >
          <Plus className="mr-1 h-3 w-3" />
          Custom Tag
        </Button>
      </div>

      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-muted/50 rounded-lg">
          {selectedTags.map(tag => (
            <Badge
              key={tag.name}
              variant={tag.type === 'major' ? 'default' : 'secondary'}
              className="gap-1 pr-1"
            >
              {tag.name}
              <button
                type="button"
                onClick={() => removeTag(tag.name)}
                className="ml-0.5 rounded-full hover:bg-foreground/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Custom Tag Input */}
      {showInput && (
        <div className="flex items-center gap-2 p-3 border rounded-lg bg-background">
          <TagIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Input
            ref={inputRef}
            value={newTagName}
            onChange={e => setNewTagName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type tag name..."
            className="h-8 text-sm flex-1"
          />
          <Select value={newTagType} onValueChange={v => setNewTagType(v as 'major' | 'minor')}>
            <SelectTrigger className="h-8 w-24 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="major">Major</SelectItem>
              <SelectItem value="minor">Minor</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" size="sm" className="h-8" onClick={addCustomTag}>
            Add
          </Button>
        </div>
      )}

      {/* Major Tags */}
      {!singleTag && (
        <>
          <div>
            <Label className="mb-2 block text-xs text-muted-foreground">Major Tags</Label>
            <div className="flex flex-wrap gap-1.5">
              {allMajorSuggestions.map(tag => {
                const isSelected = tagExists(selectedTags, tag);
                return (
                  <Badge
                    key={tag}
                    variant={isSelected ? 'default' : 'outline'}
                    className="cursor-pointer transition-all hover:scale-105"
                    onClick={() => toggleTag(tag, 'major')}
                  >
                    {tag}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="mb-2 block text-xs text-muted-foreground">Minor Tags</Label>
            <div className="flex flex-wrap gap-1.5">
              {allMinorSuggestions.map(tag => {
                const isSelected = tagExists(selectedTags, tag);
                return (
                  <Badge
                    key={tag}
                    variant={isSelected ? 'secondary' : 'outline'}
                    className="cursor-pointer transition-all hover:scale-105"
                    onClick={() => toggleTag(tag, 'minor')}
                  >
                    {tag}
                  </Badge>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Single-tag mode: show suggestions inline */}
      {singleTag && (
        <div>
          <Label className="mb-2 block text-xs text-muted-foreground">Suggested Tags</Label>
          <div className="flex flex-wrap gap-1.5">
            {[...allMajorSuggestions, ...allMinorSuggestions].map(tag => {
              const isSelected = tagExists(selectedTags, tag);
              const type = suggestedMajor.some(s => s.toLowerCase() === tag.toLowerCase()) ? 'major' : 'minor';
              return (
                <Badge
                  key={tag}
                  variant={isSelected ? 'default' : 'outline'}
                  className="cursor-pointer transition-all hover:scale-105"
                  onClick={() => toggleTag(tag, type as 'major' | 'minor')}
                >
                  {tag}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
