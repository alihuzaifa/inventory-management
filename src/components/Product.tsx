import { Field, Form, Formik } from 'formik';
import React from 'react';
import * as Yup from 'yup';

interface FormikCustomerDetails {
    customerName: string;
    phoneNumber: string;
    paymentTypes: string[];
    cashAmount?: string;
    bankAmount?: string;
    bankName?: string;
    checkAmount?: string;
    checkNumber?: string;
    billType: 'perfect' | 'fake';
}

const customerDetailsSchema = Yup.object().shape({
    customerName: Yup.string().required('Customer name is required'),
    phoneNumber: Yup.string()
        .matches(/^[0-9]+$/, 'Phone number must contain only digits')
        .min(11, 'Phone number must be at least 11 digits')
        .max(11, 'Phone number must not exceed 11 digits'),
    paymentTypes: Yup.array().min(1, 'At least one payment type is required'),
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
    billType: Yup.string().oneOf(['perfect', 'fake'], 'Invalid bill type').required('Bill type is required'),
});

const productSchema = Yup.object().shape({
    product: Yup.string().required('Product is required'),
    availableQuantity: Yup.number().required('Available quantity is required'),
    sellingQuantity: Yup.number()
        .required('Selling quantity is required')
        .positive('Quantity must be positive')
        .test('max', 'Selling quantity cannot exceed available quantity', function (value) {
            return !value || value <= this.parent.availableQuantity;
        }),
    price: Yup.number().required('Price is required').positive('Price must be positive'),
    totalPrice: Yup.number().required('Total price is required'),
});

