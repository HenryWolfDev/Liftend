import {
  BarlowSemiCondensed_300Light,
  BarlowSemiCondensed_400Regular,
  BarlowSemiCondensed_500Medium,
  BarlowSemiCondensed_600SemiBold,
  BarlowSemiCondensed_700Bold,
  useFonts,
} from '@expo-google-fonts/barlow-semi-condensed';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { ArrowRight, Check, DoorOpen, List, Minus, NotebookPen, Plus } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  Animated,
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import WheelPicker from 'react-native-wheely';

const C = {
  accent:   '#E2E49F',
  bg:       '#121212',
  surface:  '#1E2023',
  border:   '#2A2D33',
  text1:    '#F5F5F5',
  text2:    '#C8C8CC',
  text3:    '#868A92',
  disabled: '#4A4D55',
} as const;

const BSC = {
  light:    'BarlowSemiCondensed_300Light',
  regular:  'BarlowSemiCondensed_400Regular',
  medium:   'BarlowSemiCondensed_500Medium',
  semibold: 'BarlowSemiCondensed_600SemiBold',
  bold:     'BarlowSemiCondensed_700Bold',
} as const;

const WEIGHT_STEP   = 2.5;
const MAX_WEIGHT    = 300;
const WEIGHTS       = Array.from({ length: 121 }, (_, i) => +((MAX_WEIGHT - i * WEIGHT_STEP).toFixed(1)));
const WEIGHT_LABELS = WEIGHTS.map(w => `${w} kg`);
const ITEM_H        = 62;
const CONFIRM_H     = 56;

const wIdxFor = (kg: number) => Math.round((MAX_WEIGHT - kg) / WEIGHT_STEP);

