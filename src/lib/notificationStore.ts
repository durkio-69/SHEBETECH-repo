import { genericSyncWithDatabase } from './dokanStore';

export interface DokanNotification {
  id: string;
  timestamp: string;
  eventType: 'order_placed' | 'order_delivered' | 'withdrawal_request' | 'customer_comment' | 'rider_registration' | 'vendor_registration' | 'vendor_approved' | 'vendor_rejected' | 'rider_assigned' | 'rider_accepted' | 'rider_rejected' | 'rider_payout_submitted' | 'refund_requested' | 'refund_vendor_decision' | 'refund_admin_decision';
  channel: 'sms' | 'email' | 'whatsapp';
  recipient: string; // e.g. "Vendor: Mukwano Online", "Admin", "Customer"
  recipientContact: string; // Phone, Email or account number
  message: string;
  status: 'sent' | 'delivered';
}

const INITIAL_NOTIFICATIONS: DokanNotification[] = [
  {
    id: 'notif-1',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    eventType: 'order_placed',
    channel: 'sms',
    recipient: 'Vendor: Tecno Official Outlet',
    recipientContact: '0702 456789',
    message: 'Olimart Alert: New Order ORDER-10492 has been placed. Fulfill Tecno Spark 20 Pro x1. Earn: Shs 582,250.',
    status: 'delivered'
  },
  {
    id: 'notif-2',
    timestamp: new Date(Date.now() - 3590000).toISOString(),
    eventType: 'order_placed',
    channel: 'whatsapp',
    recipient: 'Super Admin',
    recipientContact: '0772 900000',
    message: '🚨 Olimart Admin Dispatch: New Order ORDER-10492 placed by Nakato Sarah for Shs 694,600. Platform commission cut is +Shs 102,750.',
    status: 'delivered'
  },
  {
    id: 'notif-3',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    eventType: 'withdrawal_request',
    channel: 'email',
    recipient: 'Super Admin',
    recipientContact: 'admin@olimart.co.ug',
    message: 'Subject: [PAYOUT REQUEST] Mukwano Industries (v1) requested a withdrawal of Shs 250,000 via direct bank transfer.',
    status: 'delivered'
  }
];

export function getDokanNotifications(): DokanNotification[] {
  setTimeout(() => { syncNotificationsWithDatabase().catch(() => {}); }, 100);
  const saved = localStorage.getItem('dokan_notifications');
  if (saved) return JSON.parse(saved);
  localStorage.setItem('dokan_notifications', JSON.stringify(INITIAL_NOTIFICATIONS));
  return INITIAL_NOTIFICATIONS;
}

export async function syncNotificationsWithDatabase() {
  return genericSyncWithDatabase<DokanNotification>({
    key: "notifications",
    apiPath: "/api/db/notifications",
    localStorageKey: "dokan_notifications",
    getLocal: getDokanNotifications,
  });
}

export function saveDokanNotifications(notifs: DokanNotification[]) {
  localStorage.setItem('dokan_notifications', JSON.stringify(notifs));
  fetch("/api/db/notifications/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(notifs)
  }).catch(err => console.warn("Failed to sync notifications on save:", err));
  // Notify listening widgets in other parts of the app
  window.dispatchEvent(new Event('storage'));
}

export function addDokanNotification(notif: Omit<DokanNotification, 'id' | 'timestamp'>) {
  const list = getDokanNotifications();
  const newNotif: DokanNotification = {
    ...notif,
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString()
  };
  list.unshift(newNotif);
  saveDokanNotifications(list);
  return newNotif;
}

