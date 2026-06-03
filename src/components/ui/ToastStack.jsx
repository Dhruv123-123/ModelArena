import { useToastStore } from '../../stores/useToastStore';

const TYPE_STYLES = {
  info: 'border-border bg-bg-panel text-text-base',
  success: 'border-primary/40 bg-primary/10 text-primary',
  error: 'border-red-500/40 bg-red-500/10 text-red-300',
};

export function ToastStack() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 lg:bottom-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`glass-panel flex max-w-sm items-center justify-between gap-3 px-4 py-3 text-sm shadow-lg ${TYPE_STYLES[t.type] ?? TYPE_STYLES.info}`}
        >
          <span>{t.message}</span>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            className="text-text-muted hover:text-text-base"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
