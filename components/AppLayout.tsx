import { ReactNode } from "react";
import {
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PageGradient } from "@/components/ScreenKit";
import { spacing } from "@/lib/theme";

type AppLayoutProps = {
  children: ReactNode;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  scrollProps?: Omit<ScrollViewProps, "contentContainerStyle" | "children" | "refreshControl">;
  refreshControl?: ScrollViewProps["refreshControl"];
};

export function AppLayout({
  children,
  scroll = false,
  contentContainerStyle,
  style,
  scrollProps,
  refreshControl
}: AppLayoutProps) {
  const insets = useSafeAreaInsets();
  return (
    <PageGradient style={[styles.root, style]}>
      <View style={styles.contentRegion}>
        {scroll ? (
          <ScrollView
            {...scrollProps}
            refreshControl={refreshControl}
            contentInsetAdjustmentBehavior="automatic"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingBottom: spacing.bottomClearance,
                paddingTop: Math.max(12, insets.top + 8)
              },
              contentContainerStyle
            ]}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.staticContent, { paddingTop: Math.max(12, insets.top + 8) }, contentContainerStyle]}>{children}</View>
        )}
      </View>
    </PageGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    maxWidth: "100%",
    width: "100%"
  },
  contentRegion: {
    flex: 1,
    maxWidth: "100%",
    overflow: "hidden",
    width: "100%"
  },
  scroll: {
    flex: 1,
    maxWidth: "100%",
    width: "100%"
  },
  scrollContent: {
    flexGrow: 1,
    gap: 18,
    maxWidth: "100%",
    paddingHorizontal: spacing.screen,
    paddingTop: 8,
    width: "100%"
  },
  staticContent: {
    flex: 1,
    gap: 18,
    maxWidth: "100%",
    paddingHorizontal: spacing.screen,
    paddingTop: 8,
    width: "100%"
  }
});
