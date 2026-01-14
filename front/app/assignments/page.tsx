"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Sidebar } from "@/components/Sidebar"
import { useAuth } from "@/context/AuthContext"
import { Calendar as CalendarIcon, FilePenLine, Upload, CheckCircle2, Clock, Plus, BookOpen, User } from "lucide-react"
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
  createdAt: string
}

interface Submission {
  _id: string
  assignmentId: string
  studentId: {
    firstName: string
    lastName: string
  }
  submissionFile?: string
  submissionText?: string
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
  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    description: "",
    subject: "",
    dueDate: "",
    totalPoints: 100,
  })
  const [submissionForm, setSubmissionForm] = useState({
    submissionText: "",
    submissionFile: "",
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
        console.error("Fetched classes is not an array:", data)
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
        console.error("Fetched assignments is not an array:", data)
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
        console.error("Fetched submissions is not an array:", data)
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

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAssignment) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assignments/submit/${selectedAssignment._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...submissionForm,
          studentId: user?.id,
        }),
      })

      if (response.ok) {
        toast.success("Assignment submitted successfully!")
        setSubmissionForm({ submissionText: "", submissionFile: "" })
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

  if (user?.role === "parent") {
    // Parent view logic could be added here
    return (
      <ProtectedRoute>
        <div className="flex">
          <Sidebar />
          <main className="flex-1 ml-64 p-8">
            <p className="text-destructive">Access denied for Parents (Not implemented yet).</p>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background text-foreground">
        <Sidebar />
        <main className="flex-1 ml-64 overflow-y-auto">
          <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
                <p className="text-muted-foreground mt-1">Manage class tasks and submissions.</p>
              </div>
              {(user?.role === "admin" || user?.role === "teacher") && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Create Assignment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Assignment</DialogTitle>
                      <DialogDescription>Add a new task for your students.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateAssignment} className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          placeholder="e.g. Algebra Homework #1"
                          value={assignmentForm.title}
                          onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Subject</Label>
                        <Input
                          placeholder="e.g. Mathematics"
                          value={assignmentForm.subject}
                          onChange={(e) => setAssignmentForm({ ...assignmentForm, subject: e.target.value })}
                          required
                        />
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
                          <Label>Points</Label>
                          <Input
                            type="number"
                            value={assignmentForm.totalPoints}
                            onChange={(e) => setAssignmentForm({ ...assignmentForm, totalPoints: Number(e.target.value) })}
                            min="0"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          placeholder="Detailed instructions..."
                          value={assignmentForm.description}
                          onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <DialogFooter>
                        <Button type="submit">Create Assignment</Button>
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
          <DialogContent className="max-w-3xl">
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
                  <p className="text-sm leading-relaxed">{selectedAssignment?.description}</p>
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
                    <Button className="w-full" onClick={() => setIsSubmitDialogOpen(true)}>
                      <Upload className="mr-2 h-4 w-4" /> Submit Assignment
                    </Button>
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
                        <div key={sub._id} className="flex justify-between items-start border-b pb-4 last:border-0 last:pb-0">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{sub.studentId.firstName} {sub.studentId.lastName}</span>
                              <span className="text-xs text-muted-foreground">{format(new Date(sub.submittedDate), "PP p")}</span>
                            </div>
                            <p className="text-sm mt-1">{sub.submissionText}</p>
                            {sub.score !== undefined && (
                              <Badge variant="outline" className="mt-2 text-emerald-600 bg-emerald-50 border-emerald-200">
                                Score: {sub.score} / {selectedAssignment?.totalPoints}
                              </Badge>
                            )}
                          </div>
                          {/* Score Input could go here for teachers */}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Submit Dialog (Nested or Separate) - Separate for cleanliness */}
        <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Assignment</DialogTitle>
              <DialogDescription>Attach your work for {selectedAssignment?.title}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitAssignment} className="space-y-4 py-2">
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
              <DialogFooter>
                <Button type="submit">Submit</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      </div>
    </ProtectedRoute>
  )
}
