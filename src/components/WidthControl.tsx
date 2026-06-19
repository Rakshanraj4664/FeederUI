interface WidthControlProps {
  width: number;
  onWidthChange: (width: number) => void;
}

export default function WidthControl({ width, onWidthChange }: WidthControlProps) {
  return (
    <div className="bg-gray-800 rounded-xl border border-amber-700/50 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-amber-400">Width Control - Roller 1</h2>
        <span className="text-sm text-gray-400">PLC: D20004/D20006</span>
      </div>

      <div className="flex items-center gap-4">
        <input
          type="range"
          min={0}
          max={100}
          step={0.5}
          value={width}
          onChange={(e) => onWidthChange(Number(e.target.value))}
          className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
        />
        <input
          type="number"
          min={0}
          max={100}
          step={0.5}
          value={width}
          onChange={(e) => onWidthChange(Math.min(100, Math.max(0, Number(e.target.value))))}
          className="w-24 text-center bg-gray-700 border border-amber-700/50 rounded-lg px-3 py-1.5 text-white text-sm"
        />
        <span className="text-sm text-gray-400 w-8">%</span>
      </div>
    </div>
  );
}
