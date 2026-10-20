import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Avatar } from '../components/Avatar';
import { MenuRow } from '../components/MenuRow';
import { LibPage } from '../components/LibPage';
import { useToast } from '../components/Toast';
import { useActionSheet } from '../components/ActionSheet';
import { s } from '../styles';
import { C } from '../theme';
import type { User } from '../types';
import { DEMO_PROFILE_SAVE, campusLabel } from '../utils';
import { SavedPlaces } from './SavedPlaces';
import { EventsScreen } from './EventsScreen';
import { BoardsScreen } from './BoardsScreen';
import { NotificationsScreen, PrivacySafetyScreen, HelpCenterScreen } from './ProfileSettings';

export function ProfileScreen({ user, onEdit, onLogout, saved, onDismissSaved, goExplore, goEvents, goBoards }: {
  user: User; onEdit: () => void; onLogout: () => void; saved?: boolean; onDismissSaved?: () => void;
  goExplore?: () => void; goEvents?: () => void; goBoards?: () => void;
}) {
  const [page, setPage] = useState<'profile' | 'saved' | 'notifications' | 'privacy' | 'help' | 'events' | 'boards'>('profile');
  const back = () => setPage('profile');
  const toast = useToast();
  const sheet = useActionSheet();
  if (page === 'notifications') return <NotificationsScreen onBack={back} />;
  if (page === 'privacy') return <PrivacySafetyScreen user={user} onBack={back} />;
  if (page === 'help') return <HelpCenterScreen onBack={back} />;
  if (page === 'events') return <LibPage title="My events" sub="Events you registered for" onBack={back}><EventsScreen user={user} /></LibPage>;
  if (page === 'boards') return <LibPage title="My boards" sub="Boards you joined" onBack={back}><BoardsScreen user={user} /></LibPage>;
  if (page === 'saved') {
    return <SavedPlaces user={user} onBack={() => setPage('profile')} onExplore={() => { setPage('profile'); goExplore?.(); }} />;
  }
  const stats = [
    { n: 12, label: 'Check-ins' },
    { n: 6, label: 'Events' },
    { n: 4, label: 'Boards' },
  ];
  return (
    <View style={s.fill}>
      <ScrollView style={s.screen} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.rowBetween}>
          <Text style={[s.header, { marginBottom: 0, fontSize: 26 }]}>Your profile</Text>
          <View style={s.rowCenter}>
            <TouchableOpacity
              style={[s.headerBtn, { backgroundColor: C.dark, marginRight: 10 }]}
              accessibilityLabel="Quick add"
              onPress={() => sheet.open('Quick add', [
                { text: 'Edit profile', onPress: onEdit },
                { text: 'Find places', onPress: () => (goExplore ? goExplore() : toast.show('Open the Explore tab to find places')) },
              ])}
            >
              <Text style={{ color: C.yellow, fontSize: 20, fontWeight: '900', marginTop: -2 }}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.headerBtn, { backgroundColor: '#fff', width: 44, height: 44, borderRadius: 14 }]}
              accessibilityLabel="Settings"
              onPress={() => sheet.open('Settings', [
                { text: 'Notifications', onPress: () => setPage('notifications') },
                { text: 'Privacy & safety', onPress: () => setPage('privacy') },
                { text: 'Help center', onPress: () => setPage('help') },
              ])}
            >
              <Text style={{ fontSize: 18 }}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Identity card */}
        <View style={[s.darkCard, { marginTop: 12, padding: 16, borderRadius: 20 }]}>
          <Avatar user={user} size={72} />
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={[s.darkName, { fontSize: 20 }]}>{user.name}</Text>
            <Text style={s.profileSub}>{user.program} · {user.year}</Text>
            <Text style={s.profileLoc}>📍 {campusLabel(user.university)}</Text>
          </View>
          <TouchableOpacity onPress={onEdit} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={{ fontSize: 18, color: C.yellow }}>✏️</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          {stats.map((st, i) => (
            <View key={st.label} style={[s.statCard, i < stats.length - 1 && { marginRight: 10 }]}>
              <Text style={s.statNum}>{st.n}</Text>
              <Text style={s.muted}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu group 1 */}
        <View style={s.menuCard}>
          <MenuRow icon="🔖" tint="#FBEFC0" label="Saved places" value="8" onPress={() => setPage('saved')} />
          <MenuRow icon="🗓️" tint="#DCEADB" label="My events" value="2 upcoming" onPress={() => (goEvents ? goEvents() : setPage('events'))} />
          <MenuRow icon="💬" tint="#E6E0F3" label="My boards" value="4 joined" last onPress={() => (goBoards ? goBoards() : setPage('boards'))} />
        </View>

        {/* Menu group 2 */}
        <View style={s.menuCard}>
          <MenuRow icon="🔔" tint="#F3D9D6" label="Notifications" value="On" onPress={() => setPage('notifications')} />
          <MenuRow icon="🛡️" tint="#DCEADB" label="Privacy & safety" onPress={() => setPage('privacy')} />
          <MenuRow icon="❓" tint="#FBF3D0" label="Help center" onPress={() => setPage('help')} last />
        </View>

        {/* Saved confirmation */}
        {saved && (
          <View style={s.successBanner}>
            <Text style={{ color: C.green, fontSize: 14 }}>✔️</Text>
            <Text style={s.successBannerText}>
              {DEMO_PROFILE_SAVE ? 'Profile saved · Demo only. Original details unchanged.' : 'Profile saved · Your changes are stored on this device.'}
            </Text>
            <TouchableOpacity onPress={onDismissSaved} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={{ fontSize: 16, color: C.dark }}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {toast.node}
        {sheet.node}

        {/* Verified banner */}
        <View style={s.verified}>
          <Text style={{ color: C.green, marginRight: 10, fontSize: 16 }}>✔️</Text>
          <Text style={s.verifiedText}>Verified TIP student</Text>
          <View style={s.yearPill}><Text style={s.yearPillText}>{new Date().getFullYear()}</Text></View>
        </View>
        <View style={{ height: 12 }} />
      </ScrollView>

      {/* Action buttons pinned above tab bar */}
      <View style={s.profileActions}>
        <TouchableOpacity style={[s.profileBtn, { backgroundColor: C.dark, marginRight: 10 }]} onPress={onEdit}>
          <Text style={{ color: C.yellow, marginRight: 8 }}>✏️</Text>
          <Text style={[s.profileBtnText, { color: '#fff' }]}>Edit profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.profileBtn, { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border }]} onPress={onLogout}>
          <Text style={{ marginRight: 8, fontSize: 16 }}>↪</Text>
          <Text style={s.profileBtnText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
