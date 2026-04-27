import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, Search, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../api/api';
import { socket } from '../api/socket';
import LoadingOverlay from '../components/common/LoadingOverlay';

export default function NotificationsPage() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [openingId, setOpeningId] = useState(null);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error(error);
      toast.error('Impossible de charger les notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const refresh = () => loadNotifications();

    socket.on('alert:created', refresh);
    socket.on('report:created', refresh);
    socket.on('alert:resolved', refresh);
    socket.on('alert:moderated', refresh);
    socket.on('message:created', refresh);

    return () => {
      socket.off('alert:created', refresh);
      socket.off('report:created', refresh);
      socket.off('alert:resolved', refresh);
      socket.off('alert:moderated', refresh);
      socket.off('message:created', refresh);
    };
  }, []);

  const filteredNotifications = useMemo(() => {
    let list = [...notifications];

    if (filter === 'UNREAD') {
      list = list.filter((n) => !n.isRead);
    } else if (filter === 'READ') {
      list = list.filter((n) => n.isRead);
    }

    const keyword = search.trim().toLowerCase();
    if (keyword) {
      list = list.filter((n) => {
        const title = String(n.title || '').toLowerCase();
        const message = String(n.message || '').toLowerCase();
        const childName = String(n.alert?.childName || '').toLowerCase();
        const location = String(n.alert?.lastSeenLocation || '').toLowerCase();

        return (
          title.includes(keyword) ||
          message.includes(keyword) ||
          childName.includes(keyword) ||
          location.includes(keyword)
        );
      });
    }

    return list;
  }, [notifications, filter, search]);

  const markOneRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error(error);
      toast.error('Impossible de marquer cette notification comme lue.');
    }
  };

  const markAllRead = async () => {
    try {
      setMarkingAll(true);
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('Toutes les notifications ont été marquées comme lues.');
    } catch (error) {
      console.error(error);
      toast.error('Impossible de tout marquer comme lu.');
    } finally {
      setMarkingAll(false);
    }
  };

  const openNotification = async (notification) => {
    try {
      setOpeningId(notification.id);

      if (!notification.isRead) {
        await api.patch(`/notifications/${notification.id}/read`);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
      }

      if (notification.alertId || notification.alert?.id) {
        const alertId = notification.alertId || notification.alert?.id;
        navigate(`/alerts/${alertId}`);
        return;
      }

      if (notification.type === 'REPORT' && notification.alert?.id) {
        navigate(`/alerts/${notification.alert.id}`);
        return;
      }

      navigate('/notifications');
    } catch (error) {
      console.error(error);
      toast.error("Impossible d'ouvrir cette notification.");
    } finally {
      setOpeningId(null);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setFilter('ALL');
  };

  return (
    <div className="space-y-6">
      <LoadingOverlay
        open={loading || markingAll || openingId !== null}
        title={
          markingAll
            ? 'Mise à jour en cours...'
            : openingId !== null
            ? 'Ouverture de la notification...'
            : 'Chargement des notifications...'
        }
        subtitle={
          markingAll
            ? 'Marquage des notifications comme lues.'
            : openingId !== null
            ? 'Redirection vers le cas concerné.'
            : 'Récupération des notifications.'
        }
      />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount} notification(s) non lue(s)
          </p>
        </div>

        <button
          type="button"
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCheck className="h-4 w-4" />
          Tout marquer comme lu
        </button>
      </div>

      <div className="rounded-2xl border bg-white p-4 space-y-4">
        <div className="relative">
          <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une notification, un cas ou un lieu..."
            className="w-full rounded-xl border pl-10 pr-4 py-3"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              filter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'border hover:bg-slate-50'
            }`}
          >
            Toutes
          </button>

          <button
            type="button"
            onClick={() => setFilter('UNREAD')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              filter === 'UNREAD'
                ? 'bg-orange-500 text-white'
                : 'border hover:bg-slate-50'
            }`}
          >
            Non lues
          </button>

          <button
            type="button"
            onClick={() => setFilter('READ')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              filter === 'READ'
                ? 'bg-emerald-600 text-white'
                : 'border hover:bg-slate-50'
            }`}
          >
            Lues
          </button>

          <button
            type="button"
            onClick={resetFilters}
            className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            Réinitialiser
          </button>
        </div>

        <p className="text-sm text-gray-500">
          {filteredNotifications.length} résultat(s)
        </p>
      </div>

      <div className="space-y-4">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-2xl border p-4 transition ${
                notification.isRead ? 'bg-white' : 'bg-orange-50 border-orange-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3 flex-1 min-w-[260px]">
                  <div className="mt-1">
                    <Bell className="h-5 w-5 text-orange-600" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900">
                        {notification.title}
                      </h3>

                      {!notification.isRead ? (
                        <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-semibold text-orange-700">
                          Non lue
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                          Lue
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-700 mt-1">
                      {notification.message}
                    </p>

                    {notification.alert ? (
                      <p className="text-xs text-gray-500 mt-2">
                        Cas : {notification.alert.childName} •{' '}
                        {notification.alert.lastSeenLocation}
                      </p>
                    ) : null}

                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {!notification.isRead ? (
                    <button
                      type="button"
                      onClick={() => markOneRead(notification.id)}
                      className="rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-white"
                    >
                      Marquer comme lu
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => openNotification(notification)}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ouvrir
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed p-8 text-center text-gray-500">
            Aucune notification ne correspond à votre recherche.
          </div>
        )}
      </div>
    </div>
  );
}