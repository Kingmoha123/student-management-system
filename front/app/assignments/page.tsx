"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Sidebar } from "@/components/Sidebar"
import { useAuth } from "@/context/AuthContext"
import { Calendar as CalendarIcon, FilePenLine, Upload, CheckCircle2, Clock, Plus, BookOpen, User, Trash2, HelpCircle } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface Question {
  questionText: string
  type: 'short-answer' | 'multiple-choice'
  options?: string[]
  correctAnswer?: string
  contextPoints?: number
}

interface Assignment {
  _id: string
  title: string
  description: string
  classId: string
  teacherId: {
    firstName: string
    lastName: string
  }
  subject: string
  dueDate: string
  totalPoints: number
  questions: Question[]
  createdAt: string
}

interface Submission {
  _id: string
  assignmentId: string
  studentId: {
    _id?: string
    firstName: string
    lastName: string
  }
  submissionFile?: string
  submissionText?: string
  answers?: { questionText: string, answer: string }[]
  submittedDate: string
  score?: number
  feedback?: string
}

export default function AssignmentsPage() {
  const { user, token } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)

  // Dialog States
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)

  // Forms
  const [assignmentForm, setAssignmentForm] = useState<{
    title: string
    description: string
    subject: string
    dueDate: string
    totalPoints: number
    questions: Question[]
  }>({
    title: "",
    description: "",
    subject: "",
    dueDate: "",
    totalPoints: 100,
    questions: []
  })

  // Local state for adding a new question in the form
  const [newQuestion, setNewQuestion] = useState<{
    text: string
    type: 'short-answer' | 'multiple-choice'
    options: string[]
    correctAnswer: string
  }>({
    text: '',
    type: 'short-answer',
    options: ['', '', '', ''],
    correctAnswer: ''
  })

  const [submissionForm, setSubmissionForm] = useState<{
    submissionText: string,
    submissionFile: string,
    answers: Record<string, string> // Map question index to answer
  }>({
    submissionText: "",
    submissionFile: "",
    answers: {}
  })

  useEffect(() => {
    if (token) {
      fetchClasses()
    }
  }, [token])

  useEffect(() => {
    if (selectedClass && token) {
      fetchAssignments(selectedClass)
    }
  }, [selectedClass, token])

  const fetchClasses = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/classes`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to fetch classes")
      const data = await response.json()
      if (Array.isArray(data)) {
        setClasses(data)
        if (data.length > 0) {
          setSelectedClass(data[0]._id)
        }
      } else {
        setClasses([])
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error)
      toast.error("Failed to fetch classes")
    }
  }

  const fetchAssignments = async (classId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assignments/class/${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to fetch assignments")
      const data = await response.json()
      if (Array.isArray(data)) {
        setAssignments(data)
      } else {
        setAssignments([])
      }
    } catch (error) {
      console.error("Failed to fetch assignments:", error)
      toast.error("Failed to fetch assignments")
    } finally {
      setLoading(false)
    }
  }

  const fetchSubmissions = async (assignmentId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assignments/submissions/${assignmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to fetch submissions")
      const data = await response.json()
      if (Array.isArray(data)) {
        setSubmissions(data)
      } else {
        setSubmissions([])
      }
    } catch (error) {
      console.error("Failed to fetch submissions:", error)
    }
  }

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assignments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...assignmentForm,
          classId: selectedClass,
          teacherId: user?.id,
        }),
      })

      if (response.ok) {
        toast.success("Assignment created!")
        setAssignmentForm({
          title: "",
          description: "",
          subject: "",
          dueDate: "",
          totalPoints: 100,
          questions: []
        })
        setIsCreateDialogOpen(false)
        fetchAssignments(selectedClass)
      } else {
        toast.error("Failed to create assignment")
      }
    } catch (error) {
      console.error("Failed to create assignment:", error)
      toast.error("An error occurred")
    }
  }

  const handleAddQuestionLocal = () => {
    if (!newQuestion.text) return;

    // Validate multiple choice
    if (newQuestion.type === 'multiple-choice') {
      const validOptions = newQuestion.options.filter(o => o.trim() !== '')
      if (validOptions.length < 2) {
        toast.error("Please provide at least 2 options for multiple choice.")
        return
      }
      if (!newQuestion.correctAnswer) {
        toast.error("Please select a correct answer.")
        return
      }
    }

    setAssignmentForm(prev => ({
      ...prev,
      questions: [...prev.questions, {
        questionText: newQuestion.text,
        type: newQuestion.type,
        options: newQuestion.type === 'multiple-choice' ? newQuestion.options.filter(o => o.trim() !== '') : undefined,
        correctAnswer: newQuestion.type === 'multiple-choice' ? newQuestion.correctAnswer : undefined
      }]
    }))
    setNewQuestion({ text: '', type: 'short-answer', options: ['', '', '', ''], correctAnswer: '' })
  }

  const handleRemoveQuestion = (index: number) => {
    setAssignmentForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }))
  }

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAssignment) return

    // Transform answers object to array
    const formattedAnswers = selectedAssignment.questions ? selectedAssignment.questions.map((q, idx) => ({
      questionText: q.questionText,
      answer: submissionForm.answers[idx] || "No answer"
    })) : []

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assignments/submit/${selectedAssignment._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId: user?.id,
          submissionText: submissionForm.submissionText, // Keeping this for backward compatibility or general notes
          answers: formattedAnswers
        }),
      })

      if (response.ok) {
        toast.success("Assignment submitted successfully!")
        setSubmissionForm({ submissionText: "", submissionFile: "", answers: {} })
        setIsSubmitDialogOpen(false)
        fetchSubmissions(selectedAssignment._id)
      } else {
        toast.error("Failed to submit assignment")
      }
    } catch (error) {
      console.error("Failed to submit assignment:", error)
      toast.error("An error occurred")
    }
  }

  const handleViewDetails = (assignment: Assignment) => {
    setSelectedAssignment(assignment)
    setIsDetailsDialogOpen(true)
    fetchSubmissions(assignment._id)
  }

  const getDaysRemaining = (dueDate: string) => {
    const days = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    if (days < 0) return { text: "Overdue", color: "text-red-500", bg: "bg-red-100" };
    if (days === 0) return { text: "Due Today", color: "text-amber-500", bg: "bg-amber-100" };
    return { text: `${days} days left`, color: "text-emerald-500", bg: "bg-emerald-100" };
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background text-foreground">
        <Sidebar />
        <main className="flex-1 ml-64 overflow-y-auto">
          <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Assignments & Quizzes</h1>
                <p className="text-muted-foreground mt-1">Manage class tasks, quizzes, and submissions.</p>
              </div>
              {user?.role === "teacher" && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Create Assignment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Assignment / Quiz</DialogTitle>
                      <DialogDescription>Add a new task or quiz for your students.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateAssignment} className="space-y-4 py-2">
                      {/* Basic Info */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input
                            placeholder="e.g. Algebra Quiz #1"
                            value={assignmentForm.title}
                            onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Subject</Label>
                          <Input
                            placeholder="e.g. Math"
                            value={assignmentForm.subject}
                            onChange={(e) => setAssignmentForm({ ...assignmentForm, subject: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Due Date</Label>
                          <Input
                            type="date"
                            value={assignmentForm.dueDate}
                            onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Total Points</Label>
                          <Input
                            type="number"
                            value={assignmentForm.totalPoints}
                            onChange={(e) => setAssignmentForm({ ...assignmentForm, totalPoints: Number(e.target.value) })}
                            min="0"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Description / Instructions</Label>
                        <Textarea
                          placeholder="General instructions..."
                          value={assignmentForm.description}
                          onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                          rows={2}
                        />
                      </div>

                      {/* Question Builder */}
                      <div className="space-y-4 pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <HelpCircle className="h-4 w-4" /> Questions ({assignmentForm.questions.length})
                          </h3>
                        </div>

                        {/* List of added questions */}
                        <div className="space-y-3">
                          {assignmentForm.questions.length === 0 && <p className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-lg">No questions added yet.</p>}
                          {assignmentForm.questions.map((q, idx) => (
                            <div key={idx} className="relative group bg-muted/30 p-4 rounded-xl border hover:border-primary/50 transition-colors">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-start gap-2">
                                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">{idx + 1}</span>
                                  <div>
                                    <p className="font-semibold text-sm">{q.questionText}</p>
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-background px-1.5 py-0.5 rounded border">{q.type.replace('-', ' ')}</span>
                                  </div>
                                </div>
                                <Button variant="ghost" size="icon" type="button" onClick={() => handleRemoveQuestion(idx)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              {q.options && (
                                <div className="pl-8 space-y-1">
                                  {q.options.map((opt, i) => (
                                    <div key={i} className={`text-xs flex items-center gap-2 ${opt === q.correctAnswer ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}`}>
                                      <div className={`w-2 h-2 rounded-full ${opt === q.correctAnswer ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`}></div>
                                      {opt}
                                      {opt === q.correctAnswer && <CheckCircle2 className="h-3 w-3" />}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Add New Question Input */}
                        <div className="bg-card border p-4 rounded-xl shadow-sm space-y-4">
                          <h4 className="font-medium text-sm flex items-center gap-2 text-muted-foreground">
                            <Plus className="h-4 w-4" /> Add New Question
                          </h4>

                          <div className="space-y-3">
                            <div className="flex gap-3">
                              <div className="flex-1 space-y-1">
                                <Label className="text-xs">Question Text</Label>
                                <Input
                                  className="bg-background"
                                  placeholder="e.g. What is the capital of France?"
                                  value={newQuestion.text}
                                  onChange={e => setNewQuestion({ ...newQuestion, text: e.target.value })}
                                />
                              </div>
                              <div className="w-[160px] space-y-1">
                                <Label className="text-xs">Type</Label>
                                <Select
                                  value={newQuestion.type}
                                  onValueChange={(val: any) => setNewQuestion({ ...newQuestion, type: val })}
                                >
                                  <SelectTrigger className="bg-background">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="short-answer">Short Answer</SelectItem>
                                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {newQuestion.type === 'multiple-choice' && (
                              <div className="space-y-3 bg-muted/30 p-3 rounded-lg animate-in slide-in-from-top-2">
                                <Label className="text-xs font-semibold">Options & Correct Answer</Label>
                                <RadioGroup
                                  value={newQuestion.correctAnswer}
                                  onValueChange={(val) => setNewQuestion(prev => ({ ...prev, correctAnswer: val }))}
                                  className="space-y-2"
                                >
                                  {newQuestion.options.map((opt, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                      <RadioGroupItem value={opt} id={`new-opt-${idx}`} disabled={!opt} />
                                      <div className="flex-1 relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-mono">
                                          {String.fromCharCode(65 + idx)}.
                                        </span>
                                        <Input
                                          className="pl-8 h-9 bg-background focus-visible:ring-offset-0"
                                          placeholder={`Option ${idx + 1}`}
                                          value={opt}
                                          onChange={(e) => {
                                            const newOpts = [...newQuestion.options];
                                            newOpts[idx] = e.target.value;
                                            setNewQuestion(prev => {
                                              const isCorrect = prev.correctAnswer === prev.options[idx];
                                              return {
                                                ...prev,
                                                options: newOpts,
                                                // If currently selected answer is edited, update selection to match new text
                                                correctAnswer: isCorrect ? e.target.value : prev.correctAnswer
                                              }
                                            })
                                          }}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </RadioGroup>
                                <p className="text-[10px] text-muted-foreground text-right">Select the radio button next to the correct answer.</p>
                              </div>
                            )}

                            <Button type="button" onClick={handleAddQuestionLocal} className="w-full">
                              Add Question
                            </Button>
                          </div>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button type="submit" className="w-full">Create Assignment</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className="mb-8 w-full md:w-1/3">
              <Label className="mb-2 block">Filter by Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-12">Loading assignments...</div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/10 border-dashed">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No assignments found</h3>
                <p className="text-muted-foreground">Select a different class or create a new assignment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignments.map((assignment) => {
                  const status = getDaysRemaining(assignment.dueDate);
                  return (
                    <Card key={assignment._id} className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300" onClick={() => handleViewDetails(assignment)}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <Badge variant="outline" className="mb-2">{assignment.subject}</Badge>
                          <Badge variant="secondary" className={`${status.bg} ${status.color} hover:${status.bg}`}>
                            {status.text}
                          </Badge>
                        </div>
                        <CardTitle className="text-xl line-clamp-1">{assignment.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{assignment.description || "No description provided."}</CardDescription>
                        {assignment.questions && assignment.questions.length > 0 && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 w-fit px-2 py-1 rounded">
                            <HelpCircle className="h-3 w-3" /> {assignment.questions.length} Questions
                          </div>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center text-sm text-muted-foreground mb-1">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          Due: {format(new Date(assignment.dueDate), "PPP")}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="mr-2 h-4 w-4" />
                          Points: {assignment.totalPoints}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </main>

        {/* Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedAssignment?.title}</DialogTitle>
              <DialogDescription>
                {selectedAssignment?.subject} • Due {selectedAssignment && format(new Date(selectedAssignment.dueDate), "PPP")}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="details" className="mt-4">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="submissions">Submissions</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="py-4 space-y-4">
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2">Instructions</h4>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedAssignment?.description}</p>
                  {selectedAssignment?.questions && selectedAssignment.questions.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h5 className="font-medium mb-2 text-sm text-muted-foreground">Preview Questions:</h5>
                      <ul className="list-decimal pl-5 space-y-1 text-sm">
                        {selectedAssignment.questions.map((q, i) => (
                          <li key={i}>{q.questionText}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg border">
                  <div>
                    <h4 className="font-semibold">Teacher</h4>
                    <p className="text-sm text-muted-foreground">{selectedAssignment?.teacherId.firstName} {selectedAssignment?.teacherId.lastName}</p>
                  </div>
                  <div className="text-right">
                    <h4 className="font-semibold">Total Points</h4>
                    <p className="text-2xl font-bold text-primary">{selectedAssignment?.totalPoints}</p>
                  </div>
                </div>

                {user?.role === "student" && (
                  <div className="pt-4">
                    {submissions.some(s => s.studentId?._id === user?.id || s.studentId === user?.id) ? (
                      <Button className="w-full bg-muted text-muted-foreground" disabled>
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Submitted
                      </Button>
                    ) : (
                      <Button className="w-full" onClick={() => setIsSubmitDialogOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" /> Start Assignment / Quiz
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="submissions" className="py-4">
                <ScrollArea className="h-[300px] border rounded-md p-4">
                  {submissions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No submissions yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {submissions.map((sub) => (
                        <div key={sub._id} className="flex flex-col border-b pb-4 last:border-0 last:pb-0 gap-2">
                          <div className="flex justify-between w-full">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{sub.studentId.firstName} {sub.studentId.lastName}</span>
                              <span className="text-xs text-muted-foreground">{format(new Date(sub.submittedDate), "PP p")}</span>
                            </div>
                            {sub.score !== undefined && (
                              <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200">
                                Score: {sub.score} / {selectedAssignment?.totalPoints}
                              </Badge>
                            )}
                          </div>

                          {/* Display Answers if available */}
                          {sub.answers && sub.answers.length > 0 ? (
                            <div className="bg-muted/30 p-3 rounded text-sm space-y-2 mt-2">
                              <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Responses:</p>
                              {sub.answers.map((ans, idx) => (
                                <div key={idx} className="grid grid-cols-[20px_1fr] gap-2">
                                  <span className="font-bold text-primary">{idx + 1}.</span>
                                  <div>
                                    <p className="font-medium text-xs opacity-70 mb-0.5">{ans.questionText}</p>
                                    <p>{ans.answer}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm mt-1 italic text-muted-foreground">{sub.submissionText || "File submitted"}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Submit Dialog */}
        <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submit Assignment</DialogTitle>
              <DialogDescription>Complete the tasks/questions below for {selectedAssignment?.title}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitAssignment} className="space-y-6 py-2">

              {selectedAssignment?.questions && selectedAssignment.questions.length > 0 ? (
                // Quiz View
                <div className="space-y-6">
                  {selectedAssignment.questions.map((q, idx) => (
                    <div key={idx} className="space-y-2 bg-muted/20 p-4 rounded-lg border">
                      <Label className="text-base font-semibold flex gap-2">
                        <span>{idx + 1}.</span>
                        <span>{q.questionText}</span>
                      </Label>
                      {q.type === 'multiple-choice' && q.options ? (
                        <RadioGroup
                          onValueChange={(val) => setSubmissionForm(prev => ({
                            ...prev,
                            answers: { ...prev.answers, [idx]: val }
                          }))}
                          className="pt-2"
                        >
                          {q.options.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center space-x-2">
                              <RadioGroupItem value={opt} id={`q${idx}-opt${optIdx}`} />
                              <Label htmlFor={`q${idx}-opt${optIdx}`} className="font-normal cursor-pointer">{opt}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      ) : (
                        <Input
                          placeholder="Your answer..."
                          className="mt-2 bg-background"
                          onChange={(e) => setSubmissionForm(prev => ({
                            ...prev,
                            answers: { ...prev.answers, [idx]: e.target.value }
                          }))}
                        />
                      )}
                    </div>
                  ))}

                  <div className="pt-4 border-t">
                    <Label>Additional Notes (Optional)</Label>
                    <Textarea
                      placeholder="Any extra comments..."
                      className="mt-1"
                      value={submissionForm.submissionText}
                      onChange={(e) => setSubmissionForm({ ...submissionForm, submissionText: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>
              ) : (
                // Classic View
                <>
                  <div className="space-y-2">
                    <Label>Your Work</Label>
                    <Textarea
                      placeholder="Type your answer or paste link..."
                      value={submissionForm.submissionText}
                      onChange={(e) => setSubmissionForm({ ...submissionForm, submissionText: e.target.value })}
                      rows={6}
                      required
                    />
                  </div>
                  {/* File upload visual only for now */}
                  <div className="border-2 border-dashed rounded-lg p-6 text-center text-sm text-muted-foreground cursor-pointer hover:bg-muted/50 transition">
                    <Upload className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p>Drag & drop files here, or click to select</p>
                  </div>
                </>
              )}

              <DialogFooter>
                <Button type="submit" size="lg" className="w-full">Submit Work</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      </div>
    </ProtectedRoute>
  )
}
