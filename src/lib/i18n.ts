import type { Language } from './types';

export interface Translations {
  readings: string;
  celebrations: string;
  noReadings: string;
  close: string;
  legend: string;
  fast: string;
  cheese: string;
  fish: string;
  pres: string;
  basil: string;
  dl: string;
  loading: string;
  tone: string;
  matins: string;
  today: string;
  calendar: string;
  noData: string;
  // Admin / Events
  admin: string;
  passcode: string;
  enterPasscode: string;
  wrongPasscode: string;
  unlock: string;
  logout: string;
  events: string;
  addEvent: string;
  editEvent: string;
  deleteEvent: string;
  deleteConfirm: string;
  eventTitle: string;
  eventTitleEn: string;
  eventTitleKo: string;
  eventDescription: string;
  eventDescriptionEn: string;
  eventDescriptionKo: string;
  eventTitleRequiredOneLanguage: string;
  eventDate: string;
  eventDetails: string;
  recurrence: string;
  recurrenceNone: string;
  recurrenceDaily: string;
  recurrenceWeekly: string;
  recurrenceMonthly: string;
  recurrenceYearly: string;
  addToCalendar: string;
  googleCalendar: string;
  appleCalendar: string;
  outlookCalendar: string;
  noDescription: string;
  sendNotification: string;
  notificationTarget: string;
  notificationAll: string;
  notificationEnglish: string;
  notificationKorean: string;
  reminderDay: string;
  save: string;
  cancel: string;
  noEvents: string;
  parishEvents: string;
}

const en: Translations = {
  readings: 'Readings',
  celebrations: 'Celebrations',
  noReadings: 'No readings',
  close: 'Close',
  legend: 'Legend',
  fast: 'Fasting',
  cheese: 'Dairy Permitted',
  fish: 'Fish Permitted',
  pres: 'Presanctified Liturgy',
  basil: 'Liturgy of St. Basil',
  dl: 'Divine Liturgy',
  loading: 'Loading…',
  tone: 'Tone',
  matins: 'Matins Gospel',
  today: 'Today',
  calendar: 'Calendar',
  noData: 'No calendar data available for today.',
  admin: 'Staff',
  passcode: 'Passcode',
  enterPasscode: 'Enter staff passcode',
  wrongPasscode: 'Incorrect passcode',
  unlock: 'Unlock',
  logout: 'Exit staff mode',
  events: 'Events',
  addEvent: 'Add event',
  editEvent: 'Edit',
  deleteEvent: 'Delete',
  deleteConfirm: 'Delete this event?',
  eventTitle: 'Title',
  eventTitleEn: 'Title (English)',
  eventTitleKo: 'Title (Korean)',
  eventDescription: 'Description (optional)',
  eventDescriptionEn: 'Description (English, optional)',
  eventDescriptionKo: 'Description (Korean, optional)',
  eventTitleRequiredOneLanguage: 'Enter at least one title (English or Korean).',
  eventDate: 'Date',
  eventDetails: 'Event Details',
  recurrence: 'Recurrence',
  recurrenceNone: 'Does not repeat',
  recurrenceDaily: 'Every day',
  recurrenceWeekly: 'Every week',
  recurrenceMonthly: 'Every month',
  recurrenceYearly: 'Every year',
  addToCalendar: 'Add to calendar',
  googleCalendar: 'Google Calendar',
  appleCalendar: 'Apple Calendar (.ics)',
  outlookCalendar: 'Outlook',
  noDescription: 'No description provided.',
  sendNotification: 'Send push notification',
  notificationTarget: 'Notify',
  notificationAll: 'All subscribers',
  notificationEnglish: 'English only',
  notificationKorean: 'Korean only',
  reminderDay: 'Reminder:',
  save: 'Save',
  cancel: 'Cancel',
  noEvents: 'No parish events',
  parishEvents: 'Parish Events',
};

const kr: Translations = {
  readings: '독서',
  celebrations: '축일',
  noReadings: '독서 없음',
  close: '닫기',
  legend: '범례',
  fast: '금식',
  cheese: '유제품 허용',
  fish: '생선 허용',
  pres: '선성체 성찬예배',
  basil: '성 바실 전례',
  dl: '성찬예배',
  loading: '로딩 중…',
  tone: '성조',
  matins: '조과 복음',
  today: '오늘',
  calendar: '달력',
  noData: '오늘 달력 데이터가 없습니다.',
  admin: '관리자',
  passcode: '비밀번호',
  enterPasscode: '관리자 비밀번호를 입력하세요',
  wrongPasscode: '비밀번호가 틀립니다',
  unlock: '잠금 해제',
  logout: '관리자 모드 종료',
  events: '행사',
  addEvent: '행사 추가',
  editEvent: '수정',
  deleteEvent: '삭제',
  deleteConfirm: '이 행사를 삭제하시겠습니까?',
  eventTitle: '제목',
  eventTitleEn: '제목 (영어)',
  eventTitleKo: '제목 (한국어)',
  eventDescription: '설명 (선택)',
  eventDescriptionEn: '설명 (영어, 선택)',
  eventDescriptionKo: '설명 (한국어, 선택)',
  eventTitleRequiredOneLanguage: '영어 또는 한국어 제목 중 하나는 입력해야 합니다.',
  eventDate: '날짜',
  eventDetails: '행사 정보',
  recurrence: '반복',
  recurrenceNone: '반복 안 함',
  recurrenceDaily: '매일',
  recurrenceWeekly: '매주',
  recurrenceMonthly: '매월',
  recurrenceYearly: '매년',
  addToCalendar: '캘린더에 추가',
  googleCalendar: '구글 캘린더',
  appleCalendar: '애플 캘린더 (.ics)',
  outlookCalendar: '아웃룩',
  noDescription: '설명이 없습니다.',
  sendNotification: '푸시 알림 보내기',
  notificationTarget: '수신자',
  notificationAll: '모든 구독자',
  notificationEnglish: '영어 구독자만',
  notificationKorean: '한국어 구독자만',
  reminderDay: '알림:',
  save: '저장',
  cancel: '취소',
  noEvents: '교구 행사 없음',
  parishEvents: '교구 행사',
};

export function getTranslations(lang: Language): Translations {
  return lang === 'en' ? en : kr;
}
