import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { s } from '../styles';
import { C } from '../theme';

export function Field({
  label, icon, value, onChangeText, placeholder, secure, error, keyboardType, autoCapitalize = 'none', half, errorText, helper, multiline, maxLength,
}: {
  label: string; icon?: string; value: string; onChangeText: (t: string) => void; placeholder?: string;
  secure?: boolean; error?: boolean; keyboardType?: any; autoCapitalize?: any; half?: boolean;
  errorText?: string; helper?: string; multiline?: boolean; maxLength?: number;
}) {
  const [hidden, setHidden] = useState(!!secure);
  return (
    <View style={{ marginBottom: 14, flex: half ? 1 : undefined }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={[s.fieldBox, multiline && { height: 120, alignItems: 'flex-start', paddingTop: 12 }, (error || !!errorText) && { borderColor: C.error }]}>
        {!!icon && <Text style={s.fieldIcon}>{icon}</Text>}
        <TextInput
          style={[s.fieldInput, multiline && { height: '100%', textAlignVertical: 'top' }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A5A296"
          secureTextEntry={hidden}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          keyboardType={keyboardType}
          multiline={multiline}
          maxLength={maxLength}
        />
        {secure && (
          <TouchableOpacity onPress={() => setHidden(!hidden)}>
            <Text style={s.fieldIcon}>{hidden ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {!!errorText ? <Text style={s.fieldErrorText}>{errorText}</Text> : !!helper ? <Text style={s.fieldHelper}>{helper}</Text> : null}
    </View>
  );
}