const Product = ({ handleSaveInvoice, currentProducts, customerData, handleCustomerSubmit, customerFormRef, totalBillAmount, handleAddProduct, products, handleRemoveProduct }: any) => {
    return (
        <div className="panel">
            {/* Product Details Section */}
            <div className="mb-5">
                <h5 className="font-semibold text-lg dark:text-white-light mb-4">Product Details</h5>
                <Formik
                    initialValues={{
                        product: '',
                        availableQuantity: '',
                        sellingQuantity: '',
                        price: '',
                        totalPrice: '',
                        availableQuantityId: '',
                    }}
                    validationSchema={productSchema}
                    onSubmit={handleAddProduct}
                >
                    {({ errors, touched, values, setFieldValue, submitCount }) => (
                        <Form>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className={submitCount ? (errors.product ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="product">Product *</label>
                                    <Field as="select" name="product" className="form-select">
                                        <option value="">Select Product</option>
                                        {products.map((p: any) => (
                                            <option key={p.id} value={p.name}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </Field>
                                    {submitCount > 0 && errors.product && <div className="text-danger mt-1">{errors.product}</div>}
                                </div>

                                {values.product && (
                                    <>
                                        <div className={submitCount ? (errors.availableQuantity ? 'has-error' : 'has-success') : ''}>
                                            <label htmlFor="availableQuantity">Available Qty *</label>
                                            <Field
                                                as="select"
                                                name="availableQuantity"
                                                className="form-select"
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                                    const selectedQuantity = e.target.value;
                                                    setFieldValue('availableQuantity', selectedQuantity);

                                                    const selectedProduct = products.find((p: any) => p.name === values.product);
                                                    if (selectedProduct) {
                                                        const selectedQtyObj = selectedProduct.quantities.find((qty: any) => qty.quantity.toString() === selectedQuantity);
                                                        if (selectedQtyObj) {
                                                            setFieldValue('availableQuantityId', selectedQtyObj._id);
                                                        } else {
                                                            setFieldValue('availableQuantityId', '');
                                                        }
                                                    }
                                                }}
                                            >
                                                <option value="">Select Quantity</option>
                                                {products
                                                    .find((p: any) => p.name === values.product)
                                                    ?.quantities.map((qty: any, idx: any) => (
                                                        <option key={idx} value={qty.quantity}>
                                                            {qty.quantity}
                                                        </option>
                                                    ))}
                                            </Field>
                                            {touched.availableQuantity && errors.availableQuantity && <div className="text-danger mt-1">{errors.availableQuantity}</div>}
                                        </div>

                                        <div className={submitCount ? (errors.sellingQuantity ? 'has-error' : 'has-success') : ''}>
                                            <label htmlFor="sellingQuantity">Selling Qty *</label>
                                            <Field
                                                name="sellingQuantity"
                                                type="number"
                                                className="form-input"
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                    const qty = Number(e.target.value);
                                                    setFieldValue('sellingQuantity', qty);
                                                    if (values.price) {
                                                        setFieldValue('totalPrice', qty * Number(values.price));
                                                    }
                                                }}
                                            />
                                            {touched.sellingQuantity && errors.sellingQuantity && <div className="text-danger mt-1">{errors.sellingQuantity}</div>}
                                        </div>

                                        <div className={submitCount ? (errors.price ? 'has-error' : 'has-success') : ''}>
                                            <label htmlFor="price">Price *</label>
                                            <Field
                                                name="price"
                                                type="number"
                                                className="form-input"
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                    const price = Number(e.target.value);
                                                    setFieldValue('price', price);
                                                    if (values.sellingQuantity) {
                                                        setFieldValue('totalPrice', price * Number(values.sellingQuantity));
                                                    }
                                                }}
                                            />
                                            {touched.price && errors.price && <div className="text-danger mt-1">{errors.price}</div>}
                                        </div>

                                        <div className={submitCount ? (errors.totalPrice ? 'has-error' : 'has-success') : ''}>
                                            <label htmlFor="totalPrice">Total Price</label>
                                            <Field name="totalPrice" type="number" className="form-input" disabled />
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="mt-4">
                                <button type="submit" className="btn btn-primary">
                                    Add Product
                                </button>
                            </div>
                        </Form>
                    )}
                </Formik>

                {/* Current Products Table */}
                {currentProducts.length > 0 && (
                    <div className="mt-6">
                        <h6 className="font-semibold mb-3">Added Products</h6>
                        <div className="table-responsive">
                            <table className="table-striped table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Quantity</th>
                                        <th>Price</th>
                                        <th>Total</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentProducts.map((item: any) => (
                                        <tr key={item.id}>
                                            <td>{item.product}</td>
                                            <td>{item.sellingQuantity}</td>
                                            <td>Rs. {item.price.toLocaleString()}</td>
                                            <td>Rs. {item.totalPrice.toLocaleString()}</td>
                                            <td>
                                                <button type="button" className="btn btn-sm btn-danger" onClick={() => handleRemoveProduct(item.id)}>
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td colSpan={3} className="text-right font-bold">
                                            Total Bill Amount:
                                        </td>
                                        <td colSpan={2} className="font-bold">
                                            Rs. {totalBillAmount.toLocaleString()}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Customer Details Section */}
            {currentProducts.length > 0 && (
                <div className="mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light mb-4">Customer Details</h5>
                    <Formik<FormikCustomerDetails>
                        initialValues={{
                            customerName: '',
                            phoneNumber: '',
                            paymentTypes: [],
                            cashAmount: '',
                            bankAmount: '',
                            bankName: '',
                            checkAmount: '',
                            checkNumber: '',
                            billType: 'perfect',
                        }}
                        validationSchema={customerDetailsSchema}
                        onSubmit={handleCustomerSubmit}
                        enableReinitialize
                        validateOnChange={true}
                        validateOnBlur={true}
                        // context={{ totalBillAmount: totalBillAmount }}
                        innerRef={customerFormRef}
                    >
                        {({ errors, touched, values, submitCount }) => (
                            <Form>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className={submitCount ? (errors.customerName ? 'has-error' : 'has-success') : ''}>
                                        <label htmlFor="customerName">Customer Name *</label>
                                        <Field name="customerName" type="text" className="form-input" />
                                        {touched.customerName && errors.customerName && <div className="text-danger mt-1">{errors.customerName}</div>}
                                    </div>

                                    <div className={submitCount ? (errors.phoneNumber ? 'has-error' : 'has-success') : ''}>
                                        <label htmlFor="phoneNumber">Phone Number *</label>
                                        <Field name="phoneNumber" type="text" className="form-input" />
                                        {touched.phoneNumber && errors.phoneNumber && <div className="text-danger mt-1">{errors.phoneNumber}</div>}
                                    </div>

                                    {/* Add Bill Type Dropdown */}
                                    <div className={submitCount ? (errors.billType ? 'has-error' : 'has-success') : ''}>
                                        <label htmlFor="billType">Bill Type *</label>
                                        <Field as="select" name="billType" className="form-select">
                                            <option value="perfect">Perfect Bill</option>
                                            <option value="fake">Fake Bill</option>
                                        </Field>
                                        {touched.billType && errors.billType && <div className="text-danger mt-1">{errors.billType}</div>}
                                    </div>

                                    <div className={submitCount ? (errors.paymentTypes ? 'has-error' : 'has-success') : ''}>
                                        <label>Payment Types *</label>
                                        <div className="mt-2">
                                            <label className="inline-flex items-center mr-3">
                                                <Field type="checkbox" name="paymentTypes" value="cash" className="form-checkbox" />
                                                <span className="ml-2">Cash</span>
                                            </label>
                                            <label className="inline-flex items-center mr-3">
                                                <Field type="checkbox" name="paymentTypes" value="bank" className="form-checkbox" />
                                                <span className="ml-2">Bank</span>
                                            </label>
                                            <label className="inline-flex items-center">
                                                <Field type="checkbox" name="paymentTypes" value="check" className="form-checkbox" />
                                                <span className="ml-2">Check</span>
                                            </label>
                                        </div>
                                        {touched.paymentTypes && errors.paymentTypes && <div className="text-danger mt-1">{errors.paymentTypes}</div>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4">
                                    {values.paymentTypes?.includes('cash') && (
                                        <div className={submitCount ? (errors.cashAmount ? 'has-error' : 'has-success') : ''}>
                                            <label htmlFor="cashAmount">Cash Amount *</label>
                                            <Field name="cashAmount" type="text" className="form-input" />
                                            {touched.cashAmount && errors.cashAmount && <div className="text-danger mt-1">{errors.cashAmount}</div>}
                                        </div>
                                    )}

                                    {values.paymentTypes.includes('bank') && (
                                        <>
                                            <div className={submitCount ? (errors.bankName ? 'has-error' : 'has-success') : ''}>
                                                <label htmlFor="bankName">Bank Name *</label>
                                                <Field name="bankName" type="text" className="form-input" />
                                                {touched.bankName && errors.bankName && <div className="text-danger mt-1">{errors.bankName}</div>}
                                            </div>
                                            <div className={submitCount ? (errors.bankAmount ? 'has-error' : 'has-success') : ''}>
                                                <label htmlFor="bankAmount">Bank Amount *</label>
                                                <Field name="bankAmount" type="text" className="form-input" />
                                                {touched.bankAmount && errors.bankAmount && <div className="text-danger mt-1">{errors.bankAmount}</div>}
                                            </div>
                                        </>
                                    )}

                                    {values.paymentTypes.includes('check') && (
                                        <>
                                            <div className={submitCount ? (errors.checkNumber ? 'has-error' : 'has-success') : ''}>
                                                <label htmlFor="checkNumber">Check Number *</label>
                                                <Field name="checkNumber" type="text" className="form-input" />
                                                {touched.checkNumber && errors.checkNumber && <div className="text-danger mt-1">{errors.checkNumber}</div>}
                                            </div>
                                            <div className={submitCount ? (errors.checkAmount ? 'has-error' : 'has-success') : ''}>
                                                <label htmlFor="checkAmount">Check Amount *</label>
                                                <Field name="checkAmount" type="text" className="form-input" />
                                                {touched.checkAmount && errors.checkAmount && <div className="text-danger mt-1">{errors.checkAmount}</div>}
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="mt-4">
                                    <button type="submit" className="btn btn-primary">
                                        Save Customer Details
                                    </button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
            )}

            {/* Save Invoice Button */}
            {currentProducts.length > 0 && customerData && (
                <div className="flex justify-end gap-4 mt-6">
                    <button type="button" className="btn btn-success" onClick={handleSaveInvoice}>
                        Save Invoice
                    </button>
                </div>
            )}
        </div>
    );
};

export default Product;
