import { Field, Form, Formik } from 'formik';
import Swal from 'sweetalert2';
import * as Yup from 'yup';
type PaymentType = 'cash' | 'bank' | 'check';
interface PaymentFormValues {
    paymentTypes: PaymentType[];
    cashAmount: string;
    bankAmount: string;
    bankName: string;
    checkAmount: string;
    checkNumber: string;
}

const paymentUpdateSchema = Yup.object().shape({
    paymentTypes: Yup.array().of(Yup.string()).min(1, 'At least one payment type is required'),
    cashAmount: Yup.string().when('paymentTypes', {
        is: (types: string[]) => types?.includes('cash'),
        then: (schema) => schema.required('Cash amount is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
    bankAmount: Yup.string().when('paymentTypes', {
        is: (types: string[]) => types?.includes('bank'),
        then: (schema) => schema.required('Bank amount is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
    bankName: Yup.string().when('paymentTypes', {
        is: (types: string[]) => types?.includes('bank'),
        then: (schema) => schema.required('Bank name is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
    checkAmount: Yup.string().when('paymentTypes', {
        is: (types: string[]) => types?.includes('check'),
        then: (schema) => schema.required('Check amount is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
    checkNumber: Yup.string().when('paymentTypes', {
        is: (types: string[]) => types?.includes('check'),
        then: (schema) => schema.required('Check number is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
});

const PaymentModal = ({ setIsPaymentModalOpen, setSelectedInvoiceForPayment, selectedInvoiceForPayment, calculateRemainingAmount, handlePaymentSubmit }: any) => {
    return (
        <div className="absolute top-20 inset-0 z-[999]">
            <div className="flex items-start justify-center min-h-screen px-4">
                <div className="panel rounded-lg w-full max-w-lg">
                    <div className="flex items-center justify-between p-5 border-b border-[#ebedf2] dark:border-[#1b2e4b]">
                        <h5 className="text-lg font-semibold">Add Payment</h5>
                        <button
                            type="button"
                            className="text-white-dark hover:text-dark"
                            onClick={() => {
                                setIsPaymentModalOpen(false);
                                setSelectedInvoiceForPayment(null);
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <circle opacity="0.5" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M14.5 9.50002L9.5 14.5M9.49998 9.5L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                    <div className="p-5">
                        <div className="mb-5">
                            <p className="text-base">
                                Remaining Amount: <span className="font-semibold text-danger">Rs. {calculateRemainingAmount(selectedInvoiceForPayment).toLocaleString()}</span>
                            </p>
                        </div>
                        <Formik<PaymentFormValues>
                            initialValues={{
                                paymentTypes: [],
                                cashAmount: '',
                                bankAmount: '',
                                bankName: '',
                                checkAmount: '',
                                checkNumber: '',
                            }}
                            validationSchema={paymentUpdateSchema}
                            onSubmit={(values) => {
                                const cashAmount = Number(values.cashAmount || 0);
                                const bankAmount = Number(values.bankAmount || 0);
                                const checkAmount = Number(values.checkAmount || 0);
                                const totalNewPayment = cashAmount + bankAmount + checkAmount;

                                if (!selectedInvoiceForPayment) return;

                                const remainingAmount = calculateRemainingAmount(selectedInvoiceForPayment);

                                if (totalNewPayment > remainingAmount) {
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Payment Error',
                                        text: `Total payment (${totalNewPayment.toLocaleString()}) cannot exceed remaining amount (${remainingAmount.toLocaleString()})`,
                                    });
                                    return;
                                }

                                handlePaymentSubmit(values);
                            }}
                        >
                            {({ values, errors, touched, submitCount }) => (
                                <Form className="space-y-5">
                                    <div className={submitCount ? (errors.paymentTypes ? 'has-error' : 'has-success') : ''}>
                                        <label className="mb-2 block">Payment Types</label>
                                        <div className="flex gap-4">
                                            <label className="inline-flex">
                                                <Field type="checkbox" name="paymentTypes" value="cash" className="form-checkbox" />
                                                <span className="ml-2">Cash</span>
                                            </label>
                                            <label className="inline-flex">
                                                <Field type="checkbox" name="paymentTypes" value="bank" className="form-checkbox" />
                                                <span className="ml-2">Bank</span>
                                            </label>
                                            <label className="inline-flex">
                                                <Field type="checkbox" name="paymentTypes" value="check" className="form-checkbox" />
                                                <span className="ml-2">Check</span>
                                            </label>
                                        </div>
                                        {touched.paymentTypes && errors.paymentTypes && <div className="text-danger mt-1">{errors.paymentTypes}</div>}
                                    </div>

                                    {values.paymentTypes.includes('cash') && (
                                        <div className={submitCount ? (errors.cashAmount ? 'has-error' : 'has-success') : ''}>
                                            <label>Cash Amount</label>
                                            <Field name="cashAmount" type="number" className="form-input" />
                                            {touched.cashAmount && errors.cashAmount && <div className="text-danger mt-1">{errors.cashAmount}</div>}
                                        </div>
                                    )}

                                    {values.paymentTypes.includes('bank') && (
                                        <>
                                            <div className={submitCount ? (errors.bankAmount ? 'has-error' : 'has-success') : ''}>
                                                <label>Bank Amount</label>
                                                <Field name="bankAmount" type="number" className="form-input" />
                                                {touched.bankAmount && errors.bankAmount && <div className="text-danger mt-1">{errors.bankAmount}</div>}
                                            </div>
                                            <div className={submitCount ? (errors.bankName ? 'has-error' : 'has-success') : ''}>
                                                <label>Bank Name</label>
                                                <Field name="bankName" type="text" className="form-input" />
                                                {touched.bankName && errors.bankName && <div className="text-danger mt-1">{errors.bankName}</div>}
                                            </div>
                                        </>
                                    )}

                                    {values.paymentTypes.includes('check') && (
                                        <>
                                            <div className={submitCount ? (errors.checkAmount ? 'has-error' : 'has-success') : ''}>
                                                <label>Check Amount</label>
                                                <Field name="checkAmount" type="number" className="form-input" />
                                                {touched.checkAmount && errors.checkAmount && <div className="text-danger mt-1">{errors.checkAmount}</div>}
                                            </div>
                                            <div className={submitCount ? (errors.checkNumber ? 'has-error' : 'has-success') : ''}>
                                                <label>Check Number</label>
                                                <Field name="checkNumber" type="text" className="form-input" />
                                                {touched.checkNumber && errors.checkNumber && <div className="text-danger mt-1">{errors.checkNumber}</div>}
                                            </div>
                                        </>
                                    )}

                                    <button type="submit" className="btn btn-primary !mt-6">
                                        Update Payment
                                    </button>
                                </Form>
                            )}
                        </Formik>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default PaymentModal;
