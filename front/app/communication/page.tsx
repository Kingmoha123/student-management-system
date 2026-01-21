"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Sidebar } from "@/components/Sidebar"
import { MobileSidebar } from "@/components/MobileSidebar"
import { useAuth } from "@/context/AuthContext"
import { format } from "date-fns"
import { toast } from "sonner"
import { Search, PenSquare, Mail, User, Clock, CheckCircle2, MoreVertical, Reply, Trash2, Send } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface Message {
  _id: string
  senderId: {
    _id: string
    firstName: string
    lastName: string
    role: string
  }
  recipientId: {
    _id: string
    firstName: string
    lastName: string
  }
  subject: string
  message: string
  isRead: boolean
  createdAt: string
}

interface User {
  _id: string
  firstName: string
  lastName: string
  role: string
}

export default function CommunicationPage() {
  const { user, token } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)

  // Compose State
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [composeForm, setComposeForm] = useState({
    recipientId: "",
    subject: "",
    message: "",
  })

  // Users for recipient selection
  const [users, setUsers] = useState<User[]>([])
  const [studentProfile, setStudentProfile] = useState<any>(null)

  useEffect(() => {
    if (token) {
      fetchMessages()
      fetchUsers()
      if (user?.role === 'student') {
        fetchStudentProfile()
      }
    }
  }, [token, user?.role])

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/communication/inbox`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to fetch messages")
      const data = await response.json()
      if (Array.isArray(data)) {
        setMessages(data)
      } else {
        console.error("Fetched messages is not an array:", data)
        setMessages([])
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error)
      toast.error("Failed to load inbox")
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to fetch users")
      const data = await response.json()
      if (Array.isArray(data)) {
        setUsers(data)
      } else {
        console.error("Fetched users is not an array:", data)
        setUsers([])
      }
    } catch (error) {
      console.error("Failed to fetch users", error)
    }
  }

  const fetchStudentProfile = async () => {
    if (!token) return
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to fetch profile")
      const data = await response.json()
      setStudentProfile(data)
    } catch (error) {
      console.error("Failed to fetch student profile", error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/communication/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...composeForm,
          senderId: user?.id
        }),
      })

      if (response.ok) {
        toast.success("Message sent successfully")
        setComposeForm({ recipientId: "", subject: "", message: "" })
        setIsComposeOpen(false)
        fetchMessages() // Refresh inbox? Or sent items? Assuming inbox for now.
      } else {
        toast.error("Failed to send message")
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    }
  }

  const handleMarkAsRead = async (message: Message) => {
    if (message.isRead) return;
    // Optimistic update
    setMessages(prev => prev.map(m => m._id === message._id ? { ...m, isRead: true } : m));
    // API call placeholder - assumes backend marks read on fetch or dedicated endpoint
  }

  const filteredUsers = Array.isArray(users) ? users.filter(u => {
    if (u._id === user?.id) return false;

    // If student, only show their parent and teachers
    if (user?.role === 'student') {
      const parentId = typeof studentProfile?.parentId === 'object' ? studentProfile.parentId?._id : studentProfile?.parentId;
      return u._id === parentId || u.role === 'teacher';
    }

    return true;
  }) : [];

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background text-foreground">
        <Sidebar />
        <main className="flex-1 md:ml-64 flex flex-col h-screen overflow-hidden relative">
          <div className="md:hidden absolute top-[1.3rem] left-4 z-50">
            <MobileSidebar />
          </div>
          {/* Header */}
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
              <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PenSquare className="mr-2 h-4 w-4" /> Compose
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>New Message</DialogTitle>
                    <DialogDescription>Send a message to another user.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSendMessage} className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label>Recipient</Label>
                      <Select
                        value={composeForm.recipientId}
                        onValueChange={(val) => setComposeForm({ ...composeForm, recipientId: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Recipient" />
                        </SelectTrigger>
                        <SelectContent>
                          <ScrollArea className="h-[200px]">
                            {filteredUsers.map(u => (
                              <SelectItem key={u._id} value={u._id}>
                                {u.firstName} {u.lastName} ({u.role})
                              </SelectItem>
                            ))}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Input
                        placeholder="Enter subject"
                        value={composeForm.subject}
                        onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Message</Label>
                      <Textarea
                        placeholder="Type your message here..."
                        value={composeForm.message}
                        onChange={(e) => setComposeForm({ ...composeForm, message: e.target.value })}
                        rows={5}
                        required
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit">
                        <Send className="mr-2 h-4 w-4" /> Send Message
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          {/* Split View */}
          <div className="flex flex-1 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            {/* Conversations List */}
            <div className="w-1/3 border-r bg-muted/10 flex flex-col">
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search messages..." className="pl-8 bg-background" />
                </div>
              </div>
              <ScrollArea className="flex-1">
                {loading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">Loading inbox...</div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Mail className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p>No messages found.</p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {messages.filter(m => {
                      if (user?.role !== 'student' || !studentProfile) return true;
                      const parentId = typeof studentProfile?.parentId === 'object' ? studentProfile.parentId?._id : studentProfile?.parentId;
                      return m.senderId?._id === parentId || m.senderId === parentId || m.senderId?.role === 'teacher';
                    }).map((message) => (
                      <button
                        key={message._id}
                        onClick={() => {
                          setSelectedMessage(message);
                          handleMarkAsRead(message);
                        }}
                        className={`flex flex-col items-start gap-2 p-4 text-left border-b hover:bg-muted/50 transition-colors ${selectedMessage?._id === message._id ? "bg-muted" : ""
                          }`}
                      >
                        <div className="flex w-full flex-col gap-1">
                          <div className="flex items-center">
                            <div className="flex items-center gap-2">
                              <div className="font-semibold">
                                {message.senderId?.firstName || 'Unknown'} {message.senderId?.lastName || 'User'}
                              </div>
                              {!message.isRead && <span className="flex h-2 w-2 rounded-full bg-blue-600" />}
                            </div>
                            <div className="ml-auto text-xs text-muted-foreground">
                              {format(new Date(message.createdAt), "MMM d, p")}
                            </div>
                          </div>
                          <div className="text-xs font-medium">{message.subject}</div>
                        </div>
                        <div className="line-clamp-2 text-xs text-muted-foreground">
                          {message.message.substring(0, 300)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Message Detail View */}
            <div className="flex-1 flex flex-col h-full bg-background">
              {selectedMessage ? (
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start p-6 border-b">
                    <div className="flex items-start gap-4 text-sm">
                      <Avatar>
                        <AvatarImage alt={selectedMessage.senderId?.firstName || 'User'} />
                        <AvatarFallback>{selectedMessage.senderId?.firstName?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="grid gap-1">
                        <div className="font-semibold">
                          {selectedMessage.senderId?.firstName || 'Unknown'} {selectedMessage.senderId?.lastName || 'User'}
                        </div>
                        <div className="line-clamp-1 text-xs text-muted-foreground">{selectedMessage.subject}</div>
                        <div className="line-clamp-1 text-xs text-muted-foreground">
                          To: <span className="font-medium text-foreground">{user?.role === 'admin' ? 'Me (Admin)' : 'Me'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-auto text-xs text-muted-foreground">
                      {format(new Date(selectedMessage.createdAt), "PPP p")}
                    </div>
                  </div>
                  <Separator />
                  <div className="flex-1 whitespace-pre-wrap p-6 text-sm">
                    {selectedMessage.message}
                  </div>
                  <Separator />
                  <div className="p-4 bg-muted/10">
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (!selectedMessage.senderId) {
                        toast.error("Cannot reply: Sender information is missing");
                        return;
                      }

                      // Reply logic would go here - prepopulate compose
                      setComposeForm({
                        recipientId: selectedMessage.senderId._id,
                        subject: `Re: ${selectedMessage.subject}`,
                        message: `\n\n--- On ${new Date(selectedMessage.createdAt).toLocaleString()}, ${selectedMessage.senderId.firstName} wrote: ---\n${selectedMessage.message}`
                      });
                      setIsComposeOpen(true);
                    }}>
                      <div className="flex items-center gap-2">
                        <Button size="sm" className="ml-auto">
                          <Reply className="mr-2 h-4 w-4" /> Reply
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground m-auto">
                  <Mail className="mx-auto h-12 w-12 opacity-20 mb-4" />
                  <h3 className="text-lg font-medium">Select a message</h3>
                  <p>Choose a message from the list to view details.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
