import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/lib/theme";

type AdaptiveBannerProps = {
  enabled: boolean;
};

export function AdaptiveBanner({ enabled }: AdaptiveBannerProps) {
  if (!enabled) {
    return null;
  }

  return (
    <View style={styles.placeholder}>
      <Text style={styles.text}>AD BANNER PLACEHOLDER</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: "center",
    height: "100%",
    justifyContent: "center",
    width: "100%"
  },
  text: {
    color: colors.textTertiary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4
  }
});
