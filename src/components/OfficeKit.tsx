import { useEffect, useRef, useState } from 'react';
import { Linking, Text, TouchableOpacity, View } from 'react-native';
import { usePopup } from './Popup';
import { OfficeIcon } from './OfficeIcon';
import type { OfficeIconName } from './OfficeIcon';
import { OFFICE_THEME } from '../data';
import type { CampusEvent, OfficeData, OfficeService } from '../data';
import { s } from '../styles';
import { C } from '../theme';
import type { OfficeRequest, User } from '../types';
import { EMAIL_REGEX, makeRef } from '../utils';
import { Field } from './Field';
import { LibPage } from './LibPage';
import { PrimaryButton } from './PrimaryButton';
import { PrivacyNote } from './PrivacyNote';
import { Select } from './Select';

/* ---------- Hub pieces (used by the OSA and Guidance pages) ---------- */

export function OfficeHero({ office }: { office: OfficeData }) {
  const t = OFFICE_THEME[office.office];
  return (
    <View style={[s.libHero, { backgroundColor: t.bg, borderWidth: 1, borderColor: t.border }]}>
      <View style={s.libHeroIcon}><OfficeIcon name={office.heroIcon as OfficeIconName} size={32} color={t.accent} strokeWidth={1.7} /></View>
      <View style={{ flex: 1 }}>
        <Text style={s.libHeroTitle}>{office.heroTitle ?? office.name}</Text>
        <Text style={s.libHeroBody}>{office.blurb}</Text>
      </View>
    </View>
  );
}

