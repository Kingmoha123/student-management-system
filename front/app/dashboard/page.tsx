"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Sidebar } from "@/components/Sidebar"
import { useAuth } from "@/context/AuthContext"
import { Users, BookOpen, ClipboardList, MessageSquare, TrendingUp, Clock, AlertCircle, Calendar, GraduationCap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"

export default function DashboardPage() {
  const { user, token } = useAuth()

  // Dashboard Stats State (General)
  const [stats, setStats] = useState({
    students: 0,
    classes: 0,
    teachers: 0,
    courses: 0,
    assignments: 0,
    messages: 0,
  })
  const [activities, setActivities] = useState<any[]>([])

  // Role Specific Data
  const [studentData, setStudentData] = useState<any>({
    class: null,
    attendancePercentage: 0,
    courses: []
  })

  const [teacherData, setTeacherData] = useState<any>({
    myClasses: [],
    myStudentsCount: 0
  })

  const [parentData, setParentData] = useState<any>({
    children: []
  })

  // Loading State
  const [loading, setLoading] = useState(true)

  // Chart Data State
  const [enrollmentData, setEnrollmentData] = useState<any[]>([])

  useEffect(() => {
    if (token && user) {
      setLoading(true);
      if (user.role === "student") {
        fetchStudentDashboardData()
      } else if (user.role === "teacher") {
        fetchTeacherDashboardData()
      } else if (user.role === "parent") {
        fetchParentDashboardData()
      } else {
        fetchAdminDashboardData() // Previously fetchDashboardData
      }
    }
  }, [token, user])

  const fetchStudentDashboardData = async () => {
    if (!user || !token) return
    try {
      const headers = { Authorization: `Bearer ${token}` }

      // 1. Fetch Student Profile to get Class ID
      const studentRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students/me`, { headers })
      if (!studentRes.ok) throw new Error("Failed to fetch student profile")

      const myStudentProfile = await studentRes.json()

      if (myStudentProfile && myStudentProfile.classId) {
        // 2. Fetch Class Details (if not already populated fully)
        const classRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/classes/${myStudentProfile.classId._id || myStudentProfile.classId}`, { headers })

        // 3. Fetch Courses for this Class
        const coursesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses?classId=${myStudentProfile.classId._id || myStudentProfile.classId}`, { headers })

        // 4. Fetch Attendance Stats
        const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/attendance/stats/student/${myStudentProfile._id}`, { headers })

        const classData = classRes.ok ? await classRes.json() : null
        const coursesData = coursesRes.ok ? await coursesRes.json() : []
        const statsData = statsRes.ok ? await statsRes.json() : { percentage: 0, present: 0, total: 0 }

        setStudentData({
          class: { name: classData?.name || "Unassigned", teacher: classData?.teacherId?.lastName || "Unknown" },
          attendancePercentage: statsData.percentage,
          attendanceStats: { present: statsData.present, total: statsData.total },
          courses: coursesData.map((c: any) => ({
            name: c.name,
            teacher: c.teacherId ? `${c.teacherId.firstName} ${c.teacherId.lastName}` : "Unassigned",
            code: c.code
          }))
        })
      }
    } catch (error) {
      console.error("Failed to fetch student data", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeacherDashboardData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` }

      // Fetch Classes taught by this teacher
      const classesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/classes?teacherId=${user?.id}`, { headers });
      const myClasses = classesRes.ok ? await classesRes.json() : [];

      // Fetch Assignments created by this teacher (assuming assignments have creatorId or linked via class)
      // For now, let's just fetch all assignments and filter client side if API doesn't support it, or just generic stats
      const assignmentsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assignments`, { headers });
      const allAssignments = assignmentsRes.ok ? await assignmentsRes.json() : [];
      // Filter assignments for my classes
      const myClassIds = myClasses.map((c: any) => c._id);
      const myAssignments = allAssignments.filter((a: any) => myClassIds.includes(a.classId?._id || a.classId));

      // Fetch messages
      const messagesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/communication/inbox`, { headers });
      const myMessages = messagesRes.ok ? await messagesRes.json() : [];

      setStats({
        students: myClasses.reduce((acc: number, curr: any) => acc + (curr.studentCount || 0), 0),
        classes: myClasses.length,
        teachers: 0,
        courses: 0,
        assignments: myAssignments.length,
        messages: myMessages.filter((m: any) => !m.isRead).length
      });

      setTeacherData({
        myClasses: myClasses,
        myStudentsCount: myClasses.reduce((acc: number, curr: any) => acc + (curr.studentCount || 0), 0)
      });

    } catch (error) {
      console.error("Teacher dashboard error", error);
    } finally {
      setLoading(false);
    }
  }

  const fetchParentDashboardData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` }

      // Fetch children
      const studentsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students?parentId=${user?.id}`, { headers });
      const myChildren = studentsRes.ok ? await studentsRes.json() : [];

      // Fetch stats for each child
      const childrenWithStats = await Promise.all(myChildren.map(async (child: any) => {
        // Get attendance
        const attRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/attendance/stats/student/${child._id}`, { headers });
        const attData = attRes.ok ? await attRes.json() : { percentage: 0 };

        return {
          ...child,
          attendancePercentage: attData.percentage
        };
      }));

      setParentData({
        children: childrenWithStats
      });

      // Messages for parent
      const messagesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/communication/inbox`, { headers });
      const myMessages = messagesRes.ok ? await messagesRes.json() : [];

      setStats({
        students: myChildren.length,
        classes: 0,
        teachers: 0,
        courses: 0,
        assignments: 0,
        messages: myMessages.filter((m: any) => !m.isRead).length
      })

    } catch (error) {
      console.error("Parent dashboard error", error);
    } finally {
      setLoading(false);
    }
  }


  const fetchAdminDashboardData = async () => {
    // This is the original fetchDashboardData logic
    try {
      const headers = { Authorization: `Bearer ${token}` }

      // Parallel Fetching
      const [studentsRes, classesRes, assignmentsRes, messagesRes, attendanceRes, usersRes, coursesRes] = await Promise.allSettled([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/students`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/classes`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/assignments`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/communication/inbox`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/attendance`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses`, { headers })
      ])

      const newStats = { students: 0, classes: 0, assignments: 0, messages: 0, teachers: 0, courses: 0 }
      const allActivities: any[] = []

      // Students
      if (studentsRes.status === 'fulfilled' && studentsRes.value.ok) {
        const data = await studentsRes.value.json()
        if (Array.isArray(data)) {
          newStats.students = data.length
          data.slice(0, 5).forEach((s: any) => {
            allActivities.push({
              id: s._id,
              type: 'enrollment',
              title: 'New student enrolled',
              description: 'Registration Dept.',
              time: s.createdAt,
              icon: Users,
              iconColor: 'text-sky-500',
              ping: true
            })
          })
        }
      }

      // Generate enrollment trend data (moved outside to avoid hydration issues)
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const currentMonth = new Date().getMonth()
        const targetMonth = (currentMonth - i + 12) % 12
        return monthNames[targetMonth]
      }).reverse()

      const trend = last6Months.map((month, idx) => ({
        name: month,
        total: 10 + (idx * 2) // Use deterministic values instead of random
      }))
      setEnrollmentData(trend)

      // Classes
      if (classesRes.status === 'fulfilled' && classesRes.value.ok) {
        const data = await classesRes.value.json()
        if (Array.isArray(data)) {
          newStats.classes = data.length
        }
      }

      // Assignments
      if (assignmentsRes.status === 'fulfilled' && assignmentsRes.value.ok) {
        const data = await assignmentsRes.value.json()
        if (Array.isArray(data)) {
          newStats.assignments = data.length
          data.slice(0, 5).forEach((a: any) => {
            allActivities.push({
              id: a._id,
              type: 'assignment',
              title: `${a.title} Posted`,
              description: '',
              time: a.createdAt,
              icon: ClipboardList,
              iconColor: 'text-amber-500'
            })
          })
        }
      }

      // Messages
      if (messagesRes.status === 'fulfilled' && messagesRes.value.ok) {
        const data = await messagesRes.value.json()
        if (Array.isArray(data)) {
          newStats.messages = data.filter((m: any) => !m.isRead).length
        }
      }

      // Attendance
      if (attendanceRes.status === 'fulfilled' && attendanceRes.value.ok) {
        const data = await attendanceRes.value.json()
        if (Array.isArray(data)) {
          data.slice(0, 5).forEach((att: any) => {
            allActivities.push({
              id: att._id,
              type: 'attendance',
              title: `Attendance marked for ${att.classId?.name || 'Class'}`,
              description: '',
              time: att.createdAt || att.date,
              icon: Clock,
              iconColor: 'text-emerald-500'
            })
          })
        }
      }

      // Teachers (from Users)
      if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
        const data = await usersRes.value.json()
        if (Array.isArray(data)) {
          newStats.teachers = data.filter((u: any) => u.role === 'teacher').length
        }
      }

      // Courses
      if (coursesRes.status === 'fulfilled' && coursesRes.value.ok) {
        const data = await coursesRes.value.json()
        if (Array.isArray(data)) {
          newStats.courses = data.length
        }
      }

      // Sort activities by time desc
      const sortedActivities = allActivities
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 8)

      setActivities(sortedActivities)
      setStats(newStats)

    } catch (error) {
      console.error("Dashboard fetch error:", error)
      toast.error("Failed to update dashboard")
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: "Total Students",
      value: stats.students.toString(),
      icon: Users,
      color: "text-blue-600 bg-blue-100",
      show: true
    },
    {
      title: "Active Classes",
      value: stats.classes.toString(),
      icon: BookOpen,
      color: "text-emerald-600 bg-emerald-100",
      show: user?.role !== 'parent' // Parents don't manage classes usually
    },
    {
      title: "Total Teachers",
      value: (stats.teachers || 0).toString(),
      icon: GraduationCap,
      color: "text-pink-600 bg-pink-100",
      show: user?.role === 'admin'
    },
    {
      title: "Total Courses",
      value: (stats.courses || 0).toString(),
      icon: BookOpen,
      color: "text-orange-600 bg-orange-100",
      show: user?.role === 'admin'
    },
    {
      title: "Assignments", // Pending or Total
      value: stats.assignments.toString(),
      icon: ClipboardList,
      color: "text-amber-600 bg-amber-100",
      show: user?.role !== 'parent'
    },
    {
      title: "Unread Messages",
      value: stats.messages.toString(),
      icon: MessageSquare,
      color: "text-purple-600 bg-purple-100",
      show: true
    },
  ]

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-background text-foreground">
          <Sidebar />
          <main className="flex-1 ml-64 p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted w-1/3 rounded"></div>
              <div className="grid grid-cols-3 gap-6">
                <div className="h-40 bg-muted rounded"></div>
                <div className="h-40 bg-muted rounded"></div>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  // --- STUDENT VIEW ---
  if (user?.role === 'student') {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-background text-foreground">
          <Sidebar />
          <main className="flex-1 ml-64 overflow-y-auto">
            <div className="bg-primary/5 px-8 py-12 animate-in fade-in slide-in-from-top-4 duration-700">
              <h1 className="text-4xl font-bold mb-2 text-primary tracking-tight">Welcome back, {user?.firstName}!</h1>
              <p className="text-muted-foreground text-lg">Here is your academic overview for <span className="font-semibold text-foreground">{studentData.class?.name}</span>.</p>
            </div>

            <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Attendance Card */}
                <Card className="border-none shadow-xl bg-card/60 backdrop-blur-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                        <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      Attendance
                    </CardTitle>
                    <CardDescription>Your attendance record for this semester</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
                    <div className="relative h-44 w-44 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                      {/* Circular Progress Mockup with SVG */}
                      <svg className="h-full w-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-muted/20" />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - (studentData.attendancePercentage || 0) / 100)}`}
                          className="text-emerald-500 transition-all duration-1000 ease-out drop-shadow-md"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-5xl font-bold text-foreground tracking-tighter">{studentData.attendancePercentage || 0}%</span>
                        <span className="text-xs uppercase font-bold text-muted-foreground tracking-widest mt-1">Present</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground text-center max-w-[80%]">
                      You have attended <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">{studentData.attendanceStats?.present || 0}</span> out of {studentData.attendanceStats?.total || 0} days.
                    </p>
                  </CardContent>
                </Card>

                {/* Courses Card */}
                <Card className="border-none shadow-xl bg-card/60 backdrop-blur-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      My Courses
                    </CardTitle>
                    <CardDescription>Courses you are currently enrolled in</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                      {studentData.courses.map((course: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-accent/50 transition-all border border-transparent hover:border-border/50 group/item">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 text-blue-600 flex items-center justify-center font-bold text-sm shadow-sm group-hover/item:scale-110 transition-transform">
                              {course.code.substring(0, 3)}
                            </div>
                            <div>
                              <p className="font-semibold text-sm group-hover/item:text-primary transition-colors">{course.name}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {course.teacher}
                              </p>
                            </div>
                          </div>
                          <div className="text-xs font-mono font-medium bg-background/80 border px-2.5 py-1 rounded-md shadow-sm">
                            {course.code}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  // --- PARENT VIEW ---
  if (user?.role === 'parent') {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-background text-foreground">
          <Sidebar />
          <main className="flex-1 ml-64 overflow-y-auto">
            <div className="bg-primary/5 px-8 py-12 animate-in fade-in slide-in-from-top-4 duration-700">
              <h1 className="text-4xl font-bold mb-2 text-primary tracking-tight">Welcome, {user?.firstName}!</h1>
              <p className="text-muted-foreground text-lg">Here is the overview for your children.</p>
            </div>

            <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
              {/* Children Overview */}
              <h2 className="text-2xl font-bold tracking-tight">My Children</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {parentData.children.length > 0 ? (
                  parentData.children.map((child: any, idx: number) => (
                    <Card key={idx} className="border-none shadow-lg bg-card/60 backdrop-blur-sm hover:shadow-xl transition-all">
                      <CardHeader>
                        <CardTitle>{child.userId.firstName} {child.userId.lastName}</CardTitle>
                        <CardDescription>{child.enrollmentNumber}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center bg-muted/30 p-3 rounded-lg">
                            <span className="text-sm font-medium">Class</span>
                            <span className="text-sm text-foreground">{child.classId?.name || "Unassigned"}</span>
                          </div>
                          <div className="flex justify-between items-center bg-muted/30 p-3 rounded-lg">
                            <span className="text-sm font-medium">Attendance</span>
                            <span className={`text-sm font-bold ${child.attendancePercentage > 75 ? 'text-emerald-500' : 'text-amber-500'}`}>
                              {child.attendancePercentage}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center bg-muted/30 p-3 rounded-lg">
                            <span className="text-sm font-medium">Status</span>
                            <span className="text-sm capitalize">{child.status}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-10 bg-muted/20 rounded-xl">
                    <p className="text-muted-foreground">No children linked to your account yet.</p>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  // --- TEACHER / ADMIN VIEW ---
  // If teacher, show their specific classes but use similar layout to admin

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        <Sidebar />
        <main className="flex-1 ml-64 overflow-y-auto custom-scrollbar">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-primary to-blue-600 px-8 py-16 text-primary-foreground animate-in fade-in slide-in-from-top-4 duration-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none"></div>

            <div className="relative z-10">
              <h1 className="text-4xl font-bold mb-3 tracking-tight">Welcome back, {user?.firstName}! 👋</h1>
              <p className="opacity-90 text-lg font-light max-w-2xl">
                Here's your daily overview. You are logged in as <span className="font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-xs ml-1">{user?.role}</span>.
              </p>
            </div>
          </div>

          <div className="p-8 space-y-8 -mt-8 relative z-20">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
              {statCards.filter(card => card.show !== false).map((stat, index) => {
                const Icon = stat.icon
                return (
                  <Card key={index} className="hover:shadow-2xl hover:-translate-y-1 hover:bg-card hover:ring-1 hover:ring-primary/20 transition-all duration-300 border-none shadow-lg bg-card/80 backdrop-blur overflow-hidden group cursor-pointer">
                    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500`}>
                      <Icon className={`w-24 h-24 ${stat.color.replace('bg-', 'text-').split(' ')[0]}`} />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                        {stat.title}
                      </CardTitle>
                      <div className={`p-2.5 rounded-xl ${stat.color} shadow-sm group-hover:shadow-md transition-all`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {user?.role === 'admin' ? (
              // ADMIN ONLY CHARTS
              <div className="grid grid-cols-1 lg:grid-cols-7 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                {/* Main Chart */}
                <Card className="col-span-1 lg:col-span-4 shadow-xl border-none bg-card/60 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      School Overview
                    </CardTitle>
                    <CardDescription>Enrollment trends over the last 6 months</CardDescription>
                  </CardHeader>
                  <CardContent className="pl-0">
                    <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={enrollmentData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.1} />
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="name"
                            stroke="currentColor"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            className="text-muted-foreground"
                            dy={10}
                          />
                          <YAxis
                            stroke="currentColor"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                            className="text-muted-foreground"
                            dx={-10}
                          />
                          <Tooltip
                            cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
                            contentStyle={{
                              borderRadius: '12px',
                              border: 'none',
                              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                              backgroundColor: 'var(--card)',
                              color: 'var(--card-foreground)'
                            }}
                          />
                          <Bar
                            dataKey="total"
                            fill="url(#colorTotal)"
                            radius={[6, 6, 0, 0]}
                            className="hover:opacity-80 transition-opacity cursor-pointer"
                            animationDuration={1500}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions / Recent Activity */}
                <Card className="col-span-1 lg:col-span-3 shadow-xl border-none bg-card/60 backdrop-blur-sm flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-500" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>Latest updates across the system</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-auto custom-scrollbar pr-2 max-h-[400px]">
                    <div className="space-y-6">
                      {activities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                          <div className="p-4 bg-muted/50 rounded-full mb-3">
                            <AlertCircle className="w-8 h-8 text-muted-foreground/50" />
                          </div>
                          <p className="text-muted-foreground text-sm font-medium">No recent activity found.</p>
                        </div>
                      ) : (
                        activities.map((activity, i) => {
                          const Icon = activity.icon
                          const timeAgo = () => {
                            const diff = new Date().getTime() - new Date(activity.time).getTime()
                            const minutes = Math.floor(diff / 60000)
                            const hours = Math.floor(minutes / 60)
                            const days = Math.floor(hours / 24)

                            if (days > 0) return `${days}d ago`
                            if (hours > 0) return `${hours}h ago`
                            if (minutes > 0) return `${minutes}m ago`
                            return 'Just now'
                          }

                          return (
                            <div key={activity.id} className="flex gap-4 group">
                              <div className="relative flex flex-col items-center">
                                <span className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-background shadow-xs z-10 ${activity.ping ? 'bg-sky-100 ring-4 ring-sky-50 dark:bg-sky-900/30 dark:ring-sky-900/10' : 'bg-muted'}`}>
                                  {activity.ping && (
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-20"></span>
                                  )}
                                  <Icon className={`h-4 w-4 ${activity.iconColor || 'text-muted-foreground'}`} />
                                </span>
                                {i !== activities.length - 1 && (
                                  <div className="w-[2px] h-full bg-border/50 absolute top-9"></div>
                                )}
                              </div>

                              <div className="flex-1 pb-1 pt-0.5">
                                <p className="text-sm font-semibold leading-none group-hover:text-primary transition-colors">{activity.title}</p>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                  {activity.description}
                                </p>
                              </div>
                              <div className="text-xs font-mono text-muted-foreground/70 whitespace-nowrap self-start mt-1 bg-muted/30 px-2 py-0.5 rounded">
                                {timeAgo()}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              // TEACHER VIEW (My Classes)
              <div className="mt-8">
                <h2 className="text-2xl font-bold tracking-tight mb-4">My Classes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {teacherData.myClasses.length > 0 ? (
                    teacherData.myClasses.map((cls: any, idx: number) => (
                      <Card key={idx} className="border-none shadow-lg bg-card/60 backdrop-blur-sm hover:shadow-xl transition-all hover:border-primary/50 border hover:-translate-y-1">
                        <CardHeader>
                          <CardTitle>{cls.name}</CardTitle>
                          <CardDescription>{cls.academicYear} - {cls.section}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>{cls.studentCount || 0} / {cls.maxCapacity} Students</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-10 bg-muted/20 rounded-xl">
                      <p className="text-muted-foreground">You are not assigned to any classes yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
