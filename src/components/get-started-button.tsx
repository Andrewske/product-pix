'use client';

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { useUser } from "@/lib/auth/hooks"
import { useRouter } from "next/navigation"

interface GetStartedButtonProps {
  variant?: "default" | "accent" | "outline"
  size?: "default" | "sm" | "lg"
  className?: string
  children?: React.ReactNode
  showArrow?: boolean
}

export function GetStartedButton({
  variant = "accent",
  size = "lg",
  className = "",
  children = "Get Started",
  showArrow = false
}: GetStartedButtonProps) {
  const { user, loading } = useUser()
  const router = useRouter()

  const handleClick = () => {
    if (loading) return

    if (user) {
      router.push('/dashboard')
    } else {
      router.push('/signup')
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={loading}
    >
      {children}
      {showArrow && <ArrowRight className="ml-2 h-5 w-5" />}
    </Button>
  )
}