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
          styles.head,
          {
            borderColor: color,
            borderRadius: 8 * unit,
            borderBottomLeftRadius: 6 * unit,
            borderBottomRightRadius: 10 * unit,
            height: 17 * unit,
            left: 3 * unit,
            top: 2 * unit,
            width: 15 * unit
          }
        ]}
      />
      <View
        style={[
          styles.faceCut,
          {
            borderColor: color,
            borderRadius: 7 * unit,
            height: 10 * unit,
            left: 7 * unit,
            top: 5 * unit,
            width: 8 * unit
          }
        ]}
      />
      <View
        style={[
          styles.neck,
          {
            backgroundColor: color,
            borderRadius: 2 * unit,
            height: 3 * unit,
            left: 9 * unit,
            top: 17 * unit,
            width: 5 * unit
          }
        ]}
      />
      <View
        style={[
          styles.circuitStem,
          {
            backgroundColor: color,
            height: 6 * unit,
            left: 9.3 * unit,
            top: 7 * unit,
            width: 1.4 * unit
          }
        ]}
      />
      <View
        style={[
          styles.circuitBranch,
          {
            backgroundColor: color,
            height: 1.4 * unit,
            left: 9.5 * unit,
            top: 8.6 * unit,
            width: 4.5 * unit
          }
        ]}
      />
      <View
        style={[
          styles.circuitBranch,
          {
            backgroundColor: color,
            height: 1.4 * unit,
            left: 6.5 * unit,
            top: 12 * unit,
            width: 4 * unit
          }
        ]}
      />
      <View style={[styles.node, { backgroundColor: color, borderRadius: 2 * unit, height: 3.2 * unit, left: 13 * unit, top: 7.7 * unit, width: 3.2 * unit }]} />
      <View style={[styles.node, { backgroundColor: color, borderRadius: 2 * unit, height: 3 * unit, left: 5 * unit, top: 11.2 * unit, width: 3 * unit }]} />
      <View style={[styles.node, { backgroundColor: color, borderRadius: 2 * unit, height: 2.8 * unit, left: 8.6 * unit, top: 5.4 * unit, width: 2.8 * unit }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "relative"
  },
  head: {
    borderWidth: 1.8,
    opacity: 0.96,
    position: "absolute"
  },
  faceCut: {
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 0,
    borderTopWidth: 0,
    opacity: 0.44,
    position: "absolute",
    transform: [{ rotate: "-14deg" }]
  },
  neck: {
    opacity: 0.9,
    position: "absolute"
  },
  circuitStem: {
    opacity: 0.9,
    position: "absolute"
  },
  circuitBranch: {
    opacity: 0.9,
    position: "absolute"
  },
  node: {
    position: "absolute"
  }
});
