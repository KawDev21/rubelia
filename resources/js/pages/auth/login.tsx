import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { store } from '@/routes/login';

type Props = {
    status?: string;
    canResetPassword?: boolean;
};

export default function Login({ status }: Props) {
    return (
        <>
            <Head title="Masuk Akun Rubelia" />

            {status && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-[#ECFDF5] px-3.5 py-2.5 text-sm font-medium text-[#047857]">
                    {status}
                </div>
            )}

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-1.5">
                            <Label
                                htmlFor="email"
                                className="text-sm font-semibold text-[#0F172A]"
                            >
                                Email Akun Rubelia
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="email"
                                placeholder="Contoh: R26110001@rubelia.com"
                                className="h-11 font-mono text-base sm:text-sm"
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-1.5">
                            <Label
                                htmlFor="password"
                                className="text-sm font-semibold text-[#0F172A]"
                            >
                                Password
                            </Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                required
                                tabIndex={2}
                                autoComplete="current-password"
                                placeholder="Password awal: ddmmyyyy tanggal lahir"
                                className="h-11 text-base sm:text-sm"
                            />
                            <p className="text-xs text-[#64748B]">
                                Password awal menggunakan tanggal lahir (
                                <span className="font-mono">ddmmyyyy</span>) dan
                                dapat diganti setelah masuk.
                            </p>
                            <InputError message={errors.password} />
                        </div>

                        <div className="flex items-center space-x-2.5">
                            <Checkbox
                                id="remember"
                                name="remember"
                                tabIndex={3}
                            />
                            <Label
                                htmlFor="remember"
                                className="text-sm text-[#475569]"
                            >
                                Tetap masuk di perangkat ini
                            </Label>
                        </div>

                        <Button
                            type="submit"
                            className="mt-1 h-11 w-full bg-[#E2A829] font-semibold text-[#0F172A] transition-transform hover:bg-[#CA8A04] active:translate-y-[1px]"
                            tabIndex={4}
                            disabled={processing}
                            data-test="login-button"
                        >
                            {processing
                                ? 'Memverifikasi Akun...'
                                : 'Masuk ke Portal Rubelia'}
                        </Button>

                        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-xs leading-relaxed text-[#475569]">
                            Belum memiliki akun atau lupa password? Silakan
                            hubungi langsung petugas Admin di lokasi Bimbingan
                            Belajar Rubelia.
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Login.layout = {
    title: 'Masuk ke Akun Anda',
    description: 'Gunakan email resmi Rubelia yang diberikan saat pendaftaran.',
};
