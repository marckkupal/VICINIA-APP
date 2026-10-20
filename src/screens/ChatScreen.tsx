import { useEffect, useRef, useState } from 'react';
import type { ElementRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BackButton } from '../components/BackButton';
import { clockLabel, getThread, sendMessage, subscribeChat } from '../people';
import type { Person } from '../people';
import { s } from '../styles';
import { C } from '../theme';
import { initials } from '../utils';

export function ChatScreen({ person, onBack }: { person: Person; onBack: () => void }) {
  const [, force] = useState(0);
  const [text, setText] = useState('');
  const scroll = useRef<ElementRef<typeof ScrollView>>(null);
  useEffect(() => subscribeChat(() => force((n) => n + 1)), []);
  const msgs = getThread(person.id);

  const send = () => {
    if (!text.trim()) return;
    sendMessage(person.id, text);
    setText('');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.lbPage}>
        <View style={s.libHeader}>
          <BackButton onPress={onBack} />
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: person.bg, alignItems: 'center', justifyContent: 'center', marginLeft: 14 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: C.dark }}>{initials(person.name)}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.lbHeaderTitle} numberOfLines={1}>{person.name}</Text>
            <Text style={s.libSub}>{person.program} · {person.year}</Text>
          </View>
        </View>

        <ScrollView
          ref={scroll}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
        >
          {msgs.length === 0 && (
            <Text style={[s.hint, { marginTop: 40 }]}>No messages yet. Say hi to {person.name.split(' ')[0]}!</Text>
          )}
          {msgs.map((m) => (
            <View key={m.id} style={{ alignItems: m.mine ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
              <View
                style={[
                  { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
                  m.mine
                    ? { backgroundColor: C.yellow, borderBottomRightRadius: 6 }
                    : { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderBottomLeftRadius: 6 },
                ]}
              >
                <Text style={{ fontSize: 14, color: C.dark, lineHeight: 20 }}>{m.text}</Text>
              </View>
              <Text style={[s.muted, { fontSize: 11, marginTop: 4 }]}>{clockLabel(m.at)}</Text>
            </View>
          ))}
          <Text style={[s.hint, { marginTop: 4, marginBottom: 8 }]}>Demo chat · Messages aren’t delivered to anyone.</Text>
        </ScrollView>

        <View style={[s.lbFooter, { flexDirection: 'row', alignItems: 'center' }]}>
          <View style={[s.lbSearch, { flex: 1, marginBottom: 0, borderRadius: 24 }]}>
            <TextInput
              style={{ flex: 1, fontSize: 14, color: C.dark }}
              placeholder={`Message ${person.name.split(' ')[0]}…`}
              placeholderTextColor="#A5A296"
              value={text}
              onChangeText={setText}
              onSubmitEditing={send}
              returnKeyType="send"
            />
          </View>
          <TouchableOpacity
            onPress={send}
            disabled={!text.trim()}
            accessibilityLabel="Send message"
            style={{ width: 48, height: 48, borderRadius: 24, marginLeft: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: text.trim() ? C.yellow : '#E3E0D6' }}
          >
            <Text style={{ fontSize: 20, fontWeight: '900', color: C.dark, marginTop: -2 }}>↑</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
