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

const i18nResources = {
  ...resources,
  ...Object.fromEntries(
    englishFallbackLanguages.map((language) => [language, resources.en])
  )
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