const EXERCISES = [
  { id: 1, name: 'Bankdrücken',     wIdx: wIdxFor(80), reps: 10 },
  { id: 2, name: 'Schulterdrücken', wIdx: wIdxFor(50), reps: 12 },
  { id: 3, name: 'Trizeps-Dips',    wIdx: wIdxFor(0),  reps: 12 },
  { id: 4, name: 'Kurzhantel-Curl', wIdx: wIdxFor(15), reps: 12 },
  { id: 5, name: 'Klimmzüge',       wIdx: wIdxFor(0),  reps: 8  },
];

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({
    BarlowSemiCondensed_300Light,
    BarlowSemiCondensed_400Regular,
    BarlowSemiCondensed_500Medium,
    BarlowSemiCondensed_600SemiBold,
    BarlowSemiCondensed_700Bold,
  });

  const [exIdx]      = useState(0);
  const [reps,  setReps] = useState(EXERCISES.map(e => e.reps));
  const [wIdx,  setWIdx] = useState(EXERCISES.map(e => e.wIdx));
  const [repsActive, setRepsActive] = useState(false);

  const repeatInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const repeatTimeout  = useRef<ReturnType<typeof setTimeout>  | null>(null);

  const repsScale    = useRef(new Animated.Value(1)).current;
  const wheelScale   = useRef(new Animated.Value(1)).current;
  const confirmPulse = useRef(new Animated.Value(1)).current;
  const ringScale    = useRef(new Animated.Value(1)).current;
  const ringOpacity  = useRef(new Animated.Value(0)).current;

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  const setWeight = (index: number) => {
    setWIdx(prev => { const n = [...prev]; n[exIdx] = index; return n; });
    Animated.sequence([
      Animated.timing(wheelScale, { toValue: 1.04, duration: 80, useNativeDriver: true }),
      Animated.spring(wheelScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }),
    ]).start();
  };

  const changeReps = (d: number) =>
    setReps(prev => { const n = [...prev]; n[exIdx] = Math.max(1, n[exIdx] + d); return n; });

  const startRepsRepeat = (d: number) => {
    setRepsActive(true);
    Animated.spring(repsScale, { toValue: 1.18, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
    changeReps(d);
    repeatTimeout.current = setTimeout(() => {
      repeatInterval.current = setInterval(() => changeReps(d), 80);
    }, 400);
  };

  const stopRepsRepeat = () => {
    setRepsActive(false);
    Animated.spring(repsScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 3 }).start();
    if (repeatTimeout.current)  clearTimeout(repeatTimeout.current);
    if (repeatInterval.current) clearInterval(repeatInterval.current);
  };

  const confirmSet = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    ringScale.setValue(1);
    ringOpacity.setValue(0.8);
    Animated.parallel([
      Animated.timing(ringScale,   { toValue: 1.22, duration: 500, useNativeDriver: true }),
      Animated.timing(ringOpacity, { toValue: 0,    duration: 500, useNativeDriver: true }),
      Animated.sequence([
        Animated.spring(confirmPulse, { toValue: 0.95, useNativeDriver: true, speed: 50, bounciness: 0 }),
        Animated.spring(confirmPulse, { toValue: 1,    useNativeDriver: true, speed: 18, bounciness: 5 }),
      ]),
    ]).start();
  };


  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />

      {/* ── Action bar ── */}
      <View style={s.actionBar}>
        <TouchableOpacity style={s.actionBtn} hitSlop={10}>
          <DoorOpen size={22} color={C.text2} strokeWidth={1.5} />
          <Text style={s.actionLabel}>Beenden</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} hitSlop={10}>
          <NotebookPen size={22} color={C.text2} strokeWidth={1.5} />
          <Text style={s.actionLabel}>Notizen</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} hitSlop={10}>
          <List size={22} color={C.text2} strokeWidth={1.5} />
          <Text style={s.actionLabel}>Sätze</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} hitSlop={10}>
          <ArrowRight size={22} color={C.text2} strokeWidth={1.5} />
          <Text style={s.actionLabel}>Übung</Text>
        </TouchableOpacity>
      </View>

      {/* ── Wheel + Reps (zentriert als Einheit) ── */}
      <View style={s.pickerContainer}>
        <Animated.View style={{ width: '100%', height: ITEM_H * 5, overflow: 'hidden', transform: [{ scale: wheelScale }] }}>
          <WheelPicker
            selectedIndex={wIdx[exIdx]}
            options={WEIGHT_LABELS}
            onChange={setWeight}
            itemHeight={ITEM_H}
            visibleRest={2}
            decelerationRate="fast"
            itemTextStyle={s.wheelText}
            selectedIndicatorStyle={s.wheelHighlight}
            containerStyle={s.wheelContainer}
            opacityFunction={(x: number) => Math.pow(0.45, x)}
            scaleFunction={(x: number) => Math.pow(0.8, x)}
          />
        </Animated.View>
        <View style={s.repsSection}>
          <Animated.Text style={[s.repsNum, repsActive && s.repsNumActive, { transform: [{ scale: repsScale }] }]}>
            × {reps[exIdx]}
          </Animated.Text>
          <View style={s.repsRow}>
            <TouchableOpacity onPressIn={() => startRepsRepeat(-1)} onPressOut={stopRepsRepeat} style={s.repBtn}>
              <Minus size={22} color={C.text2} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity onPressIn={() => startRepsRepeat(1)} onPressOut={stopRepsRepeat} style={s.repBtn}>
              <Plus size={22} color={C.text2} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Confirm ── */}
      <View style={[s.bottomArea, { paddingBottom: insets.bottom + 16 }]}>
        <View style={s.confirmOuter}>
          <Animated.View style={[s.confirmRing, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
          <Animated.View style={{ transform: [{ scale: confirmPulse }] }}>
            <TouchableOpacity onPress={confirmSet} activeOpacity={0.7} style={s.confirmBtn}>
              <Check size={18} color={C.accent} strokeWidth={2.5} />
              <Text style={s.confirmLabel}>Satz bestätigen</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    marginHorizontal: 6,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
  actionLabel: {
    marginTop: 5,
    fontSize: 11,
    fontFamily: BSC.medium,
    color: C.text2,
  },

  pickerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  wheelContainer:  { width: '100%', backgroundColor: 'transparent' },
  wheelText:       { fontFamily: BSC.semibold, fontSize: 32, color: C.accent },
  wheelHighlight:  { backgroundColor: 'transparent' },

  repsSection: { width: '100%', paddingHorizontal: 20, paddingTop: 16 },
  bottomArea:  { paddingHorizontal: 20 },
  repsRow:    { flexDirection: 'row', gap: 12 },
  repBtn: {
    flex: 1, paddingVertical: 16,
    justifyContent: 'center', alignItems: 'center',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
  repsNum:       { fontSize: 36, fontFamily: BSC.semibold, color: C.text2, textAlign: 'center', marginBottom: 8 },
  repsNumActive: { color: C.accent },

  confirmOuter: {
    position: 'relative',
  },
  confirmRing: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.accent,
  },
  confirmBtn: {
    height: CONFIRM_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: C.accent,
    borderRadius: 14,
  },
  confirmLabel: {
    fontSize: 17,
    fontFamily: BSC.semibold,
    color: C.accent,
  },
});
