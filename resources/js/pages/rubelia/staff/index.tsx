import { Head, router, useForm } from '@inertiajs/react';
import {
    Copy,
    KeyRound,
    Plus,
    RotateCcw,
    Search,
    UserCheck,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatRupiah, roleLabel } from '@/lib/rubelia';

type StaffRow = {
    id: number;
    name: string;
    email: string;
    role: 'master' | 'admin' | 'mentor';
    birth_date?: string | null;
    phone?: string | null;
    is_active: boolean;
    fee_per_session: number;
    specialization: string;
};

type Props = {
    staffList: StaffRow[];
    filters: { role: string; search: string };
    createdCredentials?: {
        name: string;
        role: string;
        email: string;
        password: string;
    } | null;
};

export default function StaffIndex({
    staffList,
    filters,
    createdCredentials,
}: Props) {
    const [editing, setEditing] = useState<StaffRow | null>(null);
    const [searchText, setSearchText] = useState(filters.search);

    const createForm = useForm({
        name: '',
        role: 'mentor' as 'master' | 'admin' | 'mentor',
        birth_date: '',
        phone: '',
        fee_per_session: 50000,
        specialization: '',
    });

    const editForm = useForm({
        name: '',
        birth_date: '',
        phone: '',
        is_active: true,
        fee_per_session: 0,
        specialization: '',
    });

    const startEdit = (row: StaffRow) => {
        setEditing(row);
        editForm.setData({
            name: row.name,
            birth_date: row.birth_date ?? '',
            phone: row.phone ?? '',
            is_active: row.is_active,
            fee_per_session: row.fee_per_session,
            specialization: row.specialization,
        });
    };

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/staff-accounts', {
            onSuccess: () =>
                createForm.reset(
                    'name',
                    'birth_date',
                    'phone',
                    'specialization',
                ),
        });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing) return;
        editForm.put(`/staff-accounts/${editing.id}`, {
            onSuccess: () => setEditing(null),
        });
    };

    const copyCredentials = (email: string, password: string) => {
        void navigator.clipboard.writeText(
            `Email: ${email}\nPassword: ${password}`,
        );
        toast.success('Email & password berhasil disalin.');
    };

    return (
        <>
            <Head title="Akun Staf & Mentor" />

            <div className="space-y-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-[#0F172A]">
                        Kelola Akun Owner, Admin & Mentor
                    </h1>
                    <p className="text-sm text-[#475569]">
                        Email dibuat otomatis tanpa spasi sesuai domain peran
                        dan password awal diambil dari tanggal lahir (
                        <span className="font-mono">ddmmyyyy</span>).
                    </p>
                </div>

                {createdCredentials && (
                    <div className="rounded-2xl border-2 border-[#E2A829] bg-[#FEF9C3] p-5">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                            <div>
                                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#0F172A] px-2.5 py-0.5 text-xs font-semibold text-[#E2A829]">
                                    <KeyRound className="size-3.5" />
                                    Kredensial Akun Siap Dibagikan
                                </span>
                                <h2 className="mt-2 font-display text-lg font-bold text-[#0F172A]">
                                    {createdCredentials.name} (
                                    {roleLabel(createdCredentials.role)})
                                </h2>
                                <p className="mt-1 font-mono text-sm text-[#0F172A]">
                                    Email:{' '}
                                    <strong>{createdCredentials.email}</strong>{' '}
                                    | Password Awal:{' '}
                                    <strong>
                                        {createdCredentials.password}
                                    </strong>
                                </p>
                            </div>
                            <Button
                                type="button"
                                onClick={() =>
                                    copyCredentials(
                                        createdCredentials.email,
                                        createdCredentials.password,
                                    )
                                }
                                className="h-11 bg-[#0F172A] text-white hover:bg-[#1E293B]"
                            >
                                <Copy className="mr-1.5 size-4" />
                                Salin Akun
                            </Button>
                        </div>
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
                    <form
                        onSubmit={submitCreate}
                        className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6"
                    >
                        <h2 className="font-display text-lg font-bold text-[#0F172A]">
                            Tambah Akun Staf / Mentor Baru
                        </h2>

                        <div className="grid gap-1.5">
                            <Label htmlFor="role">Peran Akun</Label>
                            <select
                                id="role"
                                value={createForm.data.role}
                                onChange={(e) =>
                                    createForm.setData(
                                        'role',
                                        e.target.value as
                                            | 'master'
                                            | 'admin'
                                            | 'mentor',
                                    )
                                }
                                className="h-11 rounded-xl border border-[#CBD5E1] bg-white px-3 text-sm"
                            >
                                <option value="mentor">
                                    Mentor (@mentor.rubelia.com)
                                </option>
                                <option value="admin">
                                    Admin / Staff (@admin.rubelia.com)
                                </option>
                                <option value="master">
                                    Master / Owner (@owner.rubelia.com)
                                </option>
                            </select>
                            <InputError message={createForm.errors.role} />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="name">Nama Lengkap</Label>
                            <Input
                                id="name"
                                value={createForm.data.name}
                                onChange={(e) =>
                                    createForm.setData('name', e.target.value)
                                }
                                placeholder="Contoh: Sigit Hadi Pratama"
                                required
                                className="h-11"
                            />
                            <InputError message={createForm.errors.name} />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="birth_date">
                                Tanggal Lahir (Password Awal)
                            </Label>
                            <Input
                                id="birth_date"
                                type="date"
                                value={createForm.data.birth_date}
                                onChange={(e) =>
                                    createForm.setData(
                                        'birth_date',
                                        e.target.value,
                                    )
                                }
                                required
                                className="h-11 font-mono"
                            />
                            <InputError
                                message={createForm.errors.birth_date}
                            />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="phone">Nomor WhatsApp</Label>
                            <Input
                                id="phone"
                                value={createForm.data.phone}
                                onChange={(e) =>
                                    createForm.setData('phone', e.target.value)
                                }
                                placeholder="0812xxxxxxxx"
                                className="h-11 font-mono"
                            />
                            <InputError message={createForm.errors.phone} />
                        </div>

                        {createForm.data.role === 'mentor' && (
                            <>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="fee_per_session">
                                        Tarif Honor per Sesi (Rp)
                                    </Label>
                                    <Input
                                        id="fee_per_session"
                                        type="number"
                                        min={0}
                                        value={createForm.data.fee_per_session}
                                        onChange={(e) =>
                                            createForm.setData(
                                                'fee_per_session',
                                                Number(e.target.value),
                                            )
                                        }
                                        className="h-11 font-mono"
                                    />
                                    <InputError
                                        message={
                                            createForm.errors.fee_per_session
                                        }
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="specialization">
                                        Bidang Mengajar
                                    </Label>
                                    <Input
                                        id="specialization"
                                        value={createForm.data.specialization}
                                        onChange={(e) =>
                                            createForm.setData(
                                                'specialization',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Contoh: Matematika SMP & SMA"
                                        className="h-11"
                                    />
                                </div>
                            </>
                        )}

                        <Button
                            type="submit"
                            disabled={createForm.processing}
                            className="h-11 w-full bg-[#E2A829] font-semibold text-[#0F172A] hover:bg-[#CA8A04]"
                        >
                            <Plus className="mr-1.5 size-4" />
                            {createForm.processing
                                ? 'Membuat Akun...'
                                : 'Buat & Generate Email Akun'}
                        </Button>
                    </form>

                    <div className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                            <div className="flex flex-wrap gap-1.5">
                                {['all', 'mentor', 'admin', 'master'].map(
                                    (r) => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() =>
                                                router.get(
                                                    '/staff-accounts',
                                                    {
                                                        role: r,
                                                        search: searchText,
                                                    },
                                                    { preserveState: true },
                                                )
                                            }
                                            className={`h-9 rounded-lg px-3 text-xs font-semibold transition-colors ${
                                                filters.role === r
                                                    ? 'bg-[#0F172A] text-white'
                                                    : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                                            }`}
                                        >
                                            {r === 'all'
                                                ? 'Semua Peran'
                                                : roleLabel(r)}
                                        </button>
                                    ),
                                )}
                            </div>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    router.get(
                                        '/staff-accounts',
                                        {
                                            role: filters.role,
                                            search: searchText,
                                        },
                                        { preserveState: true },
                                    );
                                }}
                                className="flex gap-2"
                            >
                                <Input
                                    value={searchText}
                                    onChange={(e) =>
                                        setSearchText(e.target.value)
                                    }
                                    placeholder="Cari nama / email..."
                                    className="h-9 text-sm"
                                />
                                <Button
                                    type="submit"
                                    variant="outline"
                                    size="sm"
                                    className="h-9"
                                >
                                    <Search className="size-4" />
                                </Button>
                            </form>
                        </div>

                        {editing && (
                            <form
                                onSubmit={submitEdit}
                                className="space-y-3 rounded-xl border border-[#E2A829] bg-[#F8FAFC] p-4"
                            >
                                <p className="font-display text-sm font-bold text-[#0F172A]">
                                    Edit Akun: {editing.name} ({editing.email})
                                </p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <Label>Nama Lengkap</Label>
                                        <Input
                                            value={editForm.data.name}
                                            onChange={(e) =>
                                                editForm.setData(
                                                    'name',
                                                    e.target.value,
                                                )
                                            }
                                            className="mt-1 h-10"
                                        />
                                    </div>
                                    <div>
                                        <Label>Tanggal Lahir</Label>
                                        <Input
                                            type="date"
                                            value={editForm.data.birth_date}
                                            onChange={(e) =>
                                                editForm.setData(
                                                    'birth_date',
                                                    e.target.value,
                                                )
                                            }
                                            className="mt-1 h-10 font-mono"
                                        />
                                    </div>
                                    <div>
                                        <Label>No. WhatsApp</Label>
                                        <Input
                                            value={editForm.data.phone}
                                            onChange={(e) =>
                                                editForm.setData(
                                                    'phone',
                                                    e.target.value,
                                                )
                                            }
                                            className="mt-1 h-10 font-mono"
                                        />
                                    </div>
                                    <div>
                                        <Label>Status Akun</Label>
                                        <select
                                            value={
                                                editForm.data.is_active
                                                    ? '1'
                                                    : '0'
                                            }
                                            onChange={(e) =>
                                                editForm.setData(
                                                    'is_active',
                                                    e.target.value === '1',
                                                )
                                            }
                                            className="mt-1 h-10 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 text-sm"
                                        >
                                            <option value="1">Aktif</option>
                                            <option value="0">Nonaktif</option>
                                        </select>
                                    </div>
                                    {editing.role === 'mentor' && (
                                        <>
                                            <div>
                                                <Label>
                                                    Tarif per Sesi (Rp)
                                                </Label>
                                                <Input
                                                    type="number"
                                                    value={
                                                        editForm.data
                                                            .fee_per_session
                                                    }
                                                    onChange={(e) =>
                                                        editForm.setData(
                                                            'fee_per_session',
                                                            Number(
                                                                e.target.value,
                                                            ),
                                                        )
                                                    }
                                                    className="mt-1 h-10 font-mono"
                                                />
                                            </div>
                                            <div>
                                                <Label>Bidang Mengajar</Label>
                                                <Input
                                                    value={
                                                        editForm.data
                                                            .specialization
                                                    }
                                                    onChange={(e) =>
                                                        editForm.setData(
                                                            'specialization',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="mt-1 h-10"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="submit"
                                        size="sm"
                                        className="bg-[#E2A829] font-semibold text-[#0F172A]"
                                    >
                                        Simpan Perubahan
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditing(null)}
                                    >
                                        Batal
                                    </Button>
                                </div>
                            </form>
                        )}

                        <div className="divide-y divide-[#F1F5F9]">
                            {staffList.map((row) => (
                                <div
                                    key={row.id}
                                    className="flex flex-col justify-between gap-3 py-3.5 sm:flex-row sm:items-center"
                                >
                                    <div className="space-y-0.5">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-semibold text-[#0F172A]">
                                                {row.name}
                                            </span>
                                            <span className="rounded bg-[#F1F5F9] px-2 py-0.5 text-xs font-semibold text-[#334155]">
                                                {roleLabel(row.role)}
                                            </span>
                                            {!row.is_active && (
                                                <span className="rounded bg-[#FFF1F2] px-2 py-0.5 text-xs font-semibold text-[#BE123C]">
                                                    Nonaktif
                                                </span>
                                            )}
                                        </div>
                                        <p className="font-mono text-xs text-[#475569]">
                                            {row.email}
                                        </p>
                                        {row.role === 'mentor' && (
                                            <p className="text-xs text-[#64748B]">
                                                Honor:{' '}
                                                <span className="font-mono font-semibold text-[#0F172A]">
                                                    {formatRupiah(
                                                        row.fee_per_session,
                                                    )}
                                                </span>
                                                /sesi
                                                {row.specialization &&
                                                    ` | ${row.specialization}`}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => startEdit(row)}
                                        >
                                            <UserCheck className="mr-1 size-3.5" />
                                            Edit
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                if (
                                                    confirm(
                                                        `Reset password ${row.name} ke tanggal lahirnya?`,
                                                    )
                                                ) {
                                                    router.post(
                                                        `/staff-accounts/${row.id}/reset-password`,
                                                    );
                                                }
                                            }}
                                        >
                                            <RotateCcw className="mr-1 size-3.5" />
                                            Reset Password
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
