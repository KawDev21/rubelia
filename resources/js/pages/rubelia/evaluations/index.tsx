import { Head, router, useForm } from '@inertiajs/react';
import { Download, FileSpreadsheet, Lock, Send } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type Props = {
    roleView: 'master' | 'admin' | 'student';
    evaluationOpen: boolean;
    evaluationYear: number;
    selectedMentorId?: number | null;
    mentors?: { id: number; name: string }[];
    reviews?: {
        id: number;
        period_year: number;
        review_text: string;
        created_at: string;
        student?: { student_code: string; user?: { name: string } };
        mentor?: { name: string };
        study_class?: { name: string };
    }[];
    studentTarget?: {
        mentor_id: number;
        mentor_name: string;
        class_id?: number | null;
        class_name?: string | null;
        already_submitted: boolean;
        submitted_text?: string | null;
    } | null;
};

export default function EvaluationsIndex({
    roleView,
    evaluationOpen,
    evaluationYear,
    selectedMentorId,
    mentors = [],
    reviews = [],
    studentTarget,
}: Props) {
    const form = useForm({
        mentor_id: studentTarget?.mentor_id ?? 0,
        review_text: studentTarget?.submitted_text ?? '',
    });

    if (roleView === 'student') {
        return (
            <>
                <Head title="Penilaian Akhir Tahun Mentor" />

                <div className="mx-auto max-w-2xl space-y-6">
                    <div>
                        <h1 className="font-display text-2xl font-bold text-[#0F172A]">
                            Penilaian Akhir Tahun Mentor ({evaluationYear})
                        </h1>
                        <p className="text-sm text-[#475569]">
                            Jawaban ulasan Anda bersifat rahasia terhadap mentor
                            dan{' '}
                            <strong>
                                hanya dapat dibaca oleh Owner & Admin Rubelia
                            </strong>
                            .
                        </p>
                    </div>

                    {!evaluationOpen ? (
                        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center">
                            <Lock className="mx-auto size-8 text-[#64748B]" />
                            <p className="mt-3 font-display text-base font-bold text-[#0F172A]">
                                Periode Penilaian Akhir Tahun Belum Dibuka
                            </p>
                            <p className="mt-1 text-sm text-[#64748B]">
                                Form evaluasi akan dibuka oleh Owner Rubelia
                                pada akhir tahun ajaran.
                            </p>
                        </div>
                    ) : !studentTarget ? (
                        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B]">
                            Anda belum memiliki mentor aktif yang terdaftar di
                            kelas saat ini.
                        </div>
                    ) : (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                form.post('/evaluations');
                            }}
                            className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-6"
                        >
                            <div className="rounded-xl bg-[#F8FAFC] p-4">
                                <p className="text-xs text-[#64748B]">
                                    Mentor yang Dinilai
                                </p>
                                <p className="font-display text-lg font-bold text-[#0F172A]">
                                    {studentTarget.mentor_name}
                                </p>
                                <p className="text-xs text-[#475569]">
                                    Kelas: {studentTarget.class_name}
                                </p>
                            </div>

                            <div className="grid gap-1.5">
                                <Label>
                                    Tuliskan ulasan tentang cara mengajar,
                                    ketepatan waktu, keramahan, dan masukan
                                    untuk Mentor
                                </Label>
                                <textarea
                                    rows={6}
                                    value={form.data.review_text}
                                    onChange={(e) =>
                                        form.setData(
                                            'review_text',
                                            e.target.value,
                                        )
                                    }
                                    required
                                    minLength={10}
                                    placeholder="Ceritakan pengalaman belajar bersama mentor di kelas..."
                                    className="rounded-xl border border-[#CBD5E1] p-3.5 text-sm"
                                />
                                <InputError message={form.errors.review_text} />
                            </div>

                            <Button
                                type="submit"
                                disabled={form.processing}
                                className="h-11 w-full bg-[#E2A829] font-semibold text-[#0F172A] hover:bg-[#CA8A04]"
                            >
                                <Send className="mr-1.5 size-4" />
                                {studentTarget.already_submitted
                                    ? 'Perbarui Ulasan Evaluasi'
                                    : 'Kirim Penilaian Akhir Tahun'}
                            </Button>
                        </form>
                    )}
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Hasil Evaluasi Tahunan Mentor" />

            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="font-display text-2xl font-bold text-[#0F172A]">
                            Hasil Penilaian Akhir Tahun Mentor ({evaluationYear}
                            )
                        </h1>
                        <p className="text-sm text-[#475569]">
                            Khusus Owner & Admin — ulasan jujur dari murid/wali
                            mengenai kualitas mengajar mentor.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" className="h-10">
                            <a
                                href={`/exports/mentor-evaluations/pdf?year=${evaluationYear}`}
                            >
                                <Download className="mr-1.5 size-4" />
                                Ekspor PDF
                            </a>
                        </Button>
                        <Button asChild variant="outline" className="h-10">
                            <a
                                href={`/exports/mentor-evaluations/excel?year=${evaluationYear}`}
                            >
                                <FileSpreadsheet className="mr-1.5 size-4" />
                                Ekspor Excel
                            </a>
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4">
                    <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                            evaluationOpen
                                ? 'bg-[#ECFDF5] text-[#047857]'
                                : 'bg-[#F1F5F9] text-[#475569]'
                        }`}
                    >
                        Status Periode {evaluationYear}:{' '}
                        {evaluationOpen ? 'DIBUKA' : 'DITUTUP'}
                    </span>

                    <select
                        value={selectedMentorId ?? ''}
                        onChange={(e) =>
                            router.get(
                                '/evaluations',
                                {
                                    year: evaluationYear,
                                    mentor_id: e.target.value || undefined,
                                },
                                { preserveState: true },
                            )
                        }
                        className="h-10 rounded-xl border border-[#CBD5E1] bg-white px-3 text-sm"
                    >
                        <option value="">Semua Mentor</option>
                        {mentors.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {reviews.length === 0 ? (
                        <div className="col-span-full rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-10 text-center text-sm text-[#64748B]">
                            Belum ada ulasan murid pada periode tahun{' '}
                            {evaluationYear}.
                        </div>
                    ) : (
                        reviews.map((rev) => (
                            <div
                                key={rev.id}
                                className="space-y-2 rounded-2xl border border-[#E2E8F0] bg-white p-5"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="rounded-md bg-[#0F172A] px-2.5 py-0.5 text-xs font-semibold text-[#E2A829]">
                                        Mentor: {rev.mentor?.name}
                                    </span>
                                    <span className="text-xs text-[#64748B]">
                                        {rev.study_class?.name}
                                    </span>
                                </div>
                                <p className="text-sm leading-relaxed text-[#0F172A]">
                                    {rev.review_text}
                                </p>
                                <p className="border-t border-[#F1F5F9] pt-2 text-xs text-[#64748B]">
                                    Diisi oleh:{' '}
                                    <strong>{rev.student?.user?.name}</strong> (
                                    {rev.student?.student_code})
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
