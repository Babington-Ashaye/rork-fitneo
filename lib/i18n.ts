import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export const LANGUAGE_STORAGE_KEY = "fitneo.language";

export const supportedLanguages = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
  { code: "it", label: "Italiano" },
  { code: "nl", label: "Nederlands" },
  { code: "pl", label: "Polski" },
  { code: "tr", label: "Türkçe" },
  { code: "ar", label: "العربية" },
  { code: "hi", label: "हिन्दी" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "ms", label: "Bahasa Melayu" },
  { code: "yo", label: "Yorùbá" },
  { code: "ha", label: "Hausa" },
  { code: "ig", label: "Igbo" },
  { code: "sw", label: "Kiswahili" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "ru", label: "Русский" }
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
      dashboard: {
        goodMorning: "Good morning",
        goodAfternoon: "Good afternoon",
        goodEvening: "Good evening",
        completeProfileTitle: "Complete your profile to see your plan",
        completeProfileCopy: "FITNEO needs your goals, fitness level, and baseline metrics before generating your My Plan dashboard.",
        loadFailed: "Failed to load dashboard.",
        dataUnavailable: "Dashboard data is unavailable.",
        myPlan: "MY PLAN",
        planCopy: "Your active plan is calibrated from onboarding and your latest FITNEO AI programming.",
        startActivePlan: "Start active plan",
        todaysWorkout: "TODAY'S WORKOUT",
        quickStart: "Quick Start",
        calToday: "Cal today",
        thisWeek: "This week",
        activeMin: "Active min",
        streak: "Streak",
        caloriesBurnedToday: "Calories burned today",
        activeMinutes: "Active minutes",
        minutesToday: "{{count}} minutes today",
        dayStreak: "{{count}} day streak",
        goals: "GOALS",
        weeklyWorkouts: "Weekly workouts",
        caloriesBurned: "Calories burned",
        caloriesEaten: "Calories eaten",
        waterIntake: "Water intake",
        cups: "cups",
        litersLogged: "{{liters}} L logged today",
        aiInsight: "FITNEO AI Insight",
        insightWorkoutGap: "You have {{remaining}} workout left for this weekly goal. Keep the next session controlled and realistic.",
        insightHydration: "Hydration is the next easy win. Add {{remaining}} more cup before the day gets away from you.",
        insightRecovery: "Calories are above target today. Keep the next meal lighter and prioritize recovery.",
        insightStreak: "Your {{count}} day streak is alive. Protect it with one focused session today.",
        insightStartStreak: "Start your first workout today to begin your streak.",
        insightWeeklyTarget: "You have hit your weekly target. Consider an active recovery session today.",
        insightLowBurn: "You have not logged many calories burned today. A short session could keep your momentum going.",
        insightCalorieTarget: "You are over your calorie target today. A protein-focused dinner can help balance your macros.",
        insightDefault: "You are building momentum. Stay consistent and trust the process.",
        recentActivity: "RECENT ACTIVITY",
        noWorkoutsYet: "No workouts yet - start your first session to see it here."
      },
      common: {
        cancel: "Cancel"
      },
      leaderboard: {
        loadFailed: "Failed to load leaderboard.",
        title: "Leaderboard",
        thisWeekCompetition: "THIS WEEK COMPETITION",
        resetsMonday: "Resets Monday",
        youAreRank: "You are Rank #{{rank}}",
        amongAthletes: "among {{count}} active athletes",
        xp: "XP",
        streak: "Streak",
        thisWeek: "This Week",
        noRankings: "No rankings yet.",
        completeWorkout: "Complete a workout to enter the leaderboard.",
        you: "You",
        level: "Level {{level}}",
        xpValue: "{{count}} XP",
        daysValue: "{{count}} days",
        workoutsValue: "{{count}} workouts"
      },
      nutrition: {
        addFailed: "Could not add this food.",
        addedFood: "{{food}} added to {{meal}}.",
        loadFailed: "Failed to load nutrition.",
        loading: "Loading nutrition data...",
        unavailable: "Nutrition data is unavailable.",
        title: "Nutrition",
        macros: "Macros",
        kcalRemaining: "kcal remaining",
        protein: "Protein",
        carbs: "Carbs",
        fat: "Fat",
        scanMeal: "Scan meal",
        scanSubtitle: "AI identifies your meal and estimates calories and macros instantly.",
        meals: {
          Breakfast: "Breakfast",
          Lunch: "Lunch",
          Dinner: "Dinner",
          Snacks: "Snacks"
        },
        addFood: "Add food",
        scan: "Scan",
        scanQuestion: "What would you like to scan?",
        scanMealCamera: "AI meal camera",
        scanCameraCopy: "Capture a plate and estimate calories/macros.",
        scanBarcode: "Barcode scanner",
        scanBarcodeCopy: "Scan packaged foods quickly.",
        addToMeal: "Add to {{meal}}",
        commonFoods: "Common foods",
        searchPlaceholder: "Search foods...",
        noFoodsFound: "No foods found",
        tryScanner: "Try AI Scanner instead",
        loadMore: "Load more"
      },
      profileScreen: {
        loadFailed: "Failed to load profile.",
        exportFailed: "Export failed",
        exportFailedCopy: "Could not prepare your export right now.",
        photoPermission: "Photo permission needed",
        photoPermissionCopy: "Allow photo access to choose a profile picture.",
        resetFailed: "Reset failed",
        resetFailedCopy: "Could not reset data. Please try again.",
        notifications: "Notifications",
        notificationFailed: "Notification setup failed",
        loading: "Loading profile...",
        unavailable: "Profile data is unavailable.",
        resetConfirmTitle: "Reset all data?",
        resetConfirmCopy: "This clears your local FITNEO data on this device.",
        reset: "Reset",
        trialDaysLeft: "{{count}} days left in your free trial",
        manageElite: "Manage your Elite subscription",
        managePro: "Manage your Pro subscription",
        upgradeToPro: "Upgrade to Pro — unlock everything",
        managePlan: "Manage your plan",
        badges: "BADGES",
        leaderboard: "Leaderboard",
        leaderboardSubtitle: "Compare XP, streaks, and weekly work",
        tellUs: "Tell us what to improve",
        tellUsSubtitle: "Send feedback to shape FITNEO",
        workoutReminders: "Workout reminders",
        streakAlerts: "Streak alerts",
        aiCheckIn: "FITNEO AI daily check-in",
        preparingExport: "Preparing export",
        exportData: "Export Data",
        exportSubtitle: "Download your data as JSON",
        resetAllData: "Reset All Data",
        signOut: "Sign Out"
      },
      progress: {
        loadFailed: "Failed to load progress.",
        loading: "Loading live progress...",
        unavailable: "Progress data is unavailable.",
        title: "Progress",
        subtitle: "Your data, decoded",
        dayStreak: "{{count}} day streak",
        longest: "Longest: {{count}} days",
        consistency: "consistency",
        workoutsPerWeek: "WORKOUTS / WEEK",
        totalWorkouts: "Total workouts",
        totalSets: "Total sets",
        caloriesBurned: "Calories burned",
        totalXp: "Total XP",
        bodyMetrics: "BODY METRICS",
        bmiTracked: "BMI tracked",
        bmiGuidance: "Add height and weight in onboarding/profile to calculate BMI",
        weeksApprox: "~{{count}} weeks",
        goalPace: "est. goal pace",
        favoriteMuscleGroups: "FAVORITE MUSCLE GROUPS",
        emptyMuscles: "Complete workouts to build your live training split.",
        thisWeek: "This week",
        lastWeek: "Last week",
        weeksAgo: "{{count}}w ago"
      },
      onboarding: {
        step: {
          aboutYou: "ABOUT YOU",
          goals: "GOALS",
          equipment: "EQUIPMENT",
          schedule: "SCHEDULE",
          style: "TRAINING STYLE",
          recovery: "RECOVERY",
          health: "HEALTH CHECK",
          nutrition: "NUTRITION & COACH",
          editProfile: "EDIT PROFILE"
        },
        title: {
          identity: "Tell us about yourself",
          goal: "What do you want to achieve?",
          equipment: "What do you have access to?",
          schedule: "How often will you train?",
          style: "What type of training do you prefer?",
          recovery: "How active and recovered are you?",
          health: "Any injuries or limitations?",
          calibration: "Final calibration"
        },
        continue: "Continue",
        finish: "Finish",
        skip: "Skip",
        error: {
          incomplete: "Complete this step to continue."
        },
        calibration: {
          kicker: "FITNEO AI CALIBRATION",
          title: "Building your personal plan",
          step1: "Reading onboarding answers",
          step2: "Selecting suitable workout style",
          step3: "Calibrating calories and macros",
          step4: "Preparing your plan"
        }
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
      dashboard: {
        goodMorning: "Buenos dias",
        goodAfternoon: "Buenas tardes",
        goodEvening: "Buenas noches",
        completeProfileTitle: "Completa tu perfil para ver tu plan",
        completeProfileCopy: "FITNEO necesita tus objetivos, nivel y datos base antes de generar tu panel Mi Plan.",
        loadFailed: "No se pudo cargar el panel.",
        dataUnavailable: "Los datos del panel no estan disponibles.",
        myPlan: "MI PLAN",
        planCopy: "Tu plan activo se calibra con el onboarding y tu programacion mas reciente de FITNEO AI.",
        startActivePlan: "Iniciar plan activo",
        todaysWorkout: "ENTRENO DE HOY",
        quickStart: "Inicio rapido",
        calToday: "Cal hoy",
        thisWeek: "Esta semana",
        activeMin: "Min activos",
        streak: "Racha",
        caloriesBurnedToday: "Calorias quemadas hoy",
        activeMinutes: "Minutos activos",
        minutesToday: "{{count}} minutos hoy",
        dayStreak: "Racha de {{count}} dias",
        goals: "OBJETIVOS",
        weeklyWorkouts: "Entrenos semanales",
        caloriesBurned: "Calorias quemadas",
        caloriesEaten: "Calorias comidas",
        waterIntake: "Agua tomada",
        cups: "vasos",
        litersLogged: "{{liters}} L registrados hoy",
        aiInsight: "Consejo de FITNEO AI",
        insightWorkoutGap: "Te queda {{remaining}} entreno para tu objetivo semanal. Mantente constante.",
        insightHydration: "La hidratacion es la victoria facil. Agrega {{remaining}} vaso mas hoy.",
        insightRecovery: "Hoy superaste tu objetivo de calorias. Haz la proxima comida mas ligera y prioriza recuperacion.",
        insightStreak: "Tu racha de {{count}} dias sigue viva. Protegela con una sesion enfocada.",
        insightStartStreak: "Empieza tu primer entrenamiento hoy para iniciar tu racha.",
        insightWeeklyTarget: "Cumpliste tu objetivo semanal. Considera una sesion de recuperacion activa hoy.",
        insightLowBurn: "No has registrado muchas calorias quemadas hoy. Una sesion corta puede mantener tu impulso.",
        insightCalorieTarget: "Estas por encima de tu objetivo de calorias. Una cena alta en proteina puede equilibrar tus macros.",
        insightDefault: "Estas ganando impulso. Mantente constante y confia en el proceso.",
        recentActivity: "ACTIVIDAD RECIENTE",
        noWorkoutsYet: "Aun no hay entrenos - inicia tu primera sesion para verla aqui."
      },
      common: {
        cancel: "Cancelar"
      },
      leaderboard: {
        loadFailed: "No se pudo cargar la clasificacion.",
        title: "Clasificacion",
        thisWeekCompetition: "COMPETENCIA DE ESTA SEMANA",
        resetsMonday: "Reinicia el lunes",
        youAreRank: "Estas en el puesto #{{rank}}",
        amongAthletes: "entre {{count}} atletas activos",
        xp: "XP",
        streak: "Racha",
        thisWeek: "Esta semana",
        noRankings: "Aun no hay clasificacion.",
        completeWorkout: "Completa un entrenamiento para entrar.",
        you: "Tu",
        level: "Nivel {{level}}",
        xpValue: "{{count}} XP",
        daysValue: "{{count}} dias",
        workoutsValue: "{{count}} entrenos"
      },
      nutrition: {
        addFailed: "No se pudo agregar este alimento.",
        addedFood: "{{food}} agregado a {{meal}}.",
        loadFailed: "No se pudo cargar nutricion.",
        loading: "Cargando nutricion...",
        unavailable: "Los datos de nutricion no estan disponibles.",
        title: "Nutricion",
        macros: "Macros",
        kcalRemaining: "kcal restantes",
        protein: "Proteina",
        carbs: "Carbohidratos",
        fat: "Grasa",
        scanMeal: "Escanear comida",
        scanSubtitle: "La IA identifica tu comida y estima calorias y macros al instante.",
        meals: {
          Breakfast: "Desayuno",
          Lunch: "Almuerzo",
          Dinner: "Cena",
          Snacks: "Snacks"
        },
        addFood: "Agregar alimento",
        scan: "Escanear",
        scanQuestion: "Que quieres escanear?",
        scanMealCamera: "Camara de comida IA",
        scanCameraCopy: "Captura un plato y estima calorias/macros.",
        scanBarcode: "Escaner de codigo",
        scanBarcodeCopy: "Escanea alimentos empaquetados rapido.",
        addToMeal: "Agregar a {{meal}}",
        commonFoods: "Alimentos comunes",
        searchPlaceholder: "Buscar alimentos...",
        noFoodsFound: "No se encontraron alimentos",
        tryScanner: "Probar escaner IA",
        loadMore: "Cargar mas"
      },
      profileScreen: {
        loadFailed: "No se pudo cargar el perfil.",
        exportFailed: "Exportacion fallida",
        exportFailedCopy: "No se pudo preparar tu exportacion ahora.",
        photoPermission: "Permiso de fotos necesario",
        photoPermissionCopy: "Permite acceso a fotos para elegir una imagen de perfil.",
        resetFailed: "Reinicio fallido",
        resetFailedCopy: "No se pudieron borrar los datos. Intentalo de nuevo.",
        notifications: "Notificaciones",
        notificationFailed: "No se pudieron configurar notificaciones",
        loading: "Cargando perfil...",
        unavailable: "Los datos de perfil no estan disponibles.",
        resetConfirmTitle: "Borrar todos los datos?",
        resetConfirmCopy: "Esto borra tus datos locales de FITNEO en este dispositivo.",
        reset: "Borrar",
        trialDaysLeft: "{{count}} dias restantes de prueba gratis",
        manageElite: "Gestiona tu suscripcion Elite",
        managePro: "Gestiona tu suscripcion Pro",
        upgradeToPro: "Mejora a Pro — desbloquea todo",
        managePlan: "Gestionar plan",
        badges: "INSIGNIAS",
        leaderboard: "Clasificacion",
        leaderboardSubtitle: "Compara XP, rachas y trabajo semanal",
        tellUs: "Dinos que mejorar",
        tellUsSubtitle: "Envia comentarios para mejorar FITNEO",
        workoutReminders: "Recordatorios de entrenamiento",
        streakAlerts: "Alertas de racha",
        aiCheckIn: "Check-in diario de FITNEO AI",
        preparingExport: "Preparando exportacion",
        exportData: "Exportar datos",
        exportSubtitle: "Descarga tus datos como JSON",
        resetAllData: "Borrar todos los datos",
        signOut: "Cerrar sesion"
      },
      progress: {
        loadFailed: "No se pudo cargar el progreso.",
        loading: "Cargando progreso en vivo...",
        unavailable: "Los datos de progreso no estan disponibles.",
        title: "Progreso",
        subtitle: "Tus datos, decodificados",
        dayStreak: "Racha de {{count}} dias",
        longest: "Mayor: {{count}} dias",
        consistency: "constancia",
        workoutsPerWeek: "ENTRENOS / SEMANA",
        totalWorkouts: "Entrenos totales",
        totalSets: "Series totales",
        caloriesBurned: "Calorias quemadas",
        totalXp: "XP total",
        bodyMetrics: "METRICAS CORPORALES",
        bmiTracked: "BMI registrado",
        bmiGuidance: "Agrega altura y peso en onboarding/perfil para calcular BMI",
        weeksApprox: "~{{count}} semanas",
        goalPace: "ritmo estimado",
        favoriteMuscleGroups: "GRUPOS MUSCULARES FAVORITOS",
        emptyMuscles: "Completa entrenamientos para crear tu division real.",
        thisWeek: "Esta semana",
        lastWeek: "Semana pasada",
        weeksAgo: "hace {{count}} sem"
      },
      onboarding: {
        step: {
          aboutYou: "SOBRE TI",
          goals: "OBJETIVOS",
          equipment: "EQUIPO",
          schedule: "HORARIO",
          style: "ESTILO DE ENTRENO",
          recovery: "RECUPERACION",
          health: "SALUD",
          nutrition: "NUTRICION Y COACH",
          editProfile: "EDITAR PERFIL"
        },
        title: {
          identity: "Cuentanos sobre ti",
          goal: "Que quieres lograr?",
          equipment: "A que tienes acceso?",
          schedule: "Con que frecuencia entrenaras?",
          style: "Que tipo de entrenamiento prefieres?",
          recovery: "Que tan activo y recuperado estas?",
          health: "Tienes lesiones o limitaciones?",
          calibration: "Calibracion final"
        },
        continue: "Continuar",
        finish: "Finalizar",
        skip: "Saltar",
        error: {
          incomplete: "Completa este paso para continuar."
        },
        calibration: {
          kicker: "CALIBRACION FITNEO AI",
          title: "Creando tu plan personal",
          step1: "Leyendo respuestas de onboarding",
          step2: "Seleccionando estilo de entrenamiento",
          step3: "Calibrando calorias y macros",
          step4: "Preparando tu plan"
        }
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
      dashboard: {
        goodMorning: "Bonjour",
        goodAfternoon: "Bon apres-midi",
        goodEvening: "Bonsoir",
        completeProfileTitle: "Completez votre profil pour voir votre plan",
        completeProfileCopy: "FITNEO a besoin de vos objectifs, de votre niveau et de vos mesures de base avant de generer votre tableau Mon Plan.",
        loadFailed: "Impossible de charger le tableau de bord.",
        dataUnavailable: "Les donnees du tableau de bord sont indisponibles.",
        myPlan: "MON PLAN",
        planCopy: "Votre plan actif est calibre avec l'onboarding et votre derniere programmation FITNEO AI.",
        startActivePlan: "Demarrer le plan",
        todaysWorkout: "SEANCE DU JOUR",
        quickStart: "Demarrage rapide",
        calToday: "Cal aujourd'hui",
        thisWeek: "Cette semaine",
        activeMin: "Min actives",
        streak: "Serie",
        caloriesBurnedToday: "Calories brulees aujourd'hui",
        activeMinutes: "Minutes actives",
        minutesToday: "{{count}} minutes aujourd'hui",
        dayStreak: "Serie de {{count}} jours",
        goals: "OBJECTIFS",
        weeklyWorkouts: "Seances hebdo",
        caloriesBurned: "Calories brulees",
        caloriesEaten: "Calories mangees",
        waterIntake: "Hydratation",
        cups: "verres",
        litersLogged: "{{liters}} L enregistres aujourd'hui",
        aiInsight: "Conseil FITNEO AI",
        insightWorkoutGap: "Il vous reste {{remaining}} seance pour votre objectif hebdomadaire. Restez regulier.",
        insightHydration: "L'hydratation est la victoire facile. Ajoutez {{remaining}} verre aujourd'hui.",
        insightRecovery: "Vous etes au-dessus de l'objectif calorique aujourd'hui. Gardez le prochain repas plus leger.",
        insightStreak: "Votre serie de {{count}} jours continue. Protegez-la avec une seance concentree.",
        insightStartStreak: "Commencez votre premier entrainement aujourd'hui pour lancer votre serie.",
        insightWeeklyTarget: "Vous avez atteint votre objectif hebdomadaire. Pensez a une seance de recuperation active aujourd'hui.",
        insightLowBurn: "Vous avez peu de calories brulees aujourd'hui. Une courte seance peut garder votre elan.",
        insightCalorieTarget: "Vous depassez votre objectif calorique. Un diner riche en proteines peut equilibrer vos macros.",
        insightDefault: "Vous prenez de l'elan. Restez regulier et faites confiance au processus.",
        recentActivity: "ACTIVITE RECENTE",
        noWorkoutsYet: "Aucune seance pour le moment - lancez votre premiere session pour la voir ici."
      },
      common: {
        cancel: "Annuler"
      },
      leaderboard: {
        loadFailed: "Impossible de charger le classement.",
        title: "Classement",
        thisWeekCompetition: "COMPETITION DE LA SEMAINE",
        resetsMonday: "Reinitialise lundi",
        youAreRank: "Vous etes rang #{{rank}}",
        amongAthletes: "parmi {{count}} athletes actifs",
        xp: "XP",
        streak: "Serie",
        thisWeek: "Cette semaine",
        noRankings: "Aucun classement pour le moment.",
        completeWorkout: "Terminez une seance pour entrer au classement.",
        you: "Vous",
        level: "Niveau {{level}}",
        xpValue: "{{count}} XP",
        daysValue: "{{count}} jours",
        workoutsValue: "{{count}} seances"
      },
      nutrition: {
        addFailed: "Impossible d'ajouter cet aliment.",
        addedFood: "{{food}} ajoute a {{meal}}.",
        loadFailed: "Impossible de charger la nutrition.",
        loading: "Chargement de la nutrition...",
        unavailable: "Les donnees nutrition sont indisponibles.",
        title: "Nutrition",
        macros: "Macros",
        kcalRemaining: "kcal restantes",
        protein: "Proteines",
        carbs: "Glucides",
        fat: "Lipides",
        scanMeal: "Scanner un repas",
        scanSubtitle: "L'IA identifie votre repas et estime calories et macros instantanement.",
        meals: {
          Breakfast: "Petit-dejeuner",
          Lunch: "Dejeuner",
          Dinner: "Diner",
          Snacks: "Snacks"
        },
        addFood: "Ajouter un aliment",
        scan: "Scanner",
        scanQuestion: "Que voulez-vous scanner ?",
        scanMealCamera: "Camera repas IA",
        scanCameraCopy: "Capturez une assiette et estimez calories/macros.",
        scanBarcode: "Scanner code-barres",
        scanBarcodeCopy: "Scannez rapidement les aliments emballes.",
        addToMeal: "Ajouter a {{meal}}",
        commonFoods: "Aliments courants",
        searchPlaceholder: "Rechercher des aliments...",
        noFoodsFound: "Aucun aliment trouve",
        tryScanner: "Essayer le scanner IA",
        loadMore: "Charger plus"
      },
      profileScreen: {
        loadFailed: "Impossible de charger le profil.",
        exportFailed: "Export echoue",
        exportFailedCopy: "Impossible de preparer l'export maintenant.",
        photoPermission: "Permission photos requise",
        photoPermissionCopy: "Autorisez l'acces aux photos pour choisir une image de profil.",
        resetFailed: "Reinitialisation echouee",
        resetFailedCopy: "Impossible de reinitialiser les donnees. Reessayez.",
        notifications: "Notifications",
        notificationFailed: "Configuration des notifications echouee",
        loading: "Chargement du profil...",
        unavailable: "Les donnees de profil sont indisponibles.",
        resetConfirmTitle: "Reinitialiser toutes les donnees ?",
        resetConfirmCopy: "Cela efface les donnees locales FITNEO sur cet appareil.",
        reset: "Reinitialiser",
        trialDaysLeft: "{{count}} jours restants dans votre essai gratuit",
        manageElite: "Gerer votre abonnement Elite",
        managePro: "Gerer votre abonnement Pro",
        upgradeToPro: "Passez a Pro — debloquez tout",
        managePlan: "Gerer le plan",
        badges: "BADGES",
        leaderboard: "Classement",
        leaderboardSubtitle: "Comparez XP, series et travail hebdo",
        tellUs: "Dites-nous quoi ameliorer",
        tellUsSubtitle: "Envoyez un avis pour faconner FITNEO",
        workoutReminders: "Rappels d'entrainement",
        streakAlerts: "Alertes de serie",
        aiCheckIn: "Check-in quotidien FITNEO AI",
        preparingExport: "Preparation de l'export",
        exportData: "Exporter les donnees",
        exportSubtitle: "Telecharger vos donnees en JSON",
        resetAllData: "Tout reinitialiser",
        signOut: "Se deconnecter"
      },
      progress: {
        loadFailed: "Impossible de charger les progres.",
        loading: "Chargement des progres...",
        unavailable: "Les donnees de progres sont indisponibles.",
        title: "Progres",
        subtitle: "Vos donnees, decodees",
        dayStreak: "Serie de {{count}} jours",
        longest: "Record : {{count}} jours",
        consistency: "regularite",
        workoutsPerWeek: "SEANCES / SEMAINE",
        totalWorkouts: "Seances totales",
        totalSets: "Series totales",
        caloriesBurned: "Calories brulees",
        totalXp: "XP total",
        bodyMetrics: "MESURES CORPORELLES",
        bmiTracked: "BMI suivi",
        bmiGuidance: "Ajoutez taille et poids dans onboarding/profil pour calculer le BMI",
        weeksApprox: "~{{count}} semaines",
        goalPace: "rythme estime",
        favoriteMuscleGroups: "GROUPES MUSCULAIRES FAVORIS",
        emptyMuscles: "Terminez des seances pour construire votre repartition.",
        thisWeek: "Cette semaine",
        lastWeek: "Semaine derniere",
        weeksAgo: "il y a {{count}} sem"
      },
      onboarding: {
        step: {
          aboutYou: "A PROPOS DE VOUS",
          goals: "OBJECTIFS",
          equipment: "EQUIPEMENT",
          schedule: "PLANNING",
          style: "STYLE D'ENTRAINEMENT",
          recovery: "RECUPERATION",
          health: "SANTE",
          nutrition: "NUTRITION & COACH",
          editProfile: "MODIFIER LE PROFIL"
        },
        title: {
          identity: "Parlez-nous de vous",
          goal: "Que voulez-vous atteindre ?",
          equipment: "A quoi avez-vous acces ?",
          schedule: "A quelle frequence allez-vous vous entrainer ?",
          style: "Quel type d'entrainement preferez-vous ?",
          recovery: "Quel est votre niveau d'activite et de recuperation ?",
          health: "Des blessures ou limitations ?",
          calibration: "Calibration finale"
        },
        continue: "Continuer",
        finish: "Terminer",
        skip: "Ignorer",
        error: {
          incomplete: "Completez cette etape pour continuer."
        },
        calibration: {
          kicker: "CALIBRATION FITNEO AI",
          title: "Creation de votre plan personnel",
          step1: "Lecture des reponses d'onboarding",
          step2: "Selection du style d'entrainement",
          step3: "Calibration calories et macros",
          step4: "Preparation de votre plan"
        }
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

const englishFallbackLanguages = [
  "de",
  "pt",
  "it",
  "nl",
  "pl",
  "tr",
  "ar",
  "hi",
  "id",
  "ms",
  "yo",
  "ha",
  "ig",
  "sw",
  "zh",
  "ja",
  "ko",
  "ru"
] as const;

type TranslationValue = string | TranslationTree;
type TranslationTree = { [key: string]: TranslationValue };

function mergeTranslations(base: TranslationTree, override: TranslationTree): TranslationTree {
  const merged: TranslationTree = { ...base };
  Object.entries(override).forEach(([key, value]) => {
    const baseValue = merged[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      baseValue &&
      typeof baseValue === "object" &&
      !Array.isArray(baseValue)
    ) {
      merged[key] = mergeTranslations(baseValue as TranslationTree, value as TranslationTree);
    } else {
      merged[key] = value;
    }
  });
  return merged;
}

function makeLocalizedResource(override: TranslationTree) {
  return {
    translation: mergeTranslations(resources.en.translation as unknown as TranslationTree, override)
  };
}

const localizedResources: Record<(typeof englishFallbackLanguages)[number], ReturnType<typeof makeLocalizedResource>> = {
  de: makeLocalizedResource({
    nav: { home: "Start", workouts: "Workouts", nutrition: "Ernaehrung", progress: "Fortschritt", profile: "Profil" },
    dashboard: { goodMorning: "Guten Morgen", goodAfternoon: "Guten Tag", goodEvening: "Guten Abend", myPlan: "MEIN PLAN", startActivePlan: "Aktiven Plan starten", todaysWorkout: "HEUTIGES WORKOUT", quickStart: "Schnellstart", calToday: "Kal heute", thisWeek: "Diese Woche", activeMin: "Aktive Min", streak: "Serie", goals: "ZIELE", weeklyWorkouts: "Workouts pro Woche", caloriesBurned: "Kalorien verbrannt", caloriesEaten: "Kalorien gegessen", waterIntake: "Wasseraufnahme", aiInsight: "FITNEO AI Hinweis", recentActivity: "LETZTE AKTIVITAET", noWorkoutsYet: "Noch keine Workouts - starte deine erste Einheit." },
    common: { cancel: "Abbrechen" },
    profileScreen: { loading: "Profil wird geladen...", notifications: "Benachrichtigungen", badges: "ABZEICHEN", leaderboard: "Bestenliste", tellUs: "Sag uns, was wir verbessern sollen", exportData: "Daten exportieren", resetAllData: "Alle Daten zuruecksetzen", signOut: "Abmelden", workoutReminders: "Workout-Erinnerungen", streakAlerts: "Serien-Alarme", aiCheckIn: "FITNEO AI Tagescheck", upgradeToPro: "Auf Pro upgraden - alles freischalten" },
    progress: { title: "Fortschritt", subtitle: "Deine Daten, entschluesselt", workoutsPerWeek: "WORKOUTS / WOCHE", totalWorkouts: "Workouts gesamt", totalSets: "Saetze gesamt", caloriesBurned: "Kalorien verbrannt", totalXp: "XP gesamt", bodyMetrics: "KOERPERWERTE", favoriteMuscleGroups: "LIEBLINGS-MUSKELGRUPPEN" },
    onboarding: { step: { aboutYou: "UEBER DICH", goals: "ZIELE", equipment: "AUSRUESTUNG", schedule: "PLAN", style: "TRAININGSSTIL", recovery: "ERHOLUNG", health: "GESUNDHEIT", nutrition: "ERNAEHRUNG & COACH", editProfile: "PROFIL BEARBEITEN" }, title: { identity: "Erzaehl uns von dir", goal: "Was willst du erreichen?", equipment: "Worauf hast du Zugriff?", schedule: "Wie oft trainierst du?", style: "Welche Art Training magst du?", recovery: "Wie aktiv und erholt bist du?", health: "Verletzungen oder Einschraenkungen?", calibration: "Letzte Kalibrierung" }, continue: "Weiter", finish: "Fertig", skip: "Ueberspringen", error: { incomplete: "Schliesse diesen Schritt ab." }, calibration: { kicker: "FITNEO AI KALIBRIERUNG", title: "Dein persoenlicher Plan wird erstellt", step1: "Antworten lesen", step2: "Trainingsstil waehlen", step3: "Kalorien und Makros kalibrieren", step4: "Plan vorbereiten" } },
    profile: { language: "Sprache", legal: "Rechtliches", legalSubtitle: "Richtlinien, Bedingungen, Erstattungen und Details" },
    language: { change: "Sprache aendern" },
    legal: { privacy: "Datenschutz", terms: "Nutzungsbedingungen", refund: "Erstattungsrichtlinie", imprint: "Impressum", support: "Support", updated: "Aktualisiert: 9. Juli 2026", privacyBody: "FITNEO nutzt Konto-, Trainings-, Ernaehrungs- und App-Daten, um ein persoenliches Fitness-Erlebnis bereitzustellen.", termsBody: "FITNEO bietet Fitness- und Ernaehrungsinformationen zu Bildungszwecken. Konsultiere vor neuen Programmen medizinisches Fachpersonal.", refundBody: "Erstattungen werden ueber die Plattform oder den Zahlungsanbieter abgewickelt.", imprintBody: "FITNEO ist ein digitales Fitnessprodukt. Fuer rechtliche oder geschaeftliche Fragen kontaktiere den Support.", supportBody: "Brauchst du Hilfe? Sende deine Konto-E-Mail, dein Geraet und eine kurze Beschreibung an den FITNEO Support." }
  }),
  pt: makeLocalizedResource({
    nav: { home: "Inicio", workouts: "Treinos", nutrition: "Nutricao", progress: "Progresso", profile: "Perfil" },
    dashboard: { goodMorning: "Bom dia", goodAfternoon: "Boa tarde", goodEvening: "Boa noite", myPlan: "MEU PLANO", startActivePlan: "Iniciar plano", todaysWorkout: "TREINO DE HOJE", quickStart: "Inicio rapido", calToday: "Cal hoje", thisWeek: "Esta semana", activeMin: "Min ativos", streak: "Sequencia", goals: "METAS", weeklyWorkouts: "Treinos semanais", caloriesBurned: "Calorias queimadas", caloriesEaten: "Calorias ingeridas", waterIntake: "Agua", aiInsight: "Insight FITNEO AI", recentActivity: "ATIVIDADE RECENTE", noWorkoutsYet: "Ainda sem treinos - comece sua primeira sessao." },
    common: { cancel: "Cancelar" },
    profileScreen: { loading: "Carregando perfil...", notifications: "Notificacoes", badges: "MEDALHAS", leaderboard: "Ranking", tellUs: "Diga o que melhorar", exportData: "Exportar dados", resetAllData: "Redefinir tudo", signOut: "Sair", workoutReminders: "Lembretes de treino", streakAlerts: "Alertas de sequencia", aiCheckIn: "Check-in diario FITNEO AI", upgradeToPro: "Atualizar para Pro - desbloquear tudo" },
    progress: { title: "Progresso", subtitle: "Seus dados decodificados", workoutsPerWeek: "TREINOS / SEMANA", totalWorkouts: "Treinos totais", totalSets: "Series totais", caloriesBurned: "Calorias queimadas", totalXp: "XP total", bodyMetrics: "MEDIDAS CORPORAIS", favoriteMuscleGroups: "MUSCULOS FAVORITOS" },
    onboarding: { step: { aboutYou: "SOBRE VOCE", goals: "METAS", equipment: "EQUIPAMENTO", schedule: "ROTINA", style: "ESTILO", recovery: "RECUPERACAO", health: "SAUDE", nutrition: "NUTRICAO & COACH", editProfile: "EDITAR PERFIL" }, title: { identity: "Conte-nos sobre voce", goal: "O que deseja alcancar?", equipment: "A que voce tem acesso?", schedule: "Com que frequencia vai treinar?", style: "Que treino voce prefere?", recovery: "Quao ativo e recuperado voce esta?", health: "Lesoes ou limitacoes?", calibration: "Calibracao final" }, continue: "Continuar", finish: "Finalizar", skip: "Pular", error: { incomplete: "Conclua esta etapa para continuar." }, calibration: { kicker: "CALIBRACAO FITNEO AI", title: "Criando seu plano pessoal", step1: "Lendo respostas", step2: "Selecionando estilo", step3: "Calibrando calorias e macros", step4: "Preparando plano" } },
    profile: { language: "Idioma", legal: "Legal", legalSubtitle: "Politicas, termos, reembolsos e detalhes" },
    language: { change: "Alterar idioma" },
    legal: { privacy: "Politica de Privacidade", terms: "Termos de Servico", refund: "Politica de Reembolso", imprint: "Informacoes legais", support: "Suporte", updated: "Atualizado: 9 de julho de 2026", privacyBody: "FITNEO usa dados de conta, treino, nutricao e atividade para personalizar sua experiencia.", termsBody: "FITNEO fornece informacoes de fitness e nutricao para fins educacionais. Consulte um medico antes de iniciar programas.", refundBody: "Reembolsos sao tratados pela plataforma ou provedor de pagamento.", imprintBody: "FITNEO e um produto digital de fitness. Para assuntos legais ou comerciais, contate o suporte.", supportBody: "Precisa de ajuda? Envie seu e-mail, dispositivo e uma breve descricao ao suporte FITNEO." }
  }),
  it: makeLocalizedResource({
    nav: { home: "Home", workouts: "Allenamenti", nutrition: "Nutrizione", progress: "Progressi", profile: "Profilo" },
    dashboard: { goodMorning: "Buongiorno", goodAfternoon: "Buon pomeriggio", goodEvening: "Buonasera", myPlan: "IL MIO PIANO", startActivePlan: "Avvia piano", todaysWorkout: "ALLENAMENTO DI OGGI", quickStart: "Avvio rapido", calToday: "Cal oggi", thisWeek: "Questa settimana", activeMin: "Min attivi", streak: "Serie", goals: "OBIETTIVI", weeklyWorkouts: "Allenamenti settimanali", caloriesBurned: "Calorie bruciate", caloriesEaten: "Calorie assunte", waterIntake: "Acqua", aiInsight: "Suggerimento FITNEO AI", recentActivity: "ATTIVITA RECENTE", noWorkoutsYet: "Nessun allenamento - inizia la prima sessione." },
    common: { cancel: "Annulla" },
    profileScreen: { loading: "Caricamento profilo...", notifications: "Notifiche", badges: "BADGE", leaderboard: "Classifica", tellUs: "Dicci cosa migliorare", exportData: "Esporta dati", resetAllData: "Reimposta tutto", signOut: "Esci", workoutReminders: "Promemoria allenamento", streakAlerts: "Avvisi serie", aiCheckIn: "Check-in giornaliero FITNEO AI", upgradeToPro: "Passa a Pro - sblocca tutto" },
    progress: { title: "Progressi", subtitle: "I tuoi dati decodificati", workoutsPerWeek: "ALLENAMENTI / SETTIMANA", totalWorkouts: "Allenamenti totali", totalSets: "Serie totali", caloriesBurned: "Calorie bruciate", totalXp: "XP totali", bodyMetrics: "MISURE CORPOREE", favoriteMuscleGroups: "GRUPPI MUSCOLARI PREFERITI" },
    onboarding: { step: { aboutYou: "SU DI TE", goals: "OBIETTIVI", equipment: "ATTREZZI", schedule: "PROGRAMMA", style: "STILE", recovery: "RECUPERO", health: "SALUTE", nutrition: "NUTRIZIONE & COACH", editProfile: "MODIFICA PROFILO" }, title: { identity: "Parlaci di te", goal: "Cosa vuoi raggiungere?", equipment: "A cosa hai accesso?", schedule: "Quanto spesso ti allenerai?", style: "Che allenamento preferisci?", recovery: "Quanto sei attivo e recuperato?", health: "Infortuni o limitazioni?", calibration: "Calibrazione finale" }, continue: "Continua", finish: "Fine", skip: "Salta", error: { incomplete: "Completa questo passo." }, calibration: { kicker: "CALIBRAZIONE FITNEO AI", title: "Creazione del tuo piano", step1: "Lettura risposte", step2: "Scelta stile", step3: "Calibrazione calorie e macro", step4: "Preparazione piano" } },
    profile: { language: "Lingua", legal: "Legale", legalSubtitle: "Policy, termini, rimborsi e dettagli" },
    language: { change: "Cambia lingua" },
    legal: { privacy: "Privacy", terms: "Termini di Servizio", refund: "Rimborsi", imprint: "Note legali", support: "Supporto", updated: "Aggiornato: 9 luglio 2026", privacyBody: "FITNEO usa dati di account, allenamento, nutrizione e attivita per personalizzare l'esperienza.", termsBody: "FITNEO offre informazioni fitness e nutrizionali a scopo educativo. Consulta un medico prima di iniziare.", refundBody: "I rimborsi sono gestiti dalla piattaforma o dal provider di pagamento.", imprintBody: "FITNEO e un prodotto fitness digitale. Per richieste legali o commerciali contatta il supporto.", supportBody: "Serve aiuto? Invia email account, dispositivo e descrizione al supporto FITNEO." }
  }),
  nl: makeLocalizedResource({
    nav: { home: "Home", workouts: "Trainingen", nutrition: "Voeding", progress: "Voortgang", profile: "Profiel" },
    dashboard: { goodMorning: "Goedemorgen", goodAfternoon: "Goedemiddag", goodEvening: "Goedenavond", myPlan: "MIJN PLAN", startActivePlan: "Start plan", todaysWorkout: "TRAINING VANDAAG", quickStart: "Snel starten", calToday: "Cal vandaag", thisWeek: "Deze week", activeMin: "Actieve min", streak: "Reeks", goals: "DOELEN", weeklyWorkouts: "Weektrainingen", caloriesBurned: "Calorieen verbrand", caloriesEaten: "Calorieen gegeten", waterIntake: "Waterinname", aiInsight: "FITNEO AI inzicht", recentActivity: "RECENTE ACTIVITEIT", noWorkoutsYet: "Nog geen trainingen - start je eerste sessie." },
    common: { cancel: "Annuleren" },
    profileScreen: { loading: "Profiel laden...", notifications: "Meldingen", badges: "BADGES", leaderboard: "Ranglijst", tellUs: "Vertel wat beter kan", exportData: "Data exporteren", resetAllData: "Alles resetten", signOut: "Uitloggen", workoutReminders: "Trainingsherinneringen", streakAlerts: "Reekswaarschuwingen", aiCheckIn: "FITNEO AI dagelijkse check-in", upgradeToPro: "Upgrade naar Pro - alles ontgrendelen" },
    progress: { title: "Voortgang", subtitle: "Je data helder gemaakt", workoutsPerWeek: "TRAININGEN / WEEK", totalWorkouts: "Totaal trainingen", totalSets: "Totaal sets", caloriesBurned: "Calorieen verbrand", totalXp: "Totaal XP", bodyMetrics: "LICHAAMSMATEN", favoriteMuscleGroups: "FAVORIETE SPIERGROEPEN" },
    onboarding: { continue: "Doorgaan", finish: "Voltooien", skip: "Overslaan", error: { incomplete: "Rond deze stap af." } },
    profile: { language: "Taal", legal: "Juridisch", legalSubtitle: "Beleid, voorwaarden, terugbetalingen en details" },
    language: { change: "Taal wijzigen" },
    legal: { privacy: "Privacybeleid", terms: "Servicevoorwaarden", refund: "Terugbetalingsbeleid", imprint: "Impressum", support: "Support", updated: "Bijgewerkt: 9 juli 2026", privacyBody: "FITNEO gebruikt account-, trainings-, voedings- en appgegevens om je ervaring te personaliseren.", termsBody: "FITNEO geeft fitness- en voedingsinformatie voor educatieve doeleinden. Raadpleeg een arts voor je begint.", refundBody: "Terugbetalingen worden afgehandeld door het platform of de betaalprovider.", imprintBody: "FITNEO is een digitaal fitnessproduct. Neem contact op met support voor juridische of zakelijke vragen.", supportBody: "Hulp nodig? Stuur je accountmail, apparaat en korte beschrijving naar FITNEO support." }
  }),
  pl: makeLocalizedResource({
    nav: { home: "Start", workouts: "Treningi", nutrition: "Dieta", progress: "Postepy", profile: "Profil" },
    dashboard: { goodMorning: "Dzien dobry", goodAfternoon: "Milego popoludnia", goodEvening: "Dobry wieczor", myPlan: "MOJ PLAN", startActivePlan: "Uruchom plan", todaysWorkout: "DZISIEJSZY TRENING", quickStart: "Szybki start", calToday: "Kal dzis", thisWeek: "Ten tydzien", activeMin: "Min aktywne", streak: "Seria", goals: "CELE", weeklyWorkouts: "Treningi tygodniowo", caloriesBurned: "Spalone kalorie", caloriesEaten: "Zjedzone kalorie", waterIntake: "Woda", aiInsight: "Wskazowka FITNEO AI", recentActivity: "OSTATNIA AKTYWNOSC", noWorkoutsYet: "Brak treningow - zacznij pierwsza sesje." },
    common: { cancel: "Anuluj" },
    profileScreen: { loading: "Ladowanie profilu...", notifications: "Powiadomienia", badges: "ODZNAKI", leaderboard: "Ranking", tellUs: "Powiedz, co poprawic", exportData: "Eksport danych", resetAllData: "Resetuj dane", signOut: "Wyloguj", workoutReminders: "Przypomnienia treningowe", streakAlerts: "Alerty serii", aiCheckIn: "Codzienny check-in FITNEO AI", upgradeToPro: "Przejdz na Pro - odblokuj wszystko" },
    progress: { title: "Postepy", subtitle: "Twoje dane w praktyce", workoutsPerWeek: "TRENINGI / TYDZIEN", totalWorkouts: "Treningi razem", totalSets: "Serie razem", caloriesBurned: "Spalone kalorie", totalXp: "XP razem", bodyMetrics: "PARAMETRY CIALA", favoriteMuscleGroups: "ULUBIONE PARTIE" },
    onboarding: { continue: "Dalej", finish: "Zakoncz", skip: "Pomin", error: { incomplete: "Ukoncz ten krok." } },
    profile: { language: "Jezyk", legal: "Informacje prawne", legalSubtitle: "Polityki, warunki, zwroty i dane" },
    language: { change: "Zmien jezyk" },
    legal: { privacy: "Prywatnosc", terms: "Warunki korzystania", refund: "Zwroty", imprint: "Dane prawne", support: "Wsparcie", updated: "Aktualizacja: 9 lipca 2026", privacyBody: "FITNEO uzywa danych konta, treningu, diety i aktywnosci, aby personalizowac aplikacje.", termsBody: "FITNEO dostarcza informacje fitness i dietetyczne edukacyjnie. Skonsultuj sie z lekarzem przed startem.", refundBody: "Zwroty obsluguje platforma lub dostawca platnosci.", imprintBody: "FITNEO to cyfrowy produkt fitness. W sprawach prawnych lub biznesowych skontaktuj sie ze wsparciem.", supportBody: "Potrzebujesz pomocy? Wyslij e-mail konta, urzadzenie i krotki opis do wsparcia FITNEO." }
  }),
  tr: makeLocalizedResource({
    nav: { home: "Ana sayfa", workouts: "Antrenman", nutrition: "Beslenme", progress: "Ilerleme", profile: "Profil" },
    dashboard: { goodMorning: "Gunaydin", goodAfternoon: "Iyi gunler", goodEvening: "Iyi aksamlar", myPlan: "PLANIM", startActivePlan: "Plani baslat", todaysWorkout: "BUGUNUN ANTRENMANI", quickStart: "Hizli baslat", calToday: "Bugun kal", thisWeek: "Bu hafta", activeMin: "Aktif dk", streak: "Seri", goals: "HEDEFLER", weeklyWorkouts: "Haftalik antrenman", caloriesBurned: "Yakilan kalori", caloriesEaten: "Alinan kalori", waterIntake: "Su takibi", aiInsight: "FITNEO AI oneri", recentActivity: "SON AKTIVITE", noWorkoutsYet: "Henuz antrenman yok - ilk seansini baslat." },
    common: { cancel: "Iptal" },
    profileScreen: { loading: "Profil yukleniyor...", notifications: "Bildirimler", badges: "ROZETLER", leaderboard: "Liderlik", tellUs: "Neyi gelistirelim?", exportData: "Verileri disa aktar", resetAllData: "Tum verileri sifirla", signOut: "Cikis yap", workoutReminders: "Antrenman hatirlaticilari", streakAlerts: "Seri uyarilari", aiCheckIn: "FITNEO AI gunluk kontrol", upgradeToPro: "Pro'ya gec - her seyi ac" },
    progress: { title: "Ilerleme", subtitle: "Verilerin cozuldu", workoutsPerWeek: "ANTRENMAN / HAFTA", totalWorkouts: "Toplam antrenman", totalSets: "Toplam set", caloriesBurned: "Yakilan kalori", totalXp: "Toplam XP", bodyMetrics: "VUCUT OLCUMLERI", favoriteMuscleGroups: "FAVORI KAS GRUPLARI" },
    onboarding: { continue: "Devam", finish: "Bitir", skip: "Atla", error: { incomplete: "Bu adimi tamamla." } },
    profile: { language: "Dil", legal: "Yasal", legalSubtitle: "Politikalar, sartlar, iadeler ve ayrintilar" },
    language: { change: "Dili degistir" },
    legal: { privacy: "Gizlilik Politikasi", terms: "Hizmet Sartlari", refund: "Iade Politikasi", imprint: "Yasal Bilgi", support: "Destek", updated: "Guncelleme: 9 Temmuz 2026", privacyBody: "FITNEO hesap, antrenman, beslenme ve uygulama verilerini deneyimini kisisellestirmek icin kullanir.", termsBody: "FITNEO fitness ve beslenme bilgisini egitim amacli sunar. Baslamadan once doktora danisin.", refundBody: "Iadeler platform veya odeme saglayicisi tarafindan islenir.", imprintBody: "FITNEO dijital bir fitness urunudur. Yasal veya ticari konular icin destekle iletisime gecin.", supportBody: "Yardim mi lazim? Hesap e-postani, cihazini ve kisa aciklamayi FITNEO destege gonder." }
  }),
  ar: makeLocalizedResource({
    nav: { home: "الرئيسية", workouts: "التمارين", nutrition: "التغذية", progress: "التقدم", profile: "الملف" },
    dashboard: { goodMorning: "صباح الخير", goodAfternoon: "مساء الخير", goodEvening: "مساء الخير", myPlan: "خطتي", startActivePlan: "ابدأ الخطة", todaysWorkout: "تمرين اليوم", quickStart: "بدء سريع", calToday: "سعرات اليوم", thisWeek: "هذا الأسبوع", activeMin: "دقائق نشطة", streak: "السلسلة", goals: "الأهداف", weeklyWorkouts: "تمارين الأسبوع", caloriesBurned: "سعرات محروقة", caloriesEaten: "سعرات مأكولة", waterIntake: "شرب الماء", aiInsight: "نصيحة FITNEO AI", recentActivity: "النشاط الأخير", noWorkoutsYet: "لا توجد تمارين بعد - ابدأ أول جلسة." },
    common: { cancel: "إلغاء" },
    profileScreen: { loading: "تحميل الملف...", notifications: "الإشعارات", badges: "الشارات", leaderboard: "لوحة الترتيب", tellUs: "أخبرنا بما نطوره", exportData: "تصدير البيانات", resetAllData: "إعادة ضبط البيانات", signOut: "تسجيل الخروج", workoutReminders: "تذكيرات التمرين", streakAlerts: "تنبيهات السلسلة", aiCheckIn: "فحص FITNEO AI اليومي", upgradeToPro: "الترقية إلى Pro - افتح كل شيء" },
    progress: { title: "التقدم", subtitle: "بياناتك بشكل واضح", workoutsPerWeek: "تمارين / أسبوع", totalWorkouts: "إجمالي التمارين", totalSets: "إجمالي المجموعات", caloriesBurned: "سعرات محروقة", totalXp: "إجمالي XP", bodyMetrics: "قياسات الجسم", favoriteMuscleGroups: "العضلات المفضلة" },
    onboarding: { continue: "متابعة", finish: "إنهاء", skip: "تخطي", error: { incomplete: "أكمل هذه الخطوة." } },
    profile: { language: "اللغة", legal: "القانوني", legalSubtitle: "السياسات والشروط والاسترداد والتفاصيل" },
    language: { change: "تغيير اللغة" },
    legal: { privacy: "سياسة الخصوصية", terms: "شروط الخدمة", refund: "سياسة الاسترداد", imprint: "بيانات قانونية", support: "الدعم", updated: "آخر تحديث: 9 يوليو 2026", privacyBody: "يستخدم FITNEO بيانات الحساب والتمارين والتغذية والنشاط لتخصيص تجربتك.", termsBody: "يوفر FITNEO معلومات لياقة وتغذية لأغراض تعليمية فقط. استشر طبيبا قبل البدء.", refundBody: "تتم معالجة الاسترداد عبر المنصة أو مزود الدفع.", imprintBody: "FITNEO منتج لياقة رقمي. للاستفسارات القانونية أو التجارية تواصل مع الدعم.", supportBody: "تحتاج مساعدة؟ أرسل بريد الحساب والجهاز ووصفا قصيرا إلى دعم FITNEO." }
  }),
  hi: makeLocalizedResource({
    nav: { home: "होम", workouts: "वर्कआउट", nutrition: "पोषण", progress: "प्रगति", profile: "प्रोफाइल" },
    dashboard: { goodMorning: "सुप्रभात", goodAfternoon: "नमस्कार", goodEvening: "शुभ संध्या", myPlan: "मेरी योजना", startActivePlan: "योजना शुरू करें", todaysWorkout: "आज का वर्कआउट", quickStart: "त्वरित शुरू", calToday: "आज कैल", thisWeek: "इस सप्ताह", activeMin: "सक्रिय मिनट", streak: "स्ट्रीक", goals: "लक्ष्य", weeklyWorkouts: "साप्ताहिक वर्कआउट", caloriesBurned: "जली कैलोरी", caloriesEaten: "खाई कैलोरी", waterIntake: "पानी", aiInsight: "FITNEO AI सुझाव", recentActivity: "हाल की गतिविधि", noWorkoutsYet: "अभी कोई वर्कआउट नहीं - पहली सेशन शुरू करें." },
    common: { cancel: "रद्द करें" },
    profileScreen: { loading: "प्रोफाइल लोड हो रही है...", notifications: "सूचनाएं", badges: "बैज", leaderboard: "लीडरबोर्ड", tellUs: "बताएं क्या सुधारें", exportData: "डेटा निर्यात", resetAllData: "सारा डेटा रीसेट", signOut: "साइन आउट", workoutReminders: "वर्कआउट रिमाइंडर", streakAlerts: "स्ट्रीक अलर्ट", aiCheckIn: "FITNEO AI दैनिक चेक-इन", upgradeToPro: "Pro में अपग्रेड - सब अनलॉक करें" },
    progress: { title: "प्रगति", subtitle: "आपका डेटा साफ", workoutsPerWeek: "वर्कआउट / सप्ताह", totalWorkouts: "कुल वर्कआउट", totalSets: "कुल सेट", caloriesBurned: "जली कैलोरी", totalXp: "कुल XP", bodyMetrics: "शरीर माप", favoriteMuscleGroups: "पसंदीदा मसल ग्रुप" },
    onboarding: { continue: "जारी रखें", finish: "समाप्त", skip: "छोड़ें", error: { incomplete: "इस चरण को पूरा करें." } },
    profile: { language: "भाषा", legal: "कानूनी", legalSubtitle: "नीतियां, शर्तें, रिफंड और विवरण" },
    language: { change: "भाषा बदलें" },
    legal: { privacy: "गोपनीयता नीति", terms: "सेवा शर्तें", refund: "रिफंड नीति", imprint: "कानूनी जानकारी", support: "सहायता", updated: "अपडेट: 9 जुलाई 2026", privacyBody: "FITNEO आपके खाते, वर्कआउट, पोषण और ऐप गतिविधि डेटा का उपयोग अनुभव को व्यक्तिगत बनाने के लिए करता है.", termsBody: "FITNEO फिटनेस और पोषण जानकारी शैक्षिक उद्देश्य से देता है. शुरू करने से पहले डॉक्टर से सलाह लें.", refundBody: "रिफंड प्लेटफॉर्म या भुगतान प्रदाता द्वारा संभाले जाते हैं.", imprintBody: "FITNEO एक डिजिटल फिटनेस उत्पाद है. कानूनी या व्यावसायिक प्रश्नों के लिए सपोर्ट से संपर्क करें.", supportBody: "मदद चाहिए? अपना ईमेल, डिवाइस और संक्षिप्त विवरण FITNEO सपोर्ट को भेजें." }
  }),
  id: makeLocalizedResource({
    nav: { home: "Beranda", workouts: "Latihan", nutrition: "Nutrisi", progress: "Progres", profile: "Profil" },
    dashboard: { goodMorning: "Selamat pagi", goodAfternoon: "Selamat siang", goodEvening: "Selamat malam", myPlan: "RENCANAKU", startActivePlan: "Mulai rencana", todaysWorkout: "LATIHAN HARI INI", quickStart: "Mulai cepat", calToday: "Kal hari ini", thisWeek: "Minggu ini", activeMin: "Menit aktif", streak: "Rangkaian", goals: "TARGET", weeklyWorkouts: "Latihan mingguan", caloriesBurned: "Kalori terbakar", caloriesEaten: "Kalori dimakan", waterIntake: "Asupan air", aiInsight: "Insight FITNEO AI", recentActivity: "AKTIVITAS TERBARU", noWorkoutsYet: "Belum ada latihan - mulai sesi pertama." },
    common: { cancel: "Batal" },
    profileScreen: { loading: "Memuat profil...", notifications: "Notifikasi", badges: "LENCANA", leaderboard: "Peringkat", tellUs: "Beri tahu yang perlu diperbaiki", exportData: "Ekspor Data", resetAllData: "Reset Semua Data", signOut: "Keluar", workoutReminders: "Pengingat latihan", streakAlerts: "Peringatan streak", aiCheckIn: "Check-in harian FITNEO AI", upgradeToPro: "Upgrade ke Pro - buka semua" },
    progress: { title: "Progres", subtitle: "Data kamu dijelaskan", workoutsPerWeek: "LATIHAN / MINGGU", totalWorkouts: "Total latihan", totalSets: "Total set", caloriesBurned: "Kalori terbakar", totalXp: "Total XP", bodyMetrics: "METRIK TUBUH", favoriteMuscleGroups: "OTOT FAVORIT" },
    onboarding: { continue: "Lanjut", finish: "Selesai", skip: "Lewati", error: { incomplete: "Selesaikan langkah ini." } },
    profile: { language: "Bahasa", legal: "Legal", legalSubtitle: "Kebijakan, syarat, refund, dan detail" },
    language: { change: "Ubah Bahasa" },
    legal: { privacy: "Kebijakan Privasi", terms: "Syarat Layanan", refund: "Kebijakan Refund", imprint: "Info legal", support: "Dukungan", updated: "Diperbarui: 9 Juli 2026", privacyBody: "FITNEO memakai data akun, latihan, nutrisi, dan aktivitas app untuk personalisasi.", termsBody: "FITNEO menyediakan info fitness dan nutrisi untuk edukasi. Konsultasikan dokter sebelum mulai.", refundBody: "Refund ditangani platform atau penyedia pembayaran.", imprintBody: "FITNEO adalah produk fitness digital. Hubungi dukungan untuk urusan legal atau bisnis.", supportBody: "Butuh bantuan? Kirim email akun, perangkat, dan deskripsi singkat ke dukungan FITNEO." }
  }),
  ms: makeLocalizedResource({
    nav: { home: "Utama", workouts: "Senaman", nutrition: "Nutrisi", progress: "Kemajuan", profile: "Profil" },
    dashboard: { goodMorning: "Selamat pagi", goodAfternoon: "Selamat petang", goodEvening: "Selamat malam", myPlan: "PELAN SAYA", startActivePlan: "Mula pelan", todaysWorkout: "SENAMAN HARI INI", quickStart: "Mula cepat", calToday: "Kal hari ini", thisWeek: "Minggu ini", activeMin: "Minit aktif", streak: "Rentetan", goals: "MATLAMAT", weeklyWorkouts: "Senaman mingguan", caloriesBurned: "Kalori dibakar", caloriesEaten: "Kalori dimakan", waterIntake: "Air", aiInsight: "Pandangan FITNEO AI", recentActivity: "AKTIVITI TERKINI", noWorkoutsYet: "Belum ada senaman - mulakan sesi pertama." },
    common: { cancel: "Batal" },
    profileScreen: { loading: "Memuat profil...", notifications: "Notifikasi", badges: "LENCANA", leaderboard: "Papan kedudukan", tellUs: "Beritahu kami apa perlu dibaiki", exportData: "Eksport Data", resetAllData: "Tetap semula semua data", signOut: "Log keluar", workoutReminders: "Peringatan senaman", streakAlerts: "Amaran rentetan", aiCheckIn: "Daftar masuk harian FITNEO AI", upgradeToPro: "Naik taraf ke Pro - buka semua" },
    progress: { title: "Kemajuan", subtitle: "Data anda diterangkan", workoutsPerWeek: "SENAMAN / MINGGU", totalWorkouts: "Jumlah senaman", totalSets: "Jumlah set", caloriesBurned: "Kalori dibakar", totalXp: "Jumlah XP", bodyMetrics: "METRIK BADAN", favoriteMuscleGroups: "OTOT KEGEMARAN" },
    onboarding: { continue: "Teruskan", finish: "Selesai", skip: "Langkau", error: { incomplete: "Lengkapkan langkah ini." } },
    profile: { language: "Bahasa", legal: "Undang-undang", legalSubtitle: "Polisi, terma, bayaran balik dan butiran" },
    language: { change: "Tukar Bahasa" },
    legal: { privacy: "Polisi Privasi", terms: "Terma Perkhidmatan", refund: "Polisi Bayaran Balik", imprint: "Maklumat undang-undang", support: "Sokongan", updated: "Dikemas kini: 9 Julai 2026", privacyBody: "FITNEO menggunakan data akaun, senaman, nutrisi dan aktiviti app untuk pengalaman peribadi.", termsBody: "FITNEO memberi maklumat fitness dan nutrisi untuk pendidikan. Dapatkan nasihat doktor sebelum bermula.", refundBody: "Bayaran balik diuruskan oleh platform atau penyedia pembayaran.", imprintBody: "FITNEO ialah produk fitness digital. Hubungi sokongan untuk urusan undang-undang atau perniagaan.", supportBody: "Perlu bantuan? Hantar e-mel akaun, peranti dan penerangan ringkas kepada sokongan FITNEO." }
  }),
  yo: makeLocalizedResource({
    nav: { home: "Ile", workouts: "Idaraya", nutrition: "Ounje", progress: "Ilosiwaju", profile: "Profaili" },
    dashboard: { goodMorning: "E kaaro", goodAfternoon: "E kaasan", goodEvening: "E ku irole", myPlan: "ETO MI", startActivePlan: "Bere eto", todaysWorkout: "IDARAYA ONI", quickStart: "Bere kiakia", calToday: "Kal oni", thisWeek: "Ose yi", activeMin: "Iseju sise", streak: "Telele", goals: "AFOJUSUN", weeklyWorkouts: "Idaraya ose", caloriesBurned: "Kalori ti jo", caloriesEaten: "Kalori ti je", waterIntake: "Omi mimu", aiInsight: "Imoran FITNEO AI", recentActivity: "ISE TO SEYIN", noWorkoutsYet: "Ko si idaraya sibẹ - bere akoko re." },
    common: { cancel: "Fagile" },
    profileScreen: { loading: "N ko profaili...", notifications: "Ifitonileti", badges: "AMI", leaderboard: "Tabili ipo", tellUs: "So ohun ti a le tun se", exportData: "Gbe data jade", resetAllData: "Tun gbogbo data se", signOut: "Jade", workoutReminders: "Iranti idaraya", streakAlerts: "Ikilo telele", aiCheckIn: "Ayewo ojoojumọ FITNEO AI", upgradeToPro: "Lo si Pro - sii gbogbo nkan" },
    progress: { title: "Ilosiwaju", subtitle: "Data re ni kedere", workoutsPerWeek: "IDARAYA / OSE", totalWorkouts: "Lapapo idaraya", totalSets: "Lapapo seti", caloriesBurned: "Kalori ti jo", totalXp: "Lapapo XP", bodyMetrics: "Iwon ara", favoriteMuscleGroups: "Isan ayanfẹ" },
    onboarding: { continue: "Tesiwaju", finish: "Pari", skip: "Fo koja", error: { incomplete: "Pari igbesẹ yi." } },
    profile: { language: "Ede", legal: "Ofin", legalSubtitle: "Ilana, ofin lilo, agbapada ati alaye" },
    language: { change: "Yi ede pada" },
    legal: { privacy: "Ilana Asiri", terms: "Ofin Ise", refund: "Ilana Agbapada", imprint: "Alaye ofin", support: "Iranlowo", updated: "Imudojuiwon: July 9, 2026", privacyBody: "FITNEO n lo data akanti, idaraya, ounje ati app lati se iriri re ni ti ara re.", termsBody: "FITNEO n pese alaye idaraya ati ounje fun eko. Ba dokita soro ki o to bere eto tuntun.", refundBody: "Agbapada wa lori pẹpẹ tabi olupese isanwo.", imprintBody: "FITNEO je ọja amọdaju oni-nomba. Kan si iranlowo fun oro ofin tabi owo.", supportBody: "Nilo iranlowo? Fi imeeli akanti, ẹrọ ati alaye kukuru ranse si FITNEO support." }
  }),
  ha: makeLocalizedResource({
    nav: { home: "Gida", workouts: "Motsa jiki", nutrition: "Abinci", progress: "Ci gaba", profile: "Bayani" },
    dashboard: { goodMorning: "Ina kwana", goodAfternoon: "Barka da rana", goodEvening: "Barka da yamma", myPlan: "TSARINA", startActivePlan: "Fara tsari", todaysWorkout: "MOTSA JIKI NA YAU", quickStart: "Fara da sauri", calToday: "Kal yau", thisWeek: "Wannan mako", activeMin: "Minti aiki", streak: "Jere", goals: "MANUFOFI", weeklyWorkouts: "Ayyukan mako", caloriesBurned: "Kalori da aka kona", caloriesEaten: "Kalori da aka ci", waterIntake: "Shan ruwa", aiInsight: "Shawarwarin FITNEO AI", recentActivity: "AIKI NA KWANAN NAN", noWorkoutsYet: "Babu motsa jiki tukuna - fara na farko." },
    common: { cancel: "Soke" },
    profileScreen: { loading: "Ana loda bayanai...", notifications: "Sanarwa", badges: "LAMBOBI", leaderboard: "Matsayi", tellUs: "Faɗa mana abin gyara", exportData: "Fitar da bayanai", resetAllData: "Sake saita bayanai", signOut: "Fita", workoutReminders: "Tunatarwa motsa jiki", streakAlerts: "Faɗakarwar jere", aiCheckIn: "Binciken yau na FITNEO AI", upgradeToPro: "Haura zuwa Pro - bude komai" },
    progress: { title: "Ci gaba", subtitle: "Bayanan ka a sarari", workoutsPerWeek: "MOTSA JIKI / MAKO", totalWorkouts: "Jimlar motsa jiki", totalSets: "Jimlar set", caloriesBurned: "Kalori da aka kona", totalXp: "Jimlar XP", bodyMetrics: "Ma'aunin jiki", favoriteMuscleGroups: "Tsokoki da aka fi so" },
    onboarding: { continue: "Ci gaba", finish: "Kammala", skip: "Tsallake", error: { incomplete: "Kammala wannan mataki." } },
    profile: { language: "Harshe", legal: "Doka", legalSubtitle: "Manufofi, sharudda, mayar da kudi da bayanai" },
    language: { change: "Canja harshe" },
    legal: { privacy: "Sirri", terms: "Sharuddan Sabis", refund: "Mayar da kudi", imprint: "Bayanan doka", support: "Tallafi", updated: "An sabunta: 9 Yuli 2026", privacyBody: "FITNEO na amfani da bayanan asusu, motsa jiki, abinci da app don keɓance kwarewa.", termsBody: "FITNEO na bayar da bayanin fitness da abinci don ilimi. Tuntuɓi likita kafin sabon shiri.", refundBody: "Mayar da kudi yana hannun dandali ko mai biyan kudi.", imprintBody: "FITNEO samfurin fitness ne na dijital. Tuntuɓi tallafi don batun doka ko kasuwanci.", supportBody: "Kana bukatar taimako? Aika imel, na'ura da takaitaccen bayani zuwa FITNEO support." }
  }),
  ig: makeLocalizedResource({
    nav: { home: "Ulo", workouts: "Mmega ahu", nutrition: "Nri", progress: "Oganihu", profile: "Profailu" },
    dashboard: { goodMorning: "Ututu oma", goodAfternoon: "Ehihie oma", goodEvening: "Mgbede oma", myPlan: "ATUMATU M", startActivePlan: "Malite atumatu", todaysWorkout: "MMEGA AHU TAA", quickStart: "Malite ngwa ngwa", calToday: "Kal taa", thisWeek: "Izu a", activeMin: "Nkeji oru", streak: "Nusoro", goals: "EBUMNUCHE", weeklyWorkouts: "Mmega izu", caloriesBurned: "Kalori gbara", caloriesEaten: "Kalori iri", waterIntake: "Mmiri", aiInsight: "Ndumodu FITNEO AI", recentActivity: "IHE EMERE NA NSO", noWorkoutsYet: "Enweghi mmega ahu - malite nke mbu." },
    common: { cancel: "Kagbuo" },
    profileScreen: { loading: "Na-ebunye profailu...", notifications: "Ozi amara", badges: "BAAJI", leaderboard: "Ndepụta ọkwa", tellUs: "Gwa anyị ihe a ga-emezi", exportData: "Bupụ data", resetAllData: "Tọgharịa data niile", signOut: "Pụọ", workoutReminders: "Ncheta mmega", streakAlerts: "Mkpu usoro", aiCheckIn: "Nlele kwa ụbọchị FITNEO AI", upgradeToPro: "Bulie gaa Pro - mepee ihe niile" },
    progress: { title: "Oganihu", subtitle: "Data gi doro anya", workoutsPerWeek: "MMEGA / IZU", totalWorkouts: "Mmega niile", totalSets: "Set niile", caloriesBurned: "Kalori gbara", totalXp: "XP niile", bodyMetrics: "Ntụ ahụ", favoriteMuscleGroups: "Akụkụ akwara kacha amasị" },
    onboarding: { continue: "Gaa n'ihu", finish: "Mechaa", skip: "Gafe", error: { incomplete: "Mechaa nzọụkwụ a." } },
    profile: { language: "Asusu", legal: "Iwu", legalSubtitle: "Atumatu, okwu, nkwughachi ego na nkowa" },
    language: { change: "Gbanwee asusu" },
    legal: { privacy: "Nzuzo", terms: "Usoro Ọrụ", refund: "Nkwughachi Ego", imprint: "Ozi iwu", support: "Nkwado", updated: "Emelitere: July 9, 2026", privacyBody: "FITNEO ji data akaụntụ, mmega, nri na app mee ka ahụmịhe gị bụrụ nkeonwe.", termsBody: "FITNEO na-enye ozi fitness na nri maka mmụta. Kpọtụrụ dọkịta tupu ịmalite.", refundBody: "Nkwughachi ego na-aga site na platform ma ọ bụ onye na-akwụ ụgwọ.", imprintBody: "FITNEO bụ ngwaahịa fitness dijitalụ. Kpọtụrụ nkwado maka okwu iwu ma ọ bụ azụmahịa.", supportBody: "Ị chọrọ enyemaka? Zipu email akaụntụ, ngwaọrụ na nkọwa dị mkpirikpi na FITNEO support." }
  }),
  sw: makeLocalizedResource({
    nav: { home: "Nyumbani", workouts: "Mazoezi", nutrition: "Lishe", progress: "Maendeleo", profile: "Wasifu" },
    dashboard: { goodMorning: "Habari za asubuhi", goodAfternoon: "Habari za mchana", goodEvening: "Habari za jioni", myPlan: "MPANGO WANGU", startActivePlan: "Anza mpango", todaysWorkout: "MAZOEZI YA LEO", quickStart: "Anza haraka", calToday: "Kal leo", thisWeek: "Wiki hii", activeMin: "Dakika hai", streak: "Mfululizo", goals: "MALENGO", weeklyWorkouts: "Mazoezi ya wiki", caloriesBurned: "Kalori zilizochomwa", caloriesEaten: "Kalori zilizoliwa", waterIntake: "Maji", aiInsight: "Ushauri FITNEO AI", recentActivity: "SHUGHULI ZA KARIBU", noWorkoutsYet: "Hakuna mazoezi bado - anza kikao cha kwanza." },
    common: { cancel: "Ghairi" },
    profileScreen: { loading: "Inapakia wasifu...", notifications: "Arifa", badges: "BEJI", leaderboard: "Ubao wa nafasi", tellUs: "Tuambie cha kuboresha", exportData: "Hamisha Data", resetAllData: "Weka upya data zote", signOut: "Toka", workoutReminders: "Vikumbusho vya mazoezi", streakAlerts: "Arifa za mfululizo", aiCheckIn: "Ukaguzi wa kila siku FITNEO AI", upgradeToPro: "Panda Pro - fungua yote" },
    progress: { title: "Maendeleo", subtitle: "Data yako imeelezwa", workoutsPerWeek: "MAZOEZI / WIKI", totalWorkouts: "Jumla ya mazoezi", totalSets: "Jumla ya seti", caloriesBurned: "Kalori zilizochomwa", totalXp: "Jumla XP", bodyMetrics: "VIPIMO VYA MWILI", favoriteMuscleGroups: "MISULI UNAYOPENDA" },
    onboarding: { continue: "Endelea", finish: "Maliza", skip: "Ruka", error: { incomplete: "Kamilisha hatua hii." } },
    profile: { language: "Lugha", legal: "Kisheria", legalSubtitle: "Sera, masharti, marejesho na maelezo" },
    language: { change: "Badilisha Lugha" },
    legal: { privacy: "Sera ya Faragha", terms: "Masharti ya Huduma", refund: "Sera ya Marejesho", imprint: "Taarifa za kisheria", support: "Msaada", updated: "Imesasishwa: 9 Julai 2026", privacyBody: "FITNEO hutumia data ya akaunti, mazoezi, lishe na app kubinafsisha uzoefu.", termsBody: "FITNEO hutoa taarifa za fitness na lishe kwa elimu. Shauriana na daktari kabla ya kuanza.", refundBody: "Marejesho hushughulikiwa na jukwaa au mtoa malipo.", imprintBody: "FITNEO ni bidhaa ya fitness ya kidijitali. Wasiliana na msaada kwa masuala ya kisheria au biashara.", supportBody: "Unahitaji msaada? Tuma barua pepe, kifaa na maelezo mafupi kwa msaada wa FITNEO." }
  }),
  zh: makeLocalizedResource({
    nav: { home: "首页", workouts: "训练", nutrition: "营养", progress: "进度", profile: "我的" },
    dashboard: { goodMorning: "早上好", goodAfternoon: "下午好", goodEvening: "晚上好", myPlan: "我的计划", startActivePlan: "开始计划", todaysWorkout: "今日训练", quickStart: "快速开始", calToday: "今日热量", thisWeek: "本周", activeMin: "活跃分钟", streak: "连续天数", goals: "目标", weeklyWorkouts: "每周训练", caloriesBurned: "消耗热量", caloriesEaten: "摄入热量", waterIntake: "饮水", aiInsight: "FITNEO AI 建议", recentActivity: "最近活动", noWorkoutsYet: "还没有训练，开始你的第一次训练。" },
    common: { cancel: "取消" },
    profileScreen: { loading: "正在加载资料...", notifications: "通知", badges: "徽章", leaderboard: "排行榜", tellUs: "告诉我们如何改进", exportData: "导出数据", resetAllData: "重置所有数据", signOut: "退出登录", workoutReminders: "训练提醒", streakAlerts: "连续提醒", aiCheckIn: "FITNEO AI 每日检查", upgradeToPro: "升级 Pro - 解锁全部" },
    progress: { title: "进度", subtitle: "你的数据已解析", workoutsPerWeek: "训练 / 周", totalWorkouts: "总训练", totalSets: "总组数", caloriesBurned: "消耗热量", totalXp: "总 XP", bodyMetrics: "身体指标", favoriteMuscleGroups: "常练肌群" },
    onboarding: { continue: "继续", finish: "完成", skip: "跳过", error: { incomplete: "请完成此步骤。" } },
    profile: { language: "语言", legal: "法律", legalSubtitle: "政策、条款、退款和详情" },
    language: { change: "更改语言" },
    legal: { privacy: "隐私政策", terms: "服务条款", refund: "退款政策", imprint: "法律信息", support: "支持", updated: "更新日期：2026年7月9日", privacyBody: "FITNEO 使用账户、训练、营养和应用活动数据来提供个性化体验。", termsBody: "FITNEO 提供教育用途的健身和营养信息。开始新计划前请咨询医生。", refundBody: "退款由购买平台或支付服务商处理。", imprintBody: "FITNEO 是数字健身产品。如有法律或商务问题，请联系支持。", supportBody: "需要帮助？请将账户邮箱、设备和简短说明发送给 FITNEO 支持。" }
  }),
  ja: makeLocalizedResource({
    nav: { home: "ホーム", workouts: "ワークアウト", nutrition: "栄養", progress: "進捗", profile: "プロフィール" },
    dashboard: { goodMorning: "おはようございます", goodAfternoon: "こんにちは", goodEvening: "こんばんは", myPlan: "マイプラン", startActivePlan: "プラン開始", todaysWorkout: "今日のワークアウト", quickStart: "クイック開始", calToday: "今日のカロリー", thisWeek: "今週", activeMin: "活動分", streak: "連続記録", goals: "目標", weeklyWorkouts: "週間ワークアウト", caloriesBurned: "消費カロリー", caloriesEaten: "摂取カロリー", waterIntake: "水分", aiInsight: "FITNEO AI 提案", recentActivity: "最近の活動", noWorkoutsYet: "まだワークアウトがありません。最初のセッションを始めましょう。" },
    common: { cancel: "キャンセル" },
    profileScreen: { loading: "プロフィールを読み込み中...", notifications: "通知", badges: "バッジ", leaderboard: "ランキング", tellUs: "改善点を教えてください", exportData: "データを書き出す", resetAllData: "全データをリセット", signOut: "ログアウト", workoutReminders: "ワークアウト通知", streakAlerts: "連続記録アラート", aiCheckIn: "FITNEO AI 毎日チェックイン", upgradeToPro: "Proへアップグレード - 全て解除" },
    progress: { title: "進捗", subtitle: "データをわかりやすく", workoutsPerWeek: "ワークアウト / 週", totalWorkouts: "合計ワークアウト", totalSets: "合計セット", caloriesBurned: "消費カロリー", totalXp: "合計XP", bodyMetrics: "身体指標", favoriteMuscleGroups: "よく鍛える部位" },
    onboarding: { continue: "続ける", finish: "完了", skip: "スキップ", error: { incomplete: "このステップを完了してください。" } },
    profile: { language: "言語", legal: "法的情報", legalSubtitle: "ポリシー、規約、返金、詳細" },
    language: { change: "言語を変更" },
    legal: { privacy: "プライバシーポリシー", terms: "利用規約", refund: "返金ポリシー", imprint: "法的表示", support: "サポート", updated: "更新日：2026年7月9日", privacyBody: "FITNEOはアカウント、運動、栄養、アプリ活動データを使い体験を個別化します。", termsBody: "FITNEOのフィットネスと栄養情報は教育目的です。開始前に医師へ相談してください。", refundBody: "返金は購入プラットフォームまたは決済事業者が処理します。", imprintBody: "FITNEOはデジタルフィットネス製品です。法務・事業のお問い合わせはサポートへ。", supportBody: "お困りですか？アカウントメール、端末、簡単な説明をFITNEOサポートへ送ってください。" }
  }),
  ko: makeLocalizedResource({
    nav: { home: "홈", workouts: "운동", nutrition: "영양", progress: "진행", profile: "프로필" },
    dashboard: { goodMorning: "좋은 아침", goodAfternoon: "좋은 오후", goodEvening: "좋은 저녁", myPlan: "내 플랜", startActivePlan: "플랜 시작", todaysWorkout: "오늘의 운동", quickStart: "빠른 시작", calToday: "오늘 칼로리", thisWeek: "이번 주", activeMin: "활동 분", streak: "연속 기록", goals: "목표", weeklyWorkouts: "주간 운동", caloriesBurned: "소모 칼로리", caloriesEaten: "섭취 칼로리", waterIntake: "수분 섭취", aiInsight: "FITNEO AI 인사이트", recentActivity: "최근 활동", noWorkoutsYet: "아직 운동이 없습니다. 첫 세션을 시작하세요." },
    common: { cancel: "취소" },
    profileScreen: { loading: "프로필 불러오는 중...", notifications: "알림", badges: "배지", leaderboard: "리더보드", tellUs: "개선할 점 알려주기", exportData: "데이터 내보내기", resetAllData: "모든 데이터 초기화", signOut: "로그아웃", workoutReminders: "운동 알림", streakAlerts: "연속 기록 알림", aiCheckIn: "FITNEO AI 일일 체크인", upgradeToPro: "Pro 업그레이드 - 모두 잠금 해제" },
    progress: { title: "진행", subtitle: "데이터를 쉽게 확인", workoutsPerWeek: "운동 / 주", totalWorkouts: "총 운동", totalSets: "총 세트", caloriesBurned: "소모 칼로리", totalXp: "총 XP", bodyMetrics: "신체 지표", favoriteMuscleGroups: "선호 근육군" },
    onboarding: { continue: "계속", finish: "완료", skip: "건너뛰기", error: { incomplete: "이 단계를 완료하세요." } },
    profile: { language: "언어", legal: "법적 정보", legalSubtitle: "정책, 약관, 환불 및 세부 정보" },
    language: { change: "언어 변경" },
    legal: { privacy: "개인정보 처리방침", terms: "서비스 약관", refund: "환불 정책", imprint: "법적 고지", support: "지원", updated: "업데이트: 2026년 7월 9일", privacyBody: "FITNEO는 계정, 운동, 영양, 앱 활동 데이터를 사용해 개인화된 경험을 제공합니다.", termsBody: "FITNEO의 피트니스 및 영양 정보는 교육 목적입니다. 시작 전 의사와 상담하세요.", refundBody: "환불은 구매 플랫폼 또는 결제 제공업체에서 처리합니다.", imprintBody: "FITNEO는 디지털 피트니스 제품입니다. 법무 또는 비즈니스 문의는 지원팀에 연락하세요.", supportBody: "도움이 필요하신가요? 계정 이메일, 기기, 간단한 설명을 FITNEO 지원팀에 보내세요." }
  }),
  ru: makeLocalizedResource({
    nav: { home: "Главная", workouts: "Тренировки", nutrition: "Питание", progress: "Прогресс", profile: "Профиль" },
    dashboard: { goodMorning: "Доброе утро", goodAfternoon: "Добрый день", goodEvening: "Добрый вечер", myPlan: "МОЙ ПЛАН", startActivePlan: "Начать план", todaysWorkout: "ТРЕНИРОВКА СЕГОДНЯ", quickStart: "Быстрый старт", calToday: "Кал сегодня", thisWeek: "Эта неделя", activeMin: "Активные мин", streak: "Серия", goals: "ЦЕЛИ", weeklyWorkouts: "Тренировки в неделю", caloriesBurned: "Калории сожжены", caloriesEaten: "Калории съедены", waterIntake: "Вода", aiInsight: "Совет FITNEO AI", recentActivity: "ПОСЛЕДНЯЯ АКТИВНОСТЬ", noWorkoutsYet: "Тренировок пока нет - начните первую сессию." },
    common: { cancel: "Отмена" },
    profileScreen: { loading: "Загрузка профиля...", notifications: "Уведомления", badges: "ЗНАЧКИ", leaderboard: "Рейтинг", tellUs: "Скажите, что улучшить", exportData: "Экспорт данных", resetAllData: "Сбросить все данные", signOut: "Выйти", workoutReminders: "Напоминания о тренировках", streakAlerts: "Оповещения серии", aiCheckIn: "Ежедневная проверка FITNEO AI", upgradeToPro: "Перейти на Pro - открыть все" },
    progress: { title: "Прогресс", subtitle: "Ваши данные понятны", workoutsPerWeek: "ТРЕНИРОВКИ / НЕДЕЛЯ", totalWorkouts: "Всего тренировок", totalSets: "Всего подходов", caloriesBurned: "Калории сожжены", totalXp: "Всего XP", bodyMetrics: "ПАРАМЕТРЫ ТЕЛА", favoriteMuscleGroups: "ЛЮБИМЫЕ МЫШЦЫ" },
    onboarding: { continue: "Далее", finish: "Готово", skip: "Пропустить", error: { incomplete: "Завершите этот шаг." } },
    profile: { language: "Язык", legal: "Правовая информация", legalSubtitle: "Политики, условия, возвраты и сведения" },
    language: { change: "Изменить язык" },
    legal: { privacy: "Политика конфиденциальности", terms: "Условия сервиса", refund: "Политика возврата", imprint: "Правовая информация", support: "Поддержка", updated: "Обновлено: 9 июля 2026", privacyBody: "FITNEO использует данные аккаунта, тренировок, питания и активности приложения для персонализации.", termsBody: "FITNEO предоставляет фитнес- и нутриционную информацию в образовательных целях. Перед стартом проконсультируйтесь с врачом.", refundBody: "Возвраты обрабатываются платформой или платежным провайдером.", imprintBody: "FITNEO - цифровой фитнес-продукт. По юридическим или деловым вопросам обращайтесь в поддержку.", supportBody: "Нужна помощь? Отправьте email аккаунта, устройство и краткое описание в поддержку FITNEO." }
  })
};

const i18nResources = {
  ...resources,
  ...localizedResources
};

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
  resources: i18nResources
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
