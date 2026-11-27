export function formatRupiah(
    amount: number | string | null | undefined,
): string {
    const numeric = Number(amount ?? 0);
    return (
        'Rp ' +
        new Intl.NumberFormat('id-ID').format(
            Number.isFinite(numeric) ? numeric : 0,
        )
    );
}

export function roleLabel(role?: string | null): string {
    switch (role) {
        case 'master':
            return 'Master (Owner)';
        case 'admin':
            return 'Admin / Staff';
        case 'mentor':
            return 'Mentor';
        case 'student':
            return 'Murid / Wali';
        default:
            return role ?? '-';
    }
}

export function levelBadgeClass(slug?: string | null): string {
    switch (slug) {
        case 'bimba':
            return 'border-[#FECDD3] bg-[#FFF1F2] text-[#BE123C]';
        case 'sd':
            return 'border-[#FDE047] bg-[#FEF9C3] text-[#713F12]';
        case 'smp':
            return 'border-[#CBD5E1] bg-[#F1F5F9] text-[#0F172A]';
        case 'sma-smk':
            return 'border-[#1E293B] bg-[#0F172A] text-[#F8FAFC]';
        default:
            return 'border-[#E2E8F0] bg-[#F8FAFC] text-[#334155]';
    }
}

export function urlBase64ToUint8Array(
    base64String: string,
): Uint8Array<ArrayBuffer> {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const buffer = new ArrayBuffer(rawData.length);
    const outputArray = new Uint8Array(buffer);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}

export function csrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}
