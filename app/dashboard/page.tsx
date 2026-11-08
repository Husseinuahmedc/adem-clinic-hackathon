'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { bookingReasons, clinicDisplayName, demoAreas } from '../../lib/clinic-content';
import { ageGroup, ageGroups, Booking, BookingStatus, readBookings, writeBookings } from '../../lib/storage';

const labels: Record<BookingStatus, string> = { new: 'جديدة', confirmed: 'مؤكد', complaint: 'شكوى', closed: 'مغلقة' };

function isInternationalNumber(value: string) {
  return /^[1-9]\d{7,14}$/.test(value);
}

function normalizeDigits(value: string) {
  return value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - '٠'.charCodeAt(0)))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - '۰'.charCodeAt(0)));
}

function getWhatsAppMessage(booking: Booking, date: string, time: string) {
  const appointment = new Date(`${date}T${time}:00+03:00`);
  const formattedDate = new Intl.DateTimeFormat('ar-IQ-u-nu-latn', { timeZone: 'Asia/Baghdad', year: 'numeric', month: 'long', day: 'numeric' }).format(appointment);
  const formattedTime = new Intl.DateTimeFormat('ar-IQ-u-nu-latn', { timeZone: 'Asia/Baghdad', hour: 'numeric', minute: '2-digit', hour12: true }).format(appointment);
  return `أهلاً ${booking.name}، تم تأكيد موعدك في ${clinicDisplayName} يوم ${formattedDate} الساعة ${formattedTime}.`;
}

function getWhatsAppLink(booking: Booking, date: string, time: string) {
  return `https://wa.me/${booking.phone}?text=${encodeURIComponent(getWhatsAppMessage(booking, date, time))}`;
}

