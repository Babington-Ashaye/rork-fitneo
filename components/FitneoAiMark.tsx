import { StyleSheet, View } from "react-native";
import { colors } from "@/lib/theme";

type FitneoAiMarkProps = {
  color?: string;
  size?: number;
};

export function FitneoAiMark({ color = colors.accent, size = 22 }: FitneoAiMarkProps) {
  const unit = size / 22;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[styles.host, { height: size, width: size }]}
    >
      <View
        style={[
          styles.orbit,
          {
            borderColor: color,
            borderRadius: size / 2,
            height: size * 0.78,
            left: size * 0.11,
            top: size * 0.11,
            width: size * 0.78
          }
        ]}
      />
      <View
        style={[
          styles.pulse,
          {
            backgroundColor: color,
            borderRadius: 3 * unit,
            height: 4 * unit,
            left: 3 * unit,
            top: 9 * unit,
            width: 16 * unit
          }
        ]}
      />
      <View
        style={[
          styles.spark,
          {
            backgroundColor: color,
            borderRadius: 2 * unit,
            height: 10 * unit,
            left: 10 * unit,
            top: 3 * unit,
            width: 4 * unit
          }
        ]}
      />
      <View
        style={[
          styles.core,
          {
            backgroundColor: color,
            borderRadius: 4 * unit,
            height: 7 * unit,
            left: 8 * unit,
            top: 8 * unit,
            width: 7 * unit
          }
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "relative"
  },
  orbit: {
    borderWidth: 1,
    opacity: 0.38,
    position: "absolute",
    transform: [{ rotate: "-28deg" }]
  },
  pulse: {
    opacity: 0.92,
    position: "absolute",
    transform: [{ rotate: "-34deg" }]
  },
  spark: {
    opacity: 0.95,
    position: "absolute",
    transform: [{ rotate: "38deg" }]
  },
  core: {
    position: "absolute"
  }
});
