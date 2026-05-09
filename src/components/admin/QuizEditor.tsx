import { useState } from 'react';
import { Plus, Trash2, GripVertical, Check, X, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { QuizQuestion, QuizOption, QuizQuestionType } from '@/lib/types';

interface QuizEditorProps {
  questions: QuizQuestion[];
  onChange: (questions: QuizQuestion[]) => void;
}

function generateId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

const QUESTION_TYPES: { value: QuizQuestionType; label: string }[] = [
  { value: 'mcq', label: 'Multiple Choice' },
  { value: 'true-false', label: 'True / False' },
  { value: 'fill-blank', label: 'Fill in the Blank' },
  { value: 'multi-select', label: 'Multi Select' },
];

function createEmptyQuestion(type: QuizQuestionType = 'mcq'): QuizQuestion {
  const base: QuizQuestion = {
    id: generateId(),
    question: '',
    type,
    options: [],
  };

  if (type === 'true-false') {
    base.options = [
      { label: 'True', isCorrect: false },
      { label: 'False', isCorrect: false },
    ];
  } else if (type === 'mcq' || type === 'multi-select') {
    base.options = [
      { label: '', isCorrect: false },
      { label: '', isCorrect: false },
      { label: '', isCorrect: false },
      { label: '', isCorrect: false },
    ];
  } else if (type === 'fill-blank') {
    base.correctAnswer = '';
  }

  return base;
}

function QuestionCard({
  question,
  index,
  onUpdate,
  onDelete,
}: {
  question: QuizQuestion;
  index: number;
  onUpdate: (q: QuizQuestion) => void;
  onDelete: () => void;
}) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const qType = question.type || 'mcq';

  const updateOption = (optIndex: number, updates: Partial<QuizOption>) => {
    const newOptions = [...question.options];
    newOptions[optIndex] = { ...newOptions[optIndex], ...updates };

    // For MCQ: ensure only one option is correct
    if (qType === 'mcq' && updates.isCorrect === true) {
      newOptions.forEach((opt, i) => {
        if (i !== optIndex) opt.isCorrect = false;
      });
    }
    // For true-false: ensure only one is correct
    if (qType === 'true-false' && updates.isCorrect === true) {
      newOptions.forEach((opt, i) => {
        if (i !== optIndex) opt.isCorrect = false;
      });
    }

    onUpdate({ ...question, options: newOptions });
  };

  const addOption = () => {
    onUpdate({
      ...question,
      options: [...question.options, { label: '', isCorrect: false }],
    });
  };

  const removeOption = (optIndex: number) => {
    if (question.options.length <= 2) return;
    const newOptions = question.options.filter((_, i) => i !== optIndex);
    onUpdate({ ...question, options: newOptions });
  };

  const changeType = (newType: QuizQuestionType) => {
    const updated = createEmptyQuestion(newType);
    updated.id = question.id;
    updated.question = question.question;
    onUpdate(updated);
  };

  return (
    <>
      <Card className="border-l-4 border-l-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 cursor-grab" />
              <Badge variant="outline" className="flex-shrink-0">Q{index + 1}</Badge>
              <Select value={qType} onValueChange={(v) => changeType(v as QuizQuestionType)}>
                <SelectTrigger className="h-8 w-40 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => setDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Question Text */}
          <div className="space-y-1.5">
            <Label className="text-xs">Question</Label>
            <Textarea
              value={question.question}
              onChange={e => onUpdate({ ...question, question: e.target.value })}
              placeholder="Enter your question..."
              rows={2}
              className="text-sm"
            />
          </div>

          {/* Options for MCQ, True/False, Multi-Select */}
          {(qType === 'mcq' || qType === 'true-false' || qType === 'multi-select') && (
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                Options
                <span className="text-muted-foreground">
                  ({qType === 'multi-select' ? 'check all correct answers' : 'check the correct answer'})
                </span>
              </Label>
              {question.options.map((opt, optIdx) => (
                <div key={optIdx} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateOption(optIdx, { isCorrect: !opt.isCorrect })}
                    className={`flex-shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      opt.isCorrect
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-muted-foreground/30 hover:border-green-400'
                    }`}
                  >
                    {opt.isCorrect && <Check className="h-3.5 w-3.5" />}
                  </button>
                  {qType === 'true-false' ? (
                    <span className="text-sm font-medium">{opt.label}</span>
                  ) : (
                    <Input
                      value={opt.label}
                      onChange={e => updateOption(optIdx, { label: e.target.value })}
                      placeholder={`Option ${optIdx + 1}`}
                      className="h-8 text-sm flex-1"
                    />
                  )}
                  {qType !== 'true-false' && question.options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0"
                      onClick={() => removeOption(optIdx)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              {qType !== 'true-false' && (
                <Button type="button" variant="outline" size="sm" className="text-xs mt-1" onClick={addOption}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Option
                </Button>
              )}
            </div>
          )}

          {/* Fill-in-the-blank */}
          {qType === 'fill-blank' && (
            <div className="space-y-1.5">
              <Label className="text-xs">Correct Answer</Label>
              <Input
                value={question.correctAnswer || ''}
                onChange={e => onUpdate({ ...question, correctAnswer: e.target.value })}
                placeholder="Enter the correct answer..."
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Case-insensitive comparison will be used for checking answers.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove question {index + 1} from the quiz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function QuizEditor({ questions, onChange }: QuizEditorProps) {
  const [addType, setAddType] = useState<QuizQuestionType>('mcq');

  const addQuestion = () => {
    const newQuestion = createEmptyQuestion(addType);
    onChange([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updated: QuizQuestion) => {
    const newQuestions = [...questions];
    newQuestions[index] = updated;
    onChange(newQuestions);
  };

  const deleteQuestion = (index: number) => {
    onChange(questions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Quiz Questions</h3>
          <Badge variant="secondary">{questions.length}</Badge>
        </div>
      </div>

      {questions.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <HelpCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No quiz questions yet</p>
          <p className="text-muted-foreground text-xs mt-1">Add questions to test reader comprehension</p>
        </div>
      )}

      {questions.map((q, idx) => (
        <QuestionCard
          key={q.id}
          question={q}
          index={idx}
          onUpdate={(updated) => updateQuestion(idx, updated)}
          onDelete={() => deleteQuestion(idx)}
        />
      ))}

      {/* Add Question */}
      <div className="flex items-center gap-2 pt-2">
        <Select value={addType} onValueChange={(v) => setAddType(v as QuizQuestionType)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {QUESTION_TYPES.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" onClick={addQuestion}>
          <Plus className="mr-2 h-4 w-4" />
          Add Question
        </Button>
      </div>
    </div>
  );
}
