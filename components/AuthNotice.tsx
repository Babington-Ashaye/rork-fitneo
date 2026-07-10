import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "@/lib/theme";

export function AuthNotice({
  danger = false,
  icon,
  message,
  title
}: {
  danger?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  message: string;
  title: string;
}) {
  const cleanMessage = typeof message === "string" ? message.trim() : "";
  const shouldShowMessage = cleanMessage.length > 0 && cleanMessage !== "{}";

  return (
    <View style={[styles.notice, danger && styles.noticeDanger]}>
      <View style={[styles.noticeIcon, danger && styles.noticeIconDanger]}>
        <Ionicons name={icon} size={17} color={danger ? colors.danger : colors.accent} />
      </View>
      <View style={styles.noticeCopy}>
        <Text style={styles.noticeTitle}>{title}</Text>
        {shouldShowMessage ? <Text style={styles.noticeText}>{cleanMessage}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    alignItems: "flex-start",
    backgroundColor: "rgba(10,132,255,0.10)",
    borderColor: "rgba(10,132,255,0.28)",
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14
  },
  noticeDanger: {
    backgroundColor: "rgba(255,69,58,0.10)",
    borderColor: "rgba(255,69,58,0.26)"
  },
  noticeIcon: {
    alignItems: "center",
    backgroundColor: "rgba(10,132,255,0.16)",
    borderRadius: 15,
    height: 30,
    justifyContent: "center",
    width: 30
  },
  noticeIconDanger: {
    backgroundColor: "rgba(255,69,58,0.14)"
  },
  noticeCopy: {
    flex: 1,
    gap: 3
  },
  noticeTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "800"
  },
  noticeText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17
  }
});
