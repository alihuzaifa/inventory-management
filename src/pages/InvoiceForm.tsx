import { lazy, useEffect, useRef, useState } from 'react';
import * as Yup from 'yup';
import { Field, Form, Formik, FormikProps } from 'formik';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../store/themeConfigSlice';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { capitalize, sortBy } from 'lodash';
import IconFile from '../components/Icon/IconFile';
import IconPrinter from '../components/Icon/IconPrinter';
import { downloadExcel } from 'react-export-table-to-excel';
const InvoicePdf = lazy(() => import('./Invoice'));

interface InvoiceFormValues {
    customerName: string;
    product: string;
    availableQuantity: string;
    sellingQuantity: string;
    price: string;
    totalPrice: string;
    phoneNumber: string;
    billType: 'fake' | 'perfect';
    paymentTypes: string[];
    cashAmount: string;
    bankAmount: string;
    bankName: string;
    checkAmount: string;
    checkNumber: string;
}

interface InvoiceRecord extends Omit<InvoiceFormValues, 'availableQuantity' | 'sellingQuantity' | 'price' | 'totalPrice' | 'cashAmount' | 'bankAmount' | 'checkAmount'> {
    id: number;
    availableQuantity: number;
    sellingQuantity: number;
    price: number;
    totalPrice: number;
    cashAmount: number;
    bankAmount: number;
    checkAmount: number;
    saleDate: string;
}

const initialData: InvoiceRecord[] = [];

const products = [
    { id: 1, name: 'LED TV', quantities: [500, 100, 1000] },
    { id: 2, name: 'Laptop', quantities: [50, 100, 200] },
    { id: 3, name: 'Mobile Phone', quantities: [300, 400, 500] },
    { id: 4, name: 'Refrigerator', quantities: [50, 75, 100] },
];

