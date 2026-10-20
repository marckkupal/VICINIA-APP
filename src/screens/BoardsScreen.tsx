import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { BOARDS } from '../data';
import { s } from '../styles';
import type { Board, User } from '../types';
import { fmtCount } from '../utils';
import { BoardDetail } from './BoardDetail';

export function BoardsScreen({ user }: { user?: User }) {
  const [open, setOpen] = useState<Board | null>(null);
  if (open) return <BoardDetail board={open} user={user} onBack={() => setOpen(null)} />;
  return (
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false}>
      <Text style={s.header}>Boards</Text>
      <View style={s.grid}>
        {BOARDS.map((b) => (
          <TouchableOpacity key={b.id} style={s.boardCard} onPress={() => setOpen(b)}>
            <Text style={{ fontSize: 22, marginBottom: 6 }}>{b.emoji}</Text>
            <Text style={s.postName}>{b.name}</Text>
            <Text style={s.muted}>{fmtCount(b.members)} members</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
