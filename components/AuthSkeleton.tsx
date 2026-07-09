import { StyleSheet, View } from "react-native";
import { SkeletonBlock } from "@/components/ScreenKit";
import { radii } from "@/lib/theme";

export function AuthSkeleton() {
  return (
    <View style={styles.wrap}>
      <SkeletonBlock height={96} radius={48} style={styles.logo} />
      <SkeletonBlock height={36} radius={10} style={styles.wordmark} />
      <SkeletonBlock height={16} radius={8} style={styles.tagline} />
      <View style={styles.form}>
        <SkeletonBlock height={34} radius={10} style={styles.title} />
        <SkeletonBlock height={52} radius={radii.md} />
        <SkeletonBlock height={52} radius={radii.md} />
        <SkeletonBlock height={52} radius={radii.md} />
        <SkeletonBlock height={52} radius={radii.md} />
        <SkeletonBlock height={18} radius={9} style={styles.footer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    alignSelf: "center",
    width: "62%"
  },
  form: {
    gap: 16,
    marginTop: 30,
    maxWidth: 400,
    width: "100%"
  },
  logo: {
    alignSelf: "center",
    width: 96
  },
  tagline: {
    alignSelf: "center",
    width: 190
  },
  title: {
    width: 190
  },
  wordmark: {
    alignSelf: "center",
    width: 150
  },
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    maxWidth: 448,
    paddingHorizontal: 24,
    width: "100%"
  }
});
