<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Fee;
use Illuminate\Http\Request;

class PaymentsController extends Controller
{
    public function index()
    {
        return Payment::with(['student', 'fee'])->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'fee_id' => 'required|exists:fees,id',
            'amount' => 'required|numeric',
            'payment_method' => 'required|string',
            'payment_date' => 'required|date',
        ]);

        $payment = Payment::create($request->all());

        // Update fee status based on total payments
        $this->updateFeeStatus($request->fee_id);

        return $payment->load(['student', 'fee']);
    }

    public function show(string $id)
    {
        return Payment::with(['student', 'fee'])->findOrFail($id);
    }

    public function update(Request $request, string $id)
    {
        $payment = Payment::findOrFail($id);
        $oldAmount = $payment->amount;
        $payment->update($request->all());

        // Update fee status if amount changed
        if ($request->amount != $oldAmount) {
            $this->updateFeeStatus($payment->fee_id);
        }

        return $payment->load(['student', 'fee']);
    }

    public function destroy(string $id)
    {
        $payment = Payment::findOrFail($id);
        $feeId = $payment->fee_id;
        $payment->delete();

        // Update fee status after deletion
        $this->updateFeeStatus($feeId);

        return response()->json(['message' => 'Payment deleted']);
    }

    private function updateFeeStatus($feeId)
    {
        $fee = Fee::findOrFail($feeId);
        $totalPaid = $fee->payments()->sum('amount');

        if ($totalPaid >= $fee->amount) {
            $fee->status = 'paid';
        } elseif ($totalPaid > 0) {
            $fee->status = 'partial';
        } else {
            $fee->status = 'pending';
        }

        $fee->paid_amount = $totalPaid;
        $fee->save();
    }
}
