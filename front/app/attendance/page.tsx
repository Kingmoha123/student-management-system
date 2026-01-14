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
import { Checkbox } from "@/components/ui/checkbox"
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
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, Plus } from "lucide-react"
import { toast } from "sonner"

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
  remarks?: string
}

export default function AttendancePage() {
  const { user, token } = useAuth()
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState<any[]>([])

  // Filter State
  const [selectedClass, setSelectedClass] = useState("")
  const [date, setDate] = useState<Date | undefined>(new Date())

  // We should also fetch students for the selected class to populate the Student ID dropdown if possible,

  // We should also fetch students for the selected class to populate the Student ID dropdown if possible,
  // but for now keeping it simple as per original code structure, or maybe fetching students of the class is better.
  // The original code used a text input for studentId, which is bad UX. I will try to fetch students for the selected class.
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
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/classes`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to fetch classes")
      const data = await response.json()
      if (Array.isArray(data)) {
        setClasses(data)
        if (data.length > 0 && !selectedClass) {
          setSelectedClass(data[0]._id)
        }
      } else {
        console.error("Fetched classes is not an array:", data)
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

      // Filter client-side by date if API doesn't support it
      // Assuming API returns all attendance for the class
      // Date comparison: check if record.date matches selected date
      let filtered = []
      if (Array.isArray(data)) {
        filtered = data
        if (date) {
          const selectedDateStr = format(date, "yyyy-MM-dd")
          filtered = data.filter((record: AttendanceRecord) =>
            new Date(record.date).toISOString().split('T')[0] === selectedDateStr
          )
        }
      } else {
        console.error("Fetched attendance is not an array:", data)
      }

      setAttendance(filtered)
    } catch (error) {
      toast.error("Failed to fetch attendance")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Helper to fetch students for the dropdown
  const fetchClassStudents = async (classId: string) => {
    try {
      // Ideally we would have an endpoint /api/students?classId=... 
      // But the previous page suggested /api/students returns all. 
      // Let's fetch all and filter.
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to fetch class students")
      const data = await response.json()
      if (Array.isArray(data)) {
        const filtered = data.filter((s: any) => s.classId?._id === classId || s.classId === classId)
        setClassStudents(filtered)
      } else {
        console.error("Fetched students is not an array:", data)
        setClassStudents([])
      }
    } catch (error) {
      console.error("Failed to fetch class students", error)
    }
  }


  const handleToggleStatus = async (studentId: string, isPresent: boolean) => {
    if (!date || !selectedClass) return

    const status = isPresent ? "present" : "absent"

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId,
          classId: selectedClass,
          date: format(date, "yyyy-MM-dd"),
          status,
        }),
      })

      if (response.ok) {
        const updatedRecord = await response.json()
        setAttendance(prev => {
          const index = prev.findIndex(r => r.studentId._id === studentId)
          if (index >= 0) {
            const newArr = [...prev]
            newArr[index] = updatedRecord
            return newArr
          }
          return [...prev, updatedRecord]
        })
      } else {
        toast.error("Failed to update status")
      }
    } catch (error) {
      console.error(error)
      toast.error("Error updating status")
    }
  }

  const markAllPresent = async () => {
    if (!selectedClass || !date) return

    toast.info("Marking all students as present...")

    try {
      const promises = classStudents.map(s =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/attendance`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            studentId: s._id,
            classId: selectedClass,
            date: format(date, "yyyy-MM-dd"),
            status: "present",
          }),
        })
      )

      await Promise.all(promises)
      fetchAttendance(selectedClass)
      toast.success("All students marked present")
    } catch (error) {
      console.error(error)
      toast.error("An error occurred")
    }
  }

  if (user?.role !== "admin" && user?.role !== "teacher") {
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
              <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
              <p className="text-muted-foreground mt-1">Monitor and record student attendance.</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6 bg-card p-4 rounded-lg border items-end animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <div className="space-y-2 w-full md:w-1/3">
              <Label>Select Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="h-11">
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
              <Label>Record Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal h-11",
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
            <div className="w-full md:w-1/3">
              <Button variant="outline" className="w-full h-11 border-dashed" onClick={markAllPresent}>
                Mark All Present
              </Button>
            </div>
          </div>

          <div className="rounded-xl border bg-card shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>ID Number</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="text-right">Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        <p className="text-muted-foreground">Loading attendance data...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : classStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No students found in this class.
                    </TableCell>
                  </TableRow>
                ) : (
                  classStudents.map((student) => {
                    const record = attendance.find(r => r.studentId._id === student._id)
                    const isPresent = record ? record.status === 'present' : false

                    return (
                      <TableRow key={student._id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="flex items-center justify-center">
                            <Checkbox
                              checked={isPresent}
                              onCheckedChange={(checked) => handleToggleStatus(student._id, !!checked)}
                              className="h-6 w-6 border-2 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold">{student.userId?.firstName} {student.userId?.lastName}</span>
                            <span className="text-xs text-muted-foreground">{student.userId?.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{student.enrollmentNumber}</TableCell>
                        <TableCell>
                          <Badge variant={isPresent ? "secondary" : "destructive"} className="capitalize">
                            {record ? record.status : "No Record"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {record ? format(new Date(record.date), "MMM d, yyyy") : "—"}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
