import * as React from 'react';
import { QuizState, UserAnswer, Question } from './types';
import { generateQuestions, getExplanation } from './lib/gemini';
import { auth, db } from './lib/firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { QuizCard } from './components/QuizCard';
import { ReviewList } from './components/ReviewList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, RefreshCw, GraduationCap, ArrowRight, History, LogIn, LogOut, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [state, setState] = React.useState<QuizState>('idle');
  const [selectedCore, setSelectedCore] = React.useState<1 | 2 | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [userAnswers, setUserAnswers] = React.useState<UserAnswer[]>([]);
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [user, setUser] = React.useState<User | null>(null);
  const [history, setHistory] = React.useState<any[]>([]);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) fetchHistory(u.uid);
    });
    return () => unsubscribe();
  }, []);

  const fetchHistory = async (uid: string) => {
    try {
      const q = query(
        collection(db, 'users', uid, 'attempts'),
        orderBy('timestamp', 'desc'),
        limit(5)
      );
      const snapshot = await getDocs(q);
      setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
      console.error("Error fetching history:", e);
    }
  };

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = () => auth.signOut();

  const startQuiz = async (core: 1 | 2) => {
    setLoading(true);
    setSelectedCore(core);
    try {
      const newQuestions = await generateQuestions(core, 15);
      setQuestions(newQuestions);
      setState('quiz');
      setCurrentQuestionIndex(0);
      setUserAnswers([]);
    } catch (e) {
      console.error("Failed to generate questions:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (selectedOption: number) => {
    const question = questions[currentQuestionIndex];
    const isCorrect = selectedOption === question.correctAnswer;
    
    const newAnswer: UserAnswer = {
      questionId: question.id,
      selectedOption,
      isCorrect,
    };

    const updatedAnswers = [...userAnswers, newAnswer];
    setUserAnswers(updatedAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setState('review');
      if (user) {
        await saveAttempt(updatedAnswers);
        fetchHistory(user.uid);
      }
    }
  };

  const saveAttempt = async (answers: UserAnswer[]) => {
    if (!user || !selectedCore) return;
    const score = answers.filter(a => a.isCorrect).length;
    try {
      await addDoc(collection(db, 'users', user.uid, 'attempts'), {
        userId: user.uid,
        core: selectedCore,
        score,
        total: questions.length,
        timestamp: serverTimestamp(),
        answers: answers
      });
    } catch (e) {
      console.error("Error saving attempt:", e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary/20">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
              <GraduationCap size={20} />
            </div>
            <span>CompTIA A+ <span className="text-primary">Study Buddy</span></span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium hidden sm:inline-block">{user.displayName}</span>
                <Button variant="outline" size="sm" onClick={logout} className="gap-2">
                  <LogOut size={16} />
                  Logout
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={login} className="gap-2">
                <LogIn size={16} />
                Login
              </Button>
            )}
            {state !== 'idle' && (
              <Button variant="ghost" size="sm" onClick={() => setState('idle')} className="gap-2">
                <RefreshCw size={16} />
                Reset
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12">
        <AnimatePresence mode="wait">
          {state === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl mx-auto"
            >
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                  <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.1]">
                    Master the <span className="text-primary">CompTIA A+</span> Exam.
                  </h1>
                  <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
                    Choose your focus area and test your knowledge with our curated practice questions.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card 
                      className={`cursor-pointer hover:border-primary transition-all hover:shadow-lg group ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                      onClick={() => startQuiz(1)}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          Core 1
                          {loading && selectedCore === 1 ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight className="opacity-0 group-hover:opacity-100 transition-opacity" size={20} />}
                        </CardTitle>
                        <CardDescription>220-1101: Hardware, Networking, & Cloud</CardDescription>
                      </CardHeader>
                    </Card>
                    <Card 
                      className={`cursor-pointer hover:border-primary transition-all hover:shadow-lg group ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                      onClick={() => startQuiz(2)}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          Core 2
                          {loading && selectedCore === 2 ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight className="opacity-0 group-hover:opacity-100 transition-opacity" size={20} />}
                        </CardTitle>
                        <CardDescription>220-1102: OS, Security, & Procedures</CardDescription>
                      </CardHeader>
                    </Card>
                  </div>

                  {user && history.length > 0 && (
                    <div className="pt-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                        <History size={14} />
                        <span>Recent Attempts</span>
                      </div>
                      <div className="space-y-2">
                        {history.map((attempt) => (
                          <div key={attempt.id} className="flex items-center justify-between p-3 rounded-lg bg-white border text-sm">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${attempt.core === 1 ? 'bg-blue-500' : 'bg-purple-500'}`} />
                              <span className="font-medium">Core {attempt.core}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-muted-foreground">{new Date(attempt.timestamp?.toDate()).toLocaleDateString()}</span>
                              <span className="font-bold">{attempt.score}/{attempt.total}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-6 pt-4">
                    <div className="flex -space-x-3">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                          <img 
                            src={`https://picsum.photos/seed/user${i}/100/100`} 
                            alt="User" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Joined by <span className="text-foreground font-bold">2,400+</span> students this week
                    </p>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute -inset-4 bg-primary/10 rounded-[2rem] blur-3xl -z-10" />
                  <Card className="border-2 shadow-2xl rounded-[2rem] overflow-hidden">
                    <div className="bg-slate-900 p-6 text-white">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                      </div>
                      <div className="space-y-3 font-mono text-sm opacity-80">
                        <p className="text-primary">$ comptia-a-plus --select-core</p>
                        <p>1) 220-1101 (Core 1)</p>
                        <p>2) 220-1102 (Core 2)</p>
                        <p className="text-green-400">Select an option to begin_</p>
                      </div>
                    </div>
                    <CardHeader>
                      <CardTitle>Dual Core Coverage</CardTitle>
                      <CardDescription>Comprehensive practice for both A+ exams.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                          <BookOpen size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-sm">Core 1 Specialist</p>
                          <p className="text-xs text-muted-foreground">Hardware focus</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                          <RefreshCw size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-sm">Core 2 Specialist</p>
                          <p className="text-xs text-muted-foreground">Software & Security focus</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}

          {state === 'quiz' && questions.length > 0 && (
            <QuizCard
              key={questions[currentQuestionIndex].id}
              question={questions[currentQuestionIndex]}
              currentIndex={currentQuestionIndex}
              totalQuestions={questions.length}
              onAnswer={handleAnswer}
            />
          )}

          {state === 'review' && (
            <div key="review" className="space-y-8">
              <div className="flex justify-between items-center max-w-3xl mx-auto">
                <div className="space-y-1">
                  <h2 className="text-3xl font-bold tracking-tight">Review Your Answers</h2>
                  <p className="text-muted-foreground">Core {selectedCore} Practice Results</p>
                  {!user && (
                    <p className="text-xs text-amber-600 font-medium">
                      Login to save your progress and track historical attempts.
                    </p>
                  )}
                </div>
                <Button onClick={() => startQuiz(selectedCore!)} variant="outline" className="gap-2" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                  Retake Core {selectedCore}
                </Button>
              </div>
              <ReviewList
                questions={questions}
                userAnswers={userAnswers}
              />
            </div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t py-12 bg-white">
        <div className="container mx-auto px-4 text-center space-y-4">
          <div className="flex justify-center items-center gap-2 font-bold text-lg opacity-50">
            <GraduationCap size={20} />
            <span>Study Buddy</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built for students, by experts. Good luck on your A+ journey!
          </p>
        </div>
      </footer>
    </div>
  );
}
