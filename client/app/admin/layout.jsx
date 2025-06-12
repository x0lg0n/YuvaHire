"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Building, BriefcaseIcon, Inbox, PlusCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"

export default function AdminLayout({ children }) {
	const router = useRouter()
	const pathname = usePathname()
	const { user } = useAuth()

	useEffect(() => {
		if (!user) {
			router.push('/login')
			return
		}

		if (user.role !== 'college_admin' && user.role !== 'super_admin') {
			router.push('/student/jobs')
			return
		}

		// Initialize with posted jobs page if no specific page is selected
		if (pathname === '/admin') {
			router.push('/admin/jobs')
		}
	}, [user, router, pathname])

	if (!user || (user.role !== 'college_admin' && user.role !== 'super_admin')) {
		return null
	}

	const navigation = [
		// Super admin only
		...(user.role === 'super_admin' ? [
			{
				name: "Manage Colleges",
				href: "/admin/colleges",
				icon: Building
			}
		] : []),
		// Both roles
		{
			name: "Posted Jobs",
			href: "/admin/jobs",
			icon: BriefcaseIcon
		},
		{
			name: "Post New Job",
			href: "/admin/jobs/new",
			icon: PlusCircle
		},
		{
			name: "Applications",
			href: "/admin/applications",
			icon: Inbox
		}
	]

	return (
		<ProtectedRoute requiredRole={['college_admin', 'super_admin']}>
			<div className="flex min-h-[calc(100vh-4rem)]">
				<div className="w-64 border-r bg-muted/10">
					<nav className="flex flex-col gap-2 p-4">
						{navigation.map((item) => {
							const Icon = item.icon
							return (
								<Link
									key={item.name}
									href={item.href}
									className={cn(
										"flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
										pathname === item.href
											? "bg-primary text-primary-foreground"
											: "hover:bg-muted"
									)}
								>
									<Icon className="h-4 w-4" />
									{item.name}
								</Link>
							)
						})}
					</nav>
				</div>
				<div className="flex-1 p-6">
					{children}
				</div>
			</div>
		</ProtectedRoute>
	)
}
