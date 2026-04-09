import * as React from 'react';
import { Question } from '@/src/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'motion/react';

interface QuizCardProps {
  key?: React.Key;
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  onAnswer: (optionIndex: number) => void;
}

export function QuizCard({ question, currentIndex, totalQuestions, onAnswer }: QuizCardProps) {
  const [selected, setSelected] = React.useState<string | null>(null);

  const handleSubmit = () => {
    if (selected !== null) {
      onAnswer(parseInt(selected));
      setSelected(null);
    }
  };

  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="mb-6 space-y-2">
        <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
          <span>Question {currentIndex + 1} of {totalQuestions}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="border-2">
        <CardHeader>
          <div className="flex justify-between items-start mb-2">
            <Badge variant="secondary" className="px-3 py-1">
              {question.category}
            </Badge>
          </div>
          <CardTitle className="text-xl md:text-2xl leading-tight">
            {question.question}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selected || ""}
            onValueChange={setSelected}
            className="space-y-3"
          >
            {question.options.map((option, index) => (
              <div
                key={index}
                className={`flex items-center space-x-3 space-y-0 rounded-lg border p-4 transition-colors hover:bg-accent ${
                  selected === index.toString() ? 'border-primary bg-primary/5' : 'border-muted'
                }`}
              >
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label
                  htmlFor={`option-${index}`}
                  className="flex-1 cursor-pointer text-base font-normal leading-normal"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter className="flex justify-end pt-6">
          <Button
            onClick={handleSubmit}
            disabled={selected === null}
            size="lg"
            className="px-8"
          >
            Next Question
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