// Emits beautiful event-driven alerts simultaneously across multiple channels (SMS, Email, WhatsApp)
export function emitEventDrivenNotifications(
  eventType: 'order_placed' | 'order_delivered' | 'withdrawal_request' | 'customer_comment' | 'rider_registration' | 'vendor_registration' | 'refund_requested' | 'refund_vendor_decision' | 'refund_admin_decision',
  data: any
) {
  if (eventType === 'order_placed') {
    const { orderId, customerName, customerPhone, items, total, subtotal, commission, vendorEarnings, customerLocation } = data;
    
    // 1. Notify Admin via WhatsApp & SMS
    addDokanNotification({
      eventType: 'order_placed',
      channel: 'whatsapp',
      recipient: 'Super Admin',
      recipientContact: '0772 900000',
      message: `🚨 Olimart Admin Radar: Order ${orderId} has been placed by ${customerName} (${customerPhone}) from ${customerLocation}. Total: Shs ${(total ?? 0).toLocaleString()}. Platform 15% commission is +Shs ${(commission ?? 0).toLocaleString()}.`,
      status: 'delivered'
    });

    addDokanNotification({
      eventType: 'order_placed',
      channel: 'sms',
      recipient: 'Super Admin',
      recipientContact: '0772 900000',
      message: `Olimart Escrow Admin: Invoice ${orderId} created for Shs ${(total ?? 0).toLocaleString()}. Net commissions: Shs ${(commission ?? 0).toLocaleString()}. Assigned for auto-boda routing.`,
      status: 'delivered'
    });

    // 2. Notify each participating Vendor via Email & SMS
    // Let's deduce vendors from items
    const vendorMap = new Map<string, { sub: number, qty: number, email: string, phone: string }>();
    
    // Map of sample contact details
    const sampleContacts: Record<string, { email: string, phone: string }> = {
      'Mukwano Industries Online': { email: 'sales@mukwano.co.ug', phone: '0772 900100' },
      'Tecno Official Outlet Kampala': { email: 'kampala@tecno-mobile.com', phone: '0702 456789' },
      'Ssebaggala Mobiles Ltd': { email: 'sseba.mobiles@gmail.com', phone: '0772 555666' }
    };

    (items || []).forEach((item: any) => {
      const vName = item.selectedVendor || 'Tecno Official Outlet Kampala';
      const price = item.customPrice !== undefined ? item.customPrice : (item.product?.price ?? 0);
      const qty = item.quantity ?? 1;
      const sub = price * qty;
      const current = vendorMap.get(vName) || { sub: 0, qty: 0, email: 'sales@dokanvendor.co.ug', phone: '0700 000000' };
      
      const contacts = sampleContacts[vName] || { email: `${vName.toLowerCase().replace(/\s+/g, '')}@olimart.co.ug`, phone: '0770 123456' };

      vendorMap.set(vName, {
        sub: current.sub + sub,
        qty: current.qty + qty,
        email: contacts.email,
        phone: contacts.phone
      });
    });

    vendorMap.forEach((info, vendorName) => {
      const vEarn = Math.round(info.sub * 0.85);
      
      // Email Notification
      addDokanNotification({
        eventType: 'order_placed',
        channel: 'email',
        recipient: `Vendor: ${vendorName}`,
        recipientContact: info.email,
        message: `Subject: [NEW ORDER] Olimart Dokan Order ${orderId} Received!\n\nDear Store Manager of ${vendorName},\n\nYou have received a new customer order on Olimart. \n\nOrder Ref: ${orderId}\nTotal Items: ${info.qty}\nSubtotal Sales: Shs ${(info.sub ?? 0).toLocaleString()}\nYour 85% Wallet Earnings: Shs ${(vEarn ?? 0).toLocaleString()} (Credited to Escrow Ledger)\nCustomer Destination: ${customerLocation}\n\nPlease prepare the shipment immediately for the Boda Courier dispatch pickup.`,
        status: 'delivered'
      });

      // SMS Notification
      addDokanNotification({
        eventType: 'order_placed',
        channel: 'sms',
        recipient: `Vendor: ${vendorName}`,
        recipientContact: info.phone,
        message: `Olimart Dokan: New Order ${orderId} received for ${vendorName}! Items count: ${info.qty}. Wallet earnings: +Shs ${(vEarn ?? 0).toLocaleString()} credited. Fulfill immediately.`,
        status: 'delivered'
      });
    });
  }

  if (eventType === 'order_delivered') {
    const { orderId, customerName, items, vendorEarnings } = data;

    // Notify participating vendors that the order is delivered
    const sampleContacts: Record<string, { email: string, phone: string }> = {
      'Mukwano Industries Online': { email: 'sales@mukwano.co.ug', phone: '0772 900100' },
      'Tecno Official Outlet Kampala': { email: 'kampala@tecno-mobile.com', phone: '0702 456789' },
      'Ssebaggala Mobiles Ltd': { email: 'sseba.mobiles@gmail.com', phone: '0772 555666' }
    };

    (items || []).forEach((item: any) => {
      const vName = item.selectedVendor || 'Tecno Official Outlet Kampala';
      const contacts = sampleContacts[vName] || { email: 'sales@vendor.co.ug', phone: '0770 123456' };
      const itemPrice = item.customPrice !== undefined ? item.customPrice : (item.product?.price ?? 0);
      const qty = item.quantity ?? 1;
      const earn = Math.round(itemPrice * qty * 0.85);

      // SMS notification to Vendor on delivery
      addDokanNotification({
        eventType: 'order_delivered',
        channel: 'sms',
        recipient: `Vendor: ${vName}`,
        recipientContact: contacts.phone,
        message: `Olimart Dispatch: Order ${orderId} has been successfully delivered to ${customerName}. Shs ${(earn ?? 0).toLocaleString()} is fully cleared in your available wallet. Mwebale!`,
        status: 'delivered'
      });

      // WhatsApp live alert to Vendor
      addDokanNotification({
        eventType: 'order_delivered',
        channel: 'whatsapp',
        recipient: `Vendor: ${vName}`,
        recipientContact: contacts.phone,
        message: `🏬 Dokan Hub: Great news! Order ${orderId} was signed and delivered safely. Your wallet balance has been unfrozen for immediate payout withdraw request.`,
        status: 'delivered'
      });
    });

    // Notify Admin
    addDokanNotification({
      eventType: 'order_delivered',
      channel: 'sms',
      recipient: 'Super Admin',
      recipientContact: '0772 900000',
      message: `Olimart Admin Alert: Delivery courier Ronald Express confirmed safe drop for invoice ${orderId}. Funds distributed. Escrow updated.`,
      status: 'delivered'
    });
  }

  if (eventType === 'withdrawal_request') {
    const { vendorName, amount, method, details } = data;

    // Notify Admin of withdrawal request via Email & SMS
    addDokanNotification({
      eventType: 'withdrawal_request',
      channel: 'email',
      recipient: 'Super Admin',
      recipientContact: 'admin@olimart.co.ug',
      message: `Subject: [ALERT] Payout Withdrawal Request from ${vendorName}\n\nOlimart Central Treasury,\n\nVendor "${vendorName}" has submitted a new payout request for Shs ${(amount ?? 0).toLocaleString()} using the payment route: "${method}".\n\nPayout details: ${details}\n\nPlease audit their commission ledger and approve or deny this transaction immediately in the Admin Console.`,
      status: 'delivered'
    });

    addDokanNotification({
      eventType: 'withdrawal_request',
      channel: 'whatsapp',
      recipient: 'Super Admin',
      recipientContact: '0772 900000',
      message: `💸 Olympus Treasury Alert: Vendor "${vendorName}" has requested a payout of Shs ${(amount ?? 0).toLocaleString()} via ${method.toUpperCase()} (${details}). Review at /admin-withdrawals.`,
      status: 'delivered'
    });
  }

  if (eventType === 'customer_comment') {
    const { customerName, productTitle, rating, comment } = data;

    // Notify Admin of customer review/comment
    addDokanNotification({
      eventType: 'customer_comment',
      channel: 'email',
      recipient: 'Super Admin',
      recipientContact: 'admin@olimart.co.ug',
      message: `Subject: [NEW REVIEWS] Review Left for "${productTitle}"\n\nDear Admin,\n\nCustomer ${customerName} has left a ${rating}-star feedback review.\n\nVerbatim Comment:\n"${comment}"\n\nYou can moderate or view this review in the Admin review console tab.`,
      status: 'delivered'
    });

    addDokanNotification({
      eventType: 'customer_comment',
      channel: 'sms',
      recipient: 'Super Admin',
      recipientContact: '0772 900000',
      message: `Olimart Reviews Guard: Customer ${customerName} rated "${productTitle.split(' - ')[0]}" with ${rating} stars. Comment: "${comment.substring(0, 45)}..."`,
      status: 'delivered'
    });
  }

  if (eventType === 'rider_registration') {
    const { riderName, phone, email, idCard, motorcyclePlate, accessLink } = data;

    // 1. WhatsApp Simulation Log
    addDokanNotification({
      eventType: 'rider_registration',
      channel: 'whatsapp',
      recipient: `Rider: ${riderName}`,
      recipientContact: phone,
      message: `Hi ${riderName}, congratulations! Your Olimart Boda profile is active. Access dashboard: ${accessLink}`,
      status: 'delivered'
    });

    // 2. SMS Simulation Log
    addDokanNotification({
      eventType: 'rider_registration',
      channel: 'sms',
      recipient: `Rider: ${riderName}`,
      recipientContact: phone,
      message: `OLIMART DISPATCH: Driver account approved. Access dashboard at: ${accessLink}`,
      status: 'delivered'
    });

    // 3. Email Simulation Log
    addDokanNotification({
      eventType: 'rider_registration',
      channel: 'email',
      recipient: `Rider: ${riderName}`,
      recipientContact: email,
      message: `Subject: Olimart Boda Partner Welcom Kit\n\nDear ${riderName},\n\nYour driver headshot and vehicle details (Reg: ${motorcyclePlate}) are verified. Access link: ${accessLink}`,
      status: 'delivered'
    });
  }

  if (eventType === 'vendor_registration') {
    const { storeName, email, phone, accessLink, uniqueId } = data;

    // WhatsApp Simulation Log to the new vendor
    addDokanNotification({
      eventType: 'vendor_registration',
      channel: 'whatsapp',
      recipient: `Vendor: ${storeName}`,
      recipientContact: phone,
      message: `Store ${storeName} registered! Unique Vendor ID: ${uniqueId}. Admin review in progress. Access dashboard: ${accessLink}`,
      status: 'delivered'
    });

    // Notify Super Admin that a new vendor is pending approval
    addDokanNotification({
      eventType: 'vendor_registration',
      channel: 'whatsapp',
      recipient: 'Super Admin',
      recipientContact: '0772 900000',
      message: `🆕 New Seller Application: "${storeName}" (ID: ${uniqueId}) has registered and is PENDING approval. Contact: ${phone} / ${email}. Please review in the Vendor Approvals queue.`,
      status: 'delivered'
    });

    addDokanNotification({
      eventType: 'vendor_registration',
      channel: 'email',
      recipient: 'Super Admin',
      recipientContact: 'admin@olimart.ug',
      message: `Subject: New Vendor Pending Approval — ${storeName}\n\nA new seller account has been submitted and is awaiting your review.\n\nStore: ${storeName}\nVendor ID: ${uniqueId}\nEmail: ${email}\nPhone: ${phone}\n\nPlease log in to the Admin Console → Vendor Approvals to approve or reject this application.`,
      status: 'delivered'
    });
  }

  if (eventType === 'vendor_approved') {
    const { orderId, vendorName, customerName, customerPhone } = data;
    // Notify Admin
    addDokanNotification({
      eventType: 'vendor_approved',
      channel: 'whatsapp',
      recipient: 'Super Admin',
      recipientContact: '0772 900000',
      message: `✅ Order Approved: Vendor "${vendorName}" has APPROVED Order ${orderId} for customer ${customerName}. Ready for Admin to route a nearby rider.`,
      status: 'delivered'
    });
    // Notify Customer
    addDokanNotification({
      eventType: 'vendor_approved',
      channel: 'sms',
      recipient: `Customer: ${customerName}`,
      recipientContact: customerPhone || '0772 123456',
      message: `Olimart: Your order ${orderId} has been approved by the seller (${vendorName})! It is being packed. Our dispatch team is allocating your Boda rider.`,
      status: 'delivered'
    });
  }

  if (eventType === 'vendor_rejected') {
    const { orderId, vendorName, customerName, customerPhone } = data;
    // Notify Admin
    addDokanNotification({
      eventType: 'vendor_rejected',
      channel: 'whatsapp',
      recipient: 'Super Admin',
      recipientContact: '0772 900000',
      message: `❌ Order Rejected: Vendor "${vendorName}" has REJECTED Order ${orderId}. Customer: ${customerName}. Please check logs.`,
      status: 'delivered'
    });
    // Notify Customer
    addDokanNotification({
      eventType: 'vendor_rejected',
      channel: 'sms',
      recipient: `Customer: ${customerName}`,
      recipientContact: customerPhone || '0772 123456',
      message: `Olimart Update: We regret to inform you that your order ${orderId} was declined by the seller. Any electronic payment has been instantly refunded to your wallet.`,
      status: 'delivered'
    });
  }

  if (eventType === 'rider_assigned') {
    const { orderId, vendorName, riderName, riderPhone, customerName, customerAddress, customerPhone, deliveryFee } = data;
    // Notify Vendor on who is coming
    addDokanNotification({
      eventType: 'rider_assigned',
      channel: 'sms',
      recipient: `Vendor: ${vendorName}`,
      recipientContact: '0700 000000',
      message: `Olimart Boda Logistics: Dispatch Rider "${riderName}" (${riderPhone}) has been assigned to pick up Order ${orderId}. Please hand over the products on arrival.`,
      status: 'delivered'
    });
    // Notify Rider with order details
    addDokanNotification({
      eventType: 'rider_assigned',
      channel: 'whatsapp',
      recipient: `Rider: ${riderName}`,
      recipientContact: riderPhone,
      message: `🏍️ Olimart New Dispatch Job: Order ${orderId} assigned. Pick up from: ${vendorName}. Deliver to Client: ${customerName} at Address: ${customerAddress} (Phone: ${customerPhone}). Delivery Fee Earned: Shs ${deliveryFee.toLocaleString()}. Accept or Reject the order on your dashboard.`,
      status: 'delivered'
    });
  }

  if (eventType === 'rider_accepted') {
    const { orderId, customerName, customerPhone, vendorName, riderName, riderPhone, riderPlate, riderMeans } = data;
    // Notify Customer with rider details
    addDokanNotification({
      eventType: 'rider_accepted',
      channel: 'sms',
      recipient: `Customer: ${customerName}`,
      recipientContact: customerPhone,
      message: `Olimart: Your package for order ${orderId} is now IN TRANSIT! Assigned Rider: ${riderName} (Phone: ${riderPhone}, Reg Plate: ${riderPlate}, Type: ${riderMeans}). You can track their live progress on your Olimart radar dashboard!`,
      status: 'delivered'
    });
    // Notify Vendor
    addDokanNotification({
      eventType: 'rider_accepted',
      channel: 'sms',
      recipient: `Vendor: ${vendorName}`,
      recipientContact: '0700 000000',
      message: `Olimart: Rider ${riderName} has ACCEPTED your shipment for Order ${orderId} and is currently en-route to pick up the products.`,
      status: 'delivered'
    });
    // Notify Admin
    addDokanNotification({
      eventType: 'rider_accepted',
      channel: 'whatsapp',
      recipient: 'Super Admin',
      recipientContact: '0772 900000',
      message: `🏍️ Rider Dispatch Success: Courier ${riderName} has ACCEPTED Order ${orderId} and is on-route. Tracking initiated.`,
      status: 'delivered'
    });
  }

  if (eventType === 'rider_rejected') {
    const { orderId, riderName, vendorName } = data;
    // Notify Admin
    addDokanNotification({
      eventType: 'rider_rejected',
      channel: 'whatsapp',
      recipient: 'Super Admin',
      recipientContact: '0772 900000',
      message: `⚠️ Rider Rejected Job: Courier ${riderName} declined pickup for Order ${orderId} (Vendor: ${vendorName}). Order returned to pending dispatch queue. Please re-assign nearby rider.`,
      status: 'delivered'
    });
  }

  if (eventType === 'rider_payout_submitted') {
    const { riderName, amount, txRef, method, details } = data;
    // Notify Admin
    addDokanNotification({
      eventType: 'rider_payout_submitted',
      channel: 'email',
      recipient: 'Super Admin',
      recipientContact: 'admin@olimart.co.ug',
      message: `Subject: [RIDER TRANS] New Boda Payout Transaction Details Submitted\n\nDear Central Treasury,\n\nCourier Rider "${riderName}" has submitted payout details to unlock their escrow balance of Shs ${amount.toLocaleString()}.\n\nMethod: ${method.toUpperCase()}\nAccount: ${details}\nTransaction Reference Number: ${txRef}\n\nPlease audit their completed drops and approve payout transactions.`,
      status: 'delivered'
    });
  }

  if (eventType === 'refund_requested') {
    const { orderId, customerName, vendorName, amount, reason } = data;
    // Notify Vendor — they get first right of response
    addDokanNotification({
      eventType: 'refund_requested',
      channel: 'whatsapp',
      recipient: `Vendor: ${vendorName}`,
      recipientContact: '0700 000000',
      message: `💸 Refund Requested: Customer ${customerName} has requested a refund of Shs ${(amount ?? 0).toLocaleString()} for Order ${orderId}. Reason: "${reason}". Please review and respond within 48 hours.`,
      status: 'delivered'
    });
    // Notify Admin for visibility
    addDokanNotification({
      eventType: 'refund_requested',
      channel: 'whatsapp',
      recipient: 'Super Admin',
      recipientContact: '0772 900000',
      message: `💸 New Refund Request: Order ${orderId} (Vendor: ${vendorName}, Customer: ${customerName}) — Shs ${(amount ?? 0).toLocaleString()}. Awaiting vendor response, then admin finalization.`,
      status: 'delivered'
    });
  }

  if (eventType === 'refund_vendor_decision') {
    const { orderId, customerName, customerPhone, vendorName, decision, amount } = data;
    // Notify Admin to finalize
    addDokanNotification({
      eventType: 'refund_vendor_decision',
      channel: 'whatsapp',
      recipient: 'Super Admin',
      recipientContact: '0772 900000',
      message: `Vendor "${vendorName}" has ${decision === 'vendor_approved' ? 'APPROVED' : 'REJECTED'} the refund for Order ${orderId} (Shs ${(amount ?? 0).toLocaleString()}). ${decision === 'vendor_approved' ? 'Please process the final payout to the customer.' : 'Customer may escalate — please review.'}`,
      status: 'delivered'
    });
    // Notify Customer of progress
    addDokanNotification({
      eventType: 'refund_vendor_decision',
      channel: 'sms',
      recipient: `Customer: ${customerName}`,
      recipientContact: customerPhone || '0772 123456',
      message: decision === 'vendor_approved'
        ? `Olimart: Good news — ${vendorName} approved your refund for Order ${orderId}. Our admin team is finalizing your payout.`
        : `Olimart: ${vendorName} was unable to approve your refund for Order ${orderId} directly. Your case has been escalated to Olimart Admin for review.`,
      status: 'delivered'
    });
  }

  if (eventType === 'refund_admin_decision') {
    const { orderId, customerName, customerPhone, amount, decision } = data;
    addDokanNotification({
      eventType: 'refund_admin_decision',
      channel: 'sms',
      recipient: `Customer: ${customerName}`,
      recipientContact: customerPhone || '0772 123456',
      message: decision === 'refunded'
        ? `Olimart: Your refund of Shs ${(amount ?? 0).toLocaleString()} for Order ${orderId} has been processed. Funds will reflect within 24-48 hours.`
        : `Olimart: After review, Olimart Admin was unable to approve your refund request for Order ${orderId}. Contact support for more details.`,
      status: 'delivered'
    });
  }
}
