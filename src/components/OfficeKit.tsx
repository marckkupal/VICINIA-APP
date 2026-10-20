import { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Text, TouchableOpacity, View } from 'react-native';
import { APPOINTMENT_TIMES } from '../data';
import type { CampusEvent, OfficeData, OfficeService } from '../data';
import { fmtTime } from '../screens/LibraryBooking';
import { s } from '../styles';
import { C } from '../theme';
import type { OfficeRequest, User } from '../types';
import { EMAIL_REGEX, makeRef, nextWeekdays } from '../utils';
import { Field } from './Field';
import { LibPage } from './LibPage';
import { PrimaryButton } from './PrimaryButton';
import { PrivacyNote } from './PrivacyNote';
import { Select } from './Select';

/* ---------- Hub pieces (used by the OSA and Guidance pages) ---------- */

export function OfficeHero({ office }: { office: OfficeData }) {
  return (
    <View style={[s.libHero, { backgroundColor: office.heroBg }]}>
      <View style={s.libHeroIcon}><Text style={{ fontSize: 28 }}>{office.heroIcon}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={s.libHeroTitle}>{office.name}</Text>
        <Text style={s.libHeroBody}>{office.blurb}</Text>
      </View>
    </View>
  );
}

export function OfficeInfoCard({ office }: { office: OfficeData }) {
  return (
    <View style={s.libInfoCard}>
      {office.info.map((i, idx) => (
        <View key={i.key} style={[s.rowCenter, idx < office.info.length - 1 && { marginBottom: 10 }]}>
          <View style={[s.libInfoIcon, { backgroundColor: i.bg }]}><Text style={{ fontSize: 16 }}>{i.icon}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.libInfoLabel}>{i.label}</Text>
            <Text style={s.libInfoValue}>{i.value}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function ServiceRow({ svc, sub, onPress }: { svc: OfficeService; sub?: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.libPlanRow} activeOpacity={0.7} onPress={onPress} accessibilityRole="button" accessibilityLabel={svc.title}>
      <View style={[s.libPlanIcon, { backgroundColor: svc.bg }]}><Text style={{ fontSize: 22 }}>{svc.icon}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={s.postName}>{svc.title}</Text>
        <Text style={[s.muted, { fontSize: 13, marginTop: 2 }]}>{sub ?? svc.sub}</Text>
      </View>
      <Text style={s.menuChevron}>›</Text>
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
  const call911 = () => Linking.openURL('tel:911').catch(() => Alert.alert('Unable to call', 'Please dial 911 directly.'));
  return (
    <TouchableOpacity style={s.emergency} activeOpacity={0.8} onPress={call911} accessibilityRole="button" accessibilityLabel="Call 911">
      <Text style={{ fontSize: 20, marginRight: 12 }}>🚨</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.emergencyTitle}>For emergencies, call 911</Text>
        <Text style={s.emergencySub}>{sub}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function ContactCard({ title, sub, onPress }: { title: string; sub: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.libAsk} activeOpacity={0.8} onPress={onPress} accessibilityRole="button" accessibilityLabel={title}>
      <Text style={{ fontSize: 22, marginRight: 12 }}>💬</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.libAskTitle}>{title}</Text>
        <Text style={s.libAskSub}>{sub}</Text>
      </View>
      <Text style={{ fontSize: 18, fontWeight: '800', color: C.yellow }}>↗</Text>
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
          <Text style={{ fontSize: 38, marginLeft: 8 }}>{svc.icon}</Text>
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

const confirmDiscard = (what: string, onDiscard: () => void) =>
  Alert.alert(`Discard this ${what}?`, 'What you typed will be lost.', [
    { text: 'Keep editing', style: 'cancel' },
    { text: 'Discard', style: 'destructive', onPress: onDiscard },
  ]);

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
    </LibPage>
  );
}

export function AppointmentForm({ office, user, existing, onBack, onSubmit }: {
  office: OfficeData; user: User; existing: OfficeRequest[]; onBack: () => void; onSubmit: (r: OfficeRequest) => void;
}) {
  const [days] = useState(() => nextWeekdays(5));
  const times = APPOINTMENT_TIMES.map(fmtTime);
  const [reason, setReason] = useState(office.topics[0]);
  const [date, setDate] = useState(days[0]);
  const [time, setTime] = useState(times[0]);
  const [email, setEmail] = useState(user.email);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<{ email?: string; slot?: string }>({});
  const { sending, run } = useDelayedSubmit();

  const submit = () => {
    const next: typeof errors = {};
    if (!EMAIL_REGEX.test(email.trim())) next.email = 'Enter a valid email address.';
    if (existing.some((r) => r.kind === 'appointment' && r.status === 'submitted' && r.date === date && r.time === time)) {
      next.slot = 'You already have a request for this day and time. Choose another slot.';
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    run(() =>
      onSubmit({
        id: `${Date.now()}`, ref: makeRef(office.refPrefix), office: office.office, kind: 'appointment', topic: reason,
        message: note.trim(), name: user.name, email: email.trim(), date, time, status: 'submitted', createdAt: Date.now(),
      })
    );
  };

  return (
    <LibPage
      title="Request an appointment"
      sub={`${office.name} · Sample times`}
      onBack={() => (note.trim() && !sending ? confirmDiscard('request', onBack) : onBack())}
      footer={<SubmitButton label={'🗓️  Submit request'} sending={sending} onPress={submit} />}
    >
      <View style={s.lbPlanCard}>
        <Text style={s.lbPlanTitle}>Make a little time to talk.</Text>
        <Text style={s.lbBody}>Choose a preferred day and time. This is a request, and the office confirms the final schedule.</Text>
      </View>

      <Text style={s.lbFieldLabel}>What would you like to talk about?</Text>
      <Select icon="💛" value={reason} options={office.topics} onChange={setReason} />

      <Text style={s.lbFieldLabel}>Preferred date</Text>
      <Select icon="🗓️" value={date} options={days} onChange={(v) => { setDate(v); setErrors((e) => ({ ...e, slot: undefined })); }} />

      <Text style={s.lbFieldLabel}>Preferred time</Text>
      <Select icon="🕒" value={time} options={times} onChange={(v) => { setTime(v); setErrors((e) => ({ ...e, slot: undefined })); }} />
      {!!errors.slot && <Text style={s.fieldErrorText}>{errors.slot}</Text>}

      <View style={{ marginTop: 14 }}>
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" errorText={errors.email} helper="Where the office can reach you about this request." />
        <Field label="Note (optional)" value={note} onChangeText={setNote} multiline maxLength={300} autoCapitalize="sentences" placeholder="Anything you’d like the office to know first" helper={`${note.length}/300`} />
      </View>

      <PrivacyNote text="Demo only. Sample times are shown. Your request is saved on this device and is not sent to the office." />
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

  const askCancel = () =>
    Alert.alert('Cancel this request?', 'The office will no longer see it as active.', [
      { text: 'Keep request', style: 'cancel' },
      { text: 'Cancel request', style: 'destructive', onPress: () => onCancel?.() },
    ]);

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
    </LibPage>
  );
}
