"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Sidebar } from "@/components/Sidebar"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Plus, Trash, Search, BookOpen, GraduationCap } from "lucide-react"
import { toast } from "sonner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default function CoursesPage() {
    const { user, token } = useAuth()
    const [courses, setCourses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [teachers, setTeachers] = useState<any[]>([])
    const [classes, setClasses] = useState<any[]>([])

    const [isAddOpen, setIsAddOpen] = useState(false)
    const [newCourse, setNewCourse] = useState({
        name: "",
        code: "",
        description: "",
        credits: 3,
        teacherId: "",
        classId: ""
    })

    useEffect(() => {
        if (token) {
            fetchCourses()
            fetchTeachers()
            fetchClasses()
        }
    }, [token])

    const fetchCourses = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setCourses(data)
            }
        } catch (error) {
            console.error("Error fetching courses:", error)
            toast.error("Failed to load courses")
        } finally {
            setLoading(false)
        }
    }

    const fetchTeachers = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users?role=teacher`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setTeachers(data.filter((u: any) => u.role === "teacher"))
            }
        } catch (error) {
            console.error("Error fetching teachers:", error)
        }
    }

    const fetchClasses = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/classes`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setClasses(data)
            }
        } catch (error) {
            console.error("Error fetching classes:", error)
        }
    }

    const handleAddCourse = async () => {
        if (!newCourse.name || !newCourse.code || !newCourse.classId) {
            toast.error("Name, Code and Class are required")
            return
        }

        const payload = { ...newCourse }
        // Ensure credits is a number
        payload.credits = Number(payload.credits)
        // Remove empty strings for optional fields to avoid backend casting errors
        if (!payload.teacherId) delete (payload as any).teacherId

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                toast.success("Course added successfully")
                setIsAddOpen(false)
                setNewCourse({
                    name: "",
                    code: "",
                    description: "",
                    credits: 3,
                    teacherId: "",
                    classId: ""
                })
                fetchCourses()
            } else {
                const err = await res.json()
                const msg = err.errors ? err.errors.map((e: any) => e.msg).join(", ") : err.message
                toast.error(msg || "Failed to add course")
            }
        } catch (error) {
            console.error(error)
            toast.error("Error adding course")
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this course?")) return

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            })

            if (res.ok) {
                toast.success("Course deleted")
                setCourses(courses.filter(c => c._id !== id))
            } else {
                toast.error("Failed to delete course")
            }
        } catch (error) {
            toast.error("Error deleting course")
        }
    }

    const filteredCourses = courses.filter(course =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <ProtectedRoute>
            <div className="flex h-screen bg-background text-foreground">
                <Sidebar />
                <main className="flex-1 ml-64 overflow-y-auto p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-3">
                                <BookOpen className="h-8 w-8 text-primary" />
                                Courses
                            </h1>
                            <p className="text-muted-foreground mt-1">Manage academic courses and subjects</p>
                        </div>

                        {user?.role === "admin" && (
                            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                                <DialogTrigger asChild>
                                    <Button className="gap-2">
                                        <Plus className="h-4 w-4" /> Add Course
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add New Course</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="grid gap-2">
                                            <Label>Course Name</Label>
                                            <Input
                                                placeholder="e.g. Mathematics 101"
                                                value={newCourse.name}
                                                onChange={e => setNewCourse({ ...newCourse, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label>Course Code</Label>
                                                <Input
                                                    placeholder="e.g. MATH101"
                                                    value={newCourse.code}
                                                    onChange={e => setNewCourse({ ...newCourse, code: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Credits</Label>
                                                <Input
                                                    type="number"
                                                    value={newCourse.credits}
                                                    onChange={e => setNewCourse({ ...newCourse, credits: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Class</Label>
                                            <Select onValueChange={(val) => setNewCourse({ ...newCourse, classId: val })}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a class" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {classes.map((c) => (
                                                        <SelectItem key={c._id} value={c._id}>
                                                            {c.name} (Sec {c.section})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Lead Teacher</Label>
                                            <Select onValueChange={(val) => setNewCourse({ ...newCourse, teacherId: val })}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a teacher" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {teachers.map((t) => (
                                                        <SelectItem key={t._id} value={t._id}>
                                                            {t.firstName} {t.lastName}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Description</Label>
                                            <Input
                                                placeholder="Course description..."
                                                value={newCourse.description}
                                                onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleAddCourse}>Create Course</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>

                    <div className="flex gap-4 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search courses..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <Card className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Class</TableHead>
                                        <TableHead>Teacher</TableHead>
                                        <TableHead>Credits</TableHead>
                                        {user?.role === "admin" && <TableHead className="text-right">Actions</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCourses.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                No courses found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredCourses.map((course) => (
                                            <TableRow key={course._id}>
                                                <TableCell className="font-mono text-xs font-semibold">{course.code}</TableCell>
                                                <TableCell className="font-medium">
                                                    <div>{course.name}</div>
                                                    <div className="text-xs text-muted-foreground line-clamp-1">{course.description}</div>
                                                </TableCell>
                                                <TableCell>
                                                    {course.classId ? (
                                                        <div className="text-sm">{course.classId.name}</div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm italic">Unassigned</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {course.teacherId ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                                                {course.teacherId.firstName[0]}
                                                            </div>
                                                            <span className="text-sm">{course.teacherId.firstName} {course.teacherId.lastName}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm italic">Unassigned</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>{course.credits}</TableCell>
                                                {user?.role === "admin" && (
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                                            onClick={() => handleDelete(course._id)}
                                                        >
                                                            <Trash className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </ProtectedRoute>
    )
}
