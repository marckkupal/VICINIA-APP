import { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { LogoMark } from '../components/LogoMark';
import { PrimaryButton } from '../components/PrimaryButton';
import { SLIDES } from '../data';
import { s } from '../styles';
import { C } from '../theme';

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(-1); // -1 = intro

  if (step === -1) {
    return (
      <View style={[s.fill, { backgroundColor: C.yellow, padding: 24 }]}>
        <StatusBar barStyle="dark-content" />
        <View style={s.pill}><Text style={s.pillText}>YOUR CAMPUS COMMUNITY</Text></View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <LogoMark size={96} />
          <Text style={s.bigWordmark}>vicinia</Text>
          <Text style={s.introTitle}>Your campus,{'\n'}closer than ever.</Text>
          <Text style={s.introBody}>Find people, places, events, communities, and wellbeing support around TIP Quezon City and Manila.</Text>
        </View>
        <PrimaryButton dark label="Get started  →" onPress={() => setStep(0)} />
        <Text style={s.footnote}>TIP · Quezon City & Manila</Text>
      </View>
    );
  }

  const slide = SLIDES[step];
  const last = step === SLIDES.length - 1;
  return (
    <View style={[s.fill, { backgroundColor: C.dark }]}>
      <StatusBar barStyle="light-content" />
      <View style={s.slideTop}>
        <View style={s.slideNav}>
          <TouchableOpacity style={s.circleSm} onPress={() => setStep(step - 1)}><Text>←</Text></TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <LogoMark size={28} />
            <Text style={s.navWordmark}> vicinia</Text>
          </View>
          <TouchableOpacity onPress={onDone}><Text style={s.skip}>Skip</Text></TouchableOpacity>
        </View>
        <Text style={s.slideIcon}>{slide.icon}</Text>
      </View>
      <View style={s.slideBottom}>
        <Text style={s.kicker}>{slide.kicker}</Text>
        <Text style={s.slideTitle}>{slide.title}</Text>
        <Text style={s.slideBody}>{slide.body}</Text>
        <View style={s.slideFooter}>
          <View>
            <View style={{ flexDirection: 'row' }}>
              {SLIDES.map((_, i) => (
                <View key={i} style={[s.dot, i === step && s.dotActive]} />
              ))}
            </View>
            <Text style={s.counter}>0{step + 1} / 03</Text>
          </View>
          <TouchableOpacity style={s.nextBtn} onPress={() => (last ? onDone() : setStep(step + 1))}>
            <Text style={s.nextText}>{last ? "Let's go, Vicinia  →" : '→'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
