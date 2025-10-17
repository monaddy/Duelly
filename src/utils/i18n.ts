import { useUIStore } from '../store/useUIStore';

const dict = {
  en: {
    quickMatch: 'Quick Match',
    stakeCredits: 'Stake (credits)',
    findMatch: 'Find Match',
    privateMatch: 'Private Match',
    create: 'Create',
    join: 'Join',
    practiceVsAi: 'Practice vs AI',
    startPractice: 'Start Practice',
    fairness: 'Fairness',
    highContrast: 'High Contrast',
    connecting: 'Connecting…',
    copyLink: 'Copy Link',
    copied: 'Link copied to clipboard',
    payAndJoin: 'Pay & Join',
    settlement: 'Settlement',
    winner: 'Winner',
    house: 'House'
  },
  he: {
    quickMatch: 'משחק מהיר',
    stakeCredits: 'סכום הימור (קרדיטים)',
    findMatch: 'מצא משחק',
    privateMatch: 'משחק פרטי',
    create: 'יצירה',
    join: 'הצטרפות',
    practiceVsAi: 'תרגול מול AI',
    startPractice: 'התחל תרגול',
    fairness: 'הוגנות',
    highContrast: 'ניגודיות גבוהה',
    connecting: 'מתחבר…',
    copyLink: 'העתק קישור',
    copied: 'הקישור הועתק',
    payAndJoin: 'תשלום והצטרפות',
    settlement: 'סיכום תוצאה',
    winner: 'זוכה',
    house: 'בית'
  }
};

export function t(key: keyof typeof dict['en']) {
  const lang = useUIStore.getState().lang;
  const table = dict[lang] ?? dict.en;
  return (table as any)[key] ?? key;
}
