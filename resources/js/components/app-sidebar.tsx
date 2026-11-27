import { Link, usePage } from '@inertiajs/react';
import {
    Award,
    BellRing,
    CalendarClock,
    CalendarDays,
    ClipboardCheck,
    CreditCard,
    LayoutGrid,
    MessageSquareText,
    Settings2,
    ShieldAlert,
    Users,
    Wallet,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { Auth } from '@/types';

type MenuEntry = {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
};

export function getRoleMenuItems(
    role?: string,
    pendingBadges?: { payments?: number; scheduleRequests?: number },
): MenuEntry[] {
    if (role === 'master') {
        return [
            { title: 'Ringkasan', href: '/dashboard', icon: LayoutGrid },
            { title: 'Pendaftaran & Murid', href: '/students', icon: Users },
            { title: 'Jadwal & Kelas', href: '/classes', icon: CalendarDays },
            {
                title: 'Pengajuan Jadwal',
                href: '/schedule-requests',
                icon: CalendarClock,
                badge: pendingBadges?.scheduleRequests,
            },
            {
                title: 'Absensi Sesi & GPS',
                href: '/attendance',
                icon: ClipboardCheck,
            },
            { title: 'Nilai Akademik', href: '/grades', icon: Award },
            {
                title: 'Evaluasi Mentor',
                href: '/evaluations',
                icon: MessageSquareText,
            },
            {
                title: 'SPP & Buku Kas',
                href: '/finance',
                icon: Wallet,
                badge: pendingBadges?.payments,
            },
            {
                title: 'Gaji & Kinerja Mentor',
                href: '/mentor-payroll',
                icon: CreditCard,
            },
            {
                title: 'Broadcast Notif HP',
                href: '/broadcasts',
                icon: BellRing,
            },
            {
                title: 'Akun Staf & Mentor',
                href: '/staff-accounts',
                icon: ShieldAlert,
            },
            {
                title: 'Pengaturan Sistem',
                href: '/system-settings',
                icon: Settings2,
            },
        ];
    }

    if (role === 'admin') {
        return [
            { title: 'Ringkasan', href: '/dashboard', icon: LayoutGrid },
            { title: 'Pendaftaran & Murid', href: '/students', icon: Users },
            { title: 'Jadwal & Kelas', href: '/classes', icon: CalendarDays },
            {
                title: 'Pengajuan Jadwal',
                href: '/schedule-requests',
                icon: CalendarClock,
                badge: pendingBadges?.scheduleRequests,
            },
            {
                title: 'Rekap Absensi',
                href: '/attendance',
                icon: ClipboardCheck,
            },
            { title: 'Nilai Akademik', href: '/grades', icon: Award },
            {
                title: 'Evaluasi Mentor',
                href: '/evaluations',
                icon: MessageSquareText,
            },
            {
                title: 'SPP & Buku Kas',
                href: '/finance',
                icon: Wallet,
                badge: pendingBadges?.payments,
            },
            {
                title: 'Broadcast Notif HP',
                href: '/broadcasts',
                icon: BellRing,
            },
        ];
    }

    if (role === 'mentor') {
        return [
            { title: 'Beranda Mentor', href: '/dashboard', icon: LayoutGrid },
            {
                title: 'Absen GPS & Murid',
                href: '/attendance',
                icon: ClipboardCheck,
            },
            {
                title: 'Jadwal Kelas Saya',
                href: '/classes',
                icon: CalendarDays,
            },
            {
                title: 'Izin / Ganti Jadwal',
                href: '/schedule-requests',
                icon: CalendarClock,
            },
            { title: 'Input Nilai Murid', href: '/grades', icon: Award },
        ];
    }

    return [
        { title: 'Beranda Murid', href: '/dashboard', icon: LayoutGrid },
        { title: 'Tagihan SPP', href: '/student/invoices', icon: Wallet },
        {
            title: 'Riwayat Kehadiran',
            href: '/attendance',
            icon: ClipboardCheck,
        },
        { title: 'Daftar Nilai', href: '/grades', icon: Award },
        {
            title: 'Pindah Kelas / Jadwal',
            href: '/schedule-requests',
            icon: CalendarClock,
        },
        {
            title: 'Ulasan Mentor',
            href: '/evaluations',
            icon: MessageSquareText,
        },
    ];
}

export function AppSidebar() {
    const { auth, pendingBadges } = usePage<{
        auth: Auth;
        pendingBadges?: { payments?: number; scheduleRequests?: number };
    }>().props;
    const { isCurrentUrl } = useCurrentUrl();

    const items = getRoleMenuItems(auth?.user?.role, pendingBadges);

    return (
        <Sidebar collapsible="icon" variant="floating">
            <SidebarHeader className="p-2.5">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            tooltip={{ children: 'Rubelia Dashboard' }}
                            className="group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center hover:bg-[#1E293B]"
                        >
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarSeparator className="bg-slate-800/80" />

            <SidebarContent className="py-1">
                <SidebarGroup className="px-2.5 py-1 group-data-[collapsible=icon]:px-2">
                    <SidebarGroupLabel className="px-2 text-[10.5px] font-semibold tracking-wider text-slate-400 uppercase">
                        Menu Navigasi
                    </SidebarGroupLabel>
                    <SidebarMenu className="gap-1">
                        {items.map((item) => {
                            const active = isCurrentUrl(item.href);
                            const hasBadge = Boolean(
                                item.badge && item.badge > 0,
                            );
                            return (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={active}
                                        tooltip={{ children: item.title }}
                                        className={
                                            active
                                                ? 'h-10 rounded-xl bg-[#E2A829]! font-semibold text-[#0F172A]! shadow-xs group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! hover:bg-[#CA8A04]! hover:text-[#0F172A]!'
                                                : 'h-10 rounded-xl text-slate-300 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! hover:bg-[#1E293B] hover:text-white'
                                        }
                                    >
                                        <Link href={item.href} prefetch>
                                            <item.icon
                                                className={
                                                    active
                                                        ? 'size-[18px] shrink-0 text-[#0F172A]'
                                                        : 'size-[18px] shrink-0 text-slate-300'
                                                }
                                            />
                                            <span className="truncate group-data-[collapsible=icon]:hidden">
                                                {item.title}
                                            </span>
                                        </Link>
                                    </SidebarMenuButton>

                                    {hasBadge && (
                                        <>
                                            <SidebarMenuBadge className="top-2 right-2 rounded-full bg-[#FFF1F2] px-2 font-mono text-[11px] font-bold text-[#BE123C]">
                                                {item.badge}
                                            </SidebarMenuBadge>
                                            <span className="pointer-events-none absolute top-1.5 right-2 hidden size-2 rounded-full bg-[#E11D48] ring-2 ring-[#0F172A] group-data-[collapsible=icon]:block" />
                                        </>
                                    )}
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarSeparator className="bg-slate-800/80" />

            <SidebarFooter className="p-2.5">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
