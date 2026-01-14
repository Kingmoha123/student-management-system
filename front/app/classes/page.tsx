"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Sidebar } from "@/components/Sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Search, Plus, Users, Calendar, BookOpen, GraduationCap, LayoutGrid, Edit, Trash2, MoreVertical } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
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

interface Class {
  _id: string
  name: string
  description: string
  teacherId: {
    _id: string
    firstName: string
    lastName: string
  }
  academicYear: string
  section: string
  maxCapacity: number
}

export default function ClassesPage() {
  const { user, token } = useAuth()
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [teachers, setTeachers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')

  // UI State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [classToDelete, setClassToDelete] = useState<string | null>(null)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    teacherId: "",
    academicYear: new Date().getFullYear().toString(),
    section: "",
    maxCapacity: 30,
  })

  useEffect(() => {
    if (token) {
      fetchClasses().then(() => {
        if (editId && classes.length > 0) {
          const cls = classes.find(c => c._id === editId)
          if (cls) openEditDialog(cls)
        }
      })
      fetchTeachers()
    }
  }, [token])

  // Separate effect for editId because classes might load later
  useEffect(() => {
    if (editId && classes.length > 0) {
      const cls = classes.find(c => c._id === editId)
      if (cls && !isEditDialogOpen) {
        openEditDialog(cls)
      }
    }
  }, [editId, classes])

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
      toast.error("Failed to load classes")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeachers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to fetch teachers")
      const data = await response.json()
      if (Array.isArray(data)) {
        setTeachers(data.filter((u: any) => u.role === "teacher"))
      } else {
        console.error("Fetched teachers is not an array:", data)
        setTeachers([])
      }
    } catch (error) {
      console.error("Failed to fetch teachers:", error)
    }
  }

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.teacherId) {
      toast.error("Please assign a teacher to this class")
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/classes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success("Class created successfully")
        setFormData({
          name: "",
          description: "",
          teacherId: "",
          academicYear: new Date().getFullYear().toString(),
          section: "",
          maxCapacity: 30,
        })
        setIsCreateDialogOpen(false)
        fetchClasses()
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || "Failed to create class")
      }
    } catch (error) {
      toast.error("An error occurred")
      console.error(error)
    }
  }

  const handleEditClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClass) return

    if (!formData.teacherId) {
      toast.error("Please assign a teacher to this class")
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/classes/${selectedClass._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success("Class updated successfully")
        setIsEditDialogOpen(false)
        fetchClasses()
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || "Failed to update class")
      }
    } catch (error) {
      toast.error("An error occurred")
      console.error(error)
    }
  }

  const handleDeleteClass = async () => {
    if (!classToDelete) return
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/classes/${classToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        toast.success("Class deleted successfully")
        setClasses(prev => prev.filter(c => c._id !== classToDelete))
      } else {
        toast.error("Failed to delete class")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setClassToDelete(null)
    }
  }

  const openEditDialog = (cls: Class) => {
    setSelectedClass(cls)
    setFormData({
      name: cls.name || "",
      description: cls.description || "",
      teacherId: typeof cls.teacherId === 'object' ? (cls.teacherId as any)?._id || "" : (cls.teacherId || ""),
      academicYear: cls.academicYear || new Date().getFullYear().toString(),
      section: cls.section || "",
      maxCapacity: cls.maxCapacity || 30,
    })
    setIsEditDialogOpen(true)
  }

  const openCreateDialog = () => {
    setFormData({
      name: "",
      description: "",
      teacherId: "",
      academicYear: new Date().getFullYear().toString(),
      section: "",
      maxCapacity: 30,
    })
    setIsCreateDialogOpen(true)
  }

  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cls.teacherId?.firstName + " " + cls.teacherId?.lastName).toLowerCase().includes(searchTerm.toLowerCase())
  )

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
      <div className="flex h-screen bg-background text-foreground">
        <Sidebar />
        <main className="flex-1 ml-64 overflow-y-auto">
          {/* Header Section */}
          <div className="bg-primary/5 border-b px-8 py-12">
            <div className="flex justify-between items-center max-w-7xl mx-auto">
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Academic Classes</h1>
                <p className="text-muted-foreground mt-2 text-lg">Manage sections, teacher assignments, and enrollment capacities.</p>
              </div>
              {user?.role === "admin" && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <Button size="lg" className="shadow-lg hover:shadow-primary/20 transition-all" onClick={openCreateDialog}>
                    <Plus className="mr-2 h-5 w-5" /> Create Class
                  </Button>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle className="text-2xl">Create New Class</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateClass} className="space-y-6 py-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Class Name</Label>
                          <Input
                            placeholder="e.g. Grade 10-A"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="bg-muted/50"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            placeholder="Brief description of the class context..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="bg-muted/50 resize-none"
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Assigned Teacher</Label>
                          <Select
                            value={formData.teacherId}
                            onValueChange={(val) => setFormData({ ...formData, teacherId: val })}
                          >
                            <SelectTrigger className="bg-muted/50">
                              <SelectValue placeholder="Select a teacher" />
                            </SelectTrigger>
                            <SelectContent>
                              {teachers.map(t => (
                                <SelectItem key={t._id} value={t._id}>
                                  {t.firstName} {t.lastName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Academic Year</Label>
                            <Input
                              value={formData.academicYear}
                              onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                              className="bg-muted/50 text-center"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Section</Label>
                            <Input
                              value={formData.section}
                              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                              placeholder="e.g. A"
                              className="bg-muted/50 text-center"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Capacity</Label>
                            <Input
                              type="number"
                              value={formData.maxCapacity}
                              onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) })}
                              className="bg-muted/50 text-center"
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="w-full h-11 text-lg">Create Class</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}

              {/* Edit Class Dialog */}
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">Edit Class: {selectedClass?.name}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleEditClass} className="space-y-6 py-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Class Name</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="bg-muted/50"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="bg-muted/50 resize-none"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Assigned Teacher</Label>
                        <Select
                          value={formData.teacherId}
                          onValueChange={(val) => setFormData({ ...formData, teacherId: val })}
                        >
                          <SelectTrigger className="bg-muted/50">
                            <SelectValue placeholder="Select a teacher" />
                          </SelectTrigger>
                          <SelectContent>
                            {teachers.map(t => (
                              <SelectItem key={t._id} value={t._id}>
                                {t.firstName} {t.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Academic Year</Label>
                          <Input
                            value={formData.academicYear}
                            onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                            className="bg-muted/50 text-center"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Section</Label>
                          <Input
                            value={formData.section}
                            onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                            className="bg-muted/50 text-center"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Capacity</Label>
                          <Input
                            type="number"
                            value={formData.maxCapacity}
                            onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) })}
                            className="bg-muted/50 text-center"
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="w-full h-11 text-lg">Update Class</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Search and Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, teacher or section..."
                  className="pl-10 bg-muted/30 border-none focus-visible:ring-1"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <LayoutGrid className="h-4 w-4" />
                <span>Showing {filteredClasses.length} classes</span>
              </div>
            </div>

            {/* Classes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <Card key={i} className="animate-pulse bg-muted/20 h-64 border-dashed" />
                ))
              ) : filteredClasses.length === 0 ? (
                <div className="col-span-full py-20 text-center space-y-4">
                  <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
                  <h3 className="text-xl font-semibold text-muted-foreground">No classes found</h3>
                  <p className="text-muted-foreground">Adjust your search or create a new class to get started.</p>
                </div>
              ) : (
                filteredClasses.map((cls) => (
                  <Card key={cls._id} className="group flex flex-col overflow-hidden border-none shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-card/60 backdrop-blur-sm ring-1 ring-foreground/5">
                    <div className="h-1.5 bg-gradient-to-r from-primary to-primary/60" />
                    <CardHeader className="pb-2">
                      <CardTitle className="text-2xl font-bold tracking-tight text-primary">
                        {cls.name}
                      </CardTitle>
                      <CardDescription className="text-sm font-medium text-muted-foreground line-clamp-2 min-h-[40px]">
                        {cls.description || "Welcome to the class"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4 pb-6">
                      <div className="flex items-center">
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">
                          Sec {cls.section || 'A'}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span className="font-medium text-foreground">Teacher:</span>
                          <span>{cls.teacherId ? `${cls.teacherId.firstName} ${cls.teacherId.lastName}` : "Unassigned"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium text-foreground">Year:</span>
                          <span>{cls.academicYear}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <BookOpen className="h-4 w-4" />
                          <span className="font-medium text-foreground">Capacity:</span>
                          <span>{cls.maxCapacity}</span>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="p-4 pt-0 gap-3">
                      <Link href={`/classes/${cls._id}`} className="flex-1">
                        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm">
                          View Details
                        </Button>
                      </Link>

                      {user?.role === "admin" && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 border-muted-foreground/20 hover:border-primary/50 hover:text-primary"
                            onClick={() => openEditDialog(cls)}
                            title="Edit Class"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 border-muted-foreground/20 hover:border-destructive/50 hover:text-destructive hover:bg-destructive/5"
                            onClick={() => setClassToDelete(cls._id)}
                            title="Delete Class"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      <AlertDialog open={!!classToDelete} onOpenChange={(open) => !open && setClassToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the class and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClass} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Class
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  )
}
