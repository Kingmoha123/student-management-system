"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            })

            if (!response.ok) {
                throw new Error("Failed to send reset link")
            }

            setSubmitted(true)
        } catch (err: any) {
            setError(err.message || "An error occurred. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-400/20 via-background to-background p-4">
            <div className="w-full max-w-md space-y-4 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex flex-col items-center justify-center space-y-2 text-center mb-8">
                    <div className="mb-2">
                        <Image
                            src="/school-logo.jpg"
                            alt="School Logo"
                            width={80}
                            height={80}
                            className="object-contain"
                        />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Student Management System</h1>
                    <p className="text-sm text-muted-foreground">Reset your account password</p>
                </div>

                <Card className="border-muted/50 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl">Forgot Password</CardTitle>
                        <CardDescription>
                            {submitted
                                ? "Check your email for a link to reset your password."
                                : "Enter your email address and we'll send you a link to reset your password."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {submitted ? (
                            <div className="flex flex-col items-center justify-center py-6 space-y-4 text-center">
                                <div className="p-3 bg-green-500/10 rounded-full">
                                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-lg">Email Sent</h3>
                                    <p className="text-sm text-muted-foreground">
                                        We&apos;ve sent a password reset link to <span className="font-medium text-foreground">{email}</span>.
                                    </p>
                                </div>
                                <Button variant="outline" className="w-full mt-4" asChild>
                                    <Link href="/login">Return to Login</Link>
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="name@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-9"
                                            required
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium">
                                        {error}
                                    </div>
                                )}

                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                                        </>
                                    ) : (
                                        "Send Reset Link"
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                    {!submitted && (
                        <CardFooter className="flex justify-center border-t p-4">
                            <Link href="/login" className="flex items-center text-sm font-medium text-primary hover:underline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Login
                            </Link>
                        </CardFooter>
                    )}
                </Card>
            </div>
        </div>
    )
}
