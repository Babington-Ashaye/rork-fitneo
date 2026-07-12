import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, TouchableOpacity } from "react-native";
import { colors } from "@/lib/theme";

type IconName = keyof typeof Ionicons.glyphMap;

type IconButtonProps = {
  name: IconName;
  onPress: () => void;
  size?: number;
};

export function IconButton({ name, onPress, size = 20 }: IconButtonProps) {
  const icon = <Ionicons name={name} size={size} color={colors.textPrimary} />;

  if (Platform.OS === "ios") {
    return (
      <TouchableOpacity activeOpacity={0.78} onPress={onPress} style={styles.touchTarget}>
        <BlurView intensity={20} tint="dark" style={[styles.button, styles.blur]}>
          {icon}
        </BlurView>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity activeOpacity={0.78} onPress={onPress} style={styles.button}>
      {icon}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchTarget: {
    borderRadius: 20
  },
  button: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 20,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    width: 42
  },
  blur: {
    overflow: "hidden"
  }
});
