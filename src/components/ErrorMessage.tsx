interface ErrorMessageProps {
  errors: Array<{ field: string; message: string }>;
  onDismiss?: () => void;
}

export default function ErrorMessage({ errors, onDismiss }: ErrorMessageProps) {
  if (errors.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-800 mb-2">
            ⚠️ 参数验证失败
          </h3>
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm text-red-700">
                {error.message}
              </li>
            ))}
          </ul>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-4 text-red-600 hover:text-red-800"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

