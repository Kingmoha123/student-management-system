"use client"

import { useState, useEffect, use } from "react"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Sidebar } from "@/components/Sidebar"
import { useAuth } from "@/context/AuthContext"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { User, Mail, Phone, Calendar as CalendarIcon, MapPin, GraduationCap, TrendingUp, Clock, AlertCircle, ChevronLeft } from "lucide-react"
import { toast } from "sonner"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { user, token } = useAuth()
    // Unwrap params using React.use()
    const { id } = use(params)

    const [student, setStudent] = useState<any>(null)
    const [attendance, setAttendance] = useState<any[]>([])
    const [grades, setGrades] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (token && id) {
            fetchStudentData()
        }
    }, [token, id])

    const fetchStudentData = async () => {
        try {
            const headers = { Authorization: `Bearer ${token}` }

            // Fetch Student Details
            const studentRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students/${id}`, { headers })
            let finalStudentData = null;
            if (studentRes.ok) {
                finalStudentData = await studentRes.json();
            } else {
                // Fallback: fetch all and find
                const allStudentsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students`, { headers })
                const allStudents = await allStudentsRes.json()
                finalStudentData = allStudents.find((s: any) => s._id === id)
            }

            setStudent(finalStudentData)

            // Fetch Grades
            // We might need to fetch all grades and filter by studentId if no specific endpoint exists
            // Previous Grades code suggested fetching by studentId might not be direct.
            // Let's try /api/grades/student/:id based on previous conversations/assumptions.
            // If that fails, we can't show grades yet.
            try {
                const gradesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/grades/student/${id}`, { headers })
                if (gradesRes.ok) {
                    setGrades(await gradesRes.json())
                }
            } catch (e) {
                console.log("Grades fetch failed", e)
            }

            // Fetch Attendance
            // Fetching by class and filtering is inefficient but might be the only way if no student-specific endpoint.
            if (finalStudentData?.classId) {
                const classId = typeof finalStudentData.classId === 'object' ? finalStudentData.classId._id : finalStudentData.classId;
                try {
                    const attRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/attendance/class/${classId}`, { headers })
                    if (attRes.ok) {
                        const allAtt = await attRes.json()
                        // Filter for this student
                        const studentAtt = allAtt.filter((a: any) =>
                            (typeof a.studentId === 'object' ? a.studentId._id : a.studentId) === id
                        )
                        setAttendance(studentAtt)
                    }
                } catch (e) {
                    console.log("Attendance fetch failed", e)
                }
            }

        } catch (error) {
            console.error("Error fetching profile:", error)
            toast.error("Failed to load student profile")
        } finally {
            setLoading(false)
        }
    }

    // Calculate Stats
    const calculateAttendanceRate = () => {
        if (attendance.length === 0) return 100; // Default or 0?
        const present = attendance.filter(a => a.status === 'present').length;
        return Math.round((present / attendance.length) * 100);
    }

    const calculateAvgGrade = () => {
        if (grades.length === 0) return "N/A";
        // Assuming 'overallScore' exists
        const total = grades.reduce((acc, curr) => acc + (curr.overallScore || 0), 0);
        return Math.round(total / grades.length);
    }

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="flex h-screen bg-background text-foreground">
                    <Sidebar />
                    <main className="flex-1 ml-64 p-8 flex items-center justify-center">
                        Loading Profile...
                    </main>
                </div>
            </ProtectedRoute>
        )
    }

    if (!student) {
        return (
            <ProtectedRoute>
                <div className="flex h-screen bg-background text-foreground">
                    <Sidebar />
                    <main className="flex-1 ml-64 p-8">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-destructive">Student Not Found</h2>
                            <p className="text-muted-foreground">The requested student profile could not be located.</p>
                            <Button className="mt-4" onClick={() => window.history.back()}>Go Back</Button>
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
                    {/* Header / Banner - Reverted to Original Theme */}
                    <div className="bg-primary/5 text-foreground p-10 pb-20 border-b relative overflow-hidden">
                        <Link href="/students" className="inline-flex items-center gap-2 text-primary hover:underline transition-colors mb-8 group relative z-10 font-medium">
                            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            Back to Student Management
                        </Link>

                        <div className="flex items-center gap-8 relative z-10">
                            <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-primary to-primary/60 p-1 shadow-xl">
                                <div className="w-full h-full rounded-2xl bg-background flex items-center justify-center text-4xl font-bold text-primary">
                                    {student.userId?.firstName?.[0]}{student.userId?.lastName?.[0]}
                                </div>
                            </div>
                            <div>
                                <h1 className="text-4xl font-extrabold tracking-tight">{student.userId?.firstName} {student.userId?.lastName}</h1>
                                <p className="text-muted-foreground capitalize flex items-center gap-2 mt-2 text-lg font-medium">
                                    <GraduationCap className="w-5 h-5 text-primary" />
                                    {student.classId?.name || "Unassigned"} Class
                                </p>
                                <div className="flex gap-4 mt-6">
                                    <Badge variant="outline" className="px-3 py-1 text-sm font-mono">
                                        #{student.enrollmentNumber}
                                    </Badge>
                                    <Badge className={cn(
                                        "px-3 py-1 text-sm font-semibold border-0",
                                        student.status === 'enrolled' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                                    )}>
                                        {student.status}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 -mt-10">
                        <Tabs defaultValue="overview" className="space-y-6">
                            <TabsList className="bg-muted p-1 h-auto rounded-xl grid grid-cols-3 w-full max-w-md ring-1 ring-foreground/5">
                                <TabsTrigger value="overview" className="py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all font-semibold">Overview</TabsTrigger>
                                <TabsTrigger value="attendance" className="py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all font-semibold">Attendance</TabsTrigger>
                                <TabsTrigger value="grades" className="py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all font-semibold">Grades</TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="space-y-6">
                                {/* Summary Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <Card className="border shadow-sm ring-1 ring-foreground/5 bg-card/50 backdrop-blur-sm transition-all hover:ring-primary/20">
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-70">Attendance Rate</CardTitle>
                                            <Clock className="w-4 h-4 text-primary" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-3xl font-bold">{calculateAttendanceRate()}%</div>
                                            <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">Validated across {attendance.length} records</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="border shadow-sm ring-1 ring-foreground/5 bg-card/50 backdrop-blur-sm transition-all hover:ring-primary/20">
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-70">Avg. Grade</CardTitle>
                                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-3xl font-bold">{calculateAvgGrade()}</div>
                                            <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">Calculated over {grades.length} subjects</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="border shadow-sm ring-1 ring-foreground/5 bg-card/50 backdrop-blur-sm transition-all hover:ring-primary/20">
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-70">Current Status</CardTitle>
                                            <AlertCircle className="w-4 h-4 text-primary" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-3xl font-bold capitalize">{student.status}</div>
                                            <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">Official academic standing</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card className="border shadow-sm ring-1 ring-foreground/5 bg-card/50 backdrop-blur-sm">
                                    <CardHeader>
                                        <CardTitle className="text-primary font-bold">Personal Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">Email Address</label>
                                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-transparent shadow-sm">
                                                <Mail className="w-4 h-4 text-primary" />
                                                <span className="font-semibold">{student.userId?.email}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">Phone Number</label>
                                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-transparent shadow-sm">
                                                <Phone className="w-4 h-4 text-primary" />
                                                <span className="font-semibold">{student.userId?.phone || "N/A"}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">Date of Birth</label>
                                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-transparent shadow-sm">
                                                <CalendarIcon className="w-4 h-4 text-primary" />
                                                <span className="font-semibold">{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : "N/A"}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">Residential Address</label>
                                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-transparent shadow-sm">
                                                <MapPin className="w-4 h-4 text-primary" />
                                                <span className="font-semibold">{student.address || "N/A"}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="attendance">
                                <Card className="border shadow-sm ring-1 ring-foreground/5 bg-card/50 backdrop-blur-sm">
                                    <CardHeader>
                                        <CardTitle className="text-primary font-bold">Attendance History</CardTitle>
                                        <CardDescription className="font-medium">Detailed session-by-session academic presence logs.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Remarks</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {attendance.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No attendance records found.</TableCell>
                                                    </TableRow>
                                                ) : (
                                                    attendance.map((record) => (
                                                        <TableRow key={record._id}>
                                                            <TableCell className="font-medium">{new Date(record.date).toLocaleDateString()}</TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    variant={record.status === 'present' ? 'default' : 'destructive'}
                                                                    className={cn(record.status === 'present' ? 'bg-emerald-500' : 'bg-rose-500')}
                                                                >
                                                                    {record.status}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-muted-foreground italic">{record.remarks || "—"}</TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="grades">
                                <Card className="border shadow-sm ring-1 ring-foreground/5 bg-card/50 backdrop-blur-sm">
                                    <CardHeader>
                                        <CardTitle className="text-primary font-bold">Academic Performance</CardTitle>
                                        <CardDescription className="font-medium">Comprehensive breakdown of scores across the academic term.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Subject</TableHead>
                                                    <TableHead>Term</TableHead>
                                                    <TableHead>Assignment</TableHead>
                                                    <TableHead>Exam</TableHead>
                                                    <TableHead>Total</TableHead>
                                                    <TableHead>Grade</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {grades.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No grades recorded yet.</TableCell>
                                                    </TableRow>
                                                ) : (
                                                    grades.map((grade) => (
                                                        <TableRow key={grade._id}>
                                                            <TableCell className="font-medium">{grade.subject}</TableCell>
                                                            <TableCell>{grade.academicTerm}</TableCell>
                                                            <TableCell>{grade.assignmentScore}</TableCell>
                                                            <TableCell>{grade.examScore}</TableCell>
                                                            <TableCell className="font-bold">{grade.overallScore}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline" className={cn(
                                                                    "font-bold shadow-sm",
                                                                    ['A', 'A+', 'B'].includes(grade.grade) ? 'border-primary/20 text-primary bg-primary/5' :
                                                                        ['F', 'D'].includes(grade.grade) ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20' : 'border-slate-300 text-slate-600'
                                                                )}>
                                                                    {grade.grade}
                                                                </Badge>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    )
}
