import { usePage } from '@inertiajs/react';
import { GraduationCap } from 'lucide-react';
import { roleLabel } from '@/lib/rubelia';
import type { Auth } from '@/types';

export default function AppLogo() {
    const { auth } = usePage<{ auth?: Auth }>().props;

    return (
        <>
            <div className="flex aspect-square size-9 shrink-0 items-center justify-center rounded-xl bg-[#E2A829] text-[#0F172A] shadow-xs">
                <GraduationCap className="size-5 stroke-[2.25]" />
            </div>
            <div className="ml-1.5 grid flex-1 text-left group-data-[collapsible=icon]:hidden">
                <span className="truncate font-display text-base leading-tight font-bold tracking-tight text-white">
                    Rubelia
                </span>
                <span className="truncate text-[11px] font-medium text-slate-400">
                    {auth?.user ? roleLabel(auth.user.role) : 'Sistem Bimbel'}
                </span>
            </div>
        </>
    );
}
