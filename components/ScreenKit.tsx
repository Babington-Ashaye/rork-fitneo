import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { PropsWithChildren, ReactNode, useEffect, useRef } from "react";
import { ActivityIndicator, Animated, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { colors, radii, spacing } from "@/lib/theme";

type IconName = keyof typeof Ionicons.glyphMap;

export function PageGradient({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return (
    <LinearGradient
      colors={[colors.backgroundTop, colors.background, colors.backgroundBottom]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, style]}
    >
      {children}
    </LinearGradient>
  );
}

export function GlassCard({
  children,
  selected = false,
  radius = radii.card,
  style
}: PropsWithChildren<{ selected?: boolean; radius?: number; style?: StyleProp<ViewStyle> }>) {
  return (
    <View
      style={[
        styles.glassCard,
        {
          backgroundColor: selected ? colors.cardFillSelected : colors.cardFill,
          borderColor: selected ? colors.cardStrokeSelected : colors.cardStroke,
          borderRadius: radius,
          borderWidth: selected ? 1.5 : 1,
          shadowColor: selected ? colors.accent : "transparent"
        },
        style
      ]}
    >
      {children}
    </View>
  );
}

export function TouchableCard({
  children,
  onPress,
  selected = false,
  radius = radii.card,
  style
}: PropsWithChildren<{
  onPress?: () => void;
  selected?: boolean;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}>) {
  return (
    <TouchableOpacity activeOpacity={0.78} onPress={onPress} disabled={!onPress}>
      <GlassCard selected={selected} radius={radius} style={style}>
        {children}
      </GlassCard>
    </TouchableOpacity>
  );
}

export function ScreenTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.screenTitleWrap}>
      <Text style={styles.screenTitle}>{title}</Text>
      {subtitle ? <Text style={styles.screenSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function SectionHeader({ title, accent = false }: { title: string; accent?: boolean }) {
  return <Text style={[styles.sectionHeader, { color: accent ? colors.accent : colors.textTertiary }]}>{title.toUpperCase()}</Text>;
}

export function StatCard({
  icon,
  value,
  label,
  tint = colors.accent,
  onPress
}: {
  icon: IconName;
  value: string;
  label: string;
  tint?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.78} disabled={!onPress} onPress={onPress} style={styles.statTouchable}>
      <GlassCard radius={16} style={styles.statCard}>
        <Ionicons name={icon} size={16} color={tint} />
        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.statValue}>{value}</Text>
        <Text numberOfLines={2} style={styles.statLabel}>{label}</Text>
      </GlassCard>
    </TouchableOpacity>
  );
}

