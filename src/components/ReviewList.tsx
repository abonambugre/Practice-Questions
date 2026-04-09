import * as React from 'react';
import { Question, UserAnswer } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, XCircle, Info, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { getExplanation } from '@/src/lib/gemini';
import { Button } from '@/components/ui/button';

interface ReviewListProps {
  questions: Question[];
  userAnswers: UserAnswer[];
}

export function ReviewList({ questions, userAnswers }: ReviewListProps) {
  const score = userAnswers.filter(a => a.isCorrect).length;
  const percentage = Math.round((score / questions.length) * 100);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 pb-12">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Quiz Results</CardTitle>
          <div className="mt-4 flex justify-center items-baseline gap-2">
            <span className="text-6xl font-black">{score}</span>
            <span className="text-2xl opacity-80">/ {questions.length}</span>
          </div>
          <p className="mt-2 text-xl font-medium opacity-90">
            {percentage}% Correct
          </p>
        </CardHeader>
      </Card>

      <div className="space-y-6">
        <h3 className="text-2xl font-bold tracking-tight">Question Review</h3>
        {questions.map((question, index) => {
          const answer = userAnswers.find(a => a.questionId === question.id);
          const isCorrect = answer?.isCorrect;

          return (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <Badge variant="outline" className="mb-2">
                        {question.category}
                      </Badge>
                      <CardTitle className="text-lg leading-snug">
                        {index + 1}. {question.question}
                      </CardTitle>
                    </div>
                    {isCorrect ? (
                      <CheckCircle2 className="text-green-500 shrink-0" size={24} />
                    ) : (
                      <XCircle className="text-red-500 shrink-0" size={24} />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    {question.options.map((option, optIndex) => {
                      const isSelected = answer?.selectedOption === optIndex;
                      const isCorrectOpt = question.correctAnswer === optIndex;

                      let bgColor = "bg-transparent";
                      let textColor = "text-foreground";
                      let borderColor = "border-muted";

                      if (isCorrectOpt) {
                        bgColor = "bg-green-50";
                        borderColor = "border-green-200";
                        textColor = "text-green-900";
                      } else if (isSelected && !isCorrect) {
                        bgColor = "bg-red-50";
                        borderColor = "border-red-200";
                        textColor = "text-red-900";
                      }

                      return (
                        <div
                          key={optIndex}
                          className={`p-3 rounded-md border text-sm flex justify-between items-center ${bgColor} ${borderColor} ${textColor}`}
                        >
                          <span>{option}</span>
                          {isCorrectOpt && <CheckCircle2 size={16} className="text-green-600" />}
                          {isSelected && !isCorrect && <XCircle size={16} className="text-red-600" />}
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                      <Info size={16} />
                      <span>Explanation</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {question.explanation}
                    </p>
                  </div>
                  
                  <AIExtendedExplanation 
                    question={question.question}
                    correctAnswer={question.options[question.correctAnswer]}
                    userAnswer={question.options[answer?.selectedOption ?? 0]}
                    isCorrect={isCorrect ?? false}
                  />
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function AIExtendedExplanation({ question, correctAnswer, userAnswer, isCorrect }: { 
  question: string, 
  correctAnswer: string, 
  userAnswer: string,
  isCorrect: boolean 
}) {
  const [explanation, setExplanation] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleGetAIHelp = async () => {
    setLoading(true);
    const result = await getExplanation(question, correctAnswer, userAnswer);
    setExplanation(result);
    setLoading(false);
  };

  return (
    <div className="pt-2">
      {!explanation ? (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleGetAIHelp}
          disabled={loading}
          className="text-xs gap-2 text-primary hover:text-primary hover:bg-primary/10"
        >
          <Sparkles size={14} />
          {loading ? "Thinking..." : "Get AI Explanation"}
        </Button>
      ) : (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-primary/5 border border-primary/20 p-4 rounded-lg mt-2"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-primary mb-2 uppercase tracking-wider">
            <Sparkles size={14} />
            <span>AI Tutor Insights</span>
          </div>
          <p className="text-sm text-foreground italic leading-relaxed">
            "{explanation}"
          </p>
        </motion.div>
      )}
    </div>
  );
}
