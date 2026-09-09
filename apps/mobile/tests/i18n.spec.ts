import { setLanguage, getCurrentLanguage, t, DEFAULT_LANGUAGE } from '../src/i18n';
import mr from '../src/i18n/mr.json';
import hi from '../src/i18n/hi.json';
import en from '../src/i18n/en.json';

describe('Localization Engine (Marathi, Hindi, English)', () => {
  beforeEach(async () => {
    await setLanguage('mr');
  });

  it('should default to English for dev (production default is Marathi per SRS)', async () => {
    // Production default = 'mr'. Switched to 'en' for dev convenience.
    expect(DEFAULT_LANGUAGE).toBe('en');
    // Switch to en and verify English strings load
    await setLanguage('en');
    expect(getCurrentLanguage()).toBe('en');
    expect(t('app.name')).toBe('CareGrid');
  });

  it('should switch to Hindi and English correctly', async () => {
    await setLanguage('hi');
    expect(getCurrentLanguage()).toBe('hi');
    expect(t('app.name')).toBe('केयरग्रिड');

    await setLanguage('en');
    expect(getCurrentLanguage()).toBe('en');
    expect(t('app.name')).toBe('CareGrid');
  });

  it('should have parity of top-level translation domains across languages', () => {
    const mrKeys = Object.keys(mr).sort();
    const hiKeys = Object.keys(hi).sort();
    const enKeys = Object.keys(en).sort();

    expect(mrKeys).toEqual(enKeys);
    expect(hiKeys).toEqual(enKeys);
  });

  it('should translate referral and 30-minute timeout strings', async () => {
    await setLanguage('mr');
    expect(t('referrals.statusPending')).toBe('डॉक्टरांच्या मंजुरीची प्रतीक्षा');
    expect(t('referrals.timeoutNotice')).toContain('३० मिनिटांची');

    await setLanguage('en');
    expect(t('referrals.statusPending')).toBe('Waiting for doctor approval');
    expect(t('referrals.timeoutNotice')).toContain('30 minutes');
  });

  it('should translate stale data warnings correctly', async () => {
    await setLanguage('mr');
    expect(t('freshness.stale')).toBe('जुना डेटा');

    await setLanguage('hi');
    expect(t('freshness.stale')).toBe('पुराना डेटा');

    await setLanguage('en');
    expect(t('freshness.stale')).toBe('STALE');
  });
});
