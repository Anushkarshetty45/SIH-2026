// Desktop Internationalization (Marathi, Hindi, English)
import { Language } from '../types';

export type TranslationKey =
  | 'appName'
  | 'dashboard'
  | 'doctorDashboard'
  | 'facilityDashboard'
  | 'districtDashboard'
  | 'bedManagement'
  | 'equipmentManagement'
  | 'medicineInventory'
  | 'staleMonitoring'
  | 'referrals'
  | 'appointments'
  | 'login'
  | 'logout'
  | 'refresh'
  | 'search'
  | 'status'
  | 'actions'
  | 'available'
  | 'occupied'
  | 'staleDataWarning'
  | 'lastUpdated';

export const translations: Record<Language, Record<TranslationKey, string>> = {
  ENGLISH: {
    appName: 'CareGrid Desktop',
    dashboard: 'Dashboard',
    doctorDashboard: 'Doctor Clinical Dashboard',
    facilityDashboard: 'Facility Operations',
    districtDashboard: 'District Administration',
    bedManagement: 'Bed Management',
    equipmentManagement: 'Equipment & Devices',
    medicineInventory: 'Medicine Inventory',
    staleMonitoring: 'Stale Data & Escalations',
    referrals: 'Referral Workflow',
    appointments: 'Appointments & Schedules',
    login: 'Login',
    logout: 'Logout',
    refresh: 'Refresh',
    search: 'Search...',
    status: 'Status',
    actions: 'Actions',
    available: 'Available',
    occupied: 'Occupied',
    staleDataWarning: 'Data is stale (>2h). Please verify with facility before critical action.',
    lastUpdated: 'Last updated',
  },
  MARATHI: {
    appName: 'केअरग्रिड डेस्कटॉप',
    dashboard: 'डॅशबोर्ड',
    doctorDashboard: 'डॉक्टर क्लिनिकल डॅशबोर्ड',
    facilityDashboard: 'रुग्णालय व्यवस्थापन',
    districtDashboard: 'जिल्हा प्रशासन',
    bedManagement: 'बेड व्यवस्थापन',
    equipmentManagement: 'वैद्यकीय उपकरणे',
    medicineInventory: 'औषध साठा',
    staleMonitoring: 'जुना डेटा व सूचना',
    referrals: 'रुग्ण संदर्भ (Referrals)',
    appointments: 'अपॉइंटमेंट्स',
    login: 'लॉगिन करा',
    logout: 'लॉगआउट',
    refresh: 'रिफ्रेश करा',
    search: 'शोधा...',
    status: 'स्थिती',
    actions: 'कृती',
    available: 'उपलब्ध',
    occupied: 'भरलेले',
    staleDataWarning: 'डेटा २ तासांपेक्षा जुना आहे. कृपया रुग्णालयाशी संपर्क साधा.',
    lastUpdated: 'शेवटचे अपडेट',
  },
  HINDI: {
    appName: 'केयरग्रिड डेस्कटॉप',
    dashboard: 'डैशबोर्ड',
    doctorDashboard: 'डॉक्टर क्लिनिकल डैशबोर्ड',
    facilityDashboard: 'अस्पताल प्रबंधन',
    districtDashboard: 'जिला प्रशासन',
    bedManagement: 'बेड प्रबंधन',
    equipmentManagement: 'चिकित्सा उपकरण',
    medicineInventory: 'दवा सूची',
    staleMonitoring: 'पुराना डेटा निगरानी',
    referrals: 'रेफरल वर्कफ़्लो',
    appointments: 'अपॉइंटमेंट',
    login: 'लॉगिन',
    logout: 'लॉगआउट',
    refresh: 'ताज़ा करें',
    search: 'खोजें...',
    status: 'स्थिति',
    actions: 'कार्रवाई',
    available: 'उपलब्ध',
    occupied: 'व्यस्त',
    staleDataWarning: 'डेटा २ घंटे से अधिक पुराना है। कृपया पुष्टि करें।',
    lastUpdated: 'अंतिम अपडेट',
  },
};

let currentLanguage: Language = 'ENGLISH';

export const setDesktopLanguage = (lang: Language): void => {
  currentLanguage = lang;
};

export const getDesktopLanguage = (): Language => currentLanguage;

export const t = (key: TranslationKey, lang?: Language): string => {
  const active = lang || currentLanguage;
  return translations[active]?.[key] || translations.ENGLISH[key] || key;
};
