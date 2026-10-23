import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { LibPage } from '../components/LibPage';
import { Field } from '../components/Field';
import { Select } from '../components/Select';
import { PrimaryButton } from '../components/PrimaryButton';
import { addBusiness, BUSINESS_CATEGORIES, BUSINESS_EMOJIS } from '../businesses';
import type { Place } from '../data';
import { s } from '../styles';
import { C } from '../theme';

// Business owners post their business and location so students can find it in Explore.
export function PostBusiness({ ownerEmail, onBack, onPosted }: { ownerEmail?: string; onBack: () => void; onPosted: (p: Place) => void }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(BUSINESS_CATEGORIES[0].label);
  const [emoji, setEmoji] = useState(BUSINESS_CATEGORIES[0].emoji);
  const [address, setAddress] = useState('');
  const [hours, setHours] = useState('');
  const [contact, setContact] = useState('');
  const [about, setAbout] = useState('');
  const [tried, setTried] = useState(false);

  const nameErr = tried && !name.trim() ? 'Enter your business name.' : undefined;
  const addrErr = tried && !address.trim() ? 'Enter the location so students can find you.' : undefined;

  const submit = () => {
    setTried(true);
    if (!name.trim() || !address.trim()) return;
    onPosted(addBusiness({ name, category, emoji, address, hours, contact, about, ownerEmail }));
  };

  return (
    <LibPage
      title="Post your business"
      sub="Show up in Explore for nearby students"
      onBack={onBack}
      footer={<PrimaryButton label="Post business" onPress={submit} />}
    >
      <View style={[s.infoCard, { marginTop: 4 }]}>
        <Text style={s.infoCardText}>Only post a business you own or run. Listings are written by owners and aren’t verified by Vicinia.</Text>
      </View>

      <Field label="Business name" value={name} onChangeText={setName} placeholder="e.g. Kuya Mel’s Silog" autoCapitalize="words" maxLength={50} errorText={nameErr} />

      <Text style={s.fieldLabel}>Category</Text>
      <View style={{ marginBottom: 14 }}>
        <Select icon="🏪" value={category} options={BUSINESS_CATEGORIES.map((c) => c.label)} onChange={(v) => { setCategory(v); const c = BUSINESS_CATEGORIES.find((x) => x.label === v); if (c) setEmoji(c.emoji); }} />
      </View>

      <Text style={s.fieldLabel}>Pick an icon</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
        {BUSINESS_EMOJIS.map((e) => (
          <TouchableOpacity key={e} onPress={() => setEmoji(e)} accessibilityLabel={`Icon ${e}`} style={{ width: 48, height: 48, borderRadius: 14, marginRight: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: e === emoji ? C.yellow : '#fff', borderWidth: 1, borderColor: e === emoji ? C.yellow : C.border }}>
            <Text style={{ fontSize: 24 }}>{e}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Field label="Location / address" icon="📍" value={address} onChangeText={setAddress} placeholder="Street, barangay, landmark" autoCapitalize="words" maxLength={120} errorText={addrErr} helper="Shown on your listing. Pin placement on the map isn’t available yet." />
      <Field label="Opening hours (optional)" value={hours} onChangeText={setHours} placeholder="e.g. Mon–Sat, 8 AM–9 PM" autoCapitalize="sentences" maxLength={60} />
      <Field label="Contact (optional)" value={contact} onChangeText={setContact} placeholder="Phone, Messenger or Instagram" maxLength={60} />
      <Field label="About (optional)" value={about} onChangeText={setAbout} placeholder="What do you offer? Student deals?" autoCapitalize="sentences" multiline maxLength={200} />
    </LibPage>
  );
}
