import React from 'react';
import CapacityView from '../team/CapacityView';

/**
 * SchedulerView
 * Consolidated into unified Capacity & Scheduling Hub.
 * Forwards with initialMode="schedule" for backward compatibility.
 */
const SchedulerView: React.FC = () => {
  return <CapacityView initialMode="schedule" />;
};

export default SchedulerView;
