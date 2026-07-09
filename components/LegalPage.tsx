import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { AppLayout } from "@/components/AppLayout";
import { GlassCard } from "@/components/ScreenKit";
import { colors, radii } from "@/lib/theme";

type LegalPageProps = {
  bodyKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
};

export function LegalPage({ bodyKey, icon, titleKey }: LegalPageProps) {
  const { t } = useTranslation();

  return (
    <AppLayout scroll>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={26} color={colors.accent} />
        </View>
        <Text style={styles.title}>{t(titleKey)}</Text>
        <Text style={styles.updated}>{t("legal.updated")}</Text>
      </View>

      <GlassCard radius={radii.xl} style={styles.card}>
        <Text style={styles.body}>{t(bodyKey)}</Text>
      </GlassCard>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  body: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 23
  },
  card: {
    padding: 20
  },
  header: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 8
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: "rgba(10,132,255,0.14)",
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    width: 56
  },
  title: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center"
  },
  updated: {
    color: colors.textTertiary,
    fontSize: 12
  }
});
