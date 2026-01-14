"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/context/AuthContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Sidebar } from "@/components/Sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Trash2, UserPlus, Filter, Eye, GraduationCap, Users, UserCheck, UserMinus, MoreVertical, LayoutGrid, Pencil, AlertCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

// Types
interface Student {
  _id: string
  userId: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  enrollmentNumber: string
  classId?: { _id: string; name: string }
  enrollmentDate: string
  status: "enrolled" | "suspended" | "graduated"
  averageGrade: number
}

// Zod Schema for Student Form
const studentSchema = z.object({
  userId: z.string().min(1, "Student user is required"),
  enrollmentNumber: z.string().min(1, "Enrollment number is required"),
  dateOfBirth: z.string().optional(),
  classId: z.string().optional(),
  status: z.enum(["enrolled", "suspended", "graduated"]),
})

type StudentFormValues = z.infer<typeof studentSchema>

export default function StudentsPage() {
  const { user, token } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])

  // UI State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null)
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null)

  // Filter/Sort State
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Form
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      userId: "",
      enrollmentNumber: "",
      dateOfBirth: "",
      classId: "",
      status: "enrolled",
    },
  })

  useEffect(() => {
    if (token) {
      fetchStudents()
      fetchClasses()
      fetchUsers()
    }
  }, [token])

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to fetch students")
      const data = await response.json()
      if (Array.isArray(data)) {
        setStudents(data)
      } else {
        console.error("Fetched students is not an array:", data)
        setStudents([])
      }
    } catch (error) {
      toast.error("Failed to load students")
      console.error(error)
    } finally {
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
        setClasses(data)
      } else {
        console.error("Fetched classes is not an array:", data)
        setClasses([])
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to fetch users")
      const data = await response.json()
      // Filter users who are students and seemingly not yet enrolled as students (optional logic)
      if (Array.isArray(data)) {
        setUsers(data.filter((u: any) => u.role === "student"))
      } else {
        console.error("Fetched users is not an array:", data)
        setUsers([])
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }

  const handleAddStudent = async (data: StudentFormValues) => {
    try {
      const payload = { ...data, classId: data.classId === "none" ? "" : data.classId }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success("Student enrolled successfully")
        setIsAddDialogOpen(false)
        form.reset()
        fetchStudents()
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || "Failed to enroll student")
      }
    } catch (error) {
      toast.error("An error occurred")
      console.error(error)
    }
  }

  const handleEditStudent = async (data: StudentFormValues) => {
    if (!studentToEdit) return

    try {
      const payload = { ...data, classId: data.classId === "none" ? "" : data.classId }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students/${studentToEdit._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success("Student updated successfully")
        setIsEditDialogOpen(false)
        setStudentToEdit(null)
        form.reset()
        fetchStudents()
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || "Failed to update student")
      }
    } catch (error) {
      toast.error("An error occurred")
      console.error(error)
    }
  }

  const openEditDialog = (student: Student) => {
    setStudentToEdit(student)
    form.reset({
      userId: student.userId._id,
      enrollmentNumber: student.enrollmentNumber,
      status: student.status,
      classId: student.classId?._id || "none",
    })
    setIsEditDialogOpen(true)
  }

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students/${studentToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        toast.success("Student removed successfully")
        setStudents(prev => prev.filter(s => s._id !== studentToDelete))
      } else {
        toast.error("Failed to remove student")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setStudentToDelete(null)
    }
  }

  // Filter Logic
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch =
        student.userId.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.userId.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.enrollmentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.userId.email.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === "all" || student.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [students, searchQuery, statusFilter])

  // Pagination Logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Stats calculation
  const stats = useMemo(() => {
    return {
      total: students.length,
      enrolled: students.filter(s => s.status === 'enrolled').length,
      suspended: students.filter(s => s.status === 'suspended').length,
      graduated: students.filter(s => s.status === 'graduated').length,
    }
  }, [students])

  if (user?.role !== "admin" && user?.role !== "teacher") {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 ml-64 p-8 flex items-center justify-center">
            <div className="text-center space-y-4">
              <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground opacity-20" />
              <p className="text-xl font-medium text-destructive">Access denied</p>
            </div>
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
          {/* Page Header */}
          <div className="bg-primary/5 border-b px-8 py-12">
            <div className="flex justify-between items-center max-w-7xl mx-auto w-full">
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-foreground">Student Management</h1>
                <p className="text-muted-foreground mt-2 text-lg">Central hub for admissions, academic tracking, and student records.</p>
              </div>
              {user?.role === "admin" && (
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="shadow-lg hover:shadow-primary/20 transition-all font-semibold">
                      <UserPlus className="mr-2 h-5 w-5" /> Register Student
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                      <DialogTitle className="text-2xl">New Student Admission</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(handleAddStudent)} className="space-y-6 py-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Select User Account</Label>
                          <Select
                            onValueChange={(val) => form.setValue("userId", val)}
                            defaultValue={form.getValues("userId")}
                          >
                            <SelectTrigger className="bg-muted/50 h-11">
                              <SelectValue placeholder="Choose a user profile" />
                            </SelectTrigger>
                            <SelectContent>
                              {users.map((u) => (
                                <SelectItem key={u._id} value={u._id}>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                        {(u.firstName?.[0] || 'U')}{(u.lastName?.[0] || '')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{u.firstName} {u.lastName} ({u.email})</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {form.formState.errors.userId && <p className="text-sm text-destructive">{form.formState.errors.userId.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Enrollment Number</Label>
                            <Input placeholder="e.g. ADM2024001" className="bg-muted/50 h-11" {...form.register("enrollmentNumber")} />
                            {form.formState.errors.enrollmentNumber && <p className="text-sm text-destructive">{form.formState.errors.enrollmentNumber.message}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                              onValueChange={(val: any) => form.setValue("status", val)}
                              defaultValue={form.getValues("status")}
                            >
                              <SelectTrigger className="bg-muted/50 h-11">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="enrolled">Enrolled</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                                <SelectItem value="graduated">Graduated</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Date of Birth</Label>
                            <Input type="date" className="bg-muted/50 h-11" {...form.register("dateOfBirth")} />
                          </div>
                          <div className="space-y-2">
                            <Label>Assigned Class</Label>
                            <Select
                              onValueChange={(val) => form.setValue("classId", val)}
                              defaultValue={form.getValues("classId")}
                            >
                              <SelectTrigger className="bg-muted/50 h-11">
                                <SelectValue placeholder="N/A" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">N/A (Unassigned)</SelectItem>
                                {classes.map((c) => (
                                  <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button type="submit" className="w-full h-11 text-lg shadow-md">Complete Registration</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm ring-1 ring-foreground/5 transition-all hover:ring-primary/20 hover:shadow-lg hover:-translate-y-1 duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="text-sm font-medium text-muted-foreground">Total Students</span>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm ring-1 ring-foreground/5 transition-all hover:ring-primary/20 hover:shadow-lg hover:-translate-y-1 duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="text-sm font-medium text-muted-foreground">Currently Enrolled</span>
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.enrolled}</div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm ring-1 ring-foreground/5 transition-all hover:ring-primary/20 hover:shadow-lg hover:-translate-y-1 duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="text-sm font-medium text-muted-foreground">Suspended</span>
                  <AlertCircle className="h-4 w-4 text-rose-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.suspended}</div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm ring-1 ring-foreground/5 transition-all hover:ring-primary/20 hover:shadow-lg hover:-translate-y-1 duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="text-sm font-medium text-muted-foreground">Graduated</span>
                  <GraduationCap className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.graduated}</div>
                </CardContent>
              </Card>
            </div>

            {/* Toolbar: Search & Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border shadow-sm ring-1 ring-foreground/5">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter name, email, or ID..."
                  className="pl-10 bg-muted/30 border-none focus-visible:ring-1 transition-all focus-visible:bg-muted/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[180px] bg-muted/30 border-none focus:ring-1">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="All Status" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="enrolled">Enrolled</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="graduated">Graduated</SelectItem>
                  </SelectContent>
                </Select>

                <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground font-medium px-4 py-2 bg-muted/20 rounded-lg">
                  <LayoutGrid className="h-4 w-4" />
                  <span>{filteredStudents.length} entries</span>
                </div>
              </div>
            </div>

            {/* Table Section */}
            <div className="rounded-xl border shadow-sm bg-card/60 backdrop-blur-sm overflow-hidden ring-1 ring-foreground/5">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="py-4">Student</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Current Class</TableHead>
                    <TableHead>Avg Perf.</TableHead>
                    <TableHead>Status</TableHead>
                    {(user?.role === "admin" || user?.role === "teacher") && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={i} className="animate-pulse">
                        <TableCell colSpan={6} className="h-16 bg-muted/5" />
                      </TableRow>
                    ))
                  ) : paginatedStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2 opacity-40">
                          <Users className="h-10 w-10" />
                          <p>No students found for this filter</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedStudents.map((student) => (
                      <TableRow key={student._id} className="group hover:bg-muted/20 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border ring-2 ring-background ring-offset-1 group-hover:ring-primary/20 transition-all">
                              <AvatarFallback className="bg-primary/5 text-primary font-bold">
                                {(student.userId.firstName?.[0] || 'S')}{(student.userId.lastName?.[0] || '')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {student.userId.firstName} {student.userId.lastName}
                              </span>
                              <span className="text-xs text-muted-foreground">{student.userId.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded font-mono border">
                            {student.enrollmentNumber}
                          </code>
                        </TableCell>
                        <TableCell>
                          {student.classId ? (
                            <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5">
                              {student.classId.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs italic italic">Pending Class</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full ${student.averageGrade >= 70 ? 'bg-emerald-500' : student.averageGrade >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                style={{ width: `${student.averageGrade || 0}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold font-mono">
                              {student.averageGrade > 0 ? student.averageGrade.toFixed(1) : "N/A"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`
                              capitalize border-none shadow-sm flex items-center w-fit font-bold py-1 px-3
                              ${student.status === 'enrolled' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                student.status === 'suspended' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' :
                                  'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'}
                            `}
                          >
                            <div className={`h-1.5 w-1.5 rounded-full mr-2 ${student.status === 'enrolled' ? 'bg-emerald-500' :
                              student.status === 'suspended' ? 'bg-rose-500' : 'bg-blue-500'
                              }`} />
                            {student.status}
                          </Badge>
                        </TableCell>
                        {(user?.role === "admin" || user?.role === "teacher") && (
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center gap-1">
                              <Link href={`/students/${student._id}`}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-500 hover:bg-blue-500/10"
                                onClick={() => openEditDialog(student)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {user?.role === "admin" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                  onClick={() => setStudentToDelete(student._id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination UI Refresh */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/10 p-4 rounded-xl border border-dashed ring-1 ring-foreground/5">
              <p className="text-sm text-muted-foreground font-medium">
                Records {filteredStudents.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} — {Math.min(currentPage * itemsPerPage, filteredStudents.length)} <span className="mx-1 opacity-20">|</span> Total {filteredStudents.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 shadow-sm bg-background border-none hover:bg-muted"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground px-4">
                  Page <span className="text-foreground">{currentPage}</span> of {totalPages || 1}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages || totalPages === 0}
                  className="h-8 shadow-sm bg-background border-none hover:bg-muted"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
      <AlertDialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the student enrollment record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStudent} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="text-2xl">Edit Student Details</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleEditStudent)} className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Student Account</Label>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {(studentToEdit?.userId.firstName?.[0] || 'U')}{(studentToEdit?.userId.lastName?.[0] || '')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{studentToEdit?.userId.firstName} {studentToEdit?.userId.lastName}</span>
                    <span className="text-xs text-muted-foreground">{studentToEdit?.userId.email}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Enrollment Number</Label>
                  <Input placeholder="e.g. ADM2024001" className="bg-muted/50 h-11" {...form.register("enrollmentNumber")} />
                  {form.formState.errors.enrollmentNumber && <p className="text-sm text-destructive">{form.formState.errors.enrollmentNumber.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    onValueChange={(val: any) => form.setValue("status", val)}
                    defaultValue={form.getValues("status")}
                    value={form.watch("status")}
                  >
                    <SelectTrigger className="bg-muted/50 h-11">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enrolled">Enrolled</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="graduated">Graduated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" className="bg-muted/50 h-11" {...form.register("dateOfBirth")} />
                </div>
                <div className="space-y-2">
                  <Label>Assigned Class</Label>
                  <Select
                    onValueChange={(val) => form.setValue("classId", val)}
                    defaultValue={form.getValues("classId")}
                    value={form.watch("classId")}
                  >
                    <SelectTrigger className="bg-muted/50 h-11">
                      <SelectValue placeholder="N/A" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">N/A (Unassigned)</SelectItem>
                      {classes.map((c) => (
                        <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full h-11 text-lg shadow-md">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  )
}
