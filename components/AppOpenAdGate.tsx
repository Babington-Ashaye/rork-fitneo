import { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const WEB_OFFER_SESSION_KEY = "fitneo.webOffer.seenThisSession";

export function AppOpenAdGate() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.sessionStorage?.getItem(WEB_OFFER_SESSION_KEY)) {
      return;
    }
    const timer = setTimeout(() => {
      if (typeof window !== "undefined") {
        window.sessionStorage?.setItem(WEB_OFFER_SESSION_KEY, "true");
      }
      setVisible(true);
    }, 1400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={() => setVisible(false)}>
      <View style={styles.scrim}>
        <View style={styles.card}>
          <TouchableOpacity accessibilityLabel="Close promotion" style={styles.close} onPress={() => setVisible(false)}>
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>
          <Text style={styles.kicker}>NEW USER BOOST</Text>
          <Text style={styles.title}>30% OFF</Text>
          <Text style={styles.copy}>Unlock full AI plans, no ads, sport programming, and meal scanning priority.</Text>
          <TouchableOpacity activeOpacity={0.84} style={styles.cta} onPress={() => setVisible(false)}>
            <Text style={styles.ctaText}>Continue</Text>
          </TouchableOpacity>
          <Text style={styles.small}>Sponsored FITNEO offer</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.62)",
    flex: 1,
    justifyContent: "center",
    padding: 24
  },
  card: {
    backgroundColor: "#FF2D55",
    borderRadius: 30,
    maxWidth: 420,
    minHeight: 390,
    overflow: "hidden",
    padding: 28,
    width: "100%"
  },
  close: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    position: "absolute",
    right: 18,
    top: 14,
    width: 36,
    zIndex: 2
  },
  closeText: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 32,
    fontWeight: "200"
  },
  kicker: {
    color: "#FFF8D7",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: 20
  },
  title: {
    color: "#FFF8D7",
    fontSize: 82,
    fontWeight: "900",
    letterSpacing: -4,
    lineHeight: 92,
    marginTop: 18
  },
  copy: {
    color: "rgba(255,255,255,0.90)",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 23,
    marginTop: 12
  },
  cta: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    justifyContent: "center",
    minHeight: 58,
    marginTop: 28
  },
  ctaText: {
    color: "#111111",
    fontSize: 18,
    fontWeight: "900"
  },
  small: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 14,
    textAlign: "center"
  }
});
