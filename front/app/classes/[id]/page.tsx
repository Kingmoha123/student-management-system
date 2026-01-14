"use client"

import { useState, useEffect, use } from "react"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Sidebar } from "@/components/Sidebar"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, Calendar, BookOpen, GraduationCap, ArrowLeft, MoreVertical, Edit, UserCheck, Search, Mail } from "lucide-react"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import Link from "next/link"

export default function ClassDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { user, token } = useAuth()
    const { id } = use(params)

    const [classData, setClassData] = useState<any>(null)
    const [students, setStudents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        if (token && id) {
            fetchClassAndStudents()
        }
    }, [token, id])

    const fetchClassAndStudents = async () => {
        try {
            const headers = { Authorization: `Bearer ${token}` }
            const classRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/classes/${id}`, { headers })
            if (!classRes.ok) throw new Error("Failed to fetch class")
            const cData = await classRes.json()
            setClassData(cData)

            const studentsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students/class/${id}`, { headers })
            if (studentsRes.ok) {
                setStudents(await studentsRes.json())
            }
        } catch (error) {
            console.error("Error fetching class details:", error)
            toast.error("Failed to load class information")
        } finally {
            setLoading(false)
        }
    }

    const filteredStudents = students.filter(s =>
        (s.userId.firstName + " " + s.userId.lastName).toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.enrollmentNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="flex h-screen bg-background text-foreground">
                    <Sidebar />
                    <main className="flex-1 ml-64 p-8 flex items-center justify-center">
                        <div className="animate-pulse flex flex-col items-center gap-4">
                            <GraduationCap className="h-12 w-12 text-primary opacity-20" />
                            <p className="text-muted-foreground font-medium">Loading class details...</p>
                        </div>
                    </main>
                </div>
            </ProtectedRoute>
        )
    }

    if (!classData) {
        return (
            <ProtectedRoute>
                <div className="flex h-screen bg-background text-foreground">
                    <Sidebar />
                    <main className="flex-1 ml-64 p-8 flex items-center justify-center">
                        <div className="text-center space-y-4">
                            <h2 className="text-2xl font-bold text-destructive">Class Not Found</h2>
                            <Button onClick={() => window.history.back()}>Go Back</Button>
                        </div>
                    </main>
                </div>
            </ProtectedRoute>
        )
    }

    const avgPerformance = students.length > 0
        ? (students.reduce((acc, s) => acc + (s.averageGrade || 0), 0) / students.length).toFixed(1)
        : "0.0"

    return (
        <ProtectedRoute>
            <div className="flex h-screen bg-background text-foreground">
                <Sidebar />
                <main className="flex-1 ml-64 overflow-y-auto">
                    <div className="bg-primary/5 border-b px-8 py-10">
                        <div className="max-w-7xl mx-auto space-y-6">
                            <Link href="/classes" className="inline-flex items-center text-sm font-medium text-primary hover:underline gap-1">
                                <ArrowLeft className="h-4 w-4" /> Back to Classes
                            </Link>
                            <div className="flex justify-between items-end">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-4xl font-bold tracking-tight">{classData.name}</h1>
                                        <Badge variant="outline" className="h-fit py-1 px-3 border-primary/20 bg-primary/5 text-primary">
                                            Section {classData.section}
                                        </Badge>
                                    </div>
                                    <p className="text-muted-foreground text-lg max-w-2xl">{classData.description || "Academic section information and student roster."}</p>
                                </div>
                                {user?.role === "admin" && (
                                    <Link href={`/classes?edit=${id}`}>
                                        <Button variant="outline" className="gap-2">
                                            <Edit className="h-4 w-4" /> Edit Class info
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-8 max-w-7xl mx-auto space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {[
                                { label: 'Enrolled Students', value: students.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                { label: 'Class Capacity', value: classData.maxCapacity, icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                                { label: 'Avg. Performance', value: `${avgPerformance}%`, icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                                { label: 'Academic Year', value: classData.academicYear, icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                            ].map((item, i) => (
                                <Card key={i} className="border-none shadow-sm ring-1 ring-foreground/5 bg-card/50 backdrop-blur-sm">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</CardTitle>
                                        <div className={`p-2 rounded-lg ${item.bg}`}>
                                            <item.icon className={`h-4 w-4 ${item.color}`} />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{item.value}</div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <Users className="h-5 w-5 text-primary" /> Student Roster
                                    </h3>
                                    <div className="relative w-64">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search students..."
                                            className="pl-8 h-9 text-sm bg-muted/30 border-none focus-visible:ring-1"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="rounded-xl border shadow-sm overflow-hidden bg-card/60 backdrop-blur-sm ring-1 ring-foreground/5">
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow>
                                                <TableHead>Student</TableHead>
                                                <TableHead>Enrollment ID</TableHead>
                                                <TableHead>Performance</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredStudents.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                                                        No students enrolled in this section yet.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredStudents.map((s) => (
                                                    <TableRow key={s._id} className="group hover:bg-muted/30 transition-colors">
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-9 w-9 border">
                                                                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs uppercase">
                                                                        {s.userId.firstName[0]}{s.userId.lastName[0]}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex flex-col">
                                                                    <span className="font-semibold text-sm">{s.userId.firstName} {s.userId.lastName}</span>
                                                                    <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                                                                        <Mail className="h-2 w-2" /> {s.userId.email}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="font-mono text-xs">{s.enrollmentNumber}</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full ${s.averageGrade >= 70 ? 'bg-emerald-500' : s.averageGrade >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                                        style={{ width: `${s.averageGrade || 0}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs font-medium">{s.averageGrade}%</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className={`
                                                                capitalize text-[10px] border-none shadow-sm
                                                                ${s.status === 'enrolled' ? 'bg-emerald-100/50 text-emerald-700' : 'bg-rose-100/50 text-rose-700'}
                                                            `}>
                                                                {s.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Link href={`/students/${s._id}`}>
                                                                <Button variant="ghost" size="sm" className="h-8 text-primary hover:bg-primary/10">View Profile</Button>
                                                            </Link>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <Card className="border-none shadow-sm ring-1 ring-foreground/5 bg-card/50">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Instructor</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {classData.teacherId ? (
                                            <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                                                <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl">
                                                    {classData.teacherId.firstName[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold">{classData.teacherId.firstName} {classData.teacherId.lastName}</p>
                                                    <p className="text-xs text-muted-foreground">{classData.teacherId.email}</p>
                                                    <Badge className="mt-2" variant="secondary">Lead Teacher</Badge>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-4 text-center border border-dashed rounded-xl text-muted-foreground italic text-sm">
                                                No teacher assigned yet
                                            </div>
                                        )}
                                        <Button variant="outline" className="w-full h-10 gap-2 text-sm font-semibold">
                                            <Mail className="h-4 w-4" /> Message Teacher
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-sm ring-1 ring-foreground/5 bg-card/50">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Section Schedule</CardTitle>
                                        <CardDescription>Estimated academic timeline</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Status</span>
                                            <Badge className="bg-emerald-500/10 text-emerald-600 border-none shadow-sm">Active Session</Badge>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Semester</span>
                                            <span className="font-medium">Fall {classData.academicYear}</span>
                                        </div>
                                        <div className="pt-4 border-t border-dashed">
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-3">Recent Activity</p>
                                            <div className="space-y-3">
                                                {[1, 2].map(i => (
                                                    <div key={i} className="flex gap-3 text-xs">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1" />
                                                        <div>
                                                            <p className="font-medium">Attendance taken</p>
                                                            <p className="text-muted-foreground">2 days ago</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    )
}
