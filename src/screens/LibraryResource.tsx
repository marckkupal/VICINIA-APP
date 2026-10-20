import { useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { LibPage } from '../components/LibPage';
import { PrimaryButton } from '../components/PrimaryButton';
import { PrivacyNote } from '../components/PrivacyNote';
import type { LibResource } from '../data';
import { s } from '../styles';

export function LibraryResource({ resource: r, onBack }: { resource: LibResource; onBack: () => void }) {
  const [reserved, setReserved] = useState(false);
  const preview = () => {
    if (reserved) return Alert.alert('Already reserved', 'Your demo reservation is on file for this session.');
    Alert.alert('Reserve this resource?', 'Demo only. Nothing is actually reserved. Ask the library desk to confirm availability and borrowing requirements.', [
      { text: 'Reserve', onPress: () => setReserved(true) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <LibPage
      title="Resource details"
      sub="Return to catalog"
      onBack={onBack}
      footer={
        <>
          {reserved && <PrivacyNote text="Reserved for this session only. No real reservation was made." />}
          <PrimaryButton label={reserved ? '✓  Reserved · Demo' : '📖  Reserve · Demo'} onPress={preview} />
          <TouchableOpacity onPress={onBack} style={s.linkBtn}>
            <Text style={s.linkBtnText}>Back to catalog results</Text>
          </TouchableOpacity>
        </>
      }
    >
      <View style={s.lbHero}>
        <Text style={{ fontSize: 40, marginRight: 14 }}>{r.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.lbHeroTitle}>{r.title}</Text>
          <Text style={s.lbBody}>{r.heroSub}</Text>
        </View>
      </View>

      <Text style={s.lbBody}>{r.authors}</Text>
      <Text style={s.lbH2}>About this resource</Text>
      <Text style={s.lbBody}>{r.about}</Text>

      <View style={s.lbInfoCard}>
        <Text style={s.lbLabel}>CALL NUMBER</Text>
        <Text style={s.lbValue}>{r.callNumber}</Text>
        <Text style={s.lbLabel}>LOCATION</Text>
        <Text style={[s.lbValue, { marginBottom: 8 }]}>{r.location}</Text>
        <Text style={s.lbGreen}>{r.avail}</Text>
      </View>

      <PrivacyNote text="Access preview only — no real download or reservation. Ask the library desk to confirm availability and borrowing requirements." />
    </LibPage>
  );
}
