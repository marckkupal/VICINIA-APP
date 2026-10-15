import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { BackButton } from '../components/BackButton';
import { LIBRARY } from '../data';
import { s } from '../styles';
import { C } from '../theme';

export function LibraryScreen({ onBack }: { onBack: () => void }) {
  const [query, setQuery] = useState('');

  const search = () => {
    if (!query.trim()) return;
    Alert.alert('Library catalog', `Catalog search for “${query.trim()}” is coming soon.`);
  };
  const askLibrarian = () => {
    Linking.openURL(`mailto:${LIBRARY.email}?subject=Research question`).catch(() =>
      Alert.alert('Email unavailable', `Write to ${LIBRARY.email}`)
    );
  };

  return (
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={s.libHeader}>
        <BackButton onPress={onBack} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={s.libTitle}>Library</Text>
          <Text style={s.libSub}>Resources for study and discovery</Text>
        </View>
        <TouchableOpacity style={s.libAddBtn}>
          <Text style={{ fontWeight: '900', fontSize: 20, color: C.yellow, marginTop: -1 }}>+</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 22, marginLeft: 12 }}>📖</Text>
      </View>

      <View style={s.libHero}>
        <View style={s.libHeroIcon}><Text style={{ fontSize: 28 }}>📚</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.libHeroTitle}>{LIBRARY.name}</Text>
          <Text style={s.libHeroBody}>{LIBRARY.blurb}</Text>
        </View>
      </View>

      <View style={s.libInfoCard}>
        {LIBRARY.info.map((i, idx) => (
          <View key={i.key} style={[s.rowCenter, idx < LIBRARY.info.length - 1 && { marginBottom: 10 }]}>
            <View style={[s.libInfoIcon, { backgroundColor: i.bg }]}><Text style={{ fontSize: 16 }}>{i.icon}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.libInfoLabel}>{i.label}</Text>
              <Text style={s.libInfoValue}>{i.value}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={s.libSearch}>
        <Text style={{ marginRight: 10, color: C.muted }}>🔍</Text>
        <TextInput
          style={{ flex: 1, fontSize: 14, color: C.dark }}
          placeholder="Search the library catalog"
          placeholderTextColor="#A5A296"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={search}
          returnKeyType="search"
        />
        <TouchableOpacity style={s.libSearchBtn} onPress={search}>
          <Text style={s.libSearchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      <View style={s.rowBetween}>
        <Text style={[s.sectionTitle, { fontSize: 20 }]}>Plan your study</Text>
        <Text style={{ fontSize: 14, fontWeight: '800', color: C.green }}>Spaces available</Text>
      </View>

      {LIBRARY.plan.map((p) => (
        <TouchableOpacity
          key={p.key}
          style={s.libPlanRow}
          activeOpacity={0.7}
          onPress={() => Alert.alert(p.title, 'This feature is coming soon.')}
        >
          <View style={[s.libPlanIcon, { backgroundColor: p.bg }]}><Text style={{ fontSize: 22 }}>{p.icon}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.postName}>{p.title}</Text>
            <Text style={[s.muted, { fontSize: 13, marginTop: 2 }]}>{p.sub}</Text>
          </View>
          <Text style={s.menuChevron}>›</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={s.libAsk} activeOpacity={0.8} onPress={askLibrarian}>
        <Text style={{ fontSize: 22, marginRight: 12 }}>💬</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.libAskTitle}>Ask a librarian</Text>
          <Text style={s.libAskSub}>Chat with the desk or email your research question</Text>
        </View>
        <Text style={{ fontSize: 18, fontWeight: '800', color: C.yellow }}>↗</Text>
      </TouchableOpacity>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}
