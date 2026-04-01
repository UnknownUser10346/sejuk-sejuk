const SERVICE_TYPES = [
    { value: 'servicing',    label: 'AC Servicing' },
    { value: 'installation', label: 'AC Installation' },
    { value: 'gas_refill',   label: 'Gas Refill' },
    { value: 'repair',       label: 'Repair' },
    { value: 'cleaning',     label: 'Cleaning' },
  ]
  
  const inputCls = (field, errors) =>
    `w-full h-9 px-3 border rounded-lg text-xs outline-none transition-colors ${
      errors[field]
        ? 'border-red-400 focus:border-red-500 bg-red-50'
        : 'border-gray-300 focus:border-[#0e7fa8] bg-white'
    }`
  
  const Field = ({ label, required, error, children }) => (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
  
  export default function OrderForm({ form, errors, technicians, onChange, onSubmit, onReset, loading }) {
    const set = (field, value) => onChange(field, value)
  
    return (
      <div className="max-w-xl mx-auto space-y-4">
  
        {/* Order Info */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-[#0e7fa8] uppercase tracking-wider mb-3">Order Info</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Order No">
              <input value={form.order_no} readOnly
                className="w-full h-9 px-3 border border-gray-200 rounded-lg text-xs bg-gray-50 text-gray-500 cursor-not-allowed outline-none" />
            </Field>
            <Field label="Scheduled Date" required error={errors.scheduled_date}>
              <input type="date" value={form.scheduled_date}
                onChange={e => set('scheduled_date', e.target.value)}
                className={inputCls('scheduled_date', errors)} />
            </Field>
          </div>
        </div>
  
        {/* Customer Details */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-[#0e7fa8] uppercase tracking-wider mb-3">Customer Details</p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Customer Name" required error={errors.customer_name}>
                <input value={form.customer_name}
                  onChange={e => set('customer_name', e.target.value)}
                  placeholder="e.g. Ahmad Razif"
                  className={inputCls('customer_name', errors)} />
              </Field>
              <Field label="Phone" required error={errors.customer_phone}>
                <input value={form.customer_phone}
                  onChange={e => set('customer_phone', e.target.value)}
                  placeholder="e.g. 011-2345 6789"
                  className={inputCls('customer_phone', errors)} />
              </Field>
            </div>
            <Field label="Address" required error={errors.customer_address}>
              <input value={form.customer_address}
                onChange={e => set('customer_address', e.target.value)}
                placeholder="e.g. No. 12, Jalan Sejuk, Shah Alam"
                className={inputCls('customer_address', errors)} />
            </Field>
            <Field label="Problem Description" required error={errors.problem_description}>
              <textarea value={form.problem_description}
                onChange={e => set('problem_description', e.target.value)}
                placeholder="Describe the issue..."
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg text-xs outline-none transition-colors resize-none ${
                  errors.problem_description ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-[#0e7fa8]'
                }`} />
            </Field>
          </div>
        </div>
  
        {/* Service Details */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-[#0e7fa8] uppercase tracking-wider mb-3">Service Details</p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Service Type" required error={errors.service_type}>
                <select value={form.service_type}
                  onChange={e => set('service_type', e.target.value)}
                  className={inputCls('service_type', errors)}>
                  <option value="">Select service type</option>
                  {SERVICE_TYPES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Quoted Price (RM)" required error={errors.quoted_price}>
                <input type="number" value={form.quoted_price}
                  onChange={e => set('quoted_price', e.target.value)}
                  placeholder="e.g. 150.00"
                  min="0" step="0.01"
                  className={inputCls('quoted_price', errors)} />
              </Field>
            </div>
            <Field label="Assign Technician" required error={errors.assigned_technician_id}>
              <select value={form.assigned_technician_id}
                onChange={e => set('assigned_technician_id', e.target.value)}
                className={inputCls('assigned_technician_id', errors)}>
                <option value="">Select technician</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.id}>{t.name} — {t.branch}</option>
                ))}
              </select>
            </Field>
            <Field label="Admin Notes" error={errors.admin_notes}>
              <textarea value={form.admin_notes}
                onChange={e => set('admin_notes', e.target.value)}
                placeholder="Any internal notes..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#0e7fa8] resize-none" />
            </Field>
          </div>
        </div>
  
        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={onReset}
            className="px-4 py-2 border border-gray-300 rounded-lg text-xs hover:bg-gray-50">
            Reset
          </button>
          <button onClick={onSubmit} disabled={loading}
            className="flex-1 py-2 bg-[#0e7fa8] text-white rounded-lg text-xs hover:bg-[#0c6d92] disabled:opacity-60">
            {loading ? 'Submitting...' : '✓ Submit Order'}
          </button>
        </div>
  
      </div>
    )
  }