"use client"

import { useState, useEffect } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Plus, Search, Filter, Download, CreditCard, DollarSign, Clock, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"

interface FeeRecord {
    _id: string
    studentId: {
        _id: string
        userId: {
            firstName: string
            lastName: string
        }
    }
    amount: number
    type: string
    date: string
    paymentMethod: string
    status: "Paid" | "Pending" | "Overdue"
    remarks?: string
    academicYear: string
}

export default function FeesPage() {
    const { token, user } = useAuth()
    const [fees, setFees] = useState<FeeRecord[]>([])
    const [students, setStudents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    // Form State
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [formData, setFormData] = useState({
        studentId: "",
        amount: "",
        type: "Tuition",
        paymentMethod: "Cash",
        status: "Paid",
        academicYear: "2023-2024",
        remarks: ""
    })

    useEffect(() => {
        if (token) {
            fetchFees()
            fetchStudents()
        }
    }, [token])

    const fetchFees = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/fees`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Unknown error" }))
                console.error("Fees fetch error:", response.status, errorData)
                throw new Error(errorData.message || `Failed to fetch fees (Status: ${response.status})`)
            }

            const data = await response.json()
            setFees(data)
        } catch (error: any) {
            console.error("Error fetching fees:", error)
            toast.error(error.message || "Error loading fees")
        } finally {
            setLoading(false)
        }
    }

    const fetchStudents = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.message || `Failed to fetch students (Status: ${response.status})`)
            }
            const data = await response.json()
            setStudents(data)
        } catch (error: any) {
            console.error("Error fetching students:", error)
            toast.error(error.message || "Error loading students")
        }
    }

    const handleAddFee = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.studentId || !formData.amount) {
            toast.error("Please fill in all required fields")
            return
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/fees`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                toast.success("Payment recorded successfully")
                setIsAddDialogOpen(false)
                setFormData({
                    studentId: "",
                    amount: "",
                    type: "Tuition",
                    paymentMethod: "Cash",
                    status: "Paid",
                    academicYear: "2023-2024",
                    remarks: ""
                })
                fetchFees()
            } else {
                const err = await response.json()
                toast.error(err.message || "Failed to record payment")
            }
        } catch (error) {
            toast.error("An error occurred")
        }
    }

    const handleExportCSV = () => {
        if (fees.length === 0) {
            toast.error("No records to export")
            return
        }

        const headers = ["Student Name", "Fee Type", "Amount", "Date", "Payment Method", "Status", "Academic Year"]
        const csvRows = fees.map(f => [
            `"${f.studentId?.userId?.firstName} ${f.studentId?.userId?.lastName}"`,
            `"${f.type}"`,
            f.amount,
            `"${format(new Date(f.date), "yyyy-MM-dd")}"`,
            `"${f.paymentMethod}"`,
            `"${f.status}"`,
            `"${f.academicYear}"`
        ].join(","))

        const csvContent = [headers.join(","), ...csvRows].join("\n")
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `fees_report_${format(new Date(), "yyyy-MM-dd")}.csv`)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success("Exporting CSV file...")
    }

    const filteredFees = fees.filter(f =>
        `${f.studentId?.userId?.firstName} ${f.studentId?.userId?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.type.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const stats = {
        total: fees.filter(f => f.status === "Paid").reduce((acc, f) => acc + f.amount, 0),
        pending: fees.filter(f => f.status === "Pending").reduce((acc, f) => acc + f.amount, 0),
        overdue: fees.filter(f => f.status === "Overdue").reduce((acc, f) => acc + f.amount, 0),
        count: fees.length
    }

    return (
        <ProtectedRoute>
            <div className="flex h-screen bg-background">
                <Sidebar />
                <main className="flex-1 ml-64 p-8 overflow-y-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                                Fee Management
                                <span className="text-[10px] bg-muted px-1 rounded font-normal text-muted-foreground opacity-20">v1.1</span>
                            </h1>
                            <p className="text-muted-foreground mt-1">Track student payments and financial records.</p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="gap-2" onClick={handleExportCSV}>
                                <Download className="h-4 w-4" /> Export
                            </Button>
                            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                                        <Plus className="h-4 w-4" /> Record Payment
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px]">
                                    <DialogHeader>
                                        <DialogTitle>Record New Payment</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleAddFee} className="space-y-4 py-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2 col-span-2">
                                                <Label>Student</Label>
                                                <Select onValueChange={(val) => setFormData({ ...formData, studentId: val })}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Student" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {students.map(s => (
                                                            <SelectItem key={s._id} value={s._id}>
                                                                {s.userId?.firstName} {s.userId?.lastName} ({s.enrollmentNumber})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Amount ($)</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={formData.amount}
                                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Fee Type</Label>
                                                <Select defaultValue="Tuition" onValueChange={(val) => setFormData({ ...formData, type: val })}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Tuition">Tuition</SelectItem>
                                                        <SelectItem value="Uniform">Uniform</SelectItem>
                                                        <SelectItem value="Transportation">Transportation</SelectItem>
                                                        <SelectItem value="Exams">Exams</SelectItem>
                                                        <SelectItem value="Library">Library</SelectItem>
                                                        <SelectItem value="Other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Payment Method</Label>
                                                <Select defaultValue="Cash" onValueChange={(val) => setFormData({ ...formData, paymentMethod: val })}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Cash">Cash</SelectItem>
                                                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                                        <SelectItem value="Card">Card</SelectItem>
                                                        <SelectItem value="Online">Online</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Status</Label>
                                                <Select defaultValue="Paid" onValueChange={(val: any) => setFormData({ ...formData, status: val })}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Paid">Paid</SelectItem>
                                                        <SelectItem value="Pending">Pending</SelectItem>
                                                        <SelectItem value="Overdue">Overdue</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Remarks</Label>
                                            <Input
                                                placeholder="Optional details..."
                                                value={formData.remarks}
                                                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                            />
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" className="w-full">Save Payment Record</Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                        <Card className="bg-emerald-500/10 border-emerald-500/20 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-emerald-600">Total Collected</CardTitle>
                                <DollarSign className="h-4 w-4 text-emerald-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-emerald-700">${stats.total.toLocaleString()}</div>
                                <p className="text-xs text-emerald-600/70 mt-1">Net revenue to date</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-amber-500/10 border-amber-500/20 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-amber-600">Pending</CardTitle>
                                <Clock className="h-4 w-4 text-amber-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-amber-700">${stats.pending.toLocaleString()}</div>
                                <p className="text-xs text-amber-600/70 mt-1">Awaiting confirmation</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-rose-500/10 border-rose-500/20 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-rose-600">Overdue</CardTitle>
                                <Filter className="h-4 w-4 text-rose-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-rose-700">${stats.overdue.toLocaleString()}</div>
                                <p className="text-xs text-rose-600/70 mt-1">Outstanding balances</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-blue-500/10 border-blue-500/20 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-blue-600">Transactions</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-700">{stats.count}</div>
                                <p className="text-xs text-blue-600/70 mt-1">Total records processed</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="bg-card rounded-xl border shadow-sm animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        <div className="p-4 border-b flex items-center gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by student name or fee type..."
                                    className="pl-10 h-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead>Student</TableHead>
                                    <TableHead>Fee Type</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">Loading fee records...</TableCell>
                                    </TableRow>
                                ) : filteredFees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">No fee records found.</TableCell>
                                    </TableRow>
                                ) : (
                                    filteredFees.map((fee) => (
                                        <TableRow key={fee._id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell>
                                                <div className="font-semibold">{fee.studentId?.userId?.firstName} {fee.studentId?.userId?.lastName}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{fee.type}</Badge>
                                            </TableCell>
                                            <TableCell className="font-medium text-primary">${fee.amount.toLocaleString()}</TableCell>
                                            <TableCell className="text-muted-foreground">{format(new Date(fee.date), "MMM d, yyyy")}</TableCell>
                                            <TableCell>{fee.paymentMethod}</TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    fee.status === "Paid" ? "default" :
                                                        fee.status === "Pending" ? "secondary" : "destructive"
                                                }>
                                                    {fee.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm">Details</Button>
                                            </TableCell>
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
