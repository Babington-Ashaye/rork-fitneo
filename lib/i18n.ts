import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export const LANGUAGE_STORAGE_KEY = "fitneo.language";

export const supportedLanguages = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" }
] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number]["code"];

function isSupportedLanguage(value: string | null): value is SupportedLanguage {
  return supportedLanguages.some((language) => language.code === value);
}

export const resources = {
  en: {
    translation: {
      nav: {
        home: "Home",
        workouts: "Workouts",
        nutrition: "Nutrition",
        progress: "Progress",
        profile: "Profile"
      },
      profile: {
        language: "Language",
        legal: "Legal",
        legalSubtitle: "Policies, terms, refunds, and company details"
      },
      language: {
        change: "Change Language"
      },
      legal: {
        privacy: "Privacy Policy",
        terms: "Terms of Service",
        refund: "Refund Policy",
        imprint: "Imprint",
        support: "Support",
        updated: "Last updated: July 9, 2026",
        privacyBody:
          "FITNEO uses your account, workout, nutrition, and app activity data to provide personalized fitness experiences. We only use public client keys in the app and never intentionally bundle administrative service-role secrets.",
        termsBody:
          "By using FITNEO, you agree to use the app responsibly and follow all applicable laws. FITNEO and its AI Coach provide fitness and nutritional information for educational purposes only. FITNEO is not a medical professional, and users should consult a physician before starting any diet or exercise program.",
        refundBody:
          "Subscription refunds are handled by the platform or billing provider used for your purchase. If you purchased through a web checkout, contact FITNEO support with your account email and receipt details.",
        imprintBody:
          "FITNEO is a digital fitness product. For business, legal, or platform inquiries, contact the FITNEO support team with your account email and request details.",
        supportBody:
          "Need help with your account, subscription, or app data? Contact FITNEO support and include your account email, device type, and a short description of the issue."
      }
    }
  },
  es: {
    translation: {
      nav: {
        home: "Inicio",
        workouts: "Entrenos",
        nutrition: "Nutrición",
        progress: "Progreso",
        profile: "Perfil"
      },
      profile: {
        language: "Idioma",
        legal: "Legal",
        legalSubtitle: "Políticas, términos, reembolsos y datos de la empresa"
      },
      language: {
        change: "Cambiar idioma"
      },
      legal: {
        privacy: "Política de Privacidad",
        terms: "Términos de Servicio",
        refund: "Política de Reembolso",
        imprint: "Aviso Legal",
        support: "Soporte",
        updated: "Última actualización: 9 de julio de 2026",
        privacyBody:
          "FITNEO usa los datos de tu cuenta, entrenamientos, nutrición y actividad en la app para ofrecer experiencias de fitness personalizadas.",
        termsBody:
          "Al usar FITNEO, aceptas utilizar la app de forma responsable. FITNEO y su AI Coach ofrecen información de fitness y nutrición solo con fines educativos. FITNEO no es un profesional médico, y los usuarios deben consultar a un médico antes de iniciar cualquier dieta o programa de ejercicio.",
        refundBody:
          "Los reembolsos de suscripciones se gestionan mediante la plataforma o proveedor de pago usado para la compra.",
        imprintBody:
          "FITNEO es un producto digital de fitness. Para consultas comerciales, legales o de plataforma, contacta al equipo de soporte de FITNEO.",
        supportBody:
          "¿Necesitas ayuda con tu cuenta, suscripción o datos de la app? Contacta al soporte de FITNEO con tu correo, dispositivo y una breve descripción."
      }
    }
  },
  fr: {
    translation: {
      nav: {
        home: "Accueil",
        workouts: "Séances",
        nutrition: "Nutrition",
        progress: "Progrès",
        profile: "Profil"
      },
      profile: {
        language: "Langue",
        legal: "Juridique",
        legalSubtitle: "Confidentialité, conditions, remboursements et mentions"
      },
      language: {
        change: "Changer de langue"
      },
      legal: {
        privacy: "Politique de Confidentialité",
        terms: "Conditions d’Utilisation",
        refund: "Politique de Remboursement",
        imprint: "Mentions Légales",
        support: "Assistance",
        updated: "Dernière mise à jour : 9 juillet 2026",
        privacyBody:
          "FITNEO utilise les données de votre compte, de vos entraînements, de votre nutrition et de votre activité dans l’app pour fournir une expérience personnalisée.",
        termsBody:
          "En utilisant FITNEO, vous acceptez d’utiliser l’app de manière responsable. FITNEO et son AI Coach fournissent des informations de fitness et de nutrition à des fins éducatives uniquement. FITNEO n’est pas un professionnel médical, et les utilisateurs doivent consulter un médecin avant de commencer tout régime ou programme d’exercice.",
        refundBody:
          "Les remboursements d’abonnement sont gérés par la plateforme ou le fournisseur de paiement utilisé pour votre achat.",
        imprintBody:
          "FITNEO est un produit numérique de fitness. Pour toute demande commerciale, juridique ou liée à la plateforme, contactez l’assistance FITNEO.",
        supportBody:
          "Besoin d’aide avec votre compte, votre abonnement ou vos données ? Contactez l’assistance FITNEO avec votre e-mail, votre appareil et une brève description."
      }
    }
  }
} as const;

void i18n.use(initReactI18next).init({
  compatibilityJSON: "v4",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false
  },
  lng: "en",
  react: {
    useSuspense: false
  },
  resources
});

void AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then((savedLanguage) => {
  if (isSupportedLanguage(savedLanguage) && savedLanguage !== i18n.language) {
    void i18n.changeLanguage(savedLanguage);
  }
});

export async function changeAppLanguage(language: SupportedLanguage): Promise<void> {
  await i18n.changeLanguage(language);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

export function getCurrentLanguage(): SupportedLanguage {
  return isSupportedLanguage(i18n.language) ? i18n.language : "en";
}

export default i18n;