const invoiceSchema = Yup.object().shape({
    customerName: Yup.string().required('Customer name is required'),
    product: Yup.string().required('Product name is required'),
    availableQuantity: Yup.number().required('Available quantity is required'),
    sellingQuantity: Yup.number()
        .required('Selling quantity is required')
        .positive('Quantity must be positive')
        .test('max', 'Selling quantity cannot exceed available quantity', function (value) {
            return !value || value <= Number(this.parent.availableQuantity);
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

const Invoice = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Sale Form'));
    }, [dispatch]);

    const [editMode, setEditMode] = useState(false);
    const formikRef = useRef<FormikProps<InvoiceFormValues>>(null);
    const [initialRecords, setInitialRecords] = useState<InvoiceRecord[]>(initialData);
    const [recordsData, setRecordsData] = useState<InvoiceRecord[]>(initialData);
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({ columnAccessor: 'id', direction: 'asc' });

    const submitForm = (values: InvoiceFormValues) => {
        const newRecord: InvoiceRecord = {
            id: initialRecords.length + 1,
            ...values,
            availableQuantity: Number(values.availableQuantity),
            sellingQuantity: Number(values.sellingQuantity),
            price: Number(values.price),
            totalPrice: Number(values.totalPrice),
            cashAmount: Number(values.cashAmount || 0),
            bankAmount: Number(values.bankAmount || 0),
            checkAmount: Number(values.checkAmount || 0),
            saleDate: new Date().toISOString(),
        };

        if (editMode) {
            const updatedRecords = initialRecords.map((record) => (record.id === newRecord.id ? newRecord : record));
            setInitialRecords(updatedRecords);
        } else {
            setInitialRecords([...initialRecords, newRecord]);
        }

        Swal.fire({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            timer: 3000,
            icon: 'success',
            title: `Sale ${editMode ? 'updated' : 'added'} successfully`,
        });
    };

    useEffect(() => {
        const filteredData = initialRecords.filter((item) => {
            const searchLower = search.toLowerCase();

            // Convert all searchable fields to strings and combine them
            const searchableText = [
                item.id.toString(),
                item.customerName.toLowerCase(),
                item.phoneNumber,
                item.product.toLowerCase(),
                item.sellingQuantity.toString(),
                item.price.toString(),
                item.totalPrice.toString(),
                item.billType.toLowerCase(),
                item.paymentTypes.join(' ').toLowerCase(),
                formatDate(item.saleDate).toLowerCase(),
                `Rs. ${item.price.toLocaleString()}`.toLowerCase(),
                `Rs. ${item.totalPrice.toLocaleString()}`.toLowerCase(),
                item.bankName?.toLowerCase() || '',
                item.checkNumber?.toLowerCase() || '',
            ].join(' ');

            return searchableText.includes(searchLower);
        });

        const sortedData = sortBy(filteredData, sortStatus.columnAccessor);
        const sorted = sortStatus.direction === 'desc' ? sortedData.reverse() : sortedData;

        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData(sorted.slice(from, to));
    }, [search, sortStatus, page, pageSize, initialRecords]);

    const formatDate = (date: string) => {
        if (!date) return '';
        try {
            const dt = new Date(date);
            if (isNaN(dt.getTime())) return '';
            const month = (dt.getMonth() + 1).toString().padStart(2, '0');
            const day = dt.getDate().toString().padStart(2, '0');
            return `${day}/${month}/${dt.getFullYear()}`;
        } catch (error) {
            console.error('Date formatting error:', error);
            return '';
        }
    };

    const handleEdit = (row: InvoiceRecord) => {
        setEditMode(true);
        if (formikRef.current) {
            formikRef.current.setValues({
                customerName: row.customerName,
                product: row.product,
                availableQuantity: row.availableQuantity.toString(),
                sellingQuantity: row.sellingQuantity.toString(),
                price: row.price.toString(),
                totalPrice: row.totalPrice.toString(),
                phoneNumber: row.phoneNumber,
                billType: row.billType,
                paymentTypes: row.paymentTypes,
                cashAmount: row.cashAmount.toString(),
                bankAmount: row.bankAmount.toString(),
                bankName: row.bankName,
                checkAmount: row.checkAmount.toString(),
                checkNumber: row.checkNumber,
            });
        }
    };
    const handleDelete = (row: InvoiceRecord) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete',
        }).then((result) => {
            if (result.isConfirmed) {
                setInitialRecords(initialRecords.filter((item) => item.id !== row.id));
                Swal.fire('Deleted!', 'The invoice has been deleted.', 'success');
            }
        });
    };

    const col = ['id', 'customerName', 'phoneNumber', 'product', 'sellingQuantity', 'price', 'totalPrice', 'billType', 'paymentTypes', 'saleDate'];
    const header = ['ID', 'Customer Name', 'Phone Number', 'Product', 'Quantity', 'Price', 'Total Price', 'Bill Type', 'Payment Types', 'Sale Date'];

    const exportTable = (type: string) => {
        let columns = col;
        let records = initialRecords;
        let filename = 'Invoice Report';

        if (type === 'csv') {
            let coldelimiter = ';';
            let linedelimiter = '\n';
            let result = columns.map(capitalize).join(coldelimiter);
            result += linedelimiter;

            records.forEach((item: any) => {
                columns.forEach((d: any, index) => {
                    if (index > 0) result += coldelimiter;
                    let val = item[d] ? item[d] : '';
                    if (d === 'price' || d === 'totalPrice') val = `Rs. ${val.toLocaleString()}`;
                    if (d === 'saleDate') val = formatDate(val);
                    if (d === 'paymentTypes') val = val.join(', ');
                    result += val;
                });
                result += linedelimiter;
            });

            const data = 'data:application/csv;charset=utf-8,' + encodeURIComponent(result);
            const link = document.createElement('a');
            link.setAttribute('href', data);
            link.setAttribute('download', filename + '.csv');
            link.click();
        } else if (type === 'print') {
            let rowhtml = `<p>${filename}</p>`;
            rowhtml += `<table style="width: 100%;" cellpadding="0" cellspacing="0">
            <thead><tr style="color: #515365; background: #eff5ff; print-color-adjust: exact;">`;

            columns.forEach((d: any) => {
                rowhtml += `<th>${capitalize(d)}</th>`;
            });

            rowhtml += `</tr></thead><tbody>`;

            records.forEach((item: any) => {
                rowhtml += '<tr>';
                columns.forEach((d) => {
                    let val = item[d] ? item[d] : '';
                    if (d === 'price' || d === 'totalPrice') val = `Rs. ${val.toLocaleString()}`;
                    if (d === 'saleDate') val = formatDate(val);
                    if (d === 'paymentTypes') val = val.join(', ');
                    rowhtml += `<td>${val}</td>`;
                });
                rowhtml += '</tr>';
            });

            rowhtml += `</tbody></table>
            <style>
                body { font-family: Arial; color:#495057; }
                p { text-align:center; font-size:18px; font-weight:bold; margin:15px; }
                table { border-collapse: collapse; }
                th, td { font-size:12px; text-align:left; padding: 4px; }
                th { padding:8px 4px; }
                tr:nth-child(odd) { background:#f7f7f7; }
            </style>`;

            const winPrint: any = window.open('', '', 'width=1000,height=600');
            winPrint.document.write(`<title>Print</title>${rowhtml}`);
            winPrint.document.close();
            winPrint.focus();
            winPrint.print();
        }
    };

    function handleDownloadExcel() {
        const excelData = initialRecords.map((item) => ({
            ID: item.id,
            'Customer Name': item.customerName,
            'Phone Number': item.phoneNumber,
            Product: item.product,
            Quantity: item.sellingQuantity,
            Price: `Rs. ${item.price.toLocaleString()}`,
            'Total Price': `Rs. ${item.totalPrice.toLocaleString()}`,
            'Bill Type': item.billType,
            'Payment Types': item.paymentTypes.join(', '),
            'Sale Date': formatDate(item.saleDate),
        }));

        downloadExcel({
            fileName: 'invoice-report',
            sheet: 'Invoice Details',
            tablePayload: {
                header,
                body: excelData,
            },
        });
    }

    return (
        <>
            <div className="panel">
                <div className="mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light mb-4">{editMode ? 'Edit Invoice' : 'Add Invoice'}</h5>
                    <Formik<InvoiceFormValues>
                        innerRef={formikRef}
                        initialValues={{
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
                        validationSchema={invoiceSchema}
                        onSubmit={(values, { resetForm }) => {
                            submitForm(values);
                            resetForm();
                            setEditMode(false);
                        }}
                    >
                        {({ errors, touched, values, setFieldValue, submitCount }) => (
                            <Form className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    {/* Customer Name */}
                                    <div className={submitCount ? (errors.customerName ? 'has-error' : 'has-success') : ''}>
                                        <label htmlFor="customerName">Customer Name *</label>
                                        <Field name="customerName" type="text" id="customerName" placeholder="Enter Customer Name" className="form-input" />
                                        {submitCount > 0 && errors.customerName && <div className="text-danger mt-1">{errors.customerName}</div>}
                                    </div>

                                    {/* Phone Number */}
                                    <div className={submitCount ? (errors.phoneNumber ? 'has-error' : 'has-success') : ''}>
                                        <label htmlFor="phoneNumber">Phone Number *</label>
                                        <Field name="phoneNumber" type="text" id="phoneNumber" placeholder="Enter Phone Number" className="form-input" />
                                        {submitCount > 0 && errors.phoneNumber && <div className="text-danger mt-1">{errors.phoneNumber}</div>}
                                    </div>

                                    {/* Product */}
                                    <div className={submitCount ? (errors.product ? 'has-error' : 'has-success') : ''}>
                                        <label htmlFor="product">Product *</label>
                                        <Field as="select" name="product" id="product" className="form-select">
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
                                    {/* Available Quantity */}
                                    {values.product && (
                                        <div className={submitCount ? (errors.availableQuantity ? 'has-error' : 'has-success') : ''}>
                                            <label htmlFor="product">Available Quantity *</label>
                                            <Field
                                                as="select"
                                                name="availableQuantity"
                                                id="availableQuantity"
                                                className="form-select"
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                                    setFieldValue('availableQuantity', Number(e.target.value));
                                                }}
                                            >
                                                <option value="">Select Available Quantity</option>
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

                                    {/* Selling Quantity */}
                                    {values.availableQuantity && (
                                        <div className={submitCount ? (errors.sellingQuantity ? 'has-error' : 'has-success') : ''}>
                                            <label htmlFor="phoneNumber">Selling Quantity *</label>
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
                                                        setFieldValue('totalPrice', qty * Number(values.price));
                                                    }
                                                }}
                                            />
                                            {submitCount > 0 && errors.sellingQuantity && <div className="text-danger mt-1">{errors.sellingQuantity}</div>}
                                        </div>
                                    )}

                                    {/* Price */}
                                    {values.availableQuantity && (
                                        <div className={submitCount ? (errors.price ? 'has-error' : 'has-success') : ''}>
                                            <label htmlFor="phoneNumber">Price *</label>
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
                                    )}

                                    {/* Total Price */}
                                    {values.price && values.sellingQuantity && Number(values.sellingQuantity) * Number(values.price) > 0 && (
                                        <div className={submitCount ? (errors.totalPrice ? 'has-error' : 'has-success') : ''}>
                                            <label htmlFor="phoneNumber">Total Price *</label>
                                            <Field name="totalPrice" type="number" id="totalPrice" className="form-input" readOnly />
                                            {submitCount > 0 && errors.totalPrice && <div className="text-danger mt-1">{errors.totalPrice}</div>}
                                        </div>
                                    )}
                                </div>

                                {/* Bill Type and Payment Types */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className={submitCount ? (errors.billType ? 'has-error' : 'has-success') : ''}>
                                        <label htmlFor="product">Bill Type *</label>
                                        <Field as="select" name="billType" id="billType" className="form-select">
                                            <option value="perfect">Perfect Bill</option>
                                            <option value="fake">F Bill</option>
                                        </Field>
                                        {submitCount > 0 && errors.billType && <div className="text-danger mt-1">{errors.billType}</div>}
                                    </div>

                                    <div>
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
                                        {touched.paymentTypes && errors.paymentTypes && <div className="text-danger mt-1">{errors.paymentTypes}</div>}
                                    </div>
                                </div>

                                {/* Payment Details */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    {/* Cash Payment */}
                                    {values.paymentTypes.includes('cash') && (
                                        <div className={submitCount ? (errors.cashAmount ? 'has-error' : 'has-success') : ''}>
                                            <label htmlFor="cashAmount">Cash Amount *</label>
                                            <Field name="cashAmount" type="number" id="cashAmount" placeholder="Enter cash amount" className="form-input" />
                                            {submitCount > 0 && errors.cashAmount && <div className="text-danger mt-1">{errors.cashAmount}</div>}
                                        </div>
                                    )}

                                    {/* Bank Payment */}
                                    {values.paymentTypes.includes('bank') && (
                                        <>
                                            <div className={submitCount ? (errors.bankName ? 'has-error' : 'has-success') : ''}>
                                                <label htmlFor="cashAmount">Bank Name *</label>
                                                <Field name="bankName" type="text" id="bankName" placeholder="Enter bank name" className="form-input" />
                                                {submitCount > 0 && errors.bankName && <div className="text-danger mt-1">{errors.bankName}</div>}
                                            </div>
                                            <div className={submitCount ? (errors.bankAmount ? 'has-error' : 'has-success') : ''}>
                                                <label htmlFor="bankAmount">Bank Amount *</label>
                                                <Field name="bankAmount" type="number" id="bankAmount" placeholder="Enter bank amount" className="form-input" />
                                                {submitCount > 0 && errors.bankAmount && <div className="text-danger mt-1">{errors.bankAmount}</div>}
                                            </div>
                                        </>
                                    )}

                                    {/* Check Payment */}
                                    {values.paymentTypes.includes('check') && (
                                        <>
                                            <div className={submitCount ? (errors.checkNumber ? 'has-error' : 'has-success') : ''}>
                                                <label htmlFor="checkNumber">Check Number *</label>
                                                <Field name="checkNumber" type="text" id="checkNumber" placeholder="Enter check number" className="form-input" />
                                                {submitCount > 0 && errors.checkNumber && <div className="text-danger mt-1">{errors.checkNumber}</div>}
                                            </div>
                                            <div className={submitCount ? (errors.checkAmount ? 'has-error' : 'has-success') : ''}>
                                                <label htmlFor="checkAmount">Check Amount *</label>
                                                <Field name="checkAmount" type="number" id="checkAmount" placeholder="Enter check amount" className="form-input" />
                                                {submitCount > 0 && errors.checkAmount && <div className="text-danger mt-1">{errors.checkAmount}</div>}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Form Actions */}
                                <div className="flex justify-end gap-4">
                                    {editMode && (
                                        <button
                                            type="button"
                                            className="btn btn-danger"
                                            onClick={() => {
                                                setEditMode(false);
                                                formikRef.current?.resetForm();
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                    <button type="submit" className="btn btn-primary">
                                        {editMode ? 'Update Invoice' : 'Add Invoice'}
                                    </button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
            </div>

            {/* Sales Table */}
            <div className="panel mt-6">
                <div className="flex md:items-center md:flex-row flex-col mb-5 gap-5">
                    {/* Export buttons */}
                    <div className="flex items-center flex-wrap gap-2">
                        <button type="button" onClick={() => exportTable('csv')} className="btn btn-primary btn-sm">
                            <IconFile className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                            CSV
                        </button>
                        <button type="button" className="btn btn-primary btn-sm" onClick={handleDownloadExcel}>
                            <IconFile className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                            EXCEL
                        </button>
                        <button type="button" onClick={() => exportTable('print')} className="btn btn-primary btn-sm">
                            <IconPrinter className="ltr:mr-2 rtl:ml-2" />
                            PRINT
                        </button>
                    </div>
                    <div className="ltr:ml-auto rtl:mr-auto">
                        <input type="text" className="form-input w-auto" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>

                <div className="datatables">
                    <DataTable
                        records={recordsData}
                        columns={[
                            { accessor: 'id', title: 'ID', sortable: true },
                            { accessor: 'customerName', title: 'Customer Name', sortable: true },
                            { accessor: 'phoneNumber', title: 'Phone Number', sortable: true },
                            { accessor: 'product', title: 'Product', sortable: true },
                            { accessor: 'sellingQuantity', title: 'Quantity', sortable: true },
                            {
                                accessor: 'price',
                                title: 'Price',
                                sortable: true,
                                render: ({ price }) => `Rs. ${price.toLocaleString()}`,
                            },
                            {
                                accessor: 'totalPrice',
                                title: 'Total Price',
                                sortable: true,
                                render: ({ totalPrice }) => `Rs. ${totalPrice.toLocaleString()}`,
                            },
                            { accessor: 'billType', title: 'Bill Type', sortable: true },
                            {
                                accessor: 'paymentTypes',
                                title: 'Payment Types',
                                render: ({ paymentTypes }) => (
                                    <div className="flex flex-wrap gap-1">
                                        {paymentTypes.map((type: string) => (
                                            <span key={type} className="badge badge-outline-primary">
                                                {type}
                                            </span>
                                        ))}
                                    </div>
                                ),
                            },
                            {
                                accessor: 'saleDate',
                                title: 'Sale Date',
                                render: ({ saleDate }) => formatDate(saleDate),
                            },
                            {
                                accessor: 'actions',
                                title: 'Actions',
                                render: (row) => (
                                    <div className="flex gap-2">
                                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(row)}>
                                            Edit
                                        </button>
                                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(row)}>
                                            Delete
                                        </button>
                                    </div>
                                ),
                            },
                        ]}
                        totalRecords={initialRecords.length}
                        recordsPerPage={pageSize}
                        page={page}
                        onPageChange={(p) => setPage(p)}
                        recordsPerPageOptions={PAGE_SIZES}
                        onRecordsPerPageChange={setPageSize}
                        sortStatus={sortStatus}
                        onSortStatusChange={setSortStatus}
                        minHeight={200}
                        paginationText={({ from, to, totalRecords }) => `Showing ${from} to ${to} of ${totalRecords} entries`}
                    />
                </div>
            </div>
        </>
    );
};

export default Invoice;
