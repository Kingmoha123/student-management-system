"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Sidebar } from "@/components/Sidebar"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, Check, CheckCircle2, Circle, UserCheck } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"

interface AttendanceRecord {
  _id: string
  studentId: {
    _id: string
    userId: {
      firstName: string
      lastName: string
    }
  }
  classId: string
  date: string
  status: "present" | "absent" | "late" | "excused"
}

export default function AttendancePage() {
  const { user, token } = useAuth()
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState<any[]>([])

  // Filter State
  const [selectedClass, setSelectedClass] = useState("")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [classStudents, setClassStudents] = useState<any[]>([])

  useEffect(() => {
    if (token) {
      fetchClasses()
    }
  }, [token])

  useEffect(() => {
    if (selectedClass && token) {
      fetchAttendance(selectedClass)
      fetchClassStudents(selectedClass)
    }
  }, [selectedClass, token, date])

  const fetchClasses = async () => {
    if (!token) return
    try {
      // If teacher, ideally fetch only their classes, but filter client side if needed or use backend support
      // For now fetching all classes is fine for Admin, strict filtering for Teacher 
      // might be done in backend or we filter here if user is teacher. 
      // However previous logic was simpler. Let's stick to endpoint.
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/classes`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to fetch classes")
      const data = await response.json()
      if (Array.isArray(data)) {
        // Optional: Filter for teacher if we want to enforce it strictly on UI
        // if (user?.role === 'teacher') { 
        //    setClasses(data.filter(c => c.teacherId?._id === user.id || c.teacherId === user.id))
        // } else { setClasses(data) }
        setClasses(data)

        if (data.length > 0 && !selectedClass) {
          setSelectedClass(data[0]._id)
        }
      } else {
        setClasses([])
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error)
    }
  }

  const fetchAttendance = async (classId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/attendance/class/${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to fetch attendance")
      const data = await response.json()

      let filtered = []
      if (Array.isArray(data)) {
        filtered = data
        if (date) {
          const selectedDateStr = format(date, "yyyy-MM-dd")
          filtered = data.filter((record: AttendanceRecord) =>
            new Date(record.date).toISOString().split('T')[0] === selectedDateStr
          )
        }
      }
      setAttendance(filtered)
    } catch (error) {
      toast.error("Failed to fetch attendance")
    } finally {
      setLoading(false)
    }
  }

  const fetchClassStudents = async (classId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to fetch class students")
      const data = await response.json()
      if (Array.isArray(data)) {
        const filtered = data.filter((s: any) => s.classId?._id === classId || s.classId === classId)
        setClassStudents(filtered)
      } else {
        setClassStudents([])
      }
    } catch (error) {
      console.error("Failed to fetch class students", error)
    }
  }

  // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const handleToggleStatus = (studentId: string, currentStatus: string | undefined) => {
    // Permission Check: Only Teacher can mark
    if (user?.role !== 'teacher') {
      toast.error("Only teachers can mark attendance.")
      return
    }

    if (!date || !selectedClass) return

    const newStatus = currentStatus === "present" ? "absent" : "present"
    setHasUnsavedChanges(true)

    setAttendance(prev => {
      const index = prev.findIndex(r => r.studentId._id === studentId)
      if (index >= 0) {
        // Update existing record in local state
        const newArr = [...prev]
        newArr[index] = { ...newArr[index], status: newStatus as "present" | "absent" }
        return newArr
      }
      // Add new record to local state (optimistic)
      // We need a temporary structure until saved
      const mockRecord: any = {
        _id: `temp-${Date.now()}`,
        studentId: { _id: studentId, userId: { firstName: "", lastName: "" } }, // Minimal data needed for ID matching
        classId: selectedClass,
        date: format(date, "yyyy-MM-dd"),
        status: newStatus
      }
      return [...prev, mockRecord]
    })
  }

  const handleSaveAttendance = async () => {
    if (!date || !selectedClass) return

    // We need to construct the payload for ALL students in the class
    // For those in 'attendance' array, use their status.
    // For those NOT in 'attendance' array, they are technically 'absent' if we are marking for today,
    // OR we only send the ones that are explicitly present spread across all? 
    // The Bulk API expects items to upsert.
    // To ensure "Absent" is recorded if unchecked, we should iterate through classStudents.

    const itemsToSave = classStudents.map(student => {
      const record = attendance.find(r => r.studentId._id === student._id)
      // If record exists, use its status (present/absent)
      // If record DOES NOT exist, it means it's 'absent' (default state if not marked present) or we can leave it null.
      // However, often "unmarked" is diff from "absent". 
      // But assuming the user sees "Absence" as an empty circle, and "Present" as checked.
      // If I toggle ON then OFF, record exists as 'absent'.
      // If never toggled, record is undefined.
      // If I want to save the state of the whole class as seen:
      const status = record ? record.status : 'absent'

      return {
        studentId: student._id,
        classId: selectedClass,
        date: format(date, "yyyy-MM-dd"),
        status: status
      }
    })

    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/attendance/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: itemsToSave }),
      })

      if (response.ok) {
        toast.success("Attendance saved successfully")
        setHasUnsavedChanges(false)
        fetchAttendance(selectedClass) // Refresh to get real IDs etc
      } else {
        const err = await response.json()
        toast.error(err.message || "Failed to save attendance")
      }
    } catch (error) {
      console.error(error)
      toast.error("Error saving attendance")
    } finally {
      setLoading(false)
    }
  }

  // Calculate stats for Admin Report
  const stats = {
    total: classStudents.length,
    present: attendance.filter(r => r.status === 'present').length,
    absent: classStudents.length - attendance.filter(r => r.status === 'present').length
  }
  const percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0

  if (user?.role !== "admin" && user?.role !== "teacher") {
    return (
      <ProtectedRoute>
        <div className="flex bg-background">
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
      <div className="flex h-screen bg-background text-foreground">
        <Sidebar />
        <main className="flex-1 ml-64 p-8 overflow-y-auto w-full">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {user?.role === 'admin' ? "Attendance Report" : "Daily Attendance"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {user?.role === 'admin' ? "View daily attendance records and statistics." : "Mark student attendance for the day."}
              </p>
            </div>
            {user?.role === 'teacher' && (
              <Button
                onClick={handleSaveAttendance}
                disabled={!hasUnsavedChanges && attendance.length === 0} // Allow save if populated
                className={cn("bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg transition-all", hasUnsavedChanges ? "animate-pulse ring-2 ring-emerald-400 ring-offset-2" : "")}
              >
                <Check className="mr-2 h-4 w-4" /> Save Attendance
              </Button>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6 bg-card p-4 rounded-xl border shadow-sm items-end animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2 w-full md:w-1/3">
              <Label>Select Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="h-11 bg-muted/30">
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
              <Label>Select Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal h-11 bg-muted/30",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            {user?.role === 'teacher' && (
              <div className="w-full md:w-1/3 pb-1">
                <p className="text-xs text-muted-foreground mb-2 text-center">Tap circles to toggle. Click Save when done.</p>
              </div>
            )}
            {user?.role === 'admin' && (
              <div className="w-full md:w-1/3 flex items-center justify-center gap-4 pb-2">
                <div className="text-center">
                  <span className="block text-2xl font-bold text-emerald-600">{stats.present}</span>
                  <span className="text-xs text-muted-foreground">Present</span>
                </div>
                <div className="h-8 w-px bg-border"></div>
                <div className="text-center">
                  <span className="block text-2xl font-bold text-rose-600">{stats.absent}</span>
                  <span className="text-xs text-muted-foreground">Absent</span>
                </div>
                <div className="h-8 w-px bg-border"></div>
                <div className="text-center">
                  <span className="block text-2xl font-bold text-blue-600">{percentage}%</span>
                  <span className="text-xs text-muted-foreground">Rate</span>
                </div>
              </div>
            )}
          </div>

          <Card className="border-none shadow-md bg-white dark:bg-card/50 overflow-hidden">
            <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">
                  Student List - {date ? format(date, "MMMM d, yyyy") : ""}
                </h3>
              </div>
              <Badge variant="outline" className="bg-background/50">
                {classStudents.length} Students
              </Badge>
            </div>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                    <tr>
                      <th className="px-6 py-4 font-medium w-16">#</th>
                      <th className="px-6 py-4 font-medium">Student Name</th>
                      <th className="px-6 py-4 font-medium text-right w-32 tracking-wider">
                        {user?.role === 'teacher' ? "Mark Present" : "Status"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">
                          Loading...
                        </td>
                      </tr>
                    ) : classStudents.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">
                          No students found in this class.
                        </td>
                      </tr>
                    ) : (
                      classStudents.map((student, index) => {
                        const record = attendance.find(r => r.studentId._id === student._id)
                        const isPresent = record ? record.status === 'present' : false

                        return (
                          <tr
                            key={student._id}
                            className={cn(
                              "hover:bg-muted/30 transition-colors group",
                              isPresent ? "bg-emerald-50/50 dark:bg-emerald-900/10" : ""
                            )}
                          >
                            <td className="px-6 py-4 font-mono text-muted-foreground">{index + 1}</td>
                            <td className="px-6 py-4 font-medium text-foreground">
                              {student.userId?.firstName} {student.userId?.lastName}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {user?.role === 'teacher' ? (
                                <button
                                  onClick={() => handleToggleStatus(student._id, record?.status)}
                                  className="inline-flex items-center justify-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                                >
                                  {isPresent ? (
                                    <CheckCircle2 className="h-7 w-7 text-emerald-500 fill-emerald-100 dark:fill-emerald-900 shadow-sm" />
                                  ) : (
                                    <Circle className="h-7 w-7 text-muted-foreground/30 hover:text-emerald-500/50" />
                                  )}
                                </button>
                              ) : (
                                // Admin View (Read Only)
                                <div className="flex justify-end">
                                  {isPresent ? (
                                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none shadow-none px-3">
                                      <Check className="w-3 h-3 mr-1" /> Present
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-muted-foreground border-muted shadow-none opacity-70">
                                      Absent
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

        </main>
      </div>
    </ProtectedRoute>
  )
}
