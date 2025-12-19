interface SupportGaugeProps {
  supportCount: number;
  opposeCount: number;
  className?: string;
}

export function SupportGauge({ supportCount, opposeCount, className = "" }: SupportGaugeProps) {
  const total = supportCount + opposeCount;
  const supportPercentage = total > 0 ? Math.round((supportCount / total) * 100) : 50;
  const opposePercentage = 100 - supportPercentage;

  // Marker position: 0% = full support (left), 100% = full oppose (right)
  // We invert it so support pulls the marker left
  const markerPosition = opposePercentage;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* Labels row */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Support</span>
        <span>Oppose</span>
      </div>

      {/* Gauge track with marker */}
      <div className="relative h-2 w-full rounded-full bg-gradient-to-r from-green-200 to-gray-300">
        {/* Marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gray-700 border-2 border-white shadow-sm transition-all duration-300"
          style={{ left: `calc(${markerPosition}% - 6px)` }}
        />
      </div>

      {/* Percentages row */}
      <div className="flex justify-between text-xs font-medium">
        <span className="text-green-600">{supportPercentage}%</span>
        <span className="text-gray-500">{opposePercentage}%</span>
      </div>
    </div>
  );
}
