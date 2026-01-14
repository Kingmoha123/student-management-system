"use client"

import type React from "react"

import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Sidebar } from "@/components/Sidebar"
import { useAuth } from "@/context/AuthContext"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Shield, Phone, MapPin, Edit, Camera } from "lucide-react"

export default function ProfilePage() {
  const { user, token } = useAuth()
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: "",
    address: "",
  })

  // Update formData when user data loads
  useState(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName,
        lastName: user.lastName,
      }))
    }
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setEditing(false)
        // Ideally trigger a user reload/context update here
      }
    } catch (error) {
      console.error("Failed to update profile:", error)
    }
  }

  const getInitials = () => {
    const f = user?.firstName?.[0] || ""
    const l = user?.lastName?.[0] || ""
    return (f + l).toUpperCase()
  }

  return (
    <ProtectedRoute>
      <div className="flex bg-background min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 overflow-y-auto">
          {/* Header with gradient background */}
          <div className="h-48 bg-gradient-to-r from-primary/80 to-primary/40 relative">
            <div className="absolute -bottom-16 left-8 flex items-end">
              <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                <AvatarFallback className="text-4xl font-bold bg-primary text-primary-foreground">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="mb-4 ml-4 space-y-1">
                <h1 className="text-3xl font-bold text-foreground drop-shadow-md">{user?.firstName} {user?.lastName}</h1>
                <Badge variant="secondary" className="px-3 py-1 text-sm bg-background/80 backdrop-blur-sm shadow-sm capitalize">
                  {user?.role}
                </Badge>
              </div>
            </div>
          </div>

          <div className="pt-24 px-8 pb-12 max-w-4xl">
            <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {!editing ? (
                <Card className="shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="space-y-1">
                      <CardTitle className="text-2xl">Profile Information</CardTitle>
                      <CardDescription>Manage your personal details and account settings.</CardDescription>
                    </div>
                    <Button onClick={() => setEditing(true)} size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </CardHeader>
                  <Separator />
                  <CardContent className="grid gap-8 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Full Name</Label>
                          <div className="flex items-center gap-2 font-medium text-lg">
                            <User className="w-4 h-4 text-primary" />
                            {user?.firstName} {user?.lastName}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Email Address</Label>
                          <div className="flex items-center gap-2 font-medium text-lg">
                            <Mail className="w-4 h-4 text-primary" />
                            {user?.email}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Role</Label>
                          <div className="flex items-center gap-2 font-medium text-lg capitalize">
                            <Shield className="w-4 h-4 text-primary" />
                            {user?.role}
                          </div>
                        </div>
                        {/* Add more fields here as backend supports them (Phone, Address etc) */}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-lg border-primary/20">
                  <CardHeader>
                    <CardTitle>Edit Profile</CardTitle>
                    <CardDescription>Update your personal information.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSave} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="firstName"
                              value={formData.firstName}
                              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                              className="pl-9"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="lastName"
                              value={formData.lastName}
                              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                              className="pl-9"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="phone"
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              className="pl-9"
                              placeholder="+1 (555) 000-0000"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="address"
                              value={formData.address}
                              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                              className="pl-9"
                              placeholder="123 Main St, City"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" type="button" onClick={() => setEditing(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
