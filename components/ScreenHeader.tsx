import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { IconButton } from "@/components/IconButton";
import { colors } from "@/lib/theme";

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
};

export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <IconButton name="arrow-back" onPress={() => router.back()} />
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
        {subtitle ? <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.placeholder} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    minHeight: 46
  },
  copy: {
    alignItems: "center",
    flex: 1,
    minWidth: 0
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2
  },
  placeholder: {
    height: 42,
    width: 42
  }
});
