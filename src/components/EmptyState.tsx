import { Text, TouchableOpacity, View } from 'react-native';
import { s } from '../styles';

// Empty list / no-results block with an explicit next step. `action` renders a 44pt button.
export function EmptyState({ icon, title, body, actionLabel, onAction }: { icon: string; title: string; body?: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={s.emptyState} accessibilityRole="summary">
      <Text style={s.emptyIcon}>{icon}</Text>
      <Text style={s.emptyTitle}>{title}</Text>
      {!!body && <Text style={s.emptyBody}>{body}</Text>}
      {!!actionLabel && !!onAction && (
        <TouchableOpacity style={s.emptyAction} onPress={onAction} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={actionLabel}>
          <Text style={s.emptyActionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
