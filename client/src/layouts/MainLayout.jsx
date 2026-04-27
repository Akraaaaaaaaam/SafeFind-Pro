import {
  AlertCircle,
  BarChart3,
  Bell,
  Home,
  LogOut,
  MapPin,
  Settings2,
  ShieldAlert,
  User,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/api';
import { socket } from '../api/socket';
import { useAuth } from '../context/AuthContext';

export default function MainLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [index, setIndex] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const links = [
    { to: '/', label: 'Accueil', icon: Home },
    { to: '/map', label: 'Carte', icon: MapPin },
    { to: '/alerts', label: 'Alertes', icon: ShieldAlert },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/analytics', label: 'Statistiques', icon: BarChart3 },
    { to: '/profile', label: 'Profil', icon: User },
    ...(user?.role === 'ADMIN' || user?.role === 'MODERATOR'
      ? [{ to: '/admin', label: 'Admin', icon: Settings2 }]
      : []),
  ];

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const loadAlerts = async () => {
    try {
      const { data } = await api.get('/alerts?status=ACTIVE');
      setAlerts(data.alerts || []);
    } catch {}
  };

  const loadNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
    } catch {
      setNotifications([]);
    }
  };

  useEffect(() => {
    loadAlerts();
    loadNotifications();
  }, []);

  useEffect(() => {
    const refreshAlerts = () => loadAlerts();
    const refreshNotifications = () => loadNotifications();

    socket.on('alert:created', refreshAlerts);
    socket.on('alert:resolved', refreshAlerts);
    socket.on('report:created', refreshAlerts);

    socket.on('alert:created', refreshNotifications);
    socket.on('alert:resolved', refreshNotifications);
    socket.on('report:created', refreshNotifications);
    socket.on('alert:moderated', refreshNotifications);
    socket.on('message:created', refreshNotifications);

    const timer = setInterval(() => {
      refreshAlerts();
      refreshNotifications();
    }, 12000);

    return () => {
      socket.off('alert:created', refreshAlerts);
      socket.off('alert:resolved', refreshAlerts);
      socket.off('report:created', refreshAlerts);

      socket.off('alert:created', refreshNotifications);
      socket.off('alert:resolved', refreshNotifications);
      socket.off('report:created', refreshNotifications);
      socket.off('alert:moderated', refreshNotifications);
      socket.off('message:created', refreshNotifications);

      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!alerts.length) return;
    const timer = setInterval(() => setIndex((v) => (v + 1) % alerts.length), 5000);
    return () => clearInterval(timer);
  }, [alerts.length]);

  const activeAlert = alerts[index] || null;

  return (
    <div className="min-h-screen bg-[#f7efe5]">
      <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white py-2 px-4 text-sm font-medium flex items-center justify-between gap-3">
        <motion.span
          key={activeAlert?.id || 'none'}
          initial={{ opacity: 0.4, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="truncate"
        >
          {activeAlert
            ? `🚨 ${activeAlert.childName} • ${activeAlert.lastSeenLocation} • ${activeAlert.elapsed} • priorité ${activeAlert.priorityScore}/100`
            : 'Aucune alerte active pour le moment'}
        </motion.span>

        {activeAlert ? (
          <button
            onClick={() => navigate(`/map?alert=${activeAlert.id}`)}
            className="rounded-full bg-white px-4 py-1 text-red-600"
          >
            Voir sur la carte
          </button>
        ) : null}
      </div>

      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 gap-3">
          <button onClick={() => navigate('/')} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500 text-white shadow">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="text-xl font-bold text-orange-600">SafeFind Pro</div>
              <div className="text-xs text-gray-500">
                Alerte, IA, forum, modération et suivi temps réel
              </div>
            </div>
          </button>

          <nav className="hidden gap-2 md:flex">
            {links.map(({ to, label, icon: Icon }) => {
              const isNotifications = to === '/notifications';

              return (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition ${
                      isActive
                        ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}

                  {isNotifications && unreadCount > 0 ? (
                    <span className="ml-1 min-w-[22px] h-[22px] px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center shadow">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  ) : null}
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/notifications')}
              className="relative rounded-xl p-2 text-gray-700 hover:bg-gray-100 md:hidden"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              ) : null}
            </button>

            <div className="hidden text-right md:block">
              <div className="text-sm font-semibold">{user?.fullname}</div>
              <div className="text-xs text-gray-500">
                {user?.role} • {user?.city || user?.email}
              </div>
            </div>

            <button
              onClick={logout}
              className="rounded-xl p-2 text-gray-700 hover:bg-gray-100"
              title="Déconnexion"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}