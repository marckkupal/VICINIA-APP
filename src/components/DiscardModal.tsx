import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { s } from '../styles';
import { C } from '../theme';

export function DiscardModal({ visible, onKeep, onDiscard }: { visible: boolean; onKeep: () => void; onDiscard: () => void }) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onKeep} statusBarTranslucent>
      <View style={s.scrim}>
        <View style={s.modalCard}>
          <TouchableOpacity style={s.modalClose} onPress={onKeep} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ fontSize: 16, color: C.dark }}>✕</Text>
          </TouchableOpacity>
          <View style={s.modalIcon}><Text style={{ fontSize: 18 }}>✏️</Text></View>
          <Text style={s.modalTitle}>Discard your changes?</Text>
          <Text style={s.modalBody}>Your unsaved edits will be lost. Your original profile details will stay the same.</Text>
          <View style={s.modalActions}>
            <TouchableOpacity style={[s.modalBtn, s.modalCancel]} onPress={onKeep} activeOpacity={0.8}>
              <Text style={s.modalBtnText}>Keep editing</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.modalBtn, { backgroundColor: C.yellow }]} onPress={onDiscard} activeOpacity={0.8}>
              <Text style={s.modalBtnText}>Discard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
