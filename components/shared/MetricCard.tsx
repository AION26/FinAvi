import React from 'react';

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

const MetricCard = ({ icon, label, value }: MetricCardProps) => (
  <div className="flex items-center space-x-3">
    <div className="bg-blue-50 p-2 rounded-full">
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  </div>
);

export default MetricCard;
