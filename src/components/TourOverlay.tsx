import { useEffect, useState } from 'react';
import { AccessibilityInfo, Modal, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { TOUR_STEPS, finishTour, getTarget, nextStep, prevStep, useTour } from '../tour';
import { C } from '../theme';

type Rect = { x: number; y: number; w: number; h: number };
const PAD = 6;
const DIM = 'rgba(0,0,0,0.72)';

// Spotlight + tooltip for the first-time walkthrough. Rendered once (inside TabBar), shown in a Modal so it sits above every screen.
export function TourOverlay() {
  const { open, step: index } = useTour();
  const { width, height } = useWindowDimensions();
  const step = TOUR_STEPS[index];
  const [rect, setRect] = useState<Rect | null | undefined>(undefined); // undefined = still measuring, null = target not found

  useEffect(() => {
    if (!open || !step) return;
    setRect(undefined);
    let cancelled = false;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    const retry = () => { if (++tries < 6) timer = setTimeout(attempt, 150); else if (!cancelled) setRect(null); };
    const attempt = () => {
      const node = getTarget(step.target);
      if (!node) return retry();
      node.measureInWindow((x, y, w, h) => {
        if (cancelled) return;
        if (w > 0 && h > 0) setRect({ x, y, w, h }); else retry();
      });
    };
    timer = setTimeout(attempt, 300); // wait for a tab switch to finish
    AccessibilityInfo.announceForAccessibility(`${step.title}. ${step.body}`);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [open, index, width, height]);

  if (!open || !step) return null;
  const last = index === TOUR_STEPS.length - 1;
  const cardW = Math.min(width - 32, 360);

  let cardPos: object = { top: 0, bottom: 0, justifyContent: 'center' };
  let caret: { left: number; below: boolean } | null = null;
  let cardLeft = (width - cardW) / 2;
  if (rect) {
    cardLeft = Math.min(Math.max(rect.x + rect.w / 2 - cardW / 2, 16), width - 16 - cardW);
    const below = rect.y + rect.h / 2 < height / 2;
    cardPos = below ? { top: rect.y + rect.h + PAD + 14 } : { bottom: height - (rect.y - PAD) + 14 };
    caret = { left: Math.min(Math.max(rect.x + rect.w / 2 - cardLeft - 7, 18), cardW - 32), below };
  }

  const hole = rect && { x: Math.max(rect.x - PAD, 0), y: Math.max(rect.y - PAD, 0), w: rect.w + PAD * 2, h: rect.h + PAD * 2 };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={finishTour}>
      <View style={{ flex: 1 }} accessibilityViewIsModal importantForAccessibility="yes">
        {hole ? (
          <>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: hole.y, backgroundColor: DIM }} />
            <View style={{ position: 'absolute', top: hole.y + hole.h, bottom: 0, left: 0, right: 0, backgroundColor: DIM }} />
            <View style={{ position: 'absolute', top: hole.y, height: hole.h, left: 0, width: hole.x, backgroundColor: DIM }} />
            <View style={{ position: 'absolute', top: hole.y, height: hole.h, left: hole.x + hole.w, right: 0, backgroundColor: DIM }} />
            <View pointerEvents="none" style={{ position: 'absolute', top: hole.y, left: hole.x, width: hole.w, height: hole.h, borderRadius: 16, borderWidth: 2, borderColor: C.yellow }} />
          </>
        ) : (
          <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: DIM }} />
        )}

        {rect !== undefined && (
          <View pointerEvents="box-none" style={[{ position: 'absolute', left: 0, right: 0 }, cardPos, !rect && { alignItems: 'center' }]}>
            <View style={{ width: cardW, marginLeft: rect ? cardLeft : 0, backgroundColor: '#fff', borderRadius: 20, padding: 18 }}>
              {caret && (
                <View
                  style={{ position: 'absolute', left: caret.left, [caret.below ? 'top' : 'bottom']: -7, width: 14, height: 14, backgroundColor: '#fff', transform: [{ rotate: '45deg' }] }}
                />
              )}
              <Text style={{ fontSize: 12, fontWeight: '800', color: C.muted, marginBottom: 6 }} accessibilityLabel={`Step ${index + 1} of ${TOUR_STEPS.length}`}>
                {index + 1} / {TOUR_STEPS.length}
              </Text>
              <Text accessibilityRole="header" style={{ fontSize: 18, fontWeight: '900', color: C.dark, marginBottom: 6 }}>{step.title}</Text>
              <Text style={{ fontSize: 14, lineHeight: 20, color: C.dark, marginBottom: 16 }}>{step.body}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {!last ? (
                  <TouchableOpacity onPress={finishTour} accessibilityRole="button" accessibilityLabel="Skip walkthrough" style={{ minHeight: 44, justifyContent: 'center', paddingRight: 12 }} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: C.muted }}>Skip</Text>
                  </TouchableOpacity>
                ) : <View style={{ width: 1 }} />}
                <View style={{ flex: 1 }} />
                {index > 0 && (
                  <TouchableOpacity onPress={prevStep} accessibilityRole="button" accessibilityLabel="Previous step" style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 14 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: C.dark }}>Back</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={nextStep}
                  accessibilityRole="button"
                  accessibilityLabel={last ? 'Done' : 'Next step'}
                  style={{ minHeight: 44, minWidth: 84, borderRadius: 14, backgroundColor: C.dark, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '800', color: C.yellow }}>{last ? 'Done' : 'Next'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}
