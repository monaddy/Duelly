import { useUIStore } from '../store/useUIStore';
var dict = {
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
export function t(key) {
    var _a, _b;
    var lang = useUIStore.getState().lang;
    var table = (_a = dict[lang]) !== null && _a !== void 0 ? _a : dict.en;
    return (_b = table[key]) !== null && _b !== void 0 ? _b : key;
}
