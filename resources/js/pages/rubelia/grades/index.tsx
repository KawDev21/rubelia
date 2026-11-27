import { Head, router, useForm } from '@inertiajs/react';
import { Download, FileSpreadsheet, Plus, Trash2 } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type GradeRow = {
    id: number;
    subject_topic: string;
    graded_at: string;
    score: number;
    notes?: string | null;
    student?: { student_code: string; user?: { name: string } };
    study_class?: { name: string };
    mentor?: { name: string };
};

type Props = {
    roleView: 'master' | 'admin' | 'mentor' | 'student';
    averageScore?: number;
    classes?: { id: number; name: string; session_number: number }[];
    selectedClassId?: number | null;
    studentsInClass?: { id: number; student_code: string; name: string }[];
    grades: {
        data: GradeRow[];
    };
};

export default function GradesIndex({
    roleView,
    averageScore = 0,
    classes = [],
    selectedClassId,
    studentsInClass = [],
    grades,
}: Props) {
    const canInput = roleView !== 'student';

    const form = useForm({
        student_id: studentsInClass[0]?.id ?? ('' as number | ''),
        study_class_id: selectedClassId ?? ('' as number | ''),
        subject_topic: '',
        graded_at: new Date().toISOString().slice(0, 10),
        score: 85,
        notes: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/grades', {
            onSuccess: () => form.reset('subject_topic', 'notes'),
        });
    };

    return (
        <>
            <Head title="Daftar Nilai Akademik" />

            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="font-display text-2xl font-bold text-[#0F172A]">
                            {roleView === 'student'
                                ? 'Daftar Nilai & Perkembangan Belajar'
                                : 'Input & Rekap Nilai Murid'}
                        </h1>
                        <p className="text-sm text-[#475569]">
                            {roleView === 'student'
                                ? `Rata-rata nilai evaluasi saat ini: ${averageScore}`
                                : 'Catat hasil latihan, ulangan harian, maupun evaluasi berkala murid.'}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button asChild variant="outline" className="h-10">
                            <a href="/exports/student-grades/pdf">
                                <Download className="mr-1.5 size-4" />
                                Ekspor PDF
                            </a>
                        </Button>
                        <Button asChild variant="outline" className="h-10">
                            <a href="/exports/student-grades/excel">
                                <FileSpreadsheet className="mr-1.5 size-4" />
                                Ekspor Excel
                            </a>
                        </Button>
                    </div>
                </div>

                <div
                    className={`grid gap-6 ${canInput ? 'lg:grid-cols-[1fr_1.8fr]' : ''}`}
                >
                    {canInput && (
                        <form
                            onSubmit={submit}
                            className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6"
                        >
                            <h2 className="font-display text-lg font-bold text-[#0F172A]">
                                Input Nilai Baru
                            </h2>

                            <div className="grid gap-1.5">
                                <Label>Pilih Kelas</Label>
                                <select
                                    value={selectedClassId ?? ''}
                                    onChange={(e) => {
                                        const cid = Number(e.target.value);
                                        form.setData('study_class_id', cid);
                                        router.get(
                                            '/grades',
                                            { class_id: cid },
                                            { preserveState: true },
                                        );
                                    }}
                                    className="h-11 rounded-xl border border-[#CBD5E1] bg-white px-3 text-sm"
                                >
                                    {classes.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} (Sesi {c.session_number})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid gap-1.5">
                                <Label>Pilih Murid di Kelas Ini</Label>
                                <select
                                    value={form.data.student_id}
                                    onChange={(e) =>
                                        form.setData(
                                            'student_id',
                                            Number(e.target.value),
                                        )
                                    }
                                    required
                                    className="h-11 rounded-xl border border-[#CBD5E1] bg-white px-3 text-sm"
                                >
                                    <option value="">-- Pilih Murid --</option>
                                    {studentsInClass.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.student_code})
                                        </option>
                                    ))}
                                </select>
                                <InputError message={form.errors.student_id} />
                            </div>

                            <div className="grid gap-1.5">
                                <Label>Mata Pelajaran / Topik Evaluasi</Label>
                                <Input
                                    value={form.data.subject_topic}
                                    onChange={(e) =>
                                        form.setData(
                                            'subject_topic',
                                            e.target.value,
                                        )
                                    }
                                    required
                                    placeholder="Contoh: Matematika - Pecahan & Desimal"
                                    className="h-11"
                                />
                                <InputError
                                    message={form.errors.subject_topic}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>Tanggal Penilaian</Label>
                                    <Input
                                        type="date"
                                        value={form.data.graded_at}
                                        onChange={(e) =>
                                            form.setData(
                                                'graded_at',
                                                e.target.value,
                                            )
                                        }
                                        required
                                        className="mt-1 h-11 font-mono"
                                    />
                                </div>
                                <div>
                                    <Label>Nilai (0 - 100)</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={100}
                                        step="0.5"
                                        value={form.data.score}
                                        onChange={(e) =>
                                            form.setData(
                                                'score',
                                                Number(e.target.value),
                                            )
                                        }
                                        required
                                        className="mt-1 h-11 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-1.5">
                                <Label>Catatan Perkembangan dari Mentor</Label>
                                <textarea
                                    rows={3}
                                    value={form.data.notes}
                                    onChange={(e) =>
                                        form.setData('notes', e.target.value)
                                    }
                                    placeholder="Catatan pemahaman materi atau saran latihan..."
                                    className="rounded-xl border border-[#CBD5E1] p-3 text-sm"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={
                                    form.processing || !form.data.student_id
                                }
                                className="h-11 w-full bg-[#E2A829] font-semibold text-[#0F172A] hover:bg-[#CA8A04]"
                            >
                                <Plus className="mr-1.5 size-4" />
                                Simpan Nilai
                            </Button>
                        </form>
                    )}

                    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px] text-left text-sm">
                                <thead>
                                    <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold text-[#475569] uppercase">
                                        <th className="px-3 py-2.5">Tanggal</th>
                                        {canInput && (
                                            <th className="px-3 py-2.5">
                                                Murid
                                            </th>
                                        )}
                                        <th className="px-3 py-2.5">
                                            Materi / Topik
                                        </th>
                                        <th className="px-3 py-2.5">Nilai</th>
                                        <th className="px-3 py-2.5">
                                            Catatan Mentor
                                        </th>
                                        {canInput && (
                                            <th className="px-3 py-2.5 text-right">
                                                Aksi
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F1F5F9]">
                                    {grades.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="py-8 text-center text-[#64748B]"
                                            >
                                                Belum ada data nilai tercatat.
                                            </td>
                                        </tr>
                                    ) : (
                                        grades.data.map((g) => (
                                            <tr key={g.id}>
                                                <td className="px-3 py-3 font-mono text-xs">
                                                    {g.graded_at}
                                                </td>
                                                {canInput && (
                                                    <td className="px-3 py-3 font-semibold text-[#0F172A]">
                                                        {g.student?.user?.name}{' '}
                                                        <span className="font-mono text-xs text-[#64748B]">
                                                            (
                                                            {
                                                                g.student
                                                                    ?.student_code
                                                            }
                                                            )
                                                        </span>
                                                    </td>
                                                )}
                                                <td className="px-3 py-3">
                                                    <p className="font-semibold text-[#0F172A]">
                                                        {g.subject_topic}
                                                    </p>
                                                    <p className="text-xs text-[#64748B]">
                                                        {g.study_class?.name} |
                                                        Mentor:{' '}
                                                        {g.mentor?.name ?? '-'}
                                                    </p>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span className="rounded-lg bg-[#FEF9C3] px-2.5 py-1 font-mono text-sm font-bold text-[#0F172A]">
                                                        {g.score}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-xs text-[#475569]">
                                                    {g.notes || '-'}
                                                </td>
                                                {canInput && (
                                                    <td className="px-3 py-3 text-right">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                if (
                                                                    confirm(
                                                                        'Hapus data nilai ini?',
                                                                    )
                                                                ) {
                                                                    router.delete(
                                                                        `/grades/${g.id}`,
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="size-3.5 text-[#BE123C]" />
                                                        </Button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