export function XPBar({
  level,
  rankTitle,
  progress,
  xpInto,
  xpSpan
}: {
  level: number;
  rankTitle: string;
  progress: number;
  xpInto: number;
  xpSpan?: number;
}) {
  return (
    <GlassCard radius={radii.card} style={styles.xpCard}>
      <View style={styles.rowBetween}>
        <View style={styles.inline}>
          <Ionicons name="flash" size={11} color={colors.accent} />
          <Text style={styles.xpTitle}>LVL {level} · {rankTitle}</Text>
        </View>
        <Text style={styles.xpMeta}>{xpSpan ? `${xpInto} / ${xpSpan} XP` : "MAX"}</Text>
      </View>
      <View style={styles.progressTrack}>
        <LinearGradient
          colors={[colors.accent, "#00F2A0"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${Math.max(4, Math.min(100, progress * 100))}%` }]}
        />
      </View>
    </GlassCard>
  );
}

export function PillButton({ title, icon, filled = true }: { title: string; icon?: IconName; filled?: boolean }) {
  return (
    <View style={[styles.pillButton, filled ? styles.pillFilled : styles.pillOutline]}>
      {icon ? <Ionicons name={icon} size={17} color={filled ? colors.textPrimary : colors.accent} /> : null}
      <Text style={[styles.pillText, { color: filled ? colors.textPrimary : colors.accent }]}>{title}</Text>
    </View>
  );
}

export function IconBubble({
  icon,
  tint = colors.accent,
  shape = "circle",
  size = 44
}: {
  icon: IconName;
  tint?: string;
  shape?: "circle" | "rounded";
  size?: number;
}) {
  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: withAlpha(tint, 0.15),
        borderRadius: shape === "circle" ? size / 2 : radii.md,
        height: size,
        justifyContent: "center",
        width: size
      }}
    >
      <Ionicons name={icon} size={Math.round(size * 0.42)} color={tint} />
    </View>
  );
}

export function MetaItem({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={12} color={colors.textTertiary} />
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

export function Chip({ title, active, coral = false }: { title: string; active?: boolean; coral?: boolean }) {
  const tint = coral ? colors.coral : colors.accent;
  return (
    <View style={[styles.chip, { backgroundColor: active ? tint : "rgba(255,255,255,0.05)", borderColor: active ? "transparent" : colors.cardStroke }]}>
      <Text style={[styles.chipText, { color: active ? colors.textPrimary : colors.textSecondary }]}>{title}</Text>
    </View>
  );
}

export function EmptySpacer({ height = spacing.bottomClearance }: { height?: number }) {
  return <View style={{ height }} />;
}

export function RowCard({
  icon,
  title,
  subtitle,
  right,
  tint = colors.accent,
  onPress
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  tint?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableCard radius={radii.card} style={styles.rowCard} onPress={onPress}>
      <IconBubble icon={icon} tint={tint} size={40} />
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {right ?? <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />}
    </TouchableCard>
  );
}

export function LoadingState({ label = "Loading FITNEO..." }: { label?: string }) {
  return (
    <View style={styles.stateWrap}>
      <ActivityIndicator color={colors.accent} />
      <Text style={styles.stateText}>{label}</Text>
    </View>
  );
}

export function SkeletonBlock({
  height,
  radius = radii.md,
  style
}: {
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        duration: 1250,
        toValue: 1,
        useNativeDriver: true
      })
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  return (
    <View style={[styles.skeleton, { borderRadius: radius, height }, style]}>
      <Animated.View
        style={[
          styles.skeletonShimmer,
          {
            transform: [
              {
                translateX: shimmer.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-180, 520]
                })
              }
            ]
          }
        ]}
      >
        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.13)", "transparent"]}
          end={{ x: 1, y: 0 }}
          start={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <GlassCard radius={radii.xl} style={styles.errorCard}>
      <Ionicons name="warning" size={18} color={colors.danger} />
      <Text style={styles.errorText}>{message}</Text>
      {onRetry ? (
        <TouchableOpacity activeOpacity={0.78} onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      ) : null}
    </GlassCard>
  );
}

export function withAlpha(hex: string, alpha: number) {
  if (!hex.startsWith("#") || hex.length !== 7) {
    return hex;
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1
  },
  glassCard: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 18
  },
  screenTitleWrap: {
    alignItems: "flex-start",
    gap: 4,
    marginBottom: 2,
    width: "100%"
  },
  screenTitle: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: 0
  },
  screenSubtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 21
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5
  },
  statCard: {
    alignItems: "center",
    flex: 1,
    gap: 8,
    justifyContent: "center",
    minHeight: 118,
    padding: 16,
    width: "100%"
  },
  statTouchable: {
    flexBasis: 0,
    flex: 1,
    minWidth: 0,
    width: "100%"
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center"
  },
  statLabel: {
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center"
  },
  xpCard: {
    gap: 10,
    padding: 18
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  inline: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  xpTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "700"
  },
  xpMeta: {
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: "700"
  },
  progressTrack: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: radii.round,
    height: 10,
    overflow: "hidden"
  },
  progressFill: {
    borderRadius: radii.round,
    height: 10
  },
  pillButton: {
    alignItems: "center",
    borderRadius: radii.lg,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingVertical: 16,
    width: "100%"
  },
  pillFilled: {
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16
  },
  pillOutline: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(10,132,255,0.4)",
    borderWidth: 1
  },
  pillText: {
    fontSize: 16,
    fontWeight: "700"
  },
  metaItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600"
  },
  chip: {
    borderRadius: radii.round,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 9
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600"
  },
  rowCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    minHeight: 74,
    padding: 16
  },
  rowText: {
    flex: 1,
    gap: 2
  },
  rowTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "600"
  },
  rowSubtitle: {
    color: colors.textTertiary,
    fontSize: 12
  },
  stateWrap: {
    alignItems: "center",
    flex: 1,
    gap: 12,
    justifyContent: "center",
    paddingVertical: 56
  },
  stateText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600"
  },
  skeleton: {
    backgroundColor: "rgba(255,255,255,0.055)",
    overflow: "hidden",
    width: "100%"
  },
  skeletonShimmer: {
    height: "100%",
    width: 150
  },
  errorCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    padding: 16
  },
  errorText: {
    color: colors.textSecondary,
    flex: 1,
    fontSize: 13,
    lineHeight: 18
  },
  retryButton: {
    borderColor: "rgba(10,132,255,0.4)",
    borderRadius: radii.round,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  retryText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700"
  }
});
