// src/components/common/ConfirmDialog.jsx
import AnimatedModal from "../AnimatedModal";
import Button from "../Button";

export default function ConfirmDialog({
  isVisible,
  title = "آیا مطمئن هستید؟",
  message = "این عملیات قابل بازگشت نیست.",
  confirmText = "تأیید",
  cancelText = "انصراف",
  danger = true,
  onConfirm,
  onCancel,
}) {
  return (
    <AnimatedModal isVisible={isVisible} onClose={onCancel}>
      <h3 className="font-secondary text-lg text-text_primary_color mb-2">{title}</h3>
      <p className="text-sm text-text_secondary_color mb-6">{message}</p>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          onClick={onCancel}
          className="bg-gray-200 text-text_primary_color px-4 py-2 w-auto h-auto"
        >
          {cancelText}
        </Button>
        <Button
          type="button"
          onClick={onConfirm}
          className={`px-4 py-2 w-auto h-auto text-white ${danger ? "bg-error hover:bg-red-600" : "bg-secondary"}`}
        >
          {confirmText}
        </Button>
      </div>
    </AnimatedModal>
  );
}
