export function AuthDivider({ label = 'Or continue with:' }: { label?: string }) {
  return (
    <div className="relative my-8">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-surface-elevated px-4 text-sm text-moons-muted">{label}</span>
      </div>
    </div>
  );
}
