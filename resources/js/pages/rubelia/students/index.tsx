import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Copy,
    Download,
    Edit3,
    FileSpreadsheet,
    KeyRound,
    RotateCcw,
    Search,
    Upload,
    UserPlus,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatRupiah, levelBadgeClass } from '@/lib/rubelia';

type StudentItem = {
    id: number;
    user_id: number;
    student_code: string;
    name: string;
    email: string;
    birth_date?: string | null;
    is_active: boolean;
    education_level_id: number;
    level_name: string;
    level_slug: string;
    guardian_name: string;
    guardian_phone: string;
    school_name?: string | null;
    address?: string | null;
    enrolled_at: string;
    active_class_id?: number | null;
    active_class_name?: string | null;
    active_class_schedule: string;
};

type ClassOption = {
    id: number;
    education_level_id: number;
    name: string;
    mentor_name: string;
    days: string[];
    session_number: number;
    start_time: string;
    end_time: string;
    quota: number;
    enrolled_count: number;
    remaining_quota: number;
};

type PaginatedStudents = {
    data: StudentItem[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    students: PaginatedStudents;
    levels: { id: number; name: string; slug: string; monthly_fee: number }[];
    classes: ClassOption[];
    filters: { search: string; level_id: string; class_id: string };
    createdStudentCredentials?: {
        student_code: string;
        name: string;
        guardian_name: string;
        email: string;
        display_email: string;
        password: string;
        class_name: string;
        paid_amount: number;
        invoice_number: string;
    } | null;
};

export default function StudentsIndex({
    students,
    levels,
    classes,
    filters,
    createdStudentCredentials,
}: Props) {
    const [showRegisterForm, setShowRegisterForm] = useState(false);
    const [showImportBox, setShowImportBox] = useState(false);
    const [editing, setEditing] = useState<StudentItem | null>(null);
    const [search, setSearch] = useState(filters.search);

    const firstLevelId = levels[0]?.id ?? 1;
    const initialAvailableClasses = classes.filter(
        (c) => c.education_level_id === firstLevelId && c.remaining_quota > 0,
    );

    const regForm = useForm({
        name: '',
        birth_date: '',
        education_level_id: firstLevelId,
        study_class_id: initialAvailableClasses[0]?.id ?? ('' as number | ''),
        guardian_name: '',
        guardian_phone: '',
        school_name: '',
        address: '',
    });

    const editForm = useForm({
        name: '',
        birth_date: '',
        education_level_id: firstLevelId,
        study_class_id: '' as number | '',
        guardian_name: '',
        guardian_phone: '',
        school_name: '',
        address: '',
        is_active: true,
    });

    const importForm = useForm<{ file: File | null }>({
        file: null,
    });

    const selectedLevelObj = levels.find(
        (l) => l.id === Number(regForm.data.education_level_id),
    );
    const filteredClassesForReg = classes.filter(
        (c) =>
            c.education_level_id === Number(regForm.data.education_level_id) &&
            c.remaining_quota > 0,
    );

    const handleLevelChangeOnReg = (newLevelId: number) => {
        const nextClasses = classes.filter(
            (c) => c.education_level_id === newLevelId && c.remaining_quota > 0,
        );
        regForm.setData((prev) => ({
            ...prev,
            education_level_id: newLevelId,
            study_class_id: nextClasses[0]?.id ?? '',
        }));
    };

    const submitRegistration = (e: React.FormEvent) => {
        e.preventDefault();
        regForm.post('/students', {
            onSuccess: () => {
                regForm.reset(
                    'name',
                    'birth_date',
                    'guardian_name',
                    'guardian_phone',
                    'school_name',
                    'address',
                );
                setShowRegisterForm(false);
            },
        });
    };

    const startEdit = (s: StudentItem) => {
        setEditing(s);
        editForm.setData({
            name: s.name,
            birth_date: s.birth_date ?? '',
            education_level_id: s.education_level_id,
            study_class_id: s.active_class_id ?? '',
            guardian_name: s.guardian_name,
            guardian_phone: s.guardian_phone,
            school_name: s.school_name ?? '',
            address: s.address ?? '',
            is_active: s.is_active,
        });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing) return;
        editForm.put(`/students/${editing.id}`, {
            onSuccess: () => setEditing(null),
        });
    };

    const submitImport = (e: React.FormEvent) => {
        e.preventDefault();
        importForm.post('/students/import', {
            forceFormData: true,
            onSuccess: () => {
                importForm.reset();
                setShowImportBox(false);
            },
        });
    };

    return (
        <>
            <Head title="Pendaftaran & Data Murid" />

            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="font-display text-2xl font-bold text-[#0F172A]">
                            Pendaftaran & Direktori Murid ({students.total}{' '}
                            Murid)
                        </h1>
                        <p className="text-sm text-[#475569]">
                            Pendaftaran murid baru otomatis melunasi SPP bulan
                            pertama dan men-generate email{' '}
                            <span className="font-mono">
                                R[yy][mm][urut]@rubelia.com
                            </span>
                            .
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            onClick={() => setShowRegisterForm((v) => !v)}
                            className="h-11 bg-[#E2A829] font-semibold text-[#0F172A] hover:bg-[#CA8A04]"
                        >
                            <UserPlus className="mr-1.5 size-4" />
                            {showRegisterForm
                                ? 'Tutup Form Pendaftaran'
                                : 'Daftar Murid Baru'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11"
                            onClick={() => setShowImportBox((v) => !v)}
                        >
                            <Upload className="mr-1.5 size-4" />
                            Import Excel
                        </Button>
                        <Button asChild variant="outline" className="h-11">
                            <a href="/exports/students/excel">
                                <FileSpreadsheet className="mr-1.5 size-4" />
                                Excel
                            </a>
                        </Button>
                        <Button asChild variant="outline" className="h-11">
                            <a href="/exports/students/pdf">
                                <Download className="mr-1.5 size-4" />
                                PDF
                            </a>
                        </Button>
                    </div>
                </div>

                {createdStudentCredentials && (
                    <div className="rounded-2xl border-2 border-[#E2A829] bg-[#FEF9C3] p-5">
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#0F172A] px-2.5 py-0.5 text-xs font-semibold text-[#E2A829]">
                                    <KeyRound className="size-3.5" />
                                    Kartu Akun Murid & Wali Murid
                                </span>
                                <h2 className="font-display text-xl font-bold text-[#0F172A]">
                                    {createdStudentCredentials.name} (
                                    {createdStudentCredentials.student_code})
                                </h2>
                                <p className="font-mono text-sm text-[#0F172A]">
                                    Email Login:{' '}
                                    <strong>
                                        {
                                            createdStudentCredentials.display_email
                                        }
                                    </strong>{' '}
                                    | Password Awal:{' '}
                                    <strong>
                                        {createdStudentCredentials.password}
                                    </strong>
                                </p>
                                <p className="text-xs text-[#713F12]">
                                    Kelas:{' '}
                                    <strong>
                                        {createdStudentCredentials.class_name}
                                    </strong>{' '}
                                    | Wali:{' '}
                                    <strong>
                                        {
                                            createdStudentCredentials.guardian_name
                                        }
                                    </strong>
                                    {createdStudentCredentials.paid_amount >
                                        0 &&
                                        ` | SPP Bulan Pertama Lunas: ${formatRupiah(createdStudentCredentials.paid_amount)}`}
                                </p>
                            </div>
                            <Button
                                type="button"
                                onClick={() => {
                                    void navigator.clipboard.writeText(
                                        `Akun Rubelia - ${createdStudentCredentials.name}\nEmail: ${createdStudentCredentials.display_email}\nPassword: ${createdStudentCredentials.password}`,
                                    );
                                    toast.success(
                                        'Kredensial akun murid berhasil disalin untuk dikirim ke Wali Murid.',
                                    );
                                }}
                                className="h-11 bg-[#0F172A] text-white hover:bg-[#1E293B]"
                            >
                                <Copy className="mr-1.5 size-4" />
                                Salin Data Login
                            </Button>
                        </div>
                    </div>
                )}

                {showImportBox && (
                    <form
                        onSubmit={submitImport}
                        className="flex flex-col justify-between gap-4 rounded-2xl border border-[#CBD5E1] bg-white p-5 sm:flex-row sm:items-end"
                    >
                        <div className="space-y-1.5">
                            <p className="font-display text-base font-bold text-[#0F172A]">
                                Import Massal Data Murid Aktif (.xlsx)
                            </p>
                            <p className="text-xs text-[#64748B]">
                                Cocok untuk memasukkan 500+ murid lama
                                sekaligus. Email & password tanggal lahir akan
                                dibuat otomatis.
                            </p>
                            <Input
                                type="file"
                                accept=".xlsx"
                                onChange={(e) =>
                                    importForm.setData(
                                        'file',
                                        e.target.files?.[0] ?? null,
                                    )
                                }
                                required
                                className="mt-2 h-10 max-w-sm"
                            />
                            <InputError message={importForm.errors.file} />
                        </div>
                        <div className="flex gap-2">
                            <Button asChild variant="outline" className="h-10">
                                <a href="/students/import-template">
                                    Unduh Template Excel
                                </a>
                            </Button>
                            <Button
                                type="submit"
                                disabled={importForm.processing}
                                className="h-10 bg-[#E2A829] font-semibold text-[#0F172A]"
                            >
                                {importForm.processing
                                    ? 'Mengimpor...'
                                    : 'Mulai Import'}
                            </Button>
                        </div>
                    </form>
                )}

                {showRegisterForm && (
                    <form
                        onSubmit={submitRegistration}
                        className="space-y-4 rounded-2xl border-2 border-[#0F172A] bg-white p-5 sm:p-6"
                    >
                        <div className="flex flex-col justify-between gap-2 border-b border-[#E2E8F0] pb-3 sm:flex-row sm:items-center">
                            <div>
                                <h2 className="font-display text-lg font-bold text-[#0F172A]">
                                    Form Pendaftaran Murid Baru di Rubelia
                                </h2>
                                <p className="text-xs text-[#64748B]">
                                    Pastikan wali murid telah menyetujui biaya
                                    pendaftaran (SPP Bulan Pertama) sebelum
                                    menyimpan.
                                </p>
                            </div>
                            <span className="rounded-xl bg-[#FEF9C3] px-3.5 py-1.5 font-mono text-sm font-bold text-[#0F172A]">
                                Biaya Pendaftaran / SPP Awal:{' '}
                                {formatRupiah(
                                    selectedLevelObj?.monthly_fee ?? 0,
                                )}
                            </span>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <Label>Nama Lengkap Anak / Murid</Label>
                                <Input
                                    value={regForm.data.name}
                                    onChange={(e) =>
                                        regForm.setData('name', e.target.value)
                                    }
                                    required
                                    placeholder="Nama lengkap murid"
                                    className="mt-1 h-11"
                                />
                                <InputError message={regForm.errors.name} />
                            </div>

                            <div>
                                <Label>
                                    Tanggal Lahir Murid (Password Awal)
                                </Label>
                                <Input
                                    type="date"
                                    value={regForm.data.birth_date}
                                    onChange={(e) =>
                                        regForm.setData(
                                            'birth_date',
                                            e.target.value,
                                        )
                                    }
                                    required
                                    className="mt-1 h-11 font-mono"
                                />
                                <InputError
                                    message={regForm.errors.birth_date}
                                />
                            </div>

                            <div>
                                <Label>Jenjang Bimbingan</Label>
                                <select
                                    value={regForm.data.education_level_id}
                                    onChange={(e) =>
                                        handleLevelChangeOnReg(
                                            Number(e.target.value),
                                        )
                                    }
                                    className="mt-1 h-11 w-full rounded-xl border border-[#CBD5E1] bg-white px-3 text-sm"
                                >
                                    {levels.map((l) => (
                                        <option key={l.id} value={l.id}>
                                            {l.name} -{' '}
                                            {formatRupiah(l.monthly_fee)}/bulan
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="sm:col-span-2">
                                <Label>
                                    Pilih Kelas & Jadwal Tersedia (Hanya
                                    Menampilkan Kelas yang Masih Ada Slot)
                                </Label>
                                <select
                                    value={regForm.data.study_class_id}
                                    onChange={(e) =>
                                        regForm.setData(
                                            'study_class_id',
                                            Number(e.target.value),
                                        )
                                    }
                                    required
                                    className="mt-1 h-11 w-full rounded-xl border border-[#CBD5E1] bg-white px-3 text-sm"
                                >
                                    {filteredClassesForReg.length === 0 && (
                                        <option value="">
                                            -- Tidak ada kelas dengan kuota
                                            tersedia di jenjang ini --
                                        </option>
                                    )}
                                    {filteredClassesForReg.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} | {c.days.join(', ')} (
                                            {c.start_time}-{c.end_time}) |
                                            Mentor: {c.mentor_name} | Sisa{' '}
                                            {c.remaining_quota} slot
                                        </option>
                                    ))}
                                </select>
                                <InputError
                                    message={regForm.errors.study_class_id}
                                />
                            </div>

                            <div>
                                <Label>Asal Sekolah (Opsional)</Label>
                                <Input
                                    value={regForm.data.school_name}
                                    onChange={(e) =>
                                        regForm.setData(
                                            'school_name',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Contoh: SMPN 1"
                                    className="mt-1 h-11"
                                />
                            </div>

                            <div>
                                <Label>Nama Wali Murid</Label>
                                <Input
                                    value={regForm.data.guardian_name}
                                    onChange={(e) =>
                                        regForm.setData(
                                            'guardian_name',
                                            e.target.value,
                                        )
                                    }
                                    required
                                    placeholder="Nama Ayah / Ibu / Wali"
                                    className="mt-1 h-11"
                                />
                                <InputError
                                    message={regForm.errors.guardian_name}
                                />
                            </div>

                            <div>
                                <Label>Nomor WhatsApp Wali Murid (Aktif)</Label>
                                <Input
                                    value={regForm.data.guardian_phone}
                                    onChange={(e) =>
                                        regForm.setData(
                                            'guardian_phone',
                                            e.target.value,
                                        )
                                    }
                                    required
                                    placeholder="0812xxxxxxxx"
                                    className="mt-1 h-11 font-mono"
                                />
                                <InputError
                                    message={regForm.errors.guardian_phone}
                                />
                            </div>

                            <div>
                                <Label>Alamat Tempat Tinggal</Label>
                                <Input
                                    value={regForm.data.address}
                                    onChange={(e) =>
                                        regForm.setData(
                                            'address',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Alamat rumah"
                                    className="mt-1 h-11"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-11"
                                onClick={() => setShowRegisterForm(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    regForm.processing ||
                                    filteredClassesForReg.length === 0
                                }
                                className="h-11 bg-[#E2A829] font-semibold text-[#0F172A] hover:bg-[#CA8A04]"
                            >
                                {regForm.processing
                                    ? 'Memproses Pendaftaran...'
                                    : 'Simpan Pendaftaran & Terima SPP Awal'}
                            </Button>
                        </div>
                    </form>
                )}

                {editing && (
                    <form
                        onSubmit={submitEdit}
                        className="space-y-4 rounded-2xl border border-[#E2A829] bg-white p-5"
                    >
                        <h3 className="font-display text-base font-bold text-[#0F172A]">
                            Edit Biodata Murid: {editing.name} (
                            {editing.student_code})
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div>
                                <Label>Nama Murid</Label>
                                <Input
                                    value={editForm.data.name}
                                    onChange={(e) =>
                                        editForm.setData('name', e.target.value)
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
                                <Label>Status Aktif</Label>
                                <select
                                    value={editForm.data.is_active ? '1' : '0'}
                                    onChange={(e) =>
                                        editForm.setData(
                                            'is_active',
                                            e.target.value === '1',
                                        )
                                    }
                                    className="mt-1 h-10 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 text-sm"
                                >
                                    <option value="1">Aktif Belajar</option>
                                    <option value="0">
                                        Nonaktif / Berhenti
                                    </option>
                                </select>
                            </div>
                            <div>
                                <Label>Nama Wali</Label>
                                <Input
                                    value={editForm.data.guardian_name}
                                    onChange={(e) =>
                                        editForm.setData(
                                            'guardian_name',
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1 h-10"
                                />
                            </div>
                            <div>
                                <Label>No. WA Wali</Label>
                                <Input
                                    value={editForm.data.guardian_phone}
                                    onChange={(e) =>
                                        editForm.setData(
                                            'guardian_phone',
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1 h-10 font-mono"
                                />
                            </div>
                            <div>
                                <Label>Kelas Aktif</Label>
                                <select
                                    value={editForm.data.study_class_id}
                                    onChange={(e) =>
                                        editForm.setData(
                                            'study_class_id',
                                            e.target.value
                                                ? Number(e.target.value)
                                                : '',
                                        )
                                    }
                                    className="mt-1 h-10 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 text-sm"
                                >
                                    <option value="">-- Pilih Kelas --</option>
                                    {classes
                                        .filter(
                                            (c) =>
                                                c.education_level_id ===
                                                Number(
                                                    editForm.data
                                                        .education_level_id,
                                                ),
                                        )
                                        .map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} (Sisa{' '}
                                                {c.remaining_quota})
                                            </option>
                                        ))}
                                </select>
                            </div>
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
                                size="sm"
                                variant="outline"
                                onClick={() => setEditing(null)}
                            >
                                Batal
                            </Button>
                        </div>
                    </form>
                )}

                <section className="rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            router.get(
                                '/students',
                                { search, level_id: filters.level_id },
                                { preserveState: true },
                            );
                        }}
                        className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                        <div className="flex flex-wrap gap-1.5">
                            <button
                                type="button"
                                onClick={() =>
                                    router.get(
                                        '/students',
                                        { search, level_id: '' },
                                        { preserveState: true },
                                    )
                                }
                                className={`h-9 rounded-lg px-3 text-xs font-semibold ${
                                    filters.level_id === ''
                                        ? 'bg-[#0F172A] text-white'
                                        : 'bg-[#F1F5F9] text-[#475569]'
                                }`}
                            >
                                Semua
                            </button>
                            {levels.map((l) => (
                                <button
                                    key={l.id}
                                    type="button"
                                    onClick={() =>
                                        router.get(
                                            '/students',
                                            { search, level_id: l.id },
                                            { preserveState: true },
                                        )
                                    }
                                    className={`h-9 rounded-lg px-3 text-xs font-semibold ${
                                        filters.level_id === String(l.id)
                                            ? 'bg-[#0F172A] text-white'
                                            : 'bg-[#F1F5F9] text-[#475569]'
                                    }`}
                                >
                                    {l.name}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari kode R26..., nama murid, wali, WA..."
                                className="h-10 sm:w-72"
                            />
                            <Button
                                type="submit"
                                variant="outline"
                                className="h-10"
                            >
                                <Search className="size-4" />
                            </Button>
                        </div>
                    </form>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[780px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold text-[#475569] uppercase">
                                    <th className="px-3 py-3">
                                        Kode & Email Login
                                    </th>
                                    <th className="px-3 py-3">Nama Murid</th>
                                    <th className="px-3 py-3">
                                        Jenjang & Kelas
                                    </th>
                                    <th className="px-3 py-3">
                                        Wali & WhatsApp
                                    </th>
                                    <th className="px-3 py-3 text-right">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F1F5F9]">
                                {students.data.map((s) => (
                                    <tr
                                        key={s.id}
                                        className="hover:bg-[#F8FAFC]/70"
                                    >
                                        <td className="px-3 py-3.5">
                                            <p className="font-mono font-bold text-[#0F172A]">
                                                {s.student_code}
                                            </p>
                                            <p className="font-mono text-xs text-[#64748B]">
                                                {s.email}
                                            </p>
                                        </td>
                                        <td className="px-3 py-3.5">
                                            <p className="font-semibold text-[#0F172A]">
                                                {s.name}
                                            </p>
                                            <p className="text-xs text-[#64748B]">
                                                Lahir:{' '}
                                                <span className="font-mono">
                                                    {s.birth_date ?? '-'}
                                                </span>
                                                {!s.is_active && (
                                                    <span className="ml-2 rounded bg-[#FFF1F2] px-1.5 py-0.5 text-[10px] font-bold text-[#BE123C]">
                                                        NONAKTIF
                                                    </span>
                                                )}
                                            </p>
                                        </td>
                                        <td className="px-3 py-3.5">
                                            <span
                                                className={`inline-block rounded border px-2 py-0.5 text-xs font-semibold ${levelBadgeClass(s.level_slug)}`}
                                            >
                                                {s.level_name}
                                            </span>
                                            <p className="mt-1 text-xs font-medium text-[#334155]">
                                                {s.active_class_name ??
                                                    'Belum ada kelas'}
                                            </p>
                                            <p className="text-[11px] text-[#64748B]">
                                                {s.active_class_schedule}
                                            </p>
                                        </td>
                                        <td className="px-3 py-3.5">
                                            <p className="font-medium text-[#0F172A]">
                                                {s.guardian_name}
                                            </p>
                                            <p className="font-mono text-xs text-[#475569]">
                                                {s.guardian_phone}
                                            </p>
                                        </td>
                                        <td className="px-3 py-3.5 text-right">
                                            <div className="inline-flex gap-1.5">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => startEdit(s)}
                                                >
                                                    <Edit3 className="size-3.5" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    title="Reset Password ke Tanggal Lahir"
                                                    onClick={() => {
                                                        if (
                                                            confirm(
                                                                `Reset password akun ${s.name} kembali ke tanggal lahir?`,
                                                            )
                                                        ) {
                                                            router.post(
                                                                `/students/${s.id}/reset-password`,
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <RotateCcw className="size-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {students.last_page > 1 && (
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#F1F5F9] pt-4">
                            <p className="text-xs text-[#64748B]">
                                Halaman {students.current_page} dari{' '}
                                {students.last_page}
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {students.links.map((lnk, idx) =>
                                    lnk.url ? (
                                        <Link
                                            key={idx}
                                            href={lnk.url}
                                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                                lnk.active
                                                    ? 'bg-[#0F172A] text-white'
                                                    : 'bg-[#F1F5F9] text-[#475569]'
                                            }`}
                                            dangerouslySetInnerHTML={{
                                                __html: lnk.label,
                                            }}
                                        />
                                    ) : null,
                                )}
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}
