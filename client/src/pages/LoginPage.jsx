import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: 'demo@safefind.com', password: '12345678' });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Connexion réussie');
      navigate('/');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7efe5] p-4">
      <div className="w-full max-w-lg rounded-[32px] border bg-white p-8 shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-red-500 to-orange-500 text-3xl font-bold text-white">!</div>
          <h1 className="mt-4 text-5xl font-extrabold text-orange-600">SafeFind Pro</h1>
          <p className="mt-3 text-gray-500">Connexion sécurisée à la plateforme</p>
        </div>
        <form className="mt-8 space-y-4" onSubmit={submit}>
          <input className="w-full rounded-xl border px-4 py-3" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input type="password" className="w-full rounded-xl border px-4 py-3" placeholder="Mot de passe" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-red-500 to-orange-500 py-3 font-semibold text-white">{loading ? 'Connexion...' : 'Se connecter'}</button>
        </form>
        <p className="mt-5 text-center text-sm text-gray-500">Pas de compte ? <Link className="font-semibold text-orange-600" to="/register">Créer un compte</Link></p>
      </div>
    </div>
  );
}
