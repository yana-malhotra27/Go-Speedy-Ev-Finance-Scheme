'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Bike,
  User,
  FileText,
  Cpu,
  IndianRupee,
  Users2,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import Header from '../../../../components/layout/Header';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import Select from '../../../../components/ui/Select';
import FileUpload from '../../../../components/ui/FileUpload';
import Modal from '../../../../components/ui/Modal';
import api from '../../../../lib/api';
import {
  formatCurrency,
  DOWNPAYMENT_MODES,
  INSTALLMENT_FREQUENCIES,
  REFERENCE_CATEGORIES,
  RTO_TYPES,
  HP_FINANCERS,
} from '../../../../lib/constants';

const DRAFT_KEY = 'gs_rental_form_draft';

const ALL_STEPS = [
  { id: 1, name: 'EV Model', icon: Bike },
  { id: 2, name: 'Personal', icon: User },
  { id: 3, name: 'Documents', icon: FileText },
  { id: 4, name: 'Scooty HW', icon: Cpu },
  { id: 5, name: 'Insurance', icon: ShieldCheck },
  { id: 6, name: 'References', icon: Users2 },
  { id: 7, name: 'Guarantors', icon: ShieldAlert },
];

export default function NewPurchaseWizardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentStep, setCurrentStep] = useState(1);
  const [models, setModels] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Pending Docs Confirmation Modal
  const [isPendingDocsModalOpen, setIsPendingDocsModalOpen] = useState(false);
  const [missingDocsList, setMissingDocsList] = useState([]);

  // Form State
  const isDirectPurchase = true;
  const STEPS = ALL_STEPS;
  const [formData, setFormData] = useState({
    // Step 1: Model
    ev_model_id: searchParams.get('model_id') || '',

    // Step 2: Personal
    name: searchParams.get('name') || '',
    phone: searchParams.get('phone') || '',
    gender: 'male',
    address: '',
    invoice_generated: false,

    // Step 3: Documents
    aadhar_path: '',
    pan_path: '',
    cheque_path: '',
    electricity_bill_path: '',
    tenant_photo_path: '',
    scooty_photo_path: '',
    invoice_doc_path: '',
    scooty_insurance_path: '',
    rider_insurance_path: '',
    scooty_insurance_company: '',
    scooty_policy_number: '',
    scooty_policy_expiry: '',
    rider_insurance_company: '',
    rider_policy_number: '',
    rider_policy_expiry: '',

    // Step 4: Scooty Hardware
    chassis_no: '',
    motor_ctrl_no: '',
    battery_no: '',
    rto_type: 'rto',
    hp_financer: 'go_speedy',
    hp_financer_other: '',
    date_of_purchase: new Date().toISOString().split('T')[0],
    date_of_delivery: new Date().toISOString().split('T')[0],

    // Step 6: 3 References
    references: [
      { category: '', name: '', area: '', phone: '' },
    ],

    // Step 7: 2 Guarantors (1 Male + 1 Female mandatory)
    guarantors: [
      { gender: 'male', name: '', address: '', phone: '' },
      { gender: 'female', name: '', address: '', phone: '' },
    ],

    // Optional booking linkage
    booking_id: searchParams.get('booking_id') || '',
  });

  // Load models & draft
  useEffect(() => {
    api.get('/api/models/dropdown').then((res) => {
      if (res.data?.success) {
        setModels(res.data.data || []);
      }
    });

    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved && !searchParams.get('booking_id')) {
      try {
        const parsed = JSON.parse(saved);
        const { isDirectPurchase: _, ...validData } = parsed;
        setFormData((prev) => ({ ...prev, ...validData }));
      } catch (err) {
        console.warn('Could not parse saved draft:', err);
      }
    }
  }, []);

  // Autosave to localStorage
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...formData, isDirectPurchase }));
  }, [formData, isDirectPurchase]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateReference = (idx, field, val) => {
    const updated = [...formData.references];
    updated[idx][field] = val;
    setFormData((prev) => ({ ...prev, references: updated }));
  };

  const updateGuarantor = (idx, field, val) => {
    const updated = [...formData.guarantors];
    updated[idx][field] = val;
    setFormData((prev) => ({ ...prev, guarantors: updated }));
  };

  const clearDraft = () => {
    if (confirm('Discard draft and start over?')) {
      localStorage.removeItem(DRAFT_KEY);
      window.location.reload();
    }
  };

  const validateStep = (step) => {
    setErrorMessage('');
    if (step === 1) {
      if (!formData.ev_model_id) {
        setErrorMessage('Please select an EV model to proceed');
        return false;
      }
    }
    if (step === 2) {
      if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim()) {
        setErrorMessage('Name, phone, and address are required');
        return false;
      }
      if (!/^\d{10}$/.test(formData.phone.trim())) {
        setErrorMessage('Phone number must be exactly 10 digits');
        return false;
      }
    }
    if (step === 4) {
      if (!formData.chassis_no.trim() || !formData.motor_ctrl_no.trim() || !formData.battery_no.trim() || !formData.rto_type || !formData.hp_financer || !formData.date_of_purchase || !formData.date_of_delivery) {
        setErrorMessage('All hardware and registration details are required');
        return false;
      }
    }
    if (step === 5) {
      if (!formData.scooty_insurance_company.trim() || !formData.scooty_policy_number.trim() || !formData.scooty_policy_expiry) {
        setErrorMessage('All Scooty insurance details are required');
        return false;
      }
      if (!formData.rider_insurance_company.trim() || !formData.rider_policy_number.trim() || !formData.rider_policy_expiry) {
        setErrorMessage('All Rider insurance details are required');
        return false;
      }
    }
    if (step === 6) {
      const missingRef = formData.references.some(r => !r.category || !r.name.trim() || !r.area.trim() || !r.phone.trim());
      if (missingRef) {
        setErrorMessage('All reference details are required');
        return false;
      }
      const invalidRefPhone = formData.references.some(r => !/^\d{10}$/.test(r.phone.trim()));
      if (invalidRefPhone) {
        setErrorMessage('All reference phone numbers must be exactly 10 digits');
        return false;
      }
    }
    if (step === 7) {
      const missingGuarantor = formData.guarantors.some(g => !g.gender || !g.name.trim() || !g.address.trim() || !g.phone.trim());
      if (missingGuarantor) {
        setErrorMessage('All guarantor details are required');
        return false;
      }
      const invalidGuarantorPhone = formData.guarantors.some(g => !/^\d{10}$/.test(g.phone.trim()));
      if (invalidGuarantorPhone) {
        setErrorMessage('All guarantor phone numbers must be exactly 10 digits');
        return false;
      }
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;

    if (currentStep === 4) {
      try {
        setIsSubmitting(true);
        const res = await api.get(`/api/rentals/check-uniqueness?chassis_no=${encodeURIComponent(formData.chassis_no)}&motor_ctrl_no=${encodeURIComponent(formData.motor_ctrl_no)}&battery_no=${encodeURIComponent(formData.battery_no)}`);
        if (res.data?.success && res.data.data?.exists) {
          setErrorMessage(res.data.data.message);
          return;
        }
      } catch (err) {
        setErrorMessage('Failed to validate hardware numbers');
        return;
      } finally {
        setIsSubmitting(false);
      }
    }

    if (currentStep === 5) {
      try {
        setIsSubmitting(true);
        const res = await api.get(`/api/rentals/check-uniqueness?scooty_policy_number=${encodeURIComponent(formData.scooty_policy_number)}&rider_policy_number=${encodeURIComponent(formData.rider_policy_number)}`);
        if (res.data?.success && res.data.data?.exists) {
          setErrorMessage(res.data.data.message);
          return;
        }
      } catch (err) {
        setErrorMessage('Failed to validate policy numbers');
        return;
      } finally {
        setIsSubmitting(false);
      }
    }

    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].id);
    }
  };

  const handlePrev = () => {
    setErrorMessage('');
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  };

  // Submit Flow with Pending Docs check
  const handleSubmitClick = () => {
    setErrorMessage('');
    if (!validateStep(currentStep)) return;

    // Check missing documents
    const docLabels = [
      { key: 'aadhar_path', label: 'Aadhar Card Photo' },
      { key: 'pan_path', label: 'PAN Card Photo' },
      { key: 'cheque_path', label: 'Bank Cheque Photo' },
      { key: 'electricity_bill_path', label: 'Electricity Bill Photo' },
      { key: 'tenant_photo_path', label: 'Buyer Profile Photo' },
      { key: 'scooty_photo_path', label: 'Scooty Handover Photo' },
      { key: 'invoice_doc_path', label: 'Invoice Document' },
      { key: 'scooty_insurance_path', label: 'Scooty Insurance Photo' },
      { key: 'rider_insurance_path', label: 'Rider Insurance Photo' },
    ];

    const missing = docLabels
      .filter((d) => !formData[d.key])
      .map((d) => d.label);

    if (missing.length > 0) {
      setMissingDocsList(missing);
      setIsPendingDocsModalOpen(true);
    } else {
      executeSubmission(false);
    }
  };

  const executeSubmission = async (hasPendingDocs) => {
    setIsPendingDocsModalOpen(false);
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const { booking_id, isDirectPurchase: _, hp_financer_other, ...restFormData } = formData;
      const payload = {
        ...restFormData,
        hp_financer: formData.hp_financer === 'other' ? (hp_financer_other || 'Other') : formData.hp_financer,
        has_pending_docs: hasPendingDocs,
        booking_amount: 0,
        downpayment_paid: 0,
        installment_daily_rate: 0,
        total_months: 0,
        status: 'direct_purchase',
      };

      let res;
      if (formData.booking_id) {
        res = await api.patch(`/api/bookings/${formData.booking_id}/convert`, payload);
      } else {
        res = await api.post('/api/rentals', payload);
      }

      if (res.data?.success) {
        localStorage.removeItem(DRAFT_KEY);
        const newId = res.data.data?.id;
        router.replace(`/purchases/${newId}`);
      } else {
        throw new Error(res.data?.message || 'Submission failed');
      }
    } catch (err) {
      console.error('Rental registration error:', err);
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to issue rental'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Header
        title="New Direct Purchase"
        subtitle="5-Step fast registration wizard with draft autosave"
        action={
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" icon={RotateCcw} onClick={clearDraft}>
              Discard Draft
            </Button>
          </div>
        }
      />

      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="bg-white/90 dark:bg-slate-900/60 p-2 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 backdrop-blur-xl card-elevation shadow-xs dark:shadow-[0_8px_30px_rgb(0,0,0,0.35)] overflow-x-auto -webkit-overflow-scrolling-touch transition-colors">
          <div className="flex items-center justify-between w-full">
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              const isDone = currentStep > s.id;
              const isCurrent = currentStep === s.id;

              return (
                <div key={s.id} className="flex items-center flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (validateStep(currentStep)) setCurrentStep(s.id);
                    }}
                    className={`flex items-center gap-1 md:gap-2 text-[10px] md:text-xs font-semibold py-1.5 px-1.5 md:px-3 rounded-lg transition-smooth whitespace-nowrap ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-sm'
                        : isDone
                        ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Icon className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
                    )}
                    <span className="hidden lg:inline">
                      {s.id}. {s.name}
                    </span>
                    <span className="lg:hidden">
                      {s.id}
                    </span>
                  </button>

                  {idx < STEPS.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-1 md:mx-2 ${
                        isDone ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700/50'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <Card>
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Select EV Scooter Model</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-0.5">
                  Choose from models currently available in Delhi hubs
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {models.map((m) => {
                  const selected = formData.ev_model_id === m.id;
                  const inStock = (m.stock_count || 0) > 0;

                  return (
                    <div
                      key={m.id}
                      onClick={() => inStock && updateField('ev_model_id', m.id)}
                      className={`p-4 rounded-xl border-2 transition-smooth cursor-pointer ${
                        selected
                          ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-500/10 shadow-sm'
                          : inStock
                          ? 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/60'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/40 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">{m.name}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            inStock
                              ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                              : 'bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400'
                          }`}
                        >
                          {m.stock_count} in stock
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{m.company} • {m.ward}</p>
                      <p className="text-sm font-black text-blue-600 dark:text-blue-400 mt-3">
                        {formatCurrency(m.total_price)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Buyer Personal Details</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-0.5">
                  Legal identity information for contract agreement
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  placeholder="e.g. Gurpreet Singh"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  required
                />

                <Input
                  label="Phone Number"
                  placeholder="10-digit mobile number"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  required
                />

                <Select
                  label="Gender"
                  value={formData.gender}
                  onChange={(e) => updateField('gender', e.target.value)}
                  options={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                  ]}
                  required
                />

                <Input
                  label="Current Residential Address"
                  placeholder="House No, Ward, City, Pincode"
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  required
                />
              </div>

              <div className="pt-4 pb-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.invoice_generated}
                    onChange={(e) => updateField('invoice_generated', e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Invoice generated and verified</span>
                </label>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Document Uploads</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FileUpload
                  label="Aadhar Card"
                  docType="aadhar_path"
                  currentPath={formData.aadhar_path}
                  onUploaded={(path) => updateField('aadhar_path', path)}
                />

                <FileUpload
                  label="PAN Card"
                  docType="pan_path"
                  currentPath={formData.pan_path}
                  onUploaded={(path) => updateField('pan_path', path)}
                />

                <FileUpload
                  label="Security Cheque"
                  docType="cheque_path"
                  currentPath={formData.cheque_path}
                  onUploaded={(path) => updateField('cheque_path', path)}
                />

                <FileUpload
                  label="Electricity Bill"
                  docType="electricity_bill_path"
                  currentPath={formData.electricity_bill_path}
                  onUploaded={(path) => updateField('electricity_bill_path', path)}
                />

                <FileUpload
                  label="Buyer Photo"
                  docType="tenant_photo_path"
                  currentPath={formData.tenant_photo_path}
                  onUploaded={(path) => updateField('tenant_photo_path', path)}
                />

                <FileUpload
                  label="Scooty Handover Photo"
                  docType="scooty_photo_path"
                  currentPath={formData.scooty_photo_path}
                  onUploaded={(path) => updateField('scooty_photo_path', path)}
                />
                <FileUpload
                  label="Invoice Document"
                  docType="invoice_doc_path"
                  currentPath={formData.invoice_doc_path}
                  onUploaded={(path) => updateField('invoice_doc_path', path)}
                />
                <FileUpload
                  label="Scooty Insurance Document"
                  docType="scooty_insurance_path"
                  currentPath={formData.scooty_insurance_path}
                  onUploaded={(path) => updateField('scooty_insurance_path', path)}
                />
                <FileUpload
                  label="Rider Insurance Document"
                  docType="rider_insurance_path"
                  currentPath={formData.rider_insurance_path}
                  onUploaded={(path) => updateField('rider_insurance_path', path)}
                />
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">EV Hardware Identification</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-0.5">
                  Unique serial numbers for vehicle tracking and compliance
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Chassis Number"
                  placeholder="e.g. CHSS-882190"
                  value={formData.chassis_no}
                  onChange={(e) => updateField('chassis_no', e.target.value)}
                  required
                />

                <Input
                  label="Motor Controller Number"
                  placeholder="e.g. MTR-49102"
                  value={formData.motor_ctrl_no}
                  onChange={(e) => updateField('motor_ctrl_no', e.target.value)}
                  required
                />

                <Input
                  label="Battery Serial Number"
                  placeholder="e.g. BAT-99120"
                  value={formData.battery_no}
                  onChange={(e) => updateField('battery_no', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <Select
                  label="RTO Type"
                  value={formData.rto_type}
                  onChange={(e) => updateField('rto_type', e.target.value)}
                  options={RTO_TYPES}
                  required
                />

                <Select
                  label="HP Financer"
                  value={formData.hp_financer}
                  onChange={(e) => updateField('hp_financer', e.target.value)}
                  options={HP_FINANCERS}
                  required
                />
                {formData.hp_financer === 'other' && (
                  <Input
                    label="Custom Financer"
                    placeholder="Enter custom financer name"
                    value={formData.hp_financer_other}
                    onChange={(e) => updateField('hp_financer_other', e.target.value)}
                    required
                  />
                )}

                <Input
                  label="Date of Purchase"
                  type="date"
                  value={formData.date_of_purchase}
                  onChange={(e) => updateField('date_of_purchase', e.target.value)}
                  required
                />

                <Input
                  label="Date of Handover / Delivery"
                  type="date"
                  value={formData.date_of_delivery}
                  onChange={(e) => updateField('date_of_delivery', e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Insurance Details</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-0.5">
                  Mandatory insurance information and documents for Scooty and Rider
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2">
                  Scooty Insurance
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Insurance Company"
                    placeholder="e.g. Bajaj Allianz"
                    value={formData.scooty_insurance_company}
                    onChange={(e) => updateField('scooty_insurance_company', e.target.value)}
                    required
                  />
                  <Input
                    label="Policy Number"
                    placeholder="e.g. POL-12345"
                    value={formData.scooty_policy_number}
                    onChange={(e) => updateField('scooty_policy_number', e.target.value)}
                    required
                  />
                  <Input
                    label="Expiry Date"
                    type="date"
                    value={formData.scooty_policy_expiry}
                    onChange={(e) => updateField('scooty_policy_expiry', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2">
                  Rider Insurance
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Insurance Company"
                    placeholder="e.g. ICICI Lombard"
                    value={formData.rider_insurance_company}
                    onChange={(e) => updateField('rider_insurance_company', e.target.value)}
                    required
                  />
                  <Input
                    label="Policy Number"
                    placeholder="e.g. POL-98765"
                    value={formData.rider_policy_number}
                    onChange={(e) => updateField('rider_policy_number', e.target.value)}
                    required
                  />
                  <Input
                    label="Expiry Date"
                    type="date"
                    value={formData.rider_policy_expiry}
                    onChange={(e) => updateField('rider_policy_expiry', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: 3 REFERENCES */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">3 Notable References</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  DSGMC Member, Nigam Parshad, MLA or respected community references
                </p>
              </div>

              <div className="space-y-3">
                {formData.references.map((ref, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <Select
                      label={`Reference #${idx + 1} Category`}
                      value={ref.category}
                      onChange={(e) => updateReference(idx, 'category', e.target.value)}
                      options={REFERENCE_CATEGORIES}
                      required
                    />
                    <Input
                      label="Full Name"
                      placeholder="Name"
                      value={ref.name}
                      onChange={(e) => updateReference(idx, 'name', e.target.value)}
                      required
                    />
                    <Input
                      label="Ward / Area"
                      placeholder="e.g. Ward 42"
                      value={ref.area}
                      onChange={(e) => updateReference(idx, 'area', e.target.value)}
                      required
                    />
                    <Input
                      label="Mobile Phone"
                      placeholder="Phone"
                      value={ref.phone}
                      onChange={(e) => updateReference(idx, 'phone', e.target.value)}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 7: 2 GUARANTORS */}
          {currentStep === 7 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">2 Co-Signer Guarantors</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  1 Male and 1 Female guarantor mandatory per policy
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formData.guarantors.map((g, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Guarantor #{idx + 1} ({g.gender.toUpperCase()})
                      </span>
                    </div>

                    <Input
                      label="Full Name"
                      placeholder="Name"
                      value={g.name}
                      onChange={(e) => updateGuarantor(idx, 'name', e.target.value)}
                      required
                    />
                    <Input
                      label="Mobile Phone"
                      placeholder="10-digit number"
                      value={g.phone}
                      onChange={(e) => updateGuarantor(idx, 'phone', e.target.value)}
                      required
                    />
                    <Input
                      label="Address"
                      placeholder="Residential Address"
                      value={g.address}
                      onChange={(e) => updateGuarantor(idx, 'address', e.target.value)}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wizard Footer Controls */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-5 mt-6">
            <Button
              variant="outline"
              size="md"
              disabled={currentStep === 1 || isSubmitting}
              onClick={handlePrev}
              icon={ChevronLeft}
            >
              Previous
            </Button>

            {currentStep !== STEPS[STEPS.length - 1].id ? (
              <Button
                variant="primary"
                size="md"
                onClick={handleNext}
              >
                Continue Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                variant="success"
                size="md"
                loading={isSubmitting}
                onClick={handleSubmitClick}
              >
                Complete & Issue Purchase
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Pending Documents Warning Modal */}
      <Modal
        isOpen={isPendingDocsModalOpen}
        onClose={() => setIsPendingDocsModalOpen(false)}
        title="Pending Documents Notice"
        subtitle="Some document photos have not been uploaded"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/20 text-xs text-amber-800 dark:text-amber-500">
            <p className="font-bold flex items-center gap-1.5 mb-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0" />
              The following documents are not yet uploaded:
            </p>
            <ul className="list-disc list-inside space-y-0.5 ml-1 text-slate-700 dark:text-amber-200/70">
              {missingDocsList.map((doc, idx) => (
                <li key={idx}>{doc}</li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400">
            Do you want to proceed and issue this purchase with documents marked as{' '}
            <span className="font-bold text-amber-700 dark:text-amber-500">pending</span>? Staff can upload them later.
          </p>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsPendingDocsModalOpen(false)}
            >
              Go Back to Upload
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => executeSubmission(true)}
            >
              Yes, Proceed
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
