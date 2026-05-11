import { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    myCounters: 'My Counters',
    newCounter: 'New Counter',
    name: 'Name',
    icon: 'Icon',
    color: 'Color',
    cycle: 'Cycle',
    cancel: 'Cancel',
    create: 'Create',
    creating: 'Creating...',
    noCounters: 'No counters yet',
    tapToCreate: 'Tap + to create your first',
    settings: 'Settings',
    appearance: 'Appearance',
    darkMode: 'Dark Mode',
    inputMode: 'Input Mode',
    tap: 'Tap',
    keyboard: 'Keyboard',
    volumeButtons: 'Use volume buttons for counting',
    keyboardShortcuts: 'Keyboard shortcuts',
    spaceIncrement: 'Space → Increment',
    backspaceDecrement: 'Backspace → Decrement',
    soundHaptic: 'Sound & Haptic',
    tapSound: 'Tap Sound',
    vibrateTap: 'Vibrate on Tap',
    longVibration: 'Long Vibration on Cycle',
    cycleSound: 'Sound on Cycle Complete',
    backup: 'Backup',
    backupDesc: 'Export your data to keep a backup.',
    exportData: 'Export Data',
    importData: 'Import Data',
    about: 'About',
    aboutTapCounter: 'About TapCounter',
    dangerZone: 'Danger Zone',
    resetData: 'Reset Data',
    madeInBharat: 'Made in Bharat with ❤️',
    version: 'v1.0.0',
    appDescription: 'Minimal counter app for meditation, habits, and mindful counting.',
    madeBy: 'Made by Uday Singh',
    close: 'Close',
    resetDaily: 'Reset Daily Counts',
    resetLifetime: 'Reset All Counts',
    deleteEverything: 'Delete Everything',
    typeToConfirm: 'Type to confirm:',
    resetting: 'Resetting...',
    history: 'History',
    lifetime: 'Lifetime',
    cycles: 'Cycles',
    lastActive: 'Last Active',
    today: 'Today',
    never: 'Never',
    noHistory: 'No history yet',
    historyAppear: 'Your daily counts will appear here',
    counterSettings: 'Counter Settings',
    cycleSize: 'Cycle Size',
    save: 'Save',
    completedCycles: 'Completed Cycles',
    dayStreak: 'Day Streak',
    feedback: 'Feedback & Suggestions',
    feedbackPlaceholder: 'Tell us what you would like improved in TapCounter...',
    submit: 'Submit',
    submitted: 'Thank you for your feedback!',
    language: 'Language',
    english: 'English',
    hindi: 'Hindi'
  },
  hi: {
    myCounters: 'मेरे काउंटर',
    newCounter: 'नया काउंटर',
    name: 'नाम',
    icon: 'आइकन',
    color: 'रंग',
    cycle: 'चक्र',
    cancel: 'रद्द करें',
    create: 'बनाएं',
    creating: 'बना रहा है...',
    noCounters: 'अभी तक कोई काउंटर नहीं',
    tapToCreate: 'बनाने के लिए + टैप करें',
    settings: 'सेटिंग्स',
    appearance: 'दिखावट',
    darkMode: 'डार्क मोड',
    inputMode: 'इनपुट मोड',
    tap: 'टैप',
    keyboard: 'कीबोर्ड',
    volumeButtons: 'वॉल्यूम बटन से काउंट करें',
    keyboardShortcuts: 'कीबोर्ड शॉर्टकट',
    spaceIncrement: 'स्पेस → बढ़ाएं',
    backspaceDecrement: 'बैकस्पेस → घटाएं',
    soundHaptic: 'ध्वनि और हैप्टिक',
    tapSound: 'टैप ध्वनि',
    vibrateTap: 'टैप पर वाइब्रेट',
    longVibration: 'चक्र पर लंबा वाइब्रेशन',
    cycleSound: 'चक्र पूरा होने पर ध्वनि',
    backup: 'बैकअप',
    backupDesc: 'अपना डेटा बैकअप करें।',
    exportData: 'डेटा निर्यात करें',
    importData: 'डेटा आयात करें',
    about: 'के बारे में',
    aboutTapCounter: 'TapCounter के बारे में',
    dangerZone: 'खतरा क्षेत्र',
    resetData: 'डेटा रीसेट करें',
    madeInBharat: 'भारत में बनाया गया ❤️',
    version: 'v1.0.0',
    appDescription: 'ध्यान, आदतें और सचेत गिनती के लिए न्यूनतम काउंटर ऐप।',
    madeBy: 'उदय सिंह द्वारा बनाया गया',
    close: 'बंद करें',
    resetDaily: 'दैनिक काउंटर रीसेट करें',
    resetLifetime: 'सभी काउंटर रीसेट करें',
    deleteEverything: 'सब कुछ हटाएं',
    typeToConfirm: 'पुष्टि करने के लिए टाइप करें:',
    resetting: 'रीसेट हो रहा है...',
    history: 'इतिहास',
    lifetime: 'आजीवन',
    cycles: 'चक्र',
    lastActive: 'अंतिम सक्रिय',
    today: 'आज',
    never: 'कभी नहीं',
    noHistory: 'अभी तक कोई इतिहास नहीं',
    historyAppear: 'आपके दैनिक काउंटर यहां दिखाई देंगे',
    counterSettings: 'काउंटर सेटिंग्स',
    cycleSize: 'चक्र आकार',
    save: 'सहेजें',
    completedCycles: 'पूर्ण चक्र',
    dayStreak: 'दिन की स्ट्रीक',
    feedback: 'प्रतिक्रिया और सुझाव',
    feedbackPlaceholder: 'TapCounter में सुधार के लिए हमें बताएं...',
    submit: 'भेजें',
    submitted: 'आपकी प्रतिक्रिया के लिए धन्यवाद!',
    language: 'भाषा',
    english: 'अंग्रेज़ी',
    hindi: 'हिंदी'
  }
};

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('tapcounter_language');
    return saved || 'en';
  });

  useEffect(() => {
    localStorage.setItem('tapcounter_language', language);
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);