import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, ImageBackground, Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ErrorState, LoadingState } from "@/components/ScreenKit";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/lib/theme";

const slides = [
  {
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=82",
    title: "#1 AI Fitness Coach",
    subtitle: "★★★★★ 4.9",
    badge: "FITNEO"
  },
  {
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=82",
    title: "Personalized Plan",
    subtitle: "BUILT FOR YOU",
    badge: "AI PLAN"
  },
  {
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=82",
    title: "Sport-Specific Training",
    subtitle: "PRO LEVEL",
    badge: "SPORT"
  },
  {
    image: "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?auto=format&fit=crop&w=1200&q=82",
    title: "200K+ Athletes Training",
    subtitle: "JOIN THEM",
    badge: "4.9 RATED"
  }
];

export default function Index() {
  const { error, isLoading, needsLegalAcceptance, needsOnboarding, session, refreshProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [showIntro, setShowIntro] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);
  const pulse = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const wordProgress = useRef(new Animated.Value(0)).current;
  const currentSlide = slides[slideIndex];

  useEffect(() => {
    const introTimer = setTimeout(() => setShowIntro(false), 1550);
    Animated.parallel([
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { duration: 760, easing: Easing.out(Easing.quad), toValue: 1, useNativeDriver: true }),
          Animated.timing(pulse, { duration: 760, easing: Easing.in(Easing.quad), toValue: 0, useNativeDriver: true })
        ])
      ),
      Animated.timing(wordProgress, { duration: 1250, easing: Easing.out(Easing.cubic), toValue: 1, useNativeDriver: true })
    ]).start();
    return () => clearTimeout(introTimer);
  }, [pulse, wordProgress]);

  useEffect(() => {
    if (showIntro) return;
    fade.setValue(0);
    Animated.timing(fade, { duration: 700, toValue: 1, useNativeDriver: true }).start();
    const timer = setInterval(() => {
      setSlideIndex((current) => (current + 1) % slides.length);
    }, 3900);
    return () => clearInterval(timer);
  }, [fade, showIntro]);

  useEffect(() => {
    if (showIntro) return;
    fade.setValue(0);
    Animated.timing(fade, { duration: 650, toValue: 1, useNativeDriver: true }).start();
  }, [fade, showIntro, slideIndex]);

  const letterOpacities = useMemo(
    () => "FITNEO".split("").map((_, index) =>
      wordProgress.interpolate({
        inputRange: [index / 7, (index + 1.2) / 7],
        outputRange: [0, 1],
        extrapolate: "clamp"
      })
    ),
    [wordProgress]
  );

  if (isLoading) {
    return (
      <View style={styles.centerState}>
        <LoadingState label="Restoring your FITNEO session..." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerState}>
        <ErrorState message={error} onRetry={refreshProfile} />
      </View>
    );
  }

  if (session && needsLegalAcceptance) return <Redirect href="/legal-consent" />;
  if (session && needsOnboarding) return <Redirect href="/onboarding" />;
  if (session) return <Redirect href="/(tabs)" />;

  if (showIntro) {
    const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] });
    const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.42, 0.76] });
    return (
      <LinearGradient colors={[colors.appBlueBright, colors.appBlue, colors.appBlueDeep]} style={styles.intro}>
        <Animated.View style={[styles.introHalo, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]} />
        <Text style={styles.introMicro}>AI FITNESS OS</Text>
        <View style={styles.introWordmark}>
          <View style={styles.letterRow}>
            {"FITNEO".split("").map((letter, index) => (
              <Animated.Text key={`${letter}-${index}`} style={[styles.introLetter, { opacity: letterOpacities[index] }]}>
                {letter}
              </Animated.Text>
            ))}
          </View>
          <Text style={styles.introSubline}>TRAINING · NUTRITION · SPORT</Text>
        </View>
        <Text style={styles.introProof}>Personal plans calibrated by FITNEO AI</Text>
        <View style={styles.introDots}>
          <View style={styles.introDotMuted} />
          <View style={styles.introDotActive} />
        </View>
        <View style={styles.introSlashOne} />
        <View style={styles.introSlashTwo} />
      </LinearGradient>
    );
  }

  return (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: fade }]}>
        <ImageBackground source={{ uri: currentSlide.image }} resizeMode="cover" style={StyleSheet.absoluteFillObject}>
          <LinearGradient
            colors={["rgba(0,0,0,0.30)", "rgba(0,46,173,0.45)", "rgba(0,0,0,0.78)"]}
            locations={[0, 0.42, 1]}
            style={StyleSheet.absoluteFillObject}
          />
        </ImageBackground>
      </Animated.View>

      <View style={[styles.heroContent, { paddingTop: Math.max(22, insets.top + 8), minHeight: height }]}>
        <View style={styles.topMark}>
          <View style={styles.miniOrb}>
            <Ionicons name="pulse" size={18} color={colors.textPrimary} />
          </View>
          <Text style={styles.brand}>FITNEO</Text>
        </View>

        <View style={styles.copyBlock}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{currentSlide.badge}</Text>
          </View>
          <Text style={styles.slideTitle}>{currentSlide.title}</Text>
          <Text style={styles.slideSubtitle}>{currentSlide.badge === "FITNEO" ? "★★★★★ 4.9 RATED" : currentSlide.subtitle}</Text>
          <View style={styles.valueRow}>
            <View style={styles.valuePill}>
              <Text style={styles.valueNumber}>108+</Text>
              <Text style={styles.valueLabel}>Exercises</Text>
            </View>
            <View style={styles.valuePill}>
              <Text style={styles.valueNumber}>AI</Text>
              <Text style={styles.valueLabel}>Plans</Text>
            </View>
            <View style={styles.valuePill}>
              <Text style={styles.valueNumber}>Sport</Text>
              <Text style={styles.valueLabel}>Mode</Text>
            </View>
          </View>
        </View>

        <View style={[styles.bottomBlock, { paddingBottom: Math.max(28, insets.bottom + 18) }]}>
          <View style={styles.slideDots}>
            {slides.map((slide, index) => (
              <View key={slide.title} style={[styles.slideDot, index === slideIndex && styles.slideDotActive]} />
            ))}
          </View>
          <TouchableOpacity activeOpacity={0.86} style={styles.startButton} onPress={() => router.push("/auth/sign-up")}>
            <Text style={styles.startText}>START</Text>
          </TouchableOpacity>
          <View style={styles.existingRow}>
            <View style={styles.line} />
            <Text style={styles.existingMuted}>Already our user?</Text>
            <View style={styles.line} />
          </View>
          <TouchableOpacity activeOpacity={0.78} style={styles.signInLink} onPress={() => router.push("/auth/sign-in")}>
            <Text style={styles.signInText}>Continue with your existing account</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.black, flex: 1 },
  centerState: { backgroundColor: colors.background, flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  intro: { alignItems: "center", flex: 1, justifyContent: "center", overflow: "hidden", paddingHorizontal: 28 },
  introHalo: { backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 220, height: 420, position: "absolute", shadowColor: colors.textPrimary, shadowOpacity: 0.30, shadowRadius: 50, width: 420 },
  introMicro: { color: "rgba(255,255,255,0.78)", fontSize: 11, fontWeight: "900", letterSpacing: 3.6, marginBottom: 18 },
  introWordmark: { alignItems: "center" },
  introSubline: { color: "rgba(255,255,255,0.62)", fontSize: 12, fontWeight: "800", letterSpacing: 3.1, marginTop: 14 },
  introProof: { bottom: 86, color: "rgba(255,255,255,0.70)", fontSize: 13, fontWeight: "800", letterSpacing: 0.4, position: "absolute", textAlign: "center" },
  introDots: { bottom: 52, flexDirection: "row", gap: 9, position: "absolute" },
  introDotMuted: { backgroundColor: "rgba(255,255,255,0.34)", borderRadius: 6, height: 11, width: 11 },
  introDotActive: { backgroundColor: colors.textPrimary, borderRadius: 6, height: 11, width: 11 },
  introSlashOne: { backgroundColor: "rgba(255,255,255,0.10)", height: 520, position: "absolute", right: 28, top: 60, transform: [{ skewX: "-14deg" }], width: 92 },
  introSlashTwo: { backgroundColor: "rgba(255,255,255,0.06)", bottom: 68, height: 360, left: -28, position: "absolute", transform: [{ skewX: "-14deg" }], width: 68 },
  introGlow: { backgroundColor: colors.appBlueBright, borderRadius: 120, height: 210, position: "absolute", shadowColor: colors.appBlueBright, shadowOpacity: 0.85, shadowRadius: 40, width: 210 },
  logoOrb: { alignItems: "center", backgroundColor: "rgba(0,79,255,0.20)", borderColor: "rgba(10,132,255,0.46)", borderRadius: 54, borderWidth: 1, height: 108, justifyContent: "center", marginBottom: 26, shadowColor: colors.appBlueBright, shadowOpacity: 0.82, shadowRadius: 28, width: 108 },
  letterRow: { flexDirection: "row", gap: 8 },
  introLetter: { color: colors.textPrimary, fontSize: 46, fontWeight: "900", letterSpacing: 8, textShadowColor: "rgba(0,0,0,0.18)", textShadowRadius: 14 },
  heroContent: { flex: 1, justifyContent: "space-between", paddingHorizontal: 34 },
  topMark: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 10 },
  miniOrb: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.16)", borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
  brand: { color: colors.textPrimary, fontSize: 16, fontWeight: "900", letterSpacing: 4 },
  copyBlock: { marginTop: "auto", paddingBottom: 80 },
  badge: { alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.86)", borderRadius: 999, marginBottom: 16, paddingHorizontal: 15, paddingVertical: 7 },
  badgeText: { color: colors.appBlueDeep, fontSize: 13, fontWeight: "900", letterSpacing: 1 },
  slideTitle: { color: colors.textPrimary, fontSize: Platform.select({ web: 52, default: 48 }), fontWeight: "900", letterSpacing: -2, lineHeight: 56, maxWidth: 420, textShadowColor: "rgba(0,0,0,0.45)", textShadowRadius: 14 },
  slideSubtitle: { color: colors.textPrimary, fontSize: 24, fontWeight: "300", letterSpacing: 2.5, marginTop: 14 },
  valueRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 20 },
  valuePill: { backgroundColor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.24)", borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  valueNumber: { color: colors.textPrimary, fontSize: 13, fontWeight: "900" },
  valueLabel: { color: "rgba(255,255,255,0.68)", fontSize: 9, fontWeight: "800", marginTop: 1, textTransform: "uppercase" },
  bottomBlock: { gap: 15 },
  slideDots: { alignSelf: "center", flexDirection: "row", gap: 8, marginBottom: 2 },
  slideDot: { backgroundColor: "rgba(255,255,255,0.26)", borderRadius: 6, height: 6, width: 18 },
  slideDotActive: { backgroundColor: colors.textPrimary, width: 34 },
  startButton: { alignItems: "center", backgroundColor: colors.appBlue, borderRadius: 31, justifyContent: "center", minHeight: 62, shadowColor: colors.appBlueBright, shadowOpacity: 0.48, shadowRadius: 20 },
  startText: { color: colors.textPrimary, fontSize: 18, fontWeight: "900", letterSpacing: 1 },
  existingRow: { alignItems: "center", flexDirection: "row", gap: 12 },
  line: { backgroundColor: "rgba(255,255,255,0.22)", flex: 1, height: 1 },
  existingMuted: { color: "rgba(255,255,255,0.58)", fontSize: 13, fontWeight: "700" },
  signInLink: { alignItems: "center", flexDirection: "row", gap: 4, justifyContent: "center", minHeight: 30 },
  signInText: { color: colors.textPrimary, fontSize: 14, fontWeight: "800" }
});