function matchesDemographics(booking: Booking, selectedArea: string, selectedGroup: string) {
  return (selectedArea === 'الكل' || booking.area === selectedArea) && (selectedGroup === 'الكل' || ageGroup(booking.age) === selectedGroup);
}

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<'new' | 'all' | 'complaint' | 'today' | 'pending'>('new');
  const [area, setArea] = useState('الكل');
  const [group, setGroup] = useState('الكل');
  const [manualOpen, setManualOpen] = useState(false);
  const [manualForm, setManualForm] = useState({ name: '', age: '', area: '', phone: '', bookingReason: '' });
  const [manualError, setManualError] = useState('');

  useEffect(() => { setBookings(readBookings()); setMounted(true); }, []);
  function save(updated: Booking[]) { setBookings(updated); writeBookings(updated); }
  function update(id: string, patch: Partial<Booking>) {
    save(bookings.map((booking) => {
      if (booking.id !== id) return booking;
      const dateChanged = Object.prototype.hasOwnProperty.call(patch, 'appointmentDate') && patch.appointmentDate !== booking.appointmentDate;
      const timeChanged = Object.prototype.hasOwnProperty.call(patch, 'appointmentTime') && patch.appointmentTime !== booking.appointmentTime;
      return { ...booking, ...patch, ...(booking.source === 'whatsapp' && (dateChanged || timeChanged) ? { confirmationSentAt: undefined } : {}) };
    }));
  }

  function addWhatsAppBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const age = Number(normalizeDigits(manualForm.age));
    if (!manualForm.name.trim() || !Number.isInteger(age) || age < 0 || age > 120 || !manualForm.area || !isInternationalNumber(manualForm.phone)) {
      setManualError('أدخل الاسم والعمر والمنطقة ورقم واتساب دولياً بالأرقام فقط، مثل 9647701234567.');
      return;
    }
    const booking: Booking = { id: `whatsapp-${Date.now()}`, name: manualForm.name.trim(), age, area: manualForm.area, bookingReason: manualForm.bookingReason || undefined, phone: manualForm.phone, source: 'whatsapp', status: 'new', createdAt: new Date().toISOString() };
    save([booking, ...bookings]);
    setManualForm({ name: '', age: '', area: '', phone: '', bookingReason: '' }); setManualError(''); setManualOpen(false); setTab('new');
  }
  const filtered = useMemo(() => bookings.filter((booking) => {
    const statusMatch = tab === 'all' || (tab === 'new' && booking.status === 'new') || (tab === 'pending' && booking.source === 'whatsapp' && booking.status === 'confirmed' && !booking.confirmationSentAt) || (tab === 'complaint' && booking.status === 'complaint') || (tab === 'today' && booking.followUpDate === new Date().toISOString().slice(0, 10));
    return statusMatch && matchesDemographics(booking, area, group);
  }), [bookings, tab, area, group]);
  const counts = useMemo(() => demoAreas.map((item) => ageGroups.map((itemGroup) => bookings.filter((booking) => booking.area === item && ageGroup(booking.age) === itemGroup && matchesDemographics(booking, area, group)).length)), [bookings, area, group]);

  if (!mounted) return <main className="page-shell"><div className="loading-state">جارٍ تجهيز السجل…</div></main>;
  return <main className="page-shell dashboard-shell">
    <header className="topbar"><div><span className="eyebrow">الاستقبال / اليوم</span><h1>لوحة المواعيد</h1></div><Link className="text-link" href="/">← نموذج المريض</Link></header>
    <section className="dashboard-summary"><div><p className="summary-label">طلبات تحتاج متابعة</p><strong>{bookings.filter((b) => b.status === 'new').length}</strong><span> طلبات جديدة</span></div><div className="summary-date">{new Intl.DateTimeFormat('ar-IQ-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</div></section>
    <nav className="tabs" aria-label="تصفية الطلبات"><button className={tab === 'new' ? 'active' : ''} onClick={() => setTab('new')}>الجديدة <b>{bookings.filter((b) => b.status === 'new').length}</b></button><button className={tab === 'pending' ? 'active' : ''} onClick={() => setTab('pending')}>بانتظار الإرسال <b>{bookings.filter((b) => b.source === 'whatsapp' && b.status === 'confirmed' && !b.confirmationSentAt).length}</b></button><button className={tab === 'all' ? 'active' : ''} onClick={() => setTab('all')}>الكل <b>{bookings.length}</b></button><button className={tab === 'complaint' ? 'active' : ''} onClick={() => setTab('complaint')}>شكاوى</button><button className={tab === 'today' ? 'active' : ''} onClick={() => setTab('today')}>متابعات اليوم</button></nav>
    <section className="filter-row"><label>المنطقة<select value={area} onChange={(e) => setArea(e.target.value)}><option>الكل</option>{demoAreas.map((item) => <option key={item}>{item}</option>)}</select></label><label>الفئة العمرية<select value={group} onChange={(e) => setGroup(e.target.value)}><option>الكل</option>{ageGroups.map((item) => <option key={item}>{item}</option>)}</select></label></section>
    <section className="whatsapp-entry"><div className="section-title"><div><span className="eyebrow">مصدر جديد</span><h2>تسجيل حجز واتساب</h2></div><button className="secondary-button" onClick={() => setManualOpen(!manualOpen)}>{manualOpen ? 'إلغاء' : 'إضافة من واتساب'}</button></div>{manualOpen && <form className="manual-form" onSubmit={addWhatsAppBooking}><div className="two-col"><label>اسم المريض <span>*</span><input required value={manualForm.name} onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })} /></label><label>العمر <span>*</span><input required type="text" inputMode="numeric" value={manualForm.age} onChange={(e) => setManualForm({ ...manualForm, age: normalizeDigits(e.target.value) })} /></label></div><div className="two-col"><label>المنطقة <span>*</span><select required value={manualForm.area} onChange={(e) => setManualForm({ ...manualForm, area: e.target.value })}><option value="">اختر المنطقة</option>{demoAreas.map((item) => <option key={item}>{item}</option>)}</select></label><label>رقم واتساب الدولي <span>*</span><input required inputMode="numeric" value={manualForm.phone} onChange={(e) => setManualForm({ ...manualForm, phone: normalizeDigits(e.target.value).replace(/\D/g, '') })} placeholder="9647701234567" /><small className="field-help">أرقام فقط، بدون + أو مسافات</small></label></div><label>سبب الحجز <small>اختياري</small><select value={manualForm.bookingReason} onChange={(e) => setManualForm({ ...manualForm, bookingReason: e.target.value })}><option value="">اختر سبب الحجز</option>{bookingReasons.map((reason) => <option key={reason}>{reason}</option>)}</select></label>{manualError && <p className="form-error" role="alert">{manualError}</p>}<button className="primary-button" type="submit">حفظ كطلب جديد</button></form>}</section>
    <section className="booking-list"><div className="section-title"><div><span className="eyebrow">سجل الطلبات</span><h2>{tab === 'new' ? 'طلبات جديدة' : tab === 'pending' ? 'بانتظار إرسال التأكيد' : tab === 'today' ? 'متابعات اليوم' : tab === 'complaint' ? 'الشكاوى' : 'كل الطلبات'}</h2></div><span className="count-pill">{filtered.length} سجلات</span></div>{filtered.length === 0 ? <div className="empty-state">لا توجد سجلات بهذه التصفية.</div> : filtered.map((booking) => <BookingRow key={booking.id} booking={booking} onUpdate={update} />)}</section>
    <section className="heatmap"><div className="section-title"><div><span className="eyebrow">نظرة سريعة</span><h2>توزيع الطلبات</h2></div><span className="muted">حسب المنطقة والعمر</span></div><div className="heatmap-wrap"><table><thead><tr><th>المنطقة</th>{ageGroups.map((item) => <th key={item}>{item}</th>)}</tr></thead><tbody>{demoAreas.map((item, row) => <tr key={item}><th>{item}</th>{counts[row].map((count, col) => <td key={col} data-level={count > 2 ? 'high' : count > 0 ? 'low' : 'none'}>{count || '—'}</td>)}</tr>)}</tbody></table></div></section>
  </main>;
}

