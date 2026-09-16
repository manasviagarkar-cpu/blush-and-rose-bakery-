import React from 'react';
import { ORDER_STATUSES, OrderStatus } from '@/lib/constants';

interface OrderStatusBadgeProps {
  status: OrderStatus | string;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  let badgeClass = 'badge-new';

  switch (status) {
    case ORDER_STATUSES.NEW_REQUEST:
      badgeClass = 'badge-new';
      break;
    case ORDER_STATUSES.AWAITING_BAKER_REVIEW:
      badgeClass = 'badge-review';
      break;
    case ORDER_STATUSES.PRICE_SENT:
    case ORDER_STATUSES.AWAITING_CUSTOMER_APPROVAL:
      badgeClass = 'badge-price';
      break;
    case ORDER_STATUSES.DEPOSIT_PENDING:
      badgeClass = 'badge-deposit';
      break;
    case ORDER_STATUSES.CONFIRMED:
      badgeClass = 'badge-confirmed';
      break;
    case ORDER_STATUSES.IN_PREPARATION:
      badgeClass = 'badge-prep';
      break;
    case ORDER_STATUSES.READY_FOR_PICKUP:
      badgeClass = 'badge-ready';
      break;
    case ORDER_STATUSES.PICKED_UP:
    case ORDER_STATUSES.COMPLETED:
      badgeClass = 'badge-completed';
      break;
    case ORDER_STATUSES.REJECTED:
    case ORDER_STATUSES.CANCELLED:
      badgeClass = 'badge-cancelled';
      break;
    default:
      badgeClass = 'badge-new';
  }

  return (
    <span className={`badge ${badgeClass}`} title={`Current status: ${status}`}>
      ● {status}
    </span>
  );
}
