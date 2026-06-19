interface RollerCardProps {
  label: string;
  speed: number;
  enabled: boolean;
  onSpeedChange: (speed: number) => void;
  onEnabledChange: (enabled: boolean) => void;
}

export default function RollerCard({
  label,
  speed,
  enabled,
  onSpeedChange,
  onEnabledChange,
}: RollerCardProps) {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">{label}</h2>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:bg-emerald-500 peer-focus:ring-2 peer-focus:ring-emerald-400 transition-colors" />
          <span className="ml-3 text-sm text-gray-400 w-10">
            {enabled ? "ON" : "OFF"}
          </span>
        </label>
      </div>

      <div className="flex items-center gap-4">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          disabled={!enabled}
          className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-40"
        />
        <input
          type="number"
          min={0}
          max={100}
          value={speed}
          onChange={(e) => onSpeedChange(Math.min(100, Math.max(0, Number(e.target.value))))}
          disabled={!enabled}
          className="w-20 text-center bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm disabled:opacity-40"
        />
        <span className="text-sm text-gray-400 w-8">%</span>
      </div>
    </div>
  );
}