function BookingRow({ booking, onUpdate }: { booking: Booking; onUpdate: (id: string, patch: Partial<Booking>) => void }) {
  const [date, setDate] = useState(booking.appointmentDate || ''); const [time, setTime] = useState(booking.appointmentTime || ''); const [note, setNote] = useState(booking.note || ''); const [followUp, setFollowUp] = useState(booking.followUpDate || ''); const [resolution, setResolution] = useState(booking.resolutionNote || '');
  const canConfirm = Boolean(date && time);
  const pendingWhatsApp = booking.source === 'whatsapp' && booking.status === 'confirmed' && !booking.confirmationSentAt && canConfirm;
  const statusLabel = pendingWhatsApp ? 'بانتظار الإرسال' : labels[booking.status];
  return <article className="booking-row"><div className="booking-main"><div className="avatar">{booking.name.slice(0, 1)}</div><div><h3>{booking.name}</h3><p>{booking.area} · {booking.age} سنة · {booking.bookingReason || 'غير محدد'} {booking.phone ? `· ${booking.phone}` : '· بلا هاتف'}{booking.source === 'whatsapp' && ' · واتساب'}</p><span className={`status status-${pendingWhatsApp ? 'pending' : booking.status}`}>{statusLabel}</span></div></div><div className="booking-actions">{booking.status !== 'complaint' && booking.status !== 'closed' && <><div className="appointment-fields"><label>التاريخ<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label><label>الوقت<input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></label></div><label>ملاحظة الاستقبال<textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="أضف ملاحظة…" /></label><div className="action-line"><button className="secondary-button" onClick={() => onUpdate(booking.id, { appointmentDate: date || undefined, appointmentTime: time || undefined, note: note || undefined, followUpDate: followUp || undefined })}>حفظ التفاصيل</button><button className="confirm-button" disabled={!canConfirm} title={!canConfirm ? 'أضف التاريخ والوقت أولاً' : ''} onClick={() => onUpdate(booking.id, { appointmentDate: date, appointmentTime: time, note: note || undefined, status: 'confirmed', followUpDate: followUp || undefined })}>تأكيد الموعد</button></div><label className="follow-up">متابعة لاحقة <input type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} /></label>{booking.source === 'whatsapp' && booking.status === 'confirmed' && canConfirm && <div className="whatsapp-confirm"><p>{pendingWhatsApp ? 'الموعد مؤكد، أرسل الرسالة من واتساب ثم سجّلها هنا.' : `تم إرسال التأكيد ${booking.confirmationSentAt ? new Date(booking.confirmationSentAt).toLocaleString('ar-IQ-u-nu-latn') : ''}`}</p>{pendingWhatsApp && <><a className="whatsapp-button" href={getWhatsAppLink(booking, date, time)} target="_blank" rel="noreferrer">إرسال التأكيد</a><button className="secondary-button" onClick={() => onUpdate(booking.id, { confirmationSentAt: new Date().toISOString() })}>تم الإرسال</button></>}</div>}</>}{booking.status === 'complaint' && <><label>ملاحظة الحل<textarea rows={2} value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="اكتب الإجراء المتخذ…" /></label><button className="secondary-button" onClick={() => onUpdate(booking.id, { resolutionNote: resolution, status: 'closed' })}>حفظ وإغلاق الشكوى</button></>}{booking.status === 'closed' && <p className="resolved-note">{booking.resolutionNote}</p>}</div></article>;
}
