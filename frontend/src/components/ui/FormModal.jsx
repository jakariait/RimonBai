import { Modal } from './Modal';
import { Button } from './Button';

function FormModal({ open, onClose, title, onSubmit, children, isLoading, size = 'md' }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size={size}>
      <form onSubmit={onSubmit} className="space-y-4">
        {children}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export { FormModal };
