import { useEffect, useRef, useState } from 'react';
import * as Yup from 'yup';
import { Field, Form, Formik } from 'formik';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../store/themeConfigSlice';

interface Customer {
    id: number;
    name: string;
    phoneNumber: string;
}

interface KhataSaleFormValues {
    customerId: string;
    customerName: string;
    product: string;
    availableQuantity: string;
    sellingQuantity: string;
    price: string;
    totalPrice: string;
    phoneNumber: string;
    billType: 'fake' | 'real';
    paymentTypes: string[];
    cashAmount: string;
    bankAmount: string;
    bankName: string;
    checkAmount: string;
    checkNumber: string;
}

const KhataSale = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Khata Sale Form'));
    }, []);

    const [editMode, setEditMode] = useState(false);
    const formikRef = useRef<any>(null);

    // Sample customers data
    const customers: Customer[] = [
        { id: 1, name: 'John Doe', phoneNumber: '03001234567' },
        { id: 2, name: 'Jane Smith', phoneNumber: '03009876543' },
        { id: 3, name: 'Alice Johnson', phoneNumber: '03331234567' },
    ];

    const submitForm = () => {
        const toast = Swal.mixin({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            timer: 3000,
        });
        toast.fire({
            icon: 'success',
            title: 'Khata Sale added successfully',
            padding: '10px 20px',
        });
    };

    const saleSchema = Yup.object().shape({
        customerId: Yup.string().required('Customer selection is required'),
        product: Yup.string().required('Product name is required'),
        availableQuantity: Yup.number().required('Available quantity is required'),
        sellingQuantity: Yup.number()
            .required('Selling quantity is required')
            .positive('Quantity must be positive')
            .test('max', 'Selling quantity cannot exceed available quantity', function (value) {
                return !value || value <= this.parent.availableQuantity;
            }),
        price: Yup.number().required('Price is required').positive('Price must be positive'),
        totalPrice: Yup.number().required('Total price is required'),
        phoneNumber: Yup.string()
            .matches(/^[0-9]+$/, 'Phone number must contain only digits')
            .min(11, 'Phone number must be at least 11 digits')
            .max(11, 'Phone number must not exceed 11 digits'),
        paymentTypes: Yup.array().min(1, 'At least one payment type is required'),
        cashAmount: Yup.number().when('paymentTypes', {
            is: (types: string[]) => types?.includes('cash'),
            then: (schema) => schema.required('Cash amount is required').positive('Amount must be positive'),
            otherwise: (schema) => schema.notRequired(),
        }),
        bankAmount: Yup.number().when('paymentTypes', {
            is: (types: string[]) => types?.includes('bank'),
            then: (schema) => schema.required('Bank amount is required').positive('Amount must be positive'),
            otherwise: (schema) => schema.notRequired(),
        }),
        bankName: Yup.string().when('paymentTypes', {
            is: (types: string[]) => types?.includes('bank'),
            then: (schema) => schema.required('Bank name is required'),
            otherwise: (schema) => schema.notRequired(),
        }),
        checkAmount: Yup.number().when('paymentTypes', {
            is: (types: string[]) => types?.includes('check'),
            then: (schema) => schema.required('Check amount is required').positive('Amount must be positive'),
            otherwise: (schema) => schema.notRequired(),
        }),
        checkNumber: Yup.string().when('paymentTypes', {
            is: (types: string[]) => types?.includes('check'),
            then: (schema) => schema.required('Check number is required'),
            otherwise: (schema) => schema.notRequired(),
        }),
    });

    const products = [
        { id: 1, name: 'LED TV', quantities: [500, 100, 1000] },
        { id: 2, name: 'Laptop', quantities: [50, 100, 200] },
        { id: 3, name: 'Mobile Phone', quantities: [300, 400, 500] },
        { id: 4, name: 'Refrigerator', quantities: [50, 75, 100] },
    ];

    return (
        <>
            <div className="panel">
                <div className="mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light mb-4">{editMode ? 'Edit Khata Sale' : 'Add Khata Sale'}</h5>
                    <Formik<KhataSaleFormValues>
                        innerRef={formikRef}
                        initialValues={{
                            customerId: '',
                            customerName: '',
                            product: '',
                            availableQuantity: '',
                            sellingQuantity: '',
                            price: '',
                            totalPrice: '',
                            phoneNumber: '',
                            billType: 'fake',
                            paymentTypes: [],
                            cashAmount: '',
                            bankAmount: '',
                            bankName: '',
                            checkAmount: '',
                            checkNumber: '',
                        }}
                        validationSchema={saleSchema}
                        onSubmit={(values, { resetForm }) => {
                            submitForm();
                            resetForm();
                            setEditMode(false);
                        }}
                    >
                        {({ errors, submitCount, values, setFieldValue }) => (
                            <Form className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className={submitCount ? (errors.customerId ? 'has-error' : 'has-success') : ''}>
                                        <label htmlFor="customerId">Select Customer *</label>
                                        <Field
                                            as="select"
                                            name="customerId"
                                            id="customerId"
                                            className="form-select"
                                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                                const selectedCustomer = customers.find((c) => c.id === parseInt(e.target.value));
                                                setFieldValue('customerId', e.target.value);
                                                setFieldValue('customerName', selectedCustomer?.name || '');
                                                setFieldValue('phoneNumber', selectedCustomer?.phoneNumber || '');
                                            }}
                                        >
                                            <option value="">Select Customer</option>
                                            {customers.map((customer) => (
                                                <option key={customer.id} value={customer.id}>
                                                    {customer.name}
                                                </option>
                                            ))}
                                        </Field>
                                        {submitCount > 0 && errors.customerId && <div className="text-danger mt-1">{errors.customerId}</div>}
                                    </div>

                                    <div className={submitCount ? (errors.phoneNumber ? 'has-error' : 'has-success') : ''}>
                                        <label htmlFor="phoneNumber">Phone Number</label>
                                        <Field name="phoneNumber" type="text" id="phoneNumber" placeholder="Enter Phone Number" className="form-input" disabled />
                                        {submitCount > 0 && errors.phoneNumber && <div className="text-danger mt-1">{errors.phoneNumber}</div>}
                                    </div>

                                    <div className={submitCount ? (errors.product ? 'has-error' : 'has-success') : ''}>
                                        <label htmlFor="product">Product Name *</label>
                                        <Field
                                            as="select"
                                            name="product"
                                            id="product"
                                            className="form-select"
                                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                                setFieldValue('product', e.target.value);
                                                setFieldValue('availableQuantity', '');
                                                setFieldValue('price', '');
                                                setFieldValue('sellingQuantity', '');
                                                setFieldValue('totalPrice', '');
                                            }}
                                        >
                                            <option value="">Select Product</option>
                                            {products.map((product) => (
                                                <option key={product.id} value={product.name}>
                                                    {product.name}
                                                </option>
                                            ))}
                                        </Field>
                                        {submitCount > 0 && errors.product && <div className="text-danger mt-1">{errors.product}</div>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    {values.product && (
                                        <div className={submitCount ? (errors.availableQuantity ? 'has-error' : 'has-success') : ''}>
                                            <label htmlFor="availableQuantity">Available Quantity *</label>
                                            <Field
                                                as="select"
                                                name="availableQuantity"
                                                id="availableQuantity"
                                                className="form-select"
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                                    setFieldValue('availableQuantity', Number(e.target.value));
                                                }}
                                            >
                                                <option value="">Select Quantity</option>
                                                {products
                                                    .find((p) => p.name === values.product)
                                                    ?.quantities.map((qty, index) => (
                                                        <option key={index} value={qty}>
                                                            {qty}
                                                        </option>
                                                    ))}
                                            </Field>
                                            {submitCount > 0 && errors.availableQuantity && <div className="text-danger mt-1">{errors.availableQuantity}</div>}
                                        </div>
                                    )}
                                    {values.availableQuantity && (
                                        <>
                                            <div className={submitCount ? (errors.sellingQuantity ? 'has-error' : 'has-success') : ''}>
                                                <label htmlFor="sellingQuantity">Selling Quantity *</label>
                                                <Field
                                                    name="sellingQuantity"
                                                    type="number"
                                                    id="sellingQuantity"
                                                    placeholder="Enter Selling Quantity"
                                                    className="form-input"
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                        const qty = Number(e.target.value);
                                                        setFieldValue('sellingQuantity', qty);
                                                        if (values.price) {
                                                            setFieldValue('totalPrice', Number(qty) * Number(values.price));
                                                        }
                                                    }}
                                                />
                                                {submitCount > 0 && errors.sellingQuantity && <div className="text-danger mt-1">{errors.sellingQuantity}</div>}
                                            </div>

                                            <div className={submitCount ? (errors.price ? 'has-error' : 'has-success') : ''}>
                                                <label htmlFor="price">Price *</label>
                                                <Field
                                                    name="price"
                                                    type="number"
                                                    id="price"
                                                    placeholder="Enter Price"
                                                    className="form-input"
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                        const price = Number(e.target.value);
                                                        setFieldValue('price', price);
                                                        if (values.sellingQuantity) {
                                                            setFieldValue('totalPrice', price * Number(values.sellingQuantity));
                                                        }
                                                    }}
                                                />
                                                {submitCount > 0 && errors.price && <div className="text-danger mt-1">{errors.price}</div>}
                                            </div>

                                            <div className={submitCount ? (errors.totalPrice ? 'has-error' : 'has-success') : ''}>
                                                <label htmlFor="totalPrice">Total Price *</label>
                                                <Field name="totalPrice" type="number" id="totalPrice" className="form-input" readOnly />
                                                {submitCount > 0 && errors.totalPrice && <div className="text-danger mt-1">{errors.totalPrice}</div>}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className={submitCount ? (errors.billType ? 'has-error' : 'has-success') : ''}>
                                        <label htmlFor="billType">Bill Type *</label>
                                        <Field as="select" name="billType" id="billType" className="form-select">
                                            <option value="fake">Fake Bill</option>
                                            <option value="perfect">Perfect Bill</option>
                                        </Field>
                                        {submitCount > 0 && errors.billType && <div className="text-danger mt-1">{errors.billType}</div>}
                                    </div>
                                    <div className={submitCount ? (errors.paymentTypes ? 'has-error' : 'has-success') : ''}>
                                        <label>Payment Types *</label>
                                        <div className="mt-2 flex items-center gap-4">
                                            <label className="flex items-center cursor-pointer">
                                                <Field type="checkbox" name="paymentTypes" value="cash" className="form-checkbox" />
                                                <span className="ml-2">Cash</span>
                                            </label>
                                            <label className="flex items-center cursor-pointer">
                                                <Field type="checkbox" name="paymentTypes" value="bank" className="form-checkbox" />
                                                <span className="ml-2">Bank Transfer</span>
                                            </label>
                                            <label className="flex items-center cursor-pointer">
                                                <Field type="checkbox" name="paymentTypes" value="check" className="form-checkbox" />
                                                <span className="ml-2">Check</span>
                                            </label>
                                        </div>
                                        {submitCount > 0 && errors.paymentTypes && <div className="text-danger mt-1">{errors.paymentTypes}</div>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    {values.paymentTypes.includes('cash') && (
                                        <div className={`w-full ${submitCount ? (errors.cashAmount ? 'has-error' : 'has-success') : ''}`}>
                                            <label htmlFor="cashAmount">Cash Amount *</label>
                                            <Field name="cashAmount" type="number" id="cashAmount" placeholder="Enter cash amount" className="form-input w-full" />
                                            {submitCount > 0 && errors.cashAmount && <div className="text-danger mt-1">{errors.cashAmount}</div>}
                                        </div>
                                    )}

                                    {values.paymentTypes.includes('bank') && (
                                        <>
                                            <div className={`w-full ${submitCount ? (errors.bankName ? 'has-error' : 'has-success') : ''}`}>
                                                <label htmlFor="bankName">Bank Name *</label>
                                                <Field name="bankName" type="text" id="bankName" placeholder="Enter bank name" className="form-input w-full" />
                                                {submitCount > 0 && errors.bankName && <div className="text-danger mt-1">{errors.bankName}</div>}
                                            </div>
                                            <div className={`w-full ${submitCount ? (errors.bankAmount ? 'has-error' : 'has-success') : ''}`}>
                                                <label htmlFor="bankAmount">Bank Amount *</label>
                                                <Field name="bankAmount" type="number" id="bankAmount" placeholder="Enter bank amount" className="form-input w-full" />
                                                {submitCount > 0 && errors.bankAmount && <div className="text-danger mt-1">{errors.bankAmount}</div>}
                                            </div>
                                        </>
                                    )}

                                    {values.paymentTypes.includes('check') && (
                                        <>
                                            <div className={`w-full ${submitCount ? (errors.checkNumber ? 'has-error' : 'has-success') : ''}`}>
                                                <label htmlFor="checkNumber">Check Number *</label>
                                                <Field name="checkNumber" type="text" id="checkNumber" placeholder="Enter check number" className="form-input w-full" />
                                                {submitCount > 0 && errors.checkNumber && <div className="text-danger mt-1">{errors.checkNumber}</div>}
                                            </div>
                                            <div className={`w-full ${submitCount ? (errors.checkAmount ? 'has-error' : 'has-success') : ''}`}>
                                                <label htmlFor="checkAmount">Check Amount *</label>
                                                <Field name="checkAmount" type="number" id="checkAmount" placeholder="Enter check amount" className="form-input w-full" />
                                                {submitCount > 0 && errors.checkAmount && <div className="text-danger mt-1">{errors.checkAmount}</div>}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="flex justify-end gap-4">
                                    {editMode && (
                                        <button
                                            type="button"
                                            className="btn btn-danger"
                                            onClick={() => {
                                                setEditMode(false);
                                                formikRef.current.resetForm();
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                    <button type="submit" className="btn btn-primary">
                                        {editMode ? 'Update Khata Sale' : 'Add Khata Sale'}
                                    </button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
            </div>
        </>
    );
};

export default KhataSale;
