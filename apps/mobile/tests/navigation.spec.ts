import { formatElapsedTime } from '../src/components/StaleDataWarning';
import { getRootFlowForRole } from '../src/navigation/routes';
import { UserRole } from '../src/types';

describe('Stale Data Warning — formatElapsedTime', () => {
  it('should return "just now" for recent timestamps', () => {
    const recentDate = new Date(Date.now() - 30 * 1000).toISOString(); // 30 sec ago
    const result = formatElapsedTime(recentDate);
    expect(result.displayText).toBe('just now');
  });

  it('should return minutes for < 1 hour', () => {
    const date = new Date(Date.now() - 42 * 60 * 1000).toISOString(); // 42 min ago
    const result = formatElapsedTime(date);
    expect(result.minutes).toBe(42);
    expect(result.displayText).toBe('42 min ago');
  });

  it('should return hours and minutes for > 1 hour', () => {
    const date = new Date(Date.now() - (2 * 60 + 14) * 60 * 1000).toISOString(); // 2h14m ago
    const result = formatElapsedTime(date);
    expect(result.displayText).toBe('2h 14m ago');
    expect(result.minutes).toBe(134);
  });

  it('should detect stale data beyond 120-minute threshold', () => {
    const date = new Date(Date.now() - 125 * 60 * 1000).toISOString(); // 2h 5m ago
    const { minutes } = formatElapsedTime(date);
    const isStale = minutes >= 120;
    expect(isStale).toBe(true);
  });

  it('should detect current data within threshold', () => {
    const date = new Date(Date.now() - 35 * 60 * 1000).toISOString(); // 35 min ago
    const { minutes } = formatElapsedTime(date);
    const isStale = minutes >= 120;
    expect(isStale).toBe(false);
  });
});

describe('Role-Based Navigation — getRootFlowForRole', () => {
  it('should route ASHA_WORKER to AshaFlow', () => {
    expect(getRootFlowForRole('ASHA_WORKER')).toBe('AshaFlow');
  });

  it('should route PHC_STAFF to AshaFlow', () => {
    expect(getRootFlowForRole('PHC_STAFF')).toBe('AshaFlow');
  });

  it('should route DOCTOR to DoctorFlow', () => {
    expect(getRootFlowForRole('DOCTOR')).toBe('DoctorFlow');
  });

  it('should route AMBULANCE_STAFF to AmbulanceFlow', () => {
    expect(getRootFlowForRole('AMBULANCE_STAFF')).toBe('AmbulanceFlow');
  });

  it('should route FACILITY_STAFF to FacilityAdminFlow', () => {
    expect(getRootFlowForRole('FACILITY_STAFF')).toBe('FacilityAdminFlow');
  });

  it('should route HOSPITAL_ADMIN to FacilityAdminFlow', () => {
    expect(getRootFlowForRole('HOSPITAL_ADMIN')).toBe('FacilityAdminFlow');
  });

  it('should route SUPER_ADMIN to DistrictAdminFlow', () => {
    expect(getRootFlowForRole('SUPER_ADMIN')).toBe('DistrictAdminFlow');
  });

  it('should route null/undefined to Auth', () => {
    expect(getRootFlowForRole(null)).toBe('Auth');
    expect(getRootFlowForRole(undefined)).toBe('Auth');
  });
});
