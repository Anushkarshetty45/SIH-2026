// Doctor Facility Beds Screen — React Native
import React from 'react';
import { BedAvailabilityScreen } from '../availability/BedAvailabilityScreen';

export const FacilityBedsScreen: React.FC = () => {
  return <BedAvailabilityScreen facilityId="fac-sdh-manchar" facilityName="Sub-District Hospital Manchar" />;
};

export default FacilityBedsScreen;
