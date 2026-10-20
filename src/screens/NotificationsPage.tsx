import { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { BackButton } from '../components/BackButton';
import { agoLabel, notifActions, sectionOf, TYPE_ICON, useNotifications } from '../notifications';
import type { AppNotification, NotifTarget } from '../notifications';
import { personOf } from '../people';
import { s } from '../styles';
import { C } from '../theme';
import { initials } from '../utils';

type Filter = 'all' | 'unread';
const SECTIONS = ['Today', 'Yesterday', 'Earlier'] as const;

function Leading({ n }: { n: AppNotification }) {
  const person = n.personId ? personOf(n.personId) : undefined;
  if (person) {
    return (
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: person.bg, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: '800', color: C.dark }}>{initials(person.name)}</Text>
      </View>
    );
  }
  const t = TYPE_ICON[n.type];
  return (
    <View style={[s.lbCardIcon, { width: 44, height: 44, backgroundColor: t.bg }]}>
      <Text style={{ fontSize: 20 }}>{t.icon}</Text>
    </View>
  );
}

function Row({ n, onPress }: { n: AppNotification; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[s.notifRow, !n.read && s.notifRowUnread]}
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${n.read ? '' : 'Unread. '}${n.title}. ${agoLabel(n.createdAt)}`}
    >
      <Leading n={n} />
      <View style={{ flex: 1 }}>
        <Text style={[s.notifTitle, !n.read && s.notifTitleUnread]}>{n.title}</Text>
        <Text style={s.notifBody} numberOfLines={2}>{n.body}</Text>
        <Text style={[s.notifTime, !n.read && { color: C.dark, fontWeight: '700' }]}>{agoLabel(n.createdAt)}</Text>
      </View>
      {!n.read && <View style={s.unreadDot} />}
      <Text style={[s.menuChevron, { marginLeft: 8 }]}>›</Text>
    </TouchableOpacity>
  );
}

export function NotificationsPage({ onBack, onOpen, onSettings }: {
  onBack: () => void; onOpen: (t: NotifTarget) => void; onSettings: () => void;
}) {
  const { items, unread } = useNotifications();
  const [filter, setFilter] = useState<Filter>('all');
  const shown = filter === 'unread' ? items.filter((n) => !n.read) : items;

  const confirmClear = () => Alert.alert('Clear all notifications?', 'This removes every notification from the list. You can restore the demo ones afterwards.', [
    { text: 'Keep', style: 'cancel' },
    { text: 'Clear all', style: 'destructive', onPress: notifActions.clearAll },
  ]);

  const open = (n: AppNotification) => {
    notifActions.markRead(n.id);
    onOpen(n.target);
  };

  return (
    <View style={s.lbPage}>
      {/* Header */}
      <View style={s.libHeader}>
        <BackButton onPress={onBack} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={s.lbHeaderTitle}>Notifications</Text>
          <Text style={s.libSub}>{unread > 0 ? `${unread} unread` : 'You’re all caught up'}</Text>
        </View>
        <TouchableOpacity
          style={[s.headerBtn, { backgroundColor: '#fff', width: 44, height: 44, borderRadius: 14 }]}
          onPress={onSettings}
          accessibilityLabel="Notification settings"
        >
          <Text style={{ fontSize: 18 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Filters + mark all as read */}
      <View style={[s.lbChipRow, { alignItems: 'center' }]}>
        {([['all', 'All'], ['unread', unread > 0 ? `Unread · ${unread}` : 'Unread']] as [Filter, string][]).map(([key, label]) => {
          const on = filter === key;
          return (
            <TouchableOpacity key={key} style={[s.lbChip, on && s.lbChipOn]} onPress={() => setFilter(key)}>
              <Text style={[s.lbChipText, on && s.lbChipTextOn]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={notifActions.markAllRead}
          disabled={unread === 0}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Mark all notifications as read"
        >
          <Text style={[s.notifAction, unread === 0 && { color: C.muted, fontWeight: '600' }]}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {shown.length === 0 ? (
          <View style={[s.lbSuccessWrap, { marginTop: 48 }]}>
            <View style={[s.lbSuccessCircle, { backgroundColor: '#FDF1C4' }]}><Text style={{ fontSize: 34 }}>🔔</Text></View>
            <Text style={s.lbSuccessTitle}>{filter === 'unread' ? 'You’re all caught up' : 'No notifications yet'}</Text>
            <Text style={[s.lbSuccessSub, { marginBottom: 16 }]}>
              {filter === 'unread'
                ? 'No unread notifications. New replies, messages and event reminders will show up here.'
                : 'When people reply, message you or events are coming up, you’ll see it here.'}
            </Text>
            {filter === 'unread' && items.length > 0 && (
              <TouchableOpacity style={[s.secondaryBtn, { alignSelf: 'stretch' }]} onPress={() => setFilter('all')} activeOpacity={0.8}>
                <Text style={s.secondaryBtnText}>View all notifications</Text>
              </TouchableOpacity>
            )}
            {items.length === 0 && (
              <TouchableOpacity style={[s.secondaryBtn, { alignSelf: 'stretch' }]} onPress={notifActions.restore} activeOpacity={0.8}>
                <Text style={s.secondaryBtnText}>Restore demo notifications</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {SECTIONS.map((sec) => {
              const group = shown.filter((n) => sectionOf(n.createdAt) === sec);
              if (group.length === 0) return null;
              return (
                <View key={sec}>
                  <Text style={s.notifSection}>{sec.toUpperCase()}</Text>
                  {group.map((n) => <Row key={n.id} n={n} onPress={() => open(n)} />)}
                </View>
              );
            })}
            <TouchableOpacity style={s.linkBtn} onPress={confirmClear}>
              <Text style={[s.linkBtnText, { color: C.muted, fontWeight: '600' }]}>Clear all notifications</Text>
            </TouchableOpacity>
            <View style={{ backgroundColor: '#FFF7E0', borderRadius: 12, padding: 12, marginTop: 12 }}>
              <Text style={s.privacyText}>🛡️  Simulated activity only. No live notifications or device permissions are enabled.</Text>
            </View>
          </>
        )}
        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
}
