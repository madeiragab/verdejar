import { STATUS_LABEL } from '../lib/catalog';
import type { Status } from '../api/types';

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`badge badge-${status.toLowerCase()}`}>{STATUS_LABEL[status]}</span>;
}
