import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { GlassCard } from "@/components/ScreenKit";
import i18n, {
  changeAppLanguage,
  getCurrentLanguage,
  SupportedLanguage,
  supportedLanguages
} from "@/lib/i18n";
import { colors, radii } from "@/lib/theme";

const legalLinks = [
  { href: "/legal/privacy", icon: "shield-checkmark", labelKey: "legal.privacy" },
  { href: "/legal/terms", icon: "document-text", labelKey: "legal.terms" },
  { href: "/legal/refund", icon: "card", labelKey: "legal.refund" },
  { href: "/legal/imprint", icon: "business", labelKey: "legal.imprint" }
] as const;

export function LegalSettingsMenu() {
  const { t } = useTranslation();
  const [language, setLanguage] = useState<SupportedLanguage>(getCurrentLanguage());

  useEffect(() => {
    const syncLanguage = (nextLanguage: string) => {
      if (supportedLanguages.some((item) => item.code === nextLanguage)) {
        setLanguage(nextLanguage as SupportedLanguage);
      }
    };
    i18n.on("languageChanged", syncLanguage);
    return () => {
      i18n.off("languageChanged", syncLanguage);
    };
  }, []);

  return (
    <GlassCard radius={radii.xl} style={styles.card}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.section}>{t("profile.language")}</Text>
          <Text style={styles.subtitle}>{t("language.change")}</Text>
        </View>
        <Ionicons name="language" size={18} color={colors.accent} />
      </View>

      <View style={styles.languageRow}>
        {supportedLanguages.map((item) => {
          const active = language === item.code;
          return (
            <TouchableOpacity
              key={item.code}
              activeOpacity={0.78}
              onPress={() => void changeAppLanguage(item.code)}
              style={[styles.languageChip, active && styles.languageChipActive]}
            >
              <Text style={[styles.languageText, active && styles.languageTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.section}>{t("profile.legal")}</Text>
          <Text style={styles.subtitle}>{t("profile.legalSubtitle")}</Text>
        </View>
        <Ionicons name="shield" size={18} color={colors.teal} />
      </View>

      <View style={styles.linkList}>
        {legalLinks.map((item) => (
          <Link key={item.href} href={item.href} asChild>
            <TouchableOpacity activeOpacity={0.78} style={styles.linkRow}>
              <Ionicons
                name={item.icon as keyof typeof Ionicons.glyphMap}
                size={17}
                color={colors.accent}
                style={styles.linkIcon}
              />
              <Text style={styles.linkText}>{t(item.labelKey)}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          </Link>
        ))}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
    padding: 18
  },
  divider: {
    backgroundColor: "rgba(255,255,255,0.08)",
    height: 1
  },
  languageChip: {
    borderColor: colors.cardStroke,
    borderRadius: radii.round,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  languageChipActive: {
    backgroundColor: "rgba(10,132,255,0.18)",
    borderColor: colors.accent
  },
  languageRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  languageText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "800"
  },
  languageTextActive: {
    color: colors.textPrimary
  },
  linkIcon: {
    width: 26
  },
  linkList: {
    gap: 4
  },
  linkRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    minHeight: 46
  },
  linkText: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 15,
    fontWeight: "700"
  },
  section: {
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
    textTransform: "uppercase"
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  subtitle: {
    color: colors.textTertiary,
    fontSize: 12,
    marginTop: 3
  }
});
