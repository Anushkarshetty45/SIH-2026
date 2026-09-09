import { t, setDesktopLanguage, getDesktopLanguage } from '../src/renderer/i18n';
import { api, setAuthToken, getAuthToken } from '../src/renderer/api/client';

describe('Milestone 6: Desktop Application Tests', () => {
  describe('Desktop Localization (Marathi, Hindi, English)', () => {
    it('should support English translations by default', () => {
      setDesktopLanguage('ENGLISH');
      expect(getDesktopLanguage()).toBe('ENGLISH');
      expect(t('appName')).toBe('CareGrid Desktop');
      expect(t('doctorDashboard')).toBe('Doctor Clinical Dashboard');
      expect(t('bedManagement')).toBe('Bed Management');
    });

    it('should translate to Marathi accurately', () => {
      setDesktopLanguage('MARATHI');
      expect(getDesktopLanguage()).toBe('MARATHI');
      expect(t('appName')).toBe('केअरग्रिड डेस्कटॉप');
      expect(t('doctorDashboard')).toBe('डॉक्टर क्लिनिकल डॅशबोर्ड');
      expect(t('bedManagement')).toBe('बेड व्यवस्थापन');
    });

    it('should translate to Hindi accurately', () => {
      setDesktopLanguage('HINDI');
      expect(getDesktopLanguage()).toBe('HINDI');
      expect(t('appName')).toBe('केयरग्रिड डेस्कटॉप');
      expect(t('facilityDashboard')).toBe('अस्पताल प्रबंधन');
      expect(t('districtDashboard')).toBe('जिला प्रशासन');
    });
  });

  describe('Desktop API Client & Session', () => {
    it('should correctly set and get auth tokens', () => {
      setAuthToken('test-desktop-jwt-token');
      expect(getAuthToken()).toBe('test-desktop-jwt-token');

      setAuthToken(null);
      expect(getAuthToken()).toBeNull();
    });
  });
});
