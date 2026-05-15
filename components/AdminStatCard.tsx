type Props = {
  label: string;
  value: string | number;
};

export default function AdminStatCard({ label, value }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-panel p-4">
      <p className="text-sm text-textMuted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-accent">{value}</p>
    </div>
  );
}
