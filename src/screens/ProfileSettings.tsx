import { useState } from 'react';
import type { ReactNode } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useToast } from '../components/Toast';
import { LibPage } from '../components/LibPage';
import { Toggle } from '../components/Toggle';
import { ProfileIcon } from '../components/ProfileIcon';
import type { ProfileIconName } from '../components/ProfileIcon';
import { agoLabel, notifActions, useNotifications } from '../notifications';
import type { NotifType } from '../notifications';
import { s } from '../styles';
import { C } from '../theme';
import type { User } from '../types';
import { campusLabel } from '../utils';

const note = { backgroundColor: '#FFF7E0', borderRadius: 12, padding: 12, marginBottom: 12 } as const;

function Section({ children }: { children: string }) {
  return <Text style={[s.lbH2, { fontSize: 17 }]}>{children}</Text>;
}

function IconRow({ icon, tint, title, sub, onPress }: { icon: ReactNode; tint: string; title: string; sub: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={[s.lbCard, { marginBottom: 12 }]} activeOpacity={0.8} onPress={onPress}>
      <View style={[s.lbCardIcon, { backgroundColor: tint }]}>{typeof icon === 'string' ? <Text style={{ fontSize: 20 }}>{icon}</Text> : icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={s.lbCardTitle}>{title}</Text>
        <Text style={s.lbCardMeta}>{sub}</Text>
      </View>
      <Text style={s.menuChevron}>›</Text>
    </TouchableOpacity>
  );
}

function ToggleRow({ title, sub, on, onToggle, last }: { title: string; sub: string; on: boolean; onToggle: () => void; last?: boolean }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center' }, !last && { marginBottom: 14 }]}>
      <View style={{ flex: 1 }}>
        <Text style={s.lbCardTitle}>{title}</Text>
        <Text style={s.lbCardMeta}>{sub}</Text>
      </View>
      <Toggle on={on} onPress={onToggle} />
    </View>
  );
}

/* ---------- Notifications ---------- */
const NOTIF_ICON: Record<NotifType, { icon: ProfileIconName; bg: string }> = {
  follow: { icon: 'user', bg: '#E3F0E4' }, message: { icon: 'message', bg: '#E6EDFB' }, board: { icon: 'message', bg: '#FDF1C4' },
  event: { icon: 'calendar', bg: '#DCEADB' }, place: { icon: 'pin', bg: '#FADFD6' }, library: { icon: 'book', bg: '#FDF1C4' }, welcome: { icon: 'bell', bg: '#F3D9D6' },
};
export function NotificationsScreen({ onBack }: { onBack: () => void }) {
  const [prefs, setPrefs] = useState({ replies: true, events: true, recs: false });
  const [showPrefs, setShowPrefs] = useState(true);
  const toast = useToast();
  const { items } = useNotifications();
  const flip = (k: keyof typeof prefs) => setPrefs((p) => ({ ...p, [k]: !p[k] }));

  return (
    <LibPage title="Notifications" sub="Your campus activity" onBack={onBack}>
      <View style={note}>
        <Text style={s.privacyText}>Simulated activity only. No live notifications or device permissions are enabled.</Text>
      </View>
      {toast.node}

      <Section>Recent activity</Section>
      {items.length === 0 && <Text style={[s.muted, { fontSize: 13, marginBottom: 16 }]}>No notifications yet. Replies, messages and event reminders will show up here.</Text>}
      {items.slice(0, 5).map((n) => (
        <IconRow key={n.id} icon={<ProfileIcon name={NOTIF_ICON[n.type].icon} size={20} />} tint={NOTIF_ICON[n.type].bg} title={n.title} sub={`${n.body} · ${agoLabel(n.createdAt)}`} onPress={() => notifActions.markRead(n.id)} />
      ))}

      <Section>Notification preferences</Section>
      <IconRow icon={<ProfileIcon name="settings" size={20} />} tint="#E6E9F8" title="Manage preferences" sub="Static settings preview below" onPress={() => setShowPrefs((v) => !v)} />
      {showPrefs && (
        <View style={[s.lbCard, { flexDirection: 'column', alignItems: 'stretch', marginBottom: 10 }]}>
          <ToggleRow title="Board replies" sub="Replies to your campus conversations" on={prefs.replies} onToggle={() => flip('replies')} />
          <ToggleRow title="Event reminders" sub="Updates for your registered events" on={prefs.events} onToggle={() => flip('events')} />
          <ToggleRow title="Campus recommendations" sub="Suggested places and communities" on={prefs.recs} onToggle={() => flip('recs')} last />
        </View>
      )}
      <Text style={[s.muted, { fontSize: 12, marginBottom: 8 }]}>Preferences are display-only and aren’t saved.</Text>
    </LibPage>
  );
}

