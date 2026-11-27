import { Link, usePage } from '@inertiajs/react';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar, getRoleMenuItems } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { AppLayoutProps, Auth } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { auth, pendingBadges } = usePage<{
        auth?: Auth;
        pendingBadges?: { payments?: number; scheduleRequests?: number };
    }>().props;
    const { isCurrentUrl } = useCurrentUrl();

    const mobileTabs = getRoleMenuItems(auth?.user?.role, pendingBadges).slice(
        0,
        5,
    );

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent
                variant="sidebar"
                className="min-h-[100dvh] min-w-0 overflow-x-clip bg-[#F8FAFC] pb-20 md:pb-6"
            >
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div className="mx-auto w-full max-w-[1360px] p-4 sm:p-6">
                    {children}
                </div>
            </AppContent>

            <nav
                aria-label="Navigasi Cepat HP"
                className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E2E8F0] bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
            >
                <div className="grid grid-cols-5">
                    {mobileTabs.map((tab) => {
                        const active = isCurrentUrl(tab.href);
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={`relative flex min-h-[58px] flex-col items-center justify-center gap-1 px-1 text-[10.5px] font-semibold transition-colors ${
                                    active ? 'text-[#0F172A]' : 'text-[#64748B]'
                                }`}
                            >
                                {active && (
                                    <span className="absolute inset-x-3 top-0 h-[3px] rounded-b-full bg-[#E2A829]" />
                                )}
                                <tab.icon
                                    className={`size-4 ${active ? 'text-[#CA8A04]' : 'text-[#64748B]'}`}
                                />
                                <span className="max-w-full truncate">
                                    {tab.title.split(' ')[0]}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </AppShell>
    );
}
