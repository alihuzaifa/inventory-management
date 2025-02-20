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
const col = ['id', 'supplierName', 'product', 'quantity', 'totalPrice', 'payingAmount', 'remainingAmount', 'purchaseDate', 'paymentStatus'];
const header = ['Id', 'Supplier', 'Product', 'Quantity', 'Total Price', 'Paying Amount', 'Remaining Amount', 'Purchase Date', 'Payment Status'];
const Purchase = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Purchase Form'));
    }, []);

    const [editMode, setEditMode] = useState(false);
    const formikRef = useRef<any>(null);

    // Sample supplier data for dropdown
    const suppliers = [
        { id: 1, name: 'Ali Trading Company' },
        { id: 2, name: 'Karachi Electronics' },
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
            title: 'Purchase added successfully',
            padding: '10px 20px',
        });
    };

    const purchaseSchema = Yup.object().shape({
        supplierId: Yup.string().required('Supplier is required'),
        product: Yup.string().required('Product name is required'),
        quantity: Yup.number().required('Quantity is required').positive('Quantity must be positive'),
        totalPrice: Yup.number().required('Total price is required').positive('Price must be positive'),
        payingAmount: Yup.number()
            .required('Paying amount is required')
            .min(0, 'Paying amount cannot be negative')
            .test('max', 'Paying amount cannot exceed total price', function (value) {
                return !value || value <= this.parent.totalPrice;
            }),
    });
    // Sample purchase data
    const rowData = [
        {
            id: 1,
            supplierId: 1,
            supplierName: 'Ali Trading Company',
            product: 'LED TV',
            quantity: 5,
            totalPrice: 250000,
            payingAmount: 250000,
            remainingAmount: 0,
            purchaseDate: '2024-01-15',
            paymentStatus: 'paid',
        },
        {
            id: 2,
            supplierId: 2,
            supplierName: 'Karachi Electronics',
            product: 'Laptop',
            quantity: 3,
            totalPrice: 450000,
            payingAmount: 200000,
            remainingAmount: 250000,
            purchaseDate: '2024-01-16',
            paymentStatus: 'partially paid',
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
    useEffect(() => {
        setInitialRecords(() => {
            return rowData.filter((item: any) => {
                return (
                    item.id.toString().includes(search.toLowerCase()) ||
                    item.supplierName.toLowerCase().includes(search.toLowerCase()) ||
                    item.product.toLowerCase().includes(search.toLowerCase()) ||
                    item.quantity.toString().includes(search.toLowerCase()) ||
                    item.totalPrice.toString().includes(search.toLowerCase()) ||
                    item.purchaseDate.toLowerCase().includes(search.toLowerCase()) ||
                    item.paymentStatus.toLowerCase().includes(search.toLowerCase())
                );
            });
        });
    }, [search]);

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
        const purchase = rowData.find((item) => item.id === id);
        if (purchase) {
            if (formikRef.current) {
                formikRef.current.setValues({
                    supplierId: purchase.supplierId,
                    product: purchase.product,
                    quantity: purchase.quantity,
                    totalPrice: purchase.totalPrice,
                    paymentStatus: purchase.paymentStatus,
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
                Swal.fire('Deleted!', 'Purchase has been deleted.', 'success');
            }
        });
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            paid: <span className="badge badge-success">Paid</span>,
            'partially paid': <span className="badge badge-warning">Partially Paid</span>,
            unpaid: <span className="badge badge-danger">Unpaid</span>,
        };
        return badges[status as keyof typeof badges] || status;
    };

    const exportTable = (type: string) => {
        let columns: any = col;
        let records = rowData;
        let filename = 'Purchase Record';

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
                    } else if (d === 'purchaseDate') {
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
                    } else if (d === 'purchaseDate') {
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
            Supplier: item.supplierName,
            Product: item.product,
            Quantity: item.quantity,
            'Total Price': `Rs. ${item.totalPrice.toLocaleString()}`,
            'Purchase Date': formatDate(item.purchaseDate),
            'Payment Status': item.paymentStatus,
        }));

        downloadExcel({
            fileName: 'purchases',
            sheet: 'Purchases',
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
                    <h5 className="font-semibold text-lg dark:text-white-light mb-4">{editMode ? 'Edit Purchase' : 'Add Purchase'}</h5>
                    <Formik
                        innerRef={formikRef}
                        initialValues={{
                            supplierId: '',
                            product: '',
                            quantity: '',
                            totalPrice: '',
                            payingAmount: '',
                            paymentStatus: '',
                        }}
                        validationSchema={purchaseSchema}
                        onSubmit={(values, { resetForm }) => {
                            const remainingAmount = Number(values.totalPrice) - Number(values.payingAmount);
                            let status = 'unpaid';
                            if (remainingAmount === 0) {
                                status = 'paid';
                            } else if (Number(values.payingAmount) > 0) {
                                status = 'partially paid';
                            }
                            values.paymentStatus = status;
                            console.log(values);
                            submitForm();
                            resetForm();
                            setEditMode(false);
                        }}
                    >
                        {({ errors, submitCount, values }) => (
                            <Form className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className={submitCount ? (errors.supplierId ? 'has-error' : 'has-success') : ''}>
                                        <label htmlFor="supplierId">Supplier *</label>
                                        <Field as="select" name="supplierId" id="supplierId" className="form-select">
                                            <option value="">Select Supplier</option>
                                            {suppliers.map((supplier) => (
                                                <option key={supplier.id} value={supplier.id}>
                                                    {supplier.name}
                                                </option>
                                            ))}
                                        </Field>
                                        {submitCount > 0 && errors.supplierId && <div className="text-danger mt-1">{errors.supplierId}</div>}
                                    </div>

                                    <div className={submitCount ? (errors.product ? 'has-error' : 'has-success') : ''}>
                                        <label htmlFor="product">Product Name *</label>
                                        <Field name="product" type="text" id="product" placeholder="Enter Product Name" className="form-input" />
                                        {submitCount > 0 && errors.product && <div className="text-danger mt-1">{errors.product}</div>}
                                    </div>

                                    <div className={submitCount ? (errors.quantity ? 'has-error' : 'has-success') : ''}>
                                        <label htmlFor="quantity">Quantity *</label>
                                        <Field name="quantity" type="number" id="quantity" placeholder="Enter Quantity" className="form-input" />
                                        {submitCount > 0 && errors.quantity && <div className="text-danger mt-1">{errors.quantity}</div>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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

                                    <div>
                                        <label htmlFor="paymentStatus">Payment Status</label>
                                        <Field
                                            as="select"
                                            name="paymentStatus"
                                            id="paymentStatus"
                                            className="form-select"
                                            disabled
                                            value={
                                                values.totalPrice && values.payingAmount
                                                    ? values.payingAmount === values.totalPrice
                                                        ? 'paid'
                                                        : Number(values.payingAmount) > 0
                                                        ? 'partially paid'
                                                        : 'unpaid'
                                                    : ''
                                            }
                                        >
                                            <option value="">Select Status</option>
                                            <option value="paid">Paid</option>
                                            <option value="partially paid">Partially Paid</option>
                                            <option value="unpaid">Unpaid</option>
                                        </Field>
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    {editMode && (
                                        <button
                                            type="button"
                                            className="btn btn-danger ml-4"
                                            onClick={() => {
                                                setEditMode(false);
                                                formikRef.current.resetForm();
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                    <button type="submit" className="btn btn-primary">
                                        {editMode ? 'Update Purchase' : 'Add Purchase'}
                                    </button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
            </div>

            <div className="panel mt-6">
                {/* Export buttons section */}
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

                {/* DataTable */}
                <div className="datatables">
                    <DataTable
                        highlightOnHover
                        className="whitespace-nowrap table-hover"
                        records={recordsData}
                        columns={[
                            { accessor: 'id', title: '#', sortable: true },
                            { accessor: 'supplierName', title: 'Supplier', sortable: true },
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
                                accessor: 'purchaseDate',
                                title: 'Purchase Date',
                                sortable: true,
                                render: ({ purchaseDate }) => formatDate(purchaseDate),
                            },
                            {
                                accessor: 'paymentStatus',
                                title: 'Payment Status',
                                sortable: true,
                                render: ({ paymentStatus }) => getStatusBadge(paymentStatus),
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

export default Purchase;