/* ---------- Privacy & safety ---------- */
export function PrivacySafetyScreen({ user, onBack }: { user: User; onBack: () => void }) {
  const [prefs, setPrefs] = useState({ campus: true, suggest: true, location: false });
  const flip = (k: keyof typeof prefs) => setPrefs((p) => ({ ...p, [k]: !p[k] }));

  return (
    <LibPage title="Privacy & safety" sub="Your campus, your comfort" onBack={onBack}>
      <View style={{ backgroundColor: C.successBg, borderRadius: 16, padding: 16, marginBottom: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '900', color: C.dark, marginBottom: 8 }}>Share thoughtfully.</Text>
        <Text style={{ fontSize: 13, color: C.dark, lineHeight: 19 }}>
          Public board posts can be seen by the community. Keep passwords, student IDs, and health details out of posts and comments.
        </Text>
      </View>

      <Section>Privacy settings</Section>
      <View style={[s.lbCard, { flexDirection: 'column', alignItems: 'stretch', marginBottom: 6 }]}>
        <ToggleRow title="Show campus on profile" sub={campusLabel(user.university)} on={prefs.campus} onToggle={() => flip('campus')} />
        <ToggleRow title="Personalized suggestions" sub="Use interests to suggest campus content" on={prefs.suggest} onToggle={() => flip('suggest')} />
        <ToggleRow title="Location sharing" sub="Off · No live GPS in this prototype" on={prefs.location} onToggle={() => flip('location')} last />
      </View>

      <Section>Safety tools</Section>
      <IconRow icon="🚩" tint="#F6E1DC" title="Report content" sub="Choose a reason from the post menu" onPress={() => Alert.alert('Report content', 'Open the ⋮ menu on any post and choose Report.')} />
      <IconRow icon="🚫" tint="#FDF1C4" title="Blocked accounts" sub="No blocked accounts in this demo" onPress={() => Alert.alert('Blocked accounts', 'You haven’t blocked anyone (demo).')} />
      <IconRow icon="🛡️" tint="#DCEADB" title="Privacy information" sub="What you share and where it appears" onPress={() => Alert.alert('Privacy information', 'Your name, program and campus are visible to verified TIP students. Use the toggles above to control what appears.')} />

      <View style={note}>
        <Text style={s.privacyText}>🛡️  Static demo settings. Nothing is saved, reported or blocked; no personal information is submitted.</Text>
      </View>
    </LibPage>
  );
}

/* ---------- Help center ---------- */
const FAQ = [
  { q: 'How do I join a board?', a: 'Open a campus board and choose Join Community. The joined state in this prototype is simulated.' },
  { q: 'Where can I find my saved places?', a: 'Go to Your profile → Saved places to see your personal collection.' },
  { q: 'Are appointments and bookings real?', a: 'No. Contact the relevant campus office for actual services. This prototype only previews the request process.' },
];

export function HelpCenterScreen({ onBack }: { onBack: () => void }) {
  const [query, setQuery] = useState('');
  const [sent, setSent] = useState(false);
  const q = query.trim().toLowerCase();
  const shown = FAQ.filter((f) => !q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
  const showAccount = !q || 'account password help recovery demo account setup'.includes(q);

  return (
    <LibPage
      title="Help center"
      sub="A little help for campus life"
      onBack={onBack}
      footer={
        <TouchableOpacity style={[s.primaryBtn, { flexDirection: 'row' }]} activeOpacity={0.85} onPress={() => setSent(true)}>
          <Text style={{ marginRight: 8 }}>💬</Text>
          <Text style={s.primaryBtnText}>Contact help · Demo</Text>
        </TouchableOpacity>
      }
    >
      <View style={[s.lbCard, { paddingVertical: 4, marginBottom: 14 }]}>
        <Text style={{ marginRight: 10, color: C.muted }}>🔍</Text>
        <TextInput
          style={{ flex: 1, fontSize: 14, color: C.dark, height: 40 }}
          placeholder="Search help topics"
          placeholderTextColor="#A5A296"
          value={query}
          onChangeText={setQuery}
        />
        {!!query && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={{ fontSize: 16, color: C.dark }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={[s.lbH2, { fontSize: 17, marginTop: 0 }]}>Frequently asked questions</Text>
      {shown.map((f) => (
        <View key={f.q} style={[s.lbCard, { flexDirection: 'column', alignItems: 'stretch', marginBottom: 12 }]}>
          <Text style={s.lbCardTitle}>{f.q}</Text>
          <Text style={s.lbCardMeta}>{f.a}</Text>
        </View>
      ))}
      {showAccount && (
        <IconRow icon="🔒" tint="#FDF1C4" title="Account & password help" sub="Recovery and demo account setup" onPress={() => Alert.alert('Account & password help', 'Use “Forgot password?” on the log in screen to start recovery.')} />
      )}
      {shown.length === 0 && !showAccount && (
        <Text style={[s.muted, { fontSize: 13, marginBottom: 12 }]}>No help topics match “{query.trim()}”.</Text>
      )}

      <View style={note}>
        <Text style={s.privacyText}>
          🛡️  {sent
            ? 'Demo help message: “Thanks for exploring Vicinia. This contact entry is a preview; no message or support ticket is sent.”'
            : 'Tap “Contact help · Demo” to preview the contact flow. Nothing is sent.'}
        </Text>
      </View>
    </LibPage>
  );
}
