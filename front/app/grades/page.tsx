"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Sidebar } from "@/components/Sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Plus, Search, FileText, Pencil, Trash2 } from "lucide-react"

interface Grade {
  _id: string
  studentId: {
    _id: string
    firstName: string
    lastName: string
    enrollmentNumber: string
  }
  subject: string
  assignmentScore: number
  examScore: number
  projectScore: number
  overallScore: number
  grade: string
  academicTerm: string
}

export default function GradesPage() {
  const { user, token } = useAuth()
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState<any[]>([])

  // Filter State
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedStudent, setSelectedStudent] = useState<string>("")
  const [students, setStudents] = useState<any[]>([]) // Students of selected class

  // Form State
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false)
  const [editingGradeId, setEditingGradeId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    studentId: "",
    classId: "",
    subject: "",
    assignmentScore: 0,
    examScore: 0,
    projectScore: 0,
    academicTerm: "",
    grade: "",
    comments: "",
  })

  // Students list for the form (might differ from filter if we allow recording for any class)
  // For simplicity, we'll use the selectedClass from filter or require class selection in form.
  // Let's require class selection in form independently or pre-fill.
  const [formClass, setFormClass] = useState("")
  const [formStudents, setFormStudents] = useState<any[]>([])

  useEffect(() => {
    if (token) {
      if (user?.role === "student") {
        fetchMyGrades()
      } else {
        fetchClasses()
      }
    }
  }, [token, user])

  useEffect(() => {
    if (selectedClass && token) {
      fetchStudentsForClass(selectedClass, setStudents)
      setGrades([])
    }
  }, [selectedClass, token])

  useEffect(() => {
    if (selectedStudent && token) {
      fetchStudentGrades(selectedStudent)
    }
  }, [selectedStudent, token])

  useEffect(() => {
    if (formClass && token) {
      fetchStudentsForClass(formClass, setFormStudents)
    }
  }, [formClass, token])

  const fetchMyGrades = async () => {
    setLoading(true)
    try {
      // 1. Find my Student Profile
      const studentsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!studentsRes.ok) throw new Error("Failed to fetch students")

      const studentsData = await studentsRes.json()
      const myProfile = studentsData.find((s: any) => s.userId._id === user?.id || s.userId === user?.id)

      if (myProfile) {
        setSelectedStudent(myProfile._id)
      } else {
        console.error("Student profile not found")
        setLoading(false)
      }
    } catch (error) {
      console.error("Failed to fetch my grades", error)
      setLoading(false)
    }
  }

  const fetchClasses = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/classes`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to fetch classes")
      const data = await response.json()

      if (Array.isArray(data)) {
        if (user?.role === 'teacher') {
          // Filter classes where teacherId matches user.id
          const myClasses = data.filter((c: any) => c.teacherId?._id === user.id || c.teacherId === user.id)
          setClasses(myClasses)
        } else {
          setClasses(data)
        }
      } else {
        console.error("Fetched classes is not an array:", data)
        setClasses([])
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error)
    }
  }

  const fetchStudentsForClass = async (classId: string, setFn: (data: any[]) => void) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to fetch students")
      const data = await response.json()
      if (Array.isArray(data)) {
        const filtered = data.filter((s: any) => s.classId?._id === classId || s.classId === classId)
        setFn(filtered)
      } else {
        setFn([])
      }
    } catch (error) {
      console.error("Failed to fetch students", error)
    }
  }

  const fetchStudentGrades = async (studentId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/grades/student/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to fetch grades")
      const data = await response.json()
      if (Array.isArray(data)) {
        setGrades(data)
      } else {
        console.error("Fetched grades is not an array:", data)
        setGrades([])
      }
    } catch (error) {
      toast.error("Failed to fetch grades")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleRecordGrade = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingGradeId
        ? `${process.env.NEXT_PUBLIC_API_URL}/grades/${editingGradeId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/grades`

      const method = editingGradeId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          classId: formClass,
        }),
      })

      if (response.ok) {
        toast.success(editingGradeId ? "Grade updated successfully" : "Grade recorded successfully")
        setFormData({
          studentId: "",
          classId: "",
          subject: "",
          assignmentScore: 0,
          examScore: 0,
          projectScore: 0,
          academicTerm: "",
          grade: "",
          comments: "",
        })
        setFormClass("")
        setEditingGradeId(null)
        setIsRecordDialogOpen(false)
        if (selectedStudent) {
          fetchStudentGrades(selectedStudent)
        }
      } else {
        toast.error(editingGradeId ? "Failed to update grade" : "Failed to record grade")
      }
    } catch (error) {
      toast.error("An error occurred")
      console.error("Failed to save grade:", error)
    }
  }

  const handleDeleteGrade = async (gradeId: string) => {
    if (!confirm("Are you sure you want to delete this grade?")) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/grades/${gradeId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        toast.success("Grade deleted")
        setGrades(grades.filter(g => g._id !== gradeId))
      } else {
        toast.error("Failed to delete grade")
      }
    } catch (error) {
      console.error("Error deleting grade:", error)
      toast.error("Failed to delete grade")
    }
  }

  const handleEditGrade = (grade: Grade) => {
    setEditingGradeId(grade._id)
    // We need to find the class ID for the student to pre-fill correctly if possible, 
    // but the grade object usually has populated fields. 
    // Based on the Type definition: grade.studentId is an object.

    // Check if we need to retrieve the class ID separately or if it's available.
    // The Grade model has classId. The interface Grade above doesn't show classId populated or not, 
    // let's assume valid data.
    // However, the current Grade interface in this file only has studentId populated.
    // We might need the raw class ID. 
    // Let's assume the backend 'populate' refers to what we get.
    // If classId is not in the Grade interface, we might be missing it. 
    // Let's check the partial grade object or force cast if needed, or update interface.
    // For now, let's try to set what we have.

    setFormData({
      studentId: grade.studentId._id,
      classId: "", // We might need to fetch or derive this if not present
      subject: grade.subject,
      assignmentScore: grade.assignmentScore,
      examScore: grade.examScore,
      projectScore: grade.projectScore,
      academicTerm: grade.academicTerm,
      grade: grade.grade || "",
      comments: "",
    })

    // We need to set formClass to enable the student dropdown
    // But we don't have classId easily if it's not in the grade object we mapped.
    // Let's look at fetchStudentGrades: it returns data from /grades/student/:id
    // That endpoint populates 'classId' with name only? 
    // backend/routes/grades.js: router.get("/student/:studentId", ... populate("classId", "name"))
    // So classId is an object { _id, name } or just { name }?
    // Mongoose populate("classId", "name") returns { _id: "...", name: "..." }.

    // So we can use grade.classId._id if we update text Grade interface or access via 'any'
    const g = grade as any
    if (g.classId) {
      setFormClass(g.classId._id)
      setFormData(prev => ({ ...prev, classId: g.classId._id }))
    }

    setIsRecordDialogOpen(true)
  }

  if (user?.role !== "admin" && user?.role !== "teacher" && user?.role !== "student") {
    return (
      <ProtectedRoute>
        <div className="flex">
          <Sidebar />
          <main className="flex-1 ml-64 p-8">
            <p className="text-destructive">Access denied</p>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 p-8 overflow-y-auto w-full">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Grades & Reports</h1>
              <p className="text-muted-foreground mt-1">Manage student grades and generate reports.</p>
            </div>
            {(user?.role === "admin" || user?.role === "teacher") && (
              <Dialog open={isRecordDialogOpen} onOpenChange={setIsRecordDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Record Grade
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingGradeId ? "Edit Grade" : "Record New Grade"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleRecordGrade} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Class</Label>
                      <Select
                        value={formClass}
                        onValueChange={setFormClass}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map(c => (
                            <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Student</Label>
                      <Select
                        value={formData.studentId}
                        onValueChange={(val) => setFormData({ ...formData, studentId: val })}
                        required
                        disabled={!formClass}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Student" />
                        </SelectTrigger>
                        <SelectContent>
                          {formStudents.map(s => (
                            <SelectItem key={s._id} value={s._id}>
                              {s.userId.firstName} {s.userId.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Input
                        placeholder="e.g. Mathematics"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Assign.</Label>
                        <Input type="number" min="0" max="100" value={formData.assignmentScore} onChange={e => setFormData({ ...formData, assignmentScore: Number(e.target.value) })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Exam</Label>
                        <Input type="number" min="0" max="100" value={formData.examScore} onChange={e => setFormData({ ...formData, examScore: Number(e.target.value) })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Project</Label>
                        <Input type="number" min="0" max="100" value={formData.projectScore} onChange={e => setFormData({ ...formData, projectScore: Number(e.target.value) })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Term</Label>
                      <Input
                        placeholder="e.g. Fall 2024"
                        value={formData.academicTerm}
                        onChange={(e) => setFormData({ ...formData, academicTerm: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Grade (Letter) - Optional</Label>
                      <Input
                        placeholder="Auto-calculated if empty (e.g. A, Pass)"
                        value={formData.grade}
                        onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Comments</Label>
                      <Textarea
                        placeholder="Optional comments..."
                        value={formData.comments}
                        onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit">{editingGradeId ? "Update Grade" : "Save Grade"}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {user?.role !== "student" && (
            <div className="flex flex-col md:flex-row gap-4 mb-6 bg-card p-4 rounded-lg border animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
              <div className="space-y-2 w-full md:w-1/3">
                <Label>Filter by Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 w-full md:w-1/3">
                <Label>Select Student</Label>
                <Select
                  value={selectedStudent}
                  onValueChange={setSelectedStudent}
                  disabled={!selectedClass}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(s => (
                      <SelectItem key={s._id} value={s._id}>
                        {s.userId.firstName} {s.userId.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="rounded-md border bg-card animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Exam</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Overall</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Term</TableHead>
                  {(user?.role === "admin" || user?.role === "teacher") && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">Loading grades...</TableCell>
                  </TableRow>
                ) : grades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      {!selectedStudent ? "Please select a class and student to view grades." : "No grades found for this student."}
                    </TableCell>
                  </TableRow>
                ) : (
                  grades.map((grade) => (
                    <TableRow key={grade._id}>
                      <TableCell className="font-medium">{grade.subject}</TableCell>
                      <TableCell>{grade.assignmentScore}</TableCell>
                      <TableCell>{grade.examScore}</TableCell>
                      <TableCell>{grade.projectScore}</TableCell>
                      <TableCell className="font-bold">{grade.overallScore?.toFixed(1) || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={
                          ['A', 'B'].includes(grade.grade) ? 'default' :
                            ['C', 'D'].includes(grade.grade) ? 'secondary' : 'destructive'
                        }>
                          {grade.grade || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{grade.academicTerm}</TableCell>
                      {(user?.role === "admin" || user?.role === "teacher") && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditGrade(grade)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteGrade(grade._id)} className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
