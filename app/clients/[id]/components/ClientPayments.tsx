'use client'

import { FormEvent, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Payment = {
  id: string
  amount: number
  payment_date: string
  payment_method: string
  notes: string | null
}

type Props = {
  clientId: string
  initialAgreedFee: number
  initialPayments: Payment[]
  t: {
    paymentInformation: string
    agreedFee: string
    totalPaid: string
    outstandingBalance: string
    paymentStatus: string
    paid: string
    partiallyPaid: string
    pendingPayment: string
    paymentHistory: string
    noPaymentsYet: string
    addPayment: string
    paymentAmount: string
    paymentDate: string
    paymentMethod: string
    paymentNotes: string
    paymentMethodCash: string
    paymentMethodBankTransfer: string
    paymentMethodCard: string
    paymentMethodOther: string
    savePaymentSettings: string
    savePayment: string
    editPayment: string
    deletePayment: string
    cancel: string
    paymentSaved: string
    paymentUpdated: string
    paymentDeleted: string
    paymentSaveError: string
    paymentDeleteError: string
  }
}

export default function ClientPayments({
  clientId,
  initialAgreedFee,
  initialPayments,
  t,
}: Props) {
  const [agreedFee, setAgreedFee] = useState(
    initialAgreedFee.toFixed(2)
  )
  const [payments, setPayments] = useState<Payment[]>(initialPayments)
  const [showForm, setShowForm] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [amount, setAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingFee, setSavingFee] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const totalPaid = useMemo(
    () =>
      payments.reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0
      ),
    [payments]
  )

  const fee = Math.max(Number(agreedFee) || 0, 0)
  const outstandingBalance = Math.max(fee - totalPaid, 0)

  const status =
    fee > 0 && outstandingBalance <= 0
      ? t.paid
      : totalPaid > 0
        ? t.partiallyPaid
        : t.pendingPayment

  function resetPaymentForm() {
    setAmount('')
    setPaymentDate(new Date().toISOString().slice(0, 10))
    setPaymentMethod('bank_transfer')
    setNotes('')
    setEditingPayment(null)
    setShowForm(false)
  }

  function startEdit(payment: Payment) {
    setEditingPayment(payment)
    setAmount(Number(payment.amount).toFixed(2))
    setPaymentDate(payment.payment_date)
    setPaymentMethod(payment.payment_method)
    setNotes(payment.notes || '')
    setShowForm(true)
    setMessage('')
    setError('')
  }

  async function saveFee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSavingFee(true)
    setMessage('')
    setError('')

    try {
      const supabase = createClient()

      const value = Number(agreedFee)

      if (!Number.isFinite(value) || value < 0) {
        setError(t.paymentSaveError)
        setSavingFee(false)
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/'
        return
      }

      const { error: saveError } = await supabase
        .from('client_payment_settings')
        .upsert({
          client_id: clientId,
          owner_id: user.id,
          agreed_fee: value,
        })

      if (saveError) {
        console.error(saveError)
        setError(t.paymentSaveError)
        setSavingFee(false)
        return
      }

      setAgreedFee(value.toFixed(2))
      setMessage(t.paymentSaved)
    } catch (err) {
      console.error(err)
      setError(t.paymentSaveError)
    } finally {
      setSavingFee(false)
    }
  }

  async function savePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    try {
      const supabase = createClient()

      const value = Number(amount)

      if (!Number.isFinite(value) || value <= 0) {
        setError(t.paymentSaveError)
        setSaving(false)
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/'
        return
      }

      if (editingPayment) {
        const { data, error: updateError } = await supabase
          .from('client_payments')
          .update({
            amount: value,
            payment_date: paymentDate,
            payment_method: paymentMethod,
            notes: notes.trim() || null,
          })
          .eq('id', editingPayment.id)
          .select('id, amount, payment_date, payment_method, notes')
          .single()

        if (updateError || !data) {
          console.error(updateError)
          setError(t.paymentSaveError)
          setSaving(false)
          return
        }

        setPayments((current) =>
          current.map((payment) =>
            payment.id === editingPayment.id
              ? {
                  ...payment,
                  ...data,
                  amount: Number(data.amount),
                }
              : payment
          )
        )

        setMessage(t.paymentUpdated)
      } else {
        const { data, error: insertError } = await supabase
          .from('client_payments')
          .insert({
            owner_id: user.id,
            client_id: clientId,
            amount: value,
            payment_date: paymentDate,
            payment_method: paymentMethod,
            notes: notes.trim() || null,
          })
          .select('id, amount, payment_date, payment_method, notes')
          .single()

        if (insertError || !data) {
          console.error(insertError)
          setError(t.paymentSaveError)
          setSaving(false)
          return
        }

        setPayments((current) => [
          {
            ...data,
            amount: Number(data.amount),
          },
          ...current,
        ])

        setMessage(t.paymentSaved)
      }

      resetPaymentForm()
    } catch (err) {
      console.error(err)
      setError(t.paymentSaveError)
    } finally {
      setSaving(false)
    }
  }

  async function deletePayment(paymentId: string) {
    setDeletingId(paymentId)
    setMessage('')
    setError('')

    try {
      const supabase = createClient()

      const { error: deleteError } = await supabase
        .from('client_payments')
        .delete()
        .eq('id', paymentId)

      if (deleteError) {
        console.error(deleteError)
        setError(t.paymentDeleteError)
        setDeletingId(null)
        return
      }

      setPayments((current) =>
        current.filter((payment) => payment.id !== paymentId)
      )

      setMessage(t.paymentDeleted)
    } catch (err) {
      console.error(err)
      setError(t.paymentDeleteError)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-black/5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#737373]">
            {t.paymentInformation}
          </p>

          <h2 className="mt-1 text-lg font-semibold text-[#171717]">
            {t.paymentInformation}
          </h2>
        </div>

        <div className="rounded-full bg-[#f7f7f5] px-3 py-1 text-xs font-semibold text-[#525252]">
          {status}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <form
          onSubmit={saveFee}
          className="rounded-xl bg-[#f7f7f5] p-5"
        >
          <p className="text-sm text-[#737373]">
            {t.agreedFee}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <span className="text-lg font-semibold text-[#171717]">
              €
            </span>

            <input
              type="number"
              min="0"
              step="0.01"
              value={agreedFee}
              onChange={(event) => setAgreedFee(event.target.value)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30"
            />
          </div>

          <button
            type="submit"
            disabled={savingFee}
            className="mt-3 rounded-lg bg-[#171717] px-3 py-2 text-xs font-medium text-white hover:bg-black disabled:opacity-50"
          >
            {savingFee ? '...' : t.savePaymentSettings}
          </button>
        </form>

        <div className="rounded-xl bg-[#f7f7f5] p-5">
          <p className="text-sm text-[#737373]">
            {t.totalPaid}
          </p>

          <p className="mt-2 text-2xl font-semibold text-[#171717]">
            €{totalPaid.toFixed(2)}
          </p>
        </div>

        <div className="rounded-xl bg-[#f7f7f5] p-5">
          <p className="text-sm text-[#737373]">
            {t.outstandingBalance}
          </p>

          <p className="mt-2 text-2xl font-semibold text-[#171717]">
            €{outstandingBalance.toFixed(2)}
          </p>
        </div>
      </div>

      {(message || error) && (
        <div
          className={`mt-4 rounded-xl px-4 py-3 text-sm ${
            error
              ? 'bg-red-50 border border-red-100 text-red-700'
              : 'bg-green-50 border border-green-100 text-green-700'
          }`}
        >
          {error || message}
        </div>
      )}

      <div className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-[#171717]">
            {t.paymentHistory}
          </h3>

          <button
            type="button"
            onClick={() => {
              if (showForm) {
                resetPaymentForm()
              } else {
                setEditingPayment(null)
                setShowForm(true)
                setMessage('')
                setError('')
              }
            }}
            className="rounded-xl bg-[#171717] px-4 py-2.5 text-sm font-medium text-white hover:bg-black transition"
          >
            + {t.addPayment}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={savePayment}
            className="mt-4 rounded-2xl border border-black/5 bg-[#f7f7f5] p-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="block">
                <span className="text-xs font-medium text-[#737373]">
                  {t.paymentAmount}
                </span>

                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#171717]">
                    €
                  </span>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-[#737373]">
                  {t.paymentDate}
                </span>

                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(event) => setPaymentDate(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-[#737373]">
                  {t.paymentMethod}
                </span>

                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30"
                >
                  <option value="cash">
                    {t.paymentMethodCash}
                  </option>
                  <option value="bank_transfer">
                    {t.paymentMethodBankTransfer}
                  </option>
                  <option value="card">
                    {t.paymentMethodCard}
                  </option>
                  <option value="other">
                    {t.paymentMethodOther}
                  </option>
                </select>
              </label>
            </div>

            <label className="block mt-4">
              <span className="text-xs font-medium text-[#737373]">
                {t.paymentNotes}
              </span>

              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30"
              />
            </label>

            <div className="mt-4 flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#171717] px-4 py-2.5 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
              >
                {saving
                  ? '...'
                  : editingPayment
                    ? t.editPayment
                    : t.savePayment}
              </button>

              <button
                type="button"
                onClick={resetPaymentForm}
                className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#525252] hover:bg-[#fafafa]"
              >
                {t.cancel}
              </button>
            </div>
          </form>
        )}

        {payments.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-black/5 bg-[#f7f7f5] p-6 text-center">
            <p className="text-sm text-[#737373]">
              {t.noPaymentsYet}
            </p>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-black/5">
            <div className="divide-y divide-black/5">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-[#171717]">
                        €{Number(payment.amount).toFixed(2)}
                      </p>

                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#737373]">
                        <span>
                          {new Date(`${payment.payment_date}T00:00:00`).toLocaleDateString('es-ES')}
                        </span>

                        <span>
                          {payment.payment_method === 'cash'
                            ? t.paymentMethodCash
                            : payment.payment_method === 'bank_transfer'
                              ? t.paymentMethodBankTransfer
                              : payment.payment_method === 'card'
                                ? t.paymentMethodCard
                                : t.paymentMethodOther}
                        </span>
                      </div>

                      {payment.notes && (
                        <p className="mt-2 text-sm text-[#525252] whitespace-pre-wrap">
                          {payment.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(payment)}
                        className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-medium text-[#525252] hover:bg-[#fafafa]"
                      >
                        {t.editPayment}
                      </button>

                      <button
                        type="button"
                        disabled={deletingId === payment.id}
                        onClick={() => {
                          if (
                            window.confirm(
                              `${t.deletePayment}?`
                            )
                          ) {
                            void deletePayment(payment.id)
                          }
                        }}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        {deletingId === payment.id
                          ? '...'
                          : t.deletePayment}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
