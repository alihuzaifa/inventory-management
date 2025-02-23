import { useEffect, useRef, useState } from 'react';
import * as Yup from 'yup';
import { Field, Form, Formik } from 'formik';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../store/themeConfigSlice';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { capitalize, sortBy } from 'lodash';
import IconEdit from '../components/Icon/IconEdit';
import IconTrash from '../components/Icon/IconTrash';
import IconFile from '../components/Icon/IconFile';
import IconPrinter from '../components/Icon/IconPrinter';
import { downloadExcel } from 'react-export-table-to-excel';

const col = ['id', 'customerName', 'product', 'quantity', 'totalPrice', 'payingAmount', 'remainingAmount', 'phoneNumber', 'saleDate'];
const header = ['Id', 'Customer Name', 'Product', 'Quantity', 'Total Price', 'Paying Amount', 'Remaining Amount', 'Phone Number', 'Sale Date'];

const Sale = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Sale Form'));
    }, []);

    const [editMode, setEditMode] = useState(false);
    const formikRef = useRef<any>(null);

    const submitForm = () => {
        const toast = Swal.mixin({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            timer: 3000,
        });
        toast.fire({
            icon: 'success',
            title: 'Sale added successfully',
            padding: '10px 20px',
        });
    };

    const saleSchema = Yup.object().shape({
        customerName: Yup.string().required('Customer name is required'),
        product: Yup.string().required('Product name is required'),
        quantity: Yup.number().required('Quantity is required').positive('Quantity must be positive'),
        totalPrice: Yup.number().required('Total price is required').positive('Price must be positive'),
        payingAmount: Yup.number()
            .required('Paying amount is required')
            .min(0, 'Paying amount cannot be negative')
            .test('max', 'Paying amount cannot exceed total price', function (value) {
                return !value || value <= this.parent.totalPrice;
            }),
        phoneNumber: Yup.string()
            .matches(/^[0-9]+$/, 'Phone number must contain only digits')
            .min(11, 'Phone number must be at least 11 digits')
            .max(11, 'Phone number must not exceed 11 digits'),
        paymentType: Yup.string().required('Payment type is required'),
        checkNumber: Yup.string().when('paymentType', {
            is: 'check',
            then: (schema) => schema.required('Check number is required'),
            otherwise: (schema) => schema.notRequired(),
        }),
    });

    // Sample sale data
    const rowData = [
        {
            id: 1,
            customerName: 'John Doe',
            product: 'LED TV',
            quantity: 1,
            totalPrice: 50000,
            payingAmount: 50000,
            remainingAmount: 0,
            phoneNumber: '03001234567',
            saleDate: '2024-01-15',
        },
        {
            id: 2,
            customerName: 'Jane Smith',
            product: 'Laptop',
            quantity: 1,
            totalPrice: 150000,
            payingAmount: 100000,
            remainingAmount: 50000,
            phoneNumber: '03009876543',
            saleDate: '2024-01-16',
        },
    ];

    // Table configuration
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState(sortBy(rowData, 'id'));
    const [recordsData, setRecordsData] = useState(initialRecords);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({ columnAccessor: 'id', direction: 'asc' });

    // Update these effects for proper searching, sorting, and pagination
    useEffect(() => {
        const filteredData = rowData.filter((item: any) => {
            const searchLower = search.toLowerCase();
            return (
                item.id.toString().includes(searchLower) ||
                item.customerName.toLowerCase().includes(searchLower) ||
                item.product.toLowerCase().includes(searchLower) ||
                item.quantity.toString().includes(searchLower) ||
                item.totalPrice.toString().includes(searchLower) ||
                (item.phoneNumber && item.phoneNumber.includes(searchLower)) ||
                (item.payingAmount && item.payingAmount.toString().includes(searchLower)) ||
                formatDate(item.saleDate).includes(searchLower)
            );
        });

        const sortedData = sortBy(filteredData, sortStatus.columnAccessor);
        const sorted = sortStatus.direction === 'desc' ? sortedData.reverse() : sortedData;

        setInitialRecords(sorted);

        // Update recordsData with paginated results
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData(sorted.slice(from, to));
    }, [search, sortStatus, page, pageSize]);

    // Reset page when pageSize changes
    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    // Handle sorting
    useEffect(() => {
        const data = sortBy(initialRecords, sortStatus.columnAccessor);
        const sorted = sortStatus.direction === 'desc' ? data.reverse() : data;
        setInitialRecords(sorted);

        // Update recordsData with new sorted and paginated results
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData(sorted.slice(from, to));
    }, [sortStatus]);

    // Update records when page changes
    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData(initialRecords.slice(from, to));
    }, [page, pageSize, initialRecords]);

    const formatDate = (date: string) => {
        if (date) {
            const dt = new Date(date);
            const month = dt.getMonth() + 1 < 10 ? '0' + (dt.getMonth() + 1) : dt.getMonth() + 1;
            const day = dt.getDate() < 10 ? '0' + dt.getDate() : dt.getDate();
            return day + '/' + month + '/' + dt.getFullYear();
        }
        return '';
    };

    const handleEdit = (id: number) => {
        const sale = rowData.find((item) => item.id === id);
        if (sale) {
            if (formikRef.current) {
                formikRef.current.setValues({
                    customerName: sale.customerName,
                    product: sale.product,
                    quantity: sale.quantity,
                    totalPrice: sale.totalPrice,
                    payingAmount: sale.payingAmount,
                    phoneNumber: sale.phoneNumber,
                });
            }
            setEditMode(true);
        }
    };

    const handleDelete = (id: number) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            padding: '2em',
        }).then((result) => {
            if (result.value) {
                const updatedData = initialRecords.filter((item) => item.id !== id);
                setInitialRecords(updatedData);
                setRecordsData(updatedData);
                Swal.fire('Deleted!', 'Sale has been deleted.', 'success');
            }
        });
    };

    const exportTable = (type: string) => {
        let columns: any = col;
        let records = rowData;
        let filename = 'Sale Record';

        let newVariable: any;
        newVariable = window.navigator;

        if (type === 'csv') {
            let coldelimiter = ';';
            let linedelimiter = '\n';
            let result = columns
                .map((d: any) => {
                    return capitalize(d);
                })
                .join(coldelimiter);
            result += linedelimiter;
            records.map((item: any) => {
                columns.map((d: any, index: any) => {
                    if (index > 0) {
                        result += coldelimiter;
                    }
                    let val = item[d] ? item[d] : '';
                    if (d === 'totalPrice' || d === 'payingAmount') {
                        val = `Rs. ${val.toLocaleString()}`;
                    } else if (d === 'remainingAmount') {
                        val = `Rs. ${(item.totalPrice - (item.payingAmount || 0)).toLocaleString()}`;
                    } else if (d === 'saleDate') {
                        val = formatDate(val);
                    }
                    result += val;
                });
                result += linedelimiter;
            });

            if (result == null) return;
            if (!result.match(/^data:text\/csv/i) && !newVariable.msSaveOrOpenBlob) {
                var data = 'data:application/csv;charset=utf-8,' + encodeURIComponent(result);
                var link = document.createElement('a');
                link.setAttribute('href', data);
                link.setAttribute('download', filename + '.csv');
                link.click();
            } else {
                var blob = new Blob([result]);
                if (newVariable.msSaveOrOpenBlob) {
                    newVariable.msSaveBlob(blob, filename + '.csv');
                }
            }
        } else if (type === 'print') {
            var rowhtml = '<p>' + filename + '</p>';
            rowhtml +=
                '<table style="width: 100%; " cellpadding="0" cellcpacing="0"><thead><tr style="color: #515365; background: #eff5ff; -webkit-print-color-adjust: exact; print-color-adjust: exact; "> ';
            columns.map((d: any) => {
                rowhtml += '<th>' + capitalize(d) + '</th>';
            });
            rowhtml += '</tr></thead>';
            rowhtml += '<tbody>';

            records.map((item: any) => {
                rowhtml += '<tr>';
                columns.map((d: any) => {
                    let val = item[d] ? item[d] : '';
                    if (d === 'totalPrice' || d === 'payingAmount') {
                        val = `Rs. ${val.toLocaleString()}`;
                    } else if (d === 'remainingAmount') {
                        val = `Rs. ${(item.totalPrice - (item.payingAmount || 0)).toLocaleString()}`;
                    } else if (d === 'saleDate') {
                        val = formatDate(val);
                    }
                    rowhtml += '<td>' + val + '</td>';
                });
                rowhtml += '</tr>';
            });
            rowhtml +=
                '<style>body {font-family:Arial; color:#495057;}p{text-align:center;font-size:18px;font-weight:bold;margin:15px;}table{ border-collapse: collapse; border-spacing: 0; }th,td{font-size:12px;text-align:left;padding: 4px;}th{padding:8px 4px;}tr:nth-child(2n-1){background:#f7f7f7; }</style>';
            rowhtml += '</tbody></table>';
            var winPrint: any = window.open('', '', 'left=0,top=0,width=1000,height=600,toolbar=0,scrollbars=0,status=0');
            winPrint.document.write('<title>Print</title>' + rowhtml);
            winPrint.document.close();
            winPrint.focus();
            winPrint.print();
        }
    };

    function handleDownloadExcel() {
        const excelData = rowData.map((item) => ({
            ID: item.id,
            'Customer Name': item.customerName,
            Product: item.product,
            Quantity: item.quantity,
            'Total Price': `Rs. ${item.totalPrice.toLocaleString()}`,
            'Paying Amount': `Rs. ${item.payingAmount.toLocaleString()}`,
            'Remaining Amount': `Rs. ${(item.totalPrice - item.payingAmount).toLocaleString()}`,
            'Phone Number': item.phoneNumber,
            'Sale Date': formatDate(item.saleDate),
        }));

        downloadExcel({
            fileName: 'sales',
            sheet: 'Sales',
            tablePayload: {
                header,
                body: excelData,
            },
        });
    }

    const products = [
        { id: 1, name: 'LED TV' },
        { id: 2, name: 'Laptop' },
        { id: 3, name: 'Mobile Phone' },
        { id: 4, name: 'Refrigerator' },
    ];

    return (
        <>
            <div className="panel">
                <div className="mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light mb-4">{editMode ? 'Edit Sale' : 'Add Sale'}</h5>
                    <Formik
                        innerRef={formikRef}
                        initialValues={{
                            customerName: '',
                            product: '',
                            quantity: '',
                            totalPrice: '',
                            payingAmount: '',
                            phoneNumber: '',
                            billType: 'fake',
                            paymentType: 'cash',
                            checkNumber: '',
                        }}
                        validationSchema={saleSchema}
                        onSubmit={(values, { resetForm }) => {
                            const remainingAmount = Number(values.totalPrice) - Number(values.payingAmount);
                            let status = 'unpaid';
                            if (remainingAmount === 0) {
                                status = 'paid';
                            } else if (Number(values.payingAmount) > 0) {
                                status = 'partially paid';
                            }
                            submitForm();
                            resetForm();
                            setEditMode(false);
                        }}
                    >
                        {({ errors, submitCount, values }) => (
                            <Form className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className={submitCount ? (errors.customerName ? 'has-error' : 'has-success') : ''}>
                                        <label htmlFor="customerName">Customer Name *</label>
                                        <Field name="customerName" type="text" id="customerName" placeholder="Enter Customer Name" className="form-input" />
                                        {submitCount > 0 && errors.customerName && <div className="text-danger mt-1">{errors.customerName}</div>}
                                    </div>

                                    <div className={submitCount ? (errors.phoneNumber ? 'has-error' : 'has-success') : ''}>
                                        <label htmlFor="phoneNumber">Phone Number</label>
                                        <Field name="phoneNumber" type="text" id="phoneNumber" placeholder="Enter Phone Number" className="form-input" />
                                        {submitCount > 0 && errors.phoneNumber && <div className="text-danger mt-1">{errors.phoneNumber}</div>}
                                    </div>
                                    <div className={submitCount ? (errors.product ? 'has-error' : 'has-success') : ''}>
                                        <label htmlFor="product">Product Name *</label>
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
                                    <div className={submitCount ? (errors.quantity ? 'has-error' : 'has-success') : ''}>
                                        <label htmlFor="quantity">Quantity *</label>
                                        <Field name="quantity" type="number" id="quantity" placeholder="Enter Quantity" className="form-input" />
                                        {submitCount > 0 && errors.quantity && <div className="text-danger mt-1">{errors.quantity}</div>}
                                    </div>

                                    <div className={submitCount ? (errors.totalPrice ? 'has-error' : 'has-success') : ''}>
                                        <label htmlFor="totalPrice">Total Price *</label>
                                        <Field name="totalPrice" type="number" id="totalPrice" placeholder="Enter Total Price" className="form-input" />
                                        {submitCount > 0 && errors.totalPrice && <div className="text-danger mt-1">{errors.totalPrice}</div>}
                                    </div>

                                    <div className={submitCount ? (errors.payingAmount ? 'has-error' : 'has-success') : ''}>
                                        <label htmlFor="payingAmount">Paying Amount *</label>
                                        <Field name="payingAmount" type="number" id="payingAmount" placeholder="Enter Paying Amount" className="form-input" />
                                        {submitCount > 0 && errors.payingAmount && <div className="text-danger mt-1">{errors.payingAmount}</div>}
                                    </div>
                                    {/* Add Bill Type Dropdown */}
                                    <div className={submitCount ? (errors.billType ? 'has-error' : 'has-success') : ''}>
                                        <label htmlFor="billType">Bill Type *</label>
                                        <Field as="select" name="billType" id="billType" className="form-select">
                                            <option value="fake">Fake Bill</option>
                                            <option value="perfect">Perfect Bill</option>
                                        </Field>
                                        {submitCount > 0 && errors.billType && <div className="text-danger mt-1">{errors.billType}</div>}
                                    </div>
                                    <div className={submitCount ? (errors.paymentType ? 'has-error' : 'has-success') : ''}>
                                        <label htmlFor="paymentType">Payment Type *</label>
                                        <Field as="select" name="paymentType" id="paymentType" className="form-select">
                                            <option value="cash">Cash</option>
                                            <option value="bank">Bank Transfer</option>
                                            <option value="check">Check</option>
                                        </Field>
                                        {submitCount > 0 && errors.paymentType && <div className="text-danger mt-1">{errors.paymentType}</div>}
                                    </div>

                                    {/* Conditional Check Number Field */}
                                    {values.paymentType === 'check' && (
                                        <div className={submitCount ? (errors.checkNumber ? 'has-error' : 'has-success') : ''}>
                                            <label htmlFor="checkNumber">Check Number *</label>
                                            <Field name="checkNumber" type="text" id="checkNumber" placeholder="Enter check number" className="form-input" />
                                            {submitCount > 0 && errors.checkNumber && <div className="text-danger mt-1">{errors.checkNumber}</div>}
                                        </div>
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
                                        {editMode ? 'Update Sale' : 'Add Sale'}
                                    </button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
            </div>

            <div className="panel mt-6">
                <div className="flex md:items-center justify-between md:flex-row flex-col mb-4.5 gap-5">
                    <div className="flex items-center flex-wrap">
                        <button type="button" onClick={() => exportTable('csv')} className="btn btn-primary btn-sm m-1 ">
                            <IconFile className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                            CSV
                        </button>
                        <button type="button" className="btn btn-primary btn-sm m-1" onClick={handleDownloadExcel}>
                            <IconFile className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                            EXCEL
                        </button>
                        <button type="button" onClick={() => exportTable('print')} className="btn btn-primary btn-sm m-1">
                            <IconPrinter className="ltr:mr-2 rtl:ml-2" />
                            PRINT
                        </button>
                    </div>

                    <input type="text" className="form-input w-auto" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="datatables">
                    <DataTable
                        highlightOnHover
                        className="whitespace-nowrap table-hover"
                        records={recordsData}
                        columns={[
                            { accessor: 'id', title: '#', sortable: true },
                            { accessor: 'customerName', title: 'Customer Name', sortable: true },
                            { accessor: 'phoneNumber', title: 'Phone Number', sortable: true },
                            { accessor: 'product', title: 'Product', sortable: true },
                            { accessor: 'quantity', title: 'Quantity', sortable: true },
                            {
                                accessor: 'totalPrice',
                                title: 'Total Price',
                                sortable: true,
                                render: ({ totalPrice }) => `Rs. ${totalPrice.toLocaleString()}`,
                            },
                            {
                                accessor: 'payingAmount',
                                title: 'Paying Amount',
                                sortable: true,
                                render: ({ payingAmount }) => `Rs. ${payingAmount?.toLocaleString() || '0'}`,
                            },
                            {
                                accessor: 'remainingAmount',
                                title: 'Remaining Amount',
                                sortable: true,
                                render: ({ totalPrice, payingAmount }) => `Rs. ${(totalPrice - (payingAmount || 0)).toLocaleString()}`,
                            },
                            {
                                accessor: 'saleDate',
                                title: 'Sale Date',
                                sortable: true,
                                render: ({ saleDate }) => formatDate(saleDate),
                            },
                            {
                                accessor: 'actions',
                                title: 'Actions',
                                render: (row) => (
                                    <div className="flex items-center gap-2">
                                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(row.id)}>
                                            <IconEdit className="w-4 h-4" />
                                        </button>
                                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(row.id)}>
                                            <IconTrash className="w-4 h-4" />
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

export default Sale;
