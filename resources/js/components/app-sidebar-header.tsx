import { Link } from '@inertiajs/react';
import { KeyRound } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { PushNotificationToggle } from '@/components/push-notification-toggle';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-[#E2E8F0] bg-white/95 px-4 backdrop-blur-xs md:top-3 md:mx-6 md:mt-3 md:h-15 md:rounded-2xl md:border md:px-5 md:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.08)]">
            <div className="flex min-w-0 items-center gap-2">
                <SidebarTrigger className="-ml-1 size-10" />
                <div className="truncate">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
                <PushNotificationToggle />
                <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 text-xs"
                >
                    <Link href="/settings/security">
                        <KeyRound className="size-3.5" />
                        <span className="hidden sm:inline">Ubah Password</span>
                    </Link>
                </Button>
            </div>
        </header>
    );
}