export function OfficeInfoCard({ office }: { office: OfficeData }) {
  const t = OFFICE_THEME[office.office];
  return (
    <View style={s.libInfoCard}>
      {office.info.map((i, idx) => (
        <View key={i.key} style={[s.rowCenter, idx < office.info.length - 1 && { marginBottom: 10 }]}>
          <View style={[s.libInfoIcon, { backgroundColor: t.bg }]}><OfficeIcon name={i.icon as OfficeIconName} size={18} /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.libInfoLabel}>{i.label}</Text>
            <Text style={s.libInfoValue}>{i.value}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// Simple "how to request an appointment" guide: numbered steps, no form.
export function AppointmentSteps({ title, steps, color = C.yellow }: { title: string; steps: { title: string; body: string }[]; color?: string }) {
  return (
    <View style={s.lbPlanCard}>
      <Text style={s.lbPlanTitle}>{title}</Text>
      {steps.map((st, i) => (
        <View key={st.title} style={{ flexDirection: 'row', marginTop: 12 }}>
          <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: color, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Text style={{ fontWeight: '900', fontSize: 13, color: color === C.yellow ? C.dark : '#fff' }}>{i + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.postName}>{st.title}</Text>
            <Text style={[s.lbBody, { marginTop: 2 }]}>{st.body}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function ServiceRow({ svc, sub, onPress }: { svc: OfficeService; sub?: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.libPlanRow} activeOpacity={0.7} onPress={onPress} accessibilityRole="button" accessibilityLabel={svc.title}>
      <View style={[s.libPlanIcon, { backgroundColor: svc.bg }]}><OfficeIcon name={svc.icon as OfficeIconName} size={24} /></View>
      <View style={{ flex: 1 }}>
        <Text style={s.postName}>{svc.title}</Text>
        <Text style={[s.muted, { fontSize: 13, marginTop: 2 }]}>{sub ?? svc.sub}</Text>
      </View>
      <OfficeIcon name="chevronRight" size={20} color={C.muted} />
    </TouchableOpacity>
  );
}

export function AnnouncementRow({ event: e, onPress }: { event: CampusEvent; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.evRow} activeOpacity={0.7} onPress={onPress} accessibilityRole="button" accessibilityLabel={`Announcement: ${e.title}`}>
      <View style={[s.lbCardIcon, { backgroundColor: e.bg }]}><Text style={{ fontSize: 18 }}>{e.icon}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={s.lbCardTitle}>{e.title}</Text>
        <Text style={s.lbCardMeta}>{e.dateShort} · {e.time} · {e.venue}</Text>
      </View>
      <Text style={s.menuChevron}>›</Text>
    </TouchableOpacity>
  );
}

export function EmergencyCard({ sub = 'Tap to open your phone’s dialer.' }: { sub?: string }) {
  const popup = usePopup();
  const call911 = () => popup.show({
    iconName: 'siren', iconBg: C.errorBg,
    title: 'Call 911?',
    body: 'This opens your phone’s dialer. Notify Campus Security immediately after.',
    actions: [
      { text: 'Cancel', style: 'secondary' },
      {
        text: 'Call 911', style: 'dark',
        onPress: () => Linking.openURL('tel:911').catch(() => popup.show({
          icon: '⚠️', iconBg: C.errorBg, title: 'Unable to call', body: 'Please dial 911 directly from your phone.',
          actions: [{ text: 'OK' }],
        })),
      },
    ],
  });
  return (
    <>
      <TouchableOpacity style={s.emergency} activeOpacity={0.8} onPress={call911} accessibilityRole="button" accessibilityLabel="Call 911">
        <View style={{ marginRight: 12 }}><OfficeIcon name="siren" size={24} color={C.yellow} /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.emergencyTitle}>For emergencies, call 911</Text>
          <Text style={s.emergencySub}>{sub}</Text>
        </View>
      </TouchableOpacity>
      {popup.node}
    </>
  );
}

export function ContactCard({ title, sub, onPress }: { title: string; sub: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.libAsk} activeOpacity={0.8} onPress={onPress} accessibilityRole="button" accessibilityLabel={title}>
      <View style={{ marginRight: 12 }}><OfficeIcon name="message" size={24} color={C.yellow} /></View>
      <View style={{ flex: 1 }}>
        <Text style={s.libAskTitle}>{title}</Text>
        <Text style={s.libAskSub}>{sub}</Text>
      </View>
      <OfficeIcon name="arrowUpRight" size={20} color={C.yellow} strokeWidth={2.2} />
    </TouchableOpacity>
  );
}

const statusLabel = (r: OfficeRequest) => (r.status === 'cancelled' ? 'Cancelled' : r.kind === 'appointment' ? 'Requested' : 'Submitted');

export function RecentRequests({ items, onOpen }: { items: OfficeRequest[]; onOpen: (id: string) => void }) {
  if (items.length === 0) return null;
  return (
    <View style={{ marginTop: 18 }}>
      <View style={s.rowBetween}>
        <Text style={[s.sectionTitle, { fontSize: 20 }]}>Your requests</Text>
        <Text style={{ fontSize: 13, fontWeight: '800', color: C.muted }}>{items.length} saved</Text>
      </View>
      {items.slice(0, 3).map((r) => (
        <TouchableOpacity key={r.id} style={[s.lbCard, { marginBottom: 10 }]} activeOpacity={0.7} onPress={() => onOpen(r.id)}>
          <View style={[s.lbCardIcon, { backgroundColor: r.kind === 'appointment' ? '#E8F2EA' : '#E6EDFB' }]}>
            <Text style={{ fontSize: 20 }}>{r.kind === 'appointment' ? '🗓️' : '✉️'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.lbCardTitle}>{r.topic}</Text>
            <Text style={s.lbCardMeta}>
              {r.ref} · {r.kind === 'appointment' ? `${r.date} · ${r.time}` : 'Inquiry'}
            </Text>
          </View>
          <Text style={[s.lbCardMeta, { fontWeight: '800', color: r.status === 'cancelled' ? C.muted : C.green }]}>{statusLabel(r)}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

/* ---------- Service details ---------- */

const START_LABEL: Record<OfficeService['action'], string> = {
  inquiry: 'Send an inquiry',
  appointment: 'Request an appointment',
  event: 'View event details',
  info: '',
};

export function ServiceDetail({ office, svc, onBack, onStart }: { office: OfficeData; svc: OfficeService; onBack: () => void; onStart: () => void }) {
  return (
    <LibPage
      title="Service details"
      sub={office.name}
      onBack={onBack}
      footer={
        <>
          {svc.action !== 'info' && <PrimaryButton label={START_LABEL[svc.action]} onPress={onStart} />}
          <TouchableOpacity style={[s.secondaryBtn, svc.action !== 'info' && { marginTop: 10 }]} onPress={onBack} activeOpacity={0.8}>
            <Text style={s.secondaryBtnText}>Back to {office.short}</Text>
          </TouchableOpacity>
        </>
      }
    >
      <View style={[s.evHero, { backgroundColor: svc.bg }]}>
        <Text style={s.evKicker}>{office.short.toUpperCase()} · SERVICE</Text>
        <View style={s.evHeroRow}>
          <Text style={s.evHeroTitle}>{svc.title}</Text>
          <View style={{ marginLeft: 8 }}><OfficeIcon name={svc.icon as OfficeIconName} size={40} strokeWidth={1.5} /></View>
        </View>
      </View>

      <Text style={s.lbBody}>{svc.about}</Text>

      {svc.include.length > 0 && (
        <>
          <Text style={s.lbH2}>What to include</Text>
          {svc.include.map((line) => (
            <View key={line} style={{ flexDirection: 'row', marginBottom: 6 }}>
              <Text style={{ color: C.green, marginRight: 8, fontWeight: '900' }}>•</Text>
              <Text style={[s.lbBody, { flex: 1 }]}>{line}</Text>
            </View>
          ))}
        </>
      )}

      {svc.action === 'info' && <View style={{ marginTop: 14 }}><EmergencyCard /></View>}

      <View style={s.evFee}>
        <Text style={s.evFeeTitle}>Sample service description</Text>
        <Text style={s.lbCardMeta}>Written for this prototype. Confirm scope, requirements and schedules with the office.</Text>
      </View>
    </LibPage>
  );
}

/* ---------- Forms ---------- */

// Themed "discard changes?" popup. Call confirmDiscard('inquiry', onDiscard) and render {popup.node}.
function useConfirmDiscard() {
  const popup = usePopup();
  const confirmDiscard = (what: string, onDiscard: () => void) => popup.show({
    icon: '✏️',
    title: `Discard this ${what}?`,
    body: 'What you typed will be lost.',
    actions: [
      { text: 'Keep editing', style: 'secondary' },
      { text: 'Discard', style: 'danger', onPress: onDiscard },
    ],
  });
  return { popup, confirmDiscard };
}

function SubmitButton({ label, sending, onPress }: { label: string; sending: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[s.primaryBtn, sending && { opacity: 0.6 }]} onPress={onPress} disabled={sending} activeOpacity={0.85}>
      <Text style={s.primaryBtnText}>{sending ? 'Sending…' : label}</Text>
    </TouchableOpacity>
  );
}

function useDelayedSubmit() {
  const [sending, setSending] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const run = (fn: () => void) => {
    setSending(true);
    timer.current = setTimeout(fn, 600);
  };
  return { sending, run };
}

const label = (t: string) => <Text style={s.fieldLabel}>{t}</Text>;

export function InquiryForm({ office, user, initialTopic, onBack, onSubmit }: {
  office: OfficeData; user: User; initialTopic?: string; onBack: () => void; onSubmit: (r: OfficeRequest) => void;
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [topic, setTopic] = useState(initialTopic && office.topics.includes(initialTopic) ? initialTopic : office.topics[0]);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const { sending, run } = useDelayedSubmit();
  const { popup, confirmDiscard } = useConfirmDiscard();

  const submit = () => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Enter your name.';
    if (!EMAIL_REGEX.test(email.trim())) next.email = 'Enter a valid email address.';
    if (message.trim().length < 10) next.message = 'Please write at least 10 characters so the office understands your request.';
    setErrors(next);
    if (Object.keys(next).length) return;
    run(() =>
      onSubmit({
        id: `${Date.now()}`, ref: makeRef(office.refPrefix), office: office.office, kind: 'inquiry', topic,
        message: message.trim(), name: name.trim(), email: email.trim(), status: 'submitted', createdAt: Date.now(),
      })
    );
  };

  return (
    <LibPage
      title="Send an inquiry"
      sub={office.name}
      onBack={() => (message.trim() && !sending ? confirmDiscard('inquiry', onBack) : onBack())}
      footer={<SubmitButton label="Submit inquiry" sending={sending} onPress={submit} />}
    >
      <View style={s.lbPlanCard}>
        <Text style={s.lbPlanTitle}>Tell us how we can help.</Text>
        <Text style={s.lbBody}>Pick a topic and describe your question or concern. Include dates or names that help the office understand.</Text>
      </View>

      <View style={{ marginTop: 16 }}>
        <Field label="Your name" value={name} onChangeText={setName} autoCapitalize="words" errorText={errors.name} />
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" errorText={errors.email} helper="The office would reply to this address." />
        {label('Topic')}
        <View style={{ marginBottom: 14 }}><Select icon="🏷️" value={topic} options={office.topics} onChange={setTopic} /></View>
        <Field
          label="Message" value={message} onChangeText={setMessage} multiline maxLength={500} autoCapitalize="sentences"
          placeholder="Describe your question or concern" errorText={errors.message} helper={`${message.length}/500`}
        />
      </View>

      <PrivacyNote text="Demo only. Your inquiry is saved on this device and is not sent to the office." />
      {popup.node}
    </LibPage>
  );
}

/* ---------- Confirmation ---------- */

export function RequestSummary({ req, office, campus, onBack, onDone, onCancel }: {
  req: OfficeRequest; office: OfficeData; campus: string; onBack: () => void; onDone: () => void; onCancel?: () => void;
}) {
  const cancelled = req.status === 'cancelled';
  const isAppt = req.kind === 'appointment';
  const rows: [string, string][] = [
    ['REFERENCE', req.ref],
    ['TYPE', isAppt ? 'Appointment request' : 'Inquiry'],
    [isAppt ? 'REASON' : 'TOPIC', req.topic],
    ...(isAppt ? ([['WHEN', `${req.date} · ${req.time}`]] as [string, string][]) : []),
    ...(req.message ? ([[isAppt ? 'NOTE' : 'MESSAGE', req.message]] as [string, string][]) : []),
    ['SUBMITTED BY', `${req.name} · ${campus}`],
    ['STATUS', cancelled ? 'Cancelled' : isAppt ? 'Requested · awaiting the office’s confirmation' : 'Submitted · awaiting the office’s reply'],
  ];

  const popup = usePopup();
  const askCancel = () => popup.show({
    iconName: 'calendarCheck', iconBg: C.errorBg,
    title: 'Cancel this request?',
    body: 'The office will no longer see it as active.',
    details: [{ label: 'Reference', value: req.ref }],
    actions: [
      { text: 'Keep request', style: 'secondary' },
      { text: 'Cancel request', style: 'danger', onPress: () => onCancel?.() },
    ],
  });

  return (
    <LibPage
      title={isAppt ? 'Request summary' : 'Inquiry summary'}
      sub={office.name}
      onBack={onBack}
      footer={
        <>
          <PrimaryButton label={`Return to ${office.short}`} onPress={onDone} />
          {isAppt && !cancelled && !!onCancel && (
            <TouchableOpacity style={[s.secondaryBtn, { marginTop: 10 }]} onPress={askCancel} activeOpacity={0.8}>
              <Text style={s.secondaryBtnText}>Cancel request</Text>
            </TouchableOpacity>
          )}
        </>
      }
    >
      <View style={s.lbSuccessWrap}>
        <View style={[s.lbSuccessCircle, cancelled && { backgroundColor: C.errorBg }]}>
          <Text style={{ fontSize: 34, color: cancelled ? C.error : C.green }}>{cancelled ? '✕' : '✓'}</Text>
        </View>
        <Text style={s.lbSuccessTitle}>{cancelled ? 'Request cancelled.' : isAppt ? 'Your request is in.' : 'Your inquiry is in.'}</Text>
      </View>
      <Text style={s.lbSuccessSub}>
        {cancelled ? 'This request is no longer active.' : isAppt ? 'Here’s what you asked for. The office confirms the final schedule.' : 'Here’s a copy of what you sent. Keep the reference number.'}
      </Text>
      <View style={s.lbSummaryCard}>
        {rows.map(([k, v], i) => (
          <View key={k}>
            <Text style={s.lbLabel}>{k}</Text>
            <Text style={[s.lbValue, i === rows.length - 1 && { marginBottom: 0 }]}>{v}</Text>
          </View>
        ))}
      </View>
      <PrivacyNote text="Demo only. This request is saved on this device and has not been sent to the office." />
      {popup.node}
    </LibPage>
  );
}
