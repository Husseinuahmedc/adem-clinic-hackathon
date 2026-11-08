'use client';

import { FormEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import { createPublicBooking } from './actions/public-bookings';
import { bookingReasons, clinicContent, clinicDisplayName, demoAreas } from '../lib/clinic-content';
import { Booking, readBookings, writeBookings } from '../lib/storage';

type FormErrors = Partial<Record<'name' | 'age' | 'area', string>>;

function normalizeDigits(value: string) {
  return value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - '٠'.charCodeAt(0)))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - '۰'.charCodeAt(0)));
}

export default function PatientPage() {
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({ name: '', age: '', area: '', phone: '', bookingReason: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { readBookings(); setMounted(true); }, []);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    if (field in errors) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedAge = normalizeDigits(form.age.trim());
    const age = Number(normalizedAge);
    const nextErrors: FormErrors = {};
    if (!form.name.trim()) nextErrors.name = 'اكتب الاسم الكامل.';
    if (!normalizedAge) nextErrors.age = 'أدخل العمر بالسنوات.';
    else if (normalizedAge.includes('.') || normalizedAge.includes('٫') || normalizedAge.includes(',')) nextErrors.age = 'أدخل عمراً صحيحاً بلا كسور.';
    else if (!Number.isInteger(age) || age < 0 || age > 120) nextErrors.age = 'أدخل عمراً صحيحاً بين 0 و120.';
    if (!form.area) nextErrors.area = 'اختر المنطقة الأقرب إليك.';
    if (Object.keys(nextErrors).length > 0) { setErrors(nextErrors); return; }

    const booking: Booking = {
      id: `booking-${Date.now()}`,
      name: form.name.trim(), age, area: form.area, bookingReason: form.bookingReason || undefined,
      phone: form.phone.trim() || undefined, status: 'new', createdAt: new Date().toISOString(),
    };
    try {
      const result = await createPublicBooking({ name: booking.name, age: booking.age, area: booking.area, phone: booking.phone, bookingReason: booking.bookingReason });
      if (result.demo) writeBookings([booking, ...readBookings()]);
      setSubmitted(true); setErrors({});
    } catch {
      setErrors({ name: 'تعذر حفظ الطلب حالياً. حاول مرة أخرى.' });
    }
  }

  return (
    <main className="landing-page">
      <section className="landing-hero" aria-labelledby="hero-title">
        <div className="landing-hero-copy">
          <h1 id="hero-title">{clinicDisplayName}</h1>
          <p className="landing-hero-subtitle">رعاية جلدية هادئة تبدأ بخطوة بسيطة. أرسل طلبك وسيتواصل معك فريق الاستقبال لتأكيد الموعد.</p>
          <a className="primary-button landing-hero-button" href="#booking-form">اطلب موعد</a>
        </div>
      </section>

      <section className="landing-booking" id="booking-form" aria-labelledby="booking-title">
        <div className="landing-form-panel">
          <h2 id="booking-title">حجز موعد</h2>
          {submitted ? (
            <div className="success-state"><span className="status-dot" /><h2>تم استلام طلب الحجز</h2><p>سجّلنا طلبك بنجاح. سيتواصل معك فريق الاستقبال لتأكيد الموعد.</p><button className="secondary-button" onClick={() => { setSubmitted(false); setForm({ name: '', age: '', area: '', phone: '', bookingReason: '' }); }}>إرسال طلب آخر</button></div>
          ) : (
            <form onSubmit={submitBooking} noValidate>
              <div className="landing-field"><label htmlFor="patient-name">الاسم الكامل <span>*</span></label><input id="patient-name" required value={form.name} onChange={(e) => updateField('name', e.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} placeholder="مثال: أحمد علي" />{errors.name && <span className="field-error" id="name-error" role="alert">{errors.name}</span>}</div>
              <div className="landing-two-col"><div className="landing-field"><label htmlFor="patient-age">العمر بالسنوات <span>*</span></label><input id="patient-age" required type="text" inputMode="numeric" value={form.age} onChange={(e) => updateField('age', e.target.value)} aria-invalid={Boolean(errors.age)} aria-describedby={errors.age ? 'age-error' : undefined} placeholder="مثال: 25" />{errors.age && <span className="field-error" id="age-error" role="alert">{errors.age}</span>}</div><div className="landing-field"><label htmlFor="patient-area">المنطقة <span>*</span></label><select id="patient-area" required value={form.area} onChange={(e) => updateField('area', e.target.value)} aria-invalid={Boolean(errors.area)} aria-describedby={errors.area ? 'area-error area-hint' : 'area-hint'}><option value="">اختر المنطقة</option>{demoAreas.map((area) => <option key={area}>{area}</option>)}</select><small id="area-hint">{clinicContent.areaHint}</small>{errors.area && <span className="field-error" id="area-error" role="alert">{errors.area}</span>}</div></div>
              <div className="landing-field"><label htmlFor="patient-reason">سبب الحجز <small>اختياري</small></label><select id="patient-reason" value={form.bookingReason} onChange={(e) => updateField('bookingReason', e.target.value)}><option value="">اختر سبب الحجز</option>{bookingReasons.map((reason) => <option key={reason}>{reason}</option>)}</select></div>
              <div className="landing-field"><label htmlFor="patient-phone">رقم الهاتف <small>اختياري</small></label><input id="patient-phone" type="tel" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="07xx xxx xxxx" /></div>
              <button className="primary-button landing-submit" disabled={!mounted} type="submit">إرسال طلب الحجز <span>←</span></button>
            </form>
          )}
        </div>
      </section>

      <section className="landing-location" id="location" aria-labelledby="location-title"><div><h2 id="location-title">الموقع التقريبي</h2><p>{clinicContent.location}</p></div>{clinicContent.mapUrl && <a className="landing-map-link" href={clinicContent.mapUrl} target="_blank" rel="noreferrer" aria-label={`افتح خريطة تقريبية لـ${clinicDisplayName} في ${clinicContent.location}`}><Image className="landing-map-image" src="/dummy-map.svg" alt={`خريطة تقريبية لـ${clinicDisplayName} في ${clinicContent.location}`} width={640} height={300} /></a>}</section>
    </main>
  );
}
