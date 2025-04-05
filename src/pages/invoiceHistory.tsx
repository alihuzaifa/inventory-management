import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setPageTitle } from '../store/themeConfigSlice';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import IconFile from '../components/Icon/IconFile';
import IconPrinter from '../components/Icon/IconPrinter';
import IconEye from '../components/Icon/IconEye';
import { downloadExcel } from 'react-export-table-to-excel';
import Swal from 'sweetalert2';
import { lazy } from 'react';
import { Formik, Field, Form } from 'formik';
import * as Yup from 'yup';
import { PDFDownloadLink } from '@react-pdf/renderer';
import InvoicePDF from '../components/InvoicePdf';
import IconDownload from '../components/Icon/IconDownload';
import IconPlus from '../components/Icon/IconPlus';
import { IRootState } from '../store';
import InventoryManagement from '../services/api';
import InvoiceTable from '../components/InvoiceTable';
const InvoiceView = lazy(() => import('./Invoice'));

// Payment Types
type PaymentType = 'cash' | 'bank' | 'check';
type BillType = 'perfect' | 'fake';

// Interface for payment amounts
interface PaymentAmounts {
    cashAmount: number;
    bankAmount: number;
    checkAmount: number;
    bankName?: string;
    checkNumber?: string;
}

// Product interface
interface ProductItem {
    id: number;
    product: string;
    availableQuantity: number;
    sellingQuantity: number;
    price: number;
    totalPrice: number;
}

// Base invoice interface
interface BaseInvoice {
    _id: string;
    invoiceNumber: string;
    customerName: string;
    phoneNumber: string;
    saleDate: string;
    totalBillAmount: number;
    billType: BillType;
}

// Complete invoice record interface
interface InvoiceRecord extends BaseInvoice, PaymentAmounts {
    paymentTypes: PaymentType[];
    products: ProductItem[];
}

// Form data interface for payment updates
interface PaymentUpdateFormData {
    paymentTypes: PaymentType[];
    cashAmount?: string;
    bankAmount?: string;
    bankName?: string;
    checkAmount?: string;
    checkNumber?: string;
}

// Filter states interface
interface FilterStates {
    search: string;
    dateRange: {
        from: string;
        to: string;
    };
    selectedPaymentMethod: PaymentType | 'all';
    selectedBillType: BillType | 'all';
}

// Table states interface
interface TableStates {
    page: number;
    pageSize: number;
    search: string;
    sortStatus: DataTableSortStatus;
}

type PaymentFormValues = {
    paymentTypes: PaymentType[];
    cashAmount: string;
    bankAmount: string;
    bankName: string;
    checkAmount: string;
    checkNumber: string;
};

const InvoiceHistory = () => {
    const dispatch = useDispatch();

    // Records state
    const [initialRecords, setInitialRecords] = useState<InvoiceRecord[]>([]);
    const [recordsData, setRecordsData] = useState<InvoiceRecord[]>([]);

    // Modal states
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
    const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<InvoiceRecord | null>(null);

    // Table states
    const PAGE_SIZES = [10, 20, 30, 50, 100] as const;
    const [tableStates, setTableStates] = useState<TableStates>({
        page: 1,
        pageSize: PAGE_SIZES[0],
        search: '',
        sortStatus: {
            columnAccessor: 'id',
            direction: 'asc',
        },
    });
    // Filter states
    const [filterStates, setFilterStates] = useState<FilterStates>({
        dateRange: { from: '', to: '' },
        selectedPaymentMethod: 'all',
        selectedBillType: 'all',
        search: '',
    });

    // Payment update schema
    const paymentUpdateSchema = Yup.object().shape({
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
    });

    useEffect(() => {
        dispatch(setPageTitle('Invoice History'));
    }, [dispatch]);

    useEffect(() => {
        const filteredData = initialRecords.filter((item) => {
            // Search filter - improved to handle multiple fields and null checks
            const searchTerm = String(filterStates.search).toLowerCase().trim();
            const matchesSearch = !searchTerm || (
                (item.customerName?.toLowerCase() || '').includes(searchTerm) ||
                (item.phoneNumber || '').includes(searchTerm) ||
                (item.invoiceNumber?.toLowerCase() || '').includes(searchTerm) ||
                item.paymentTypes.some(type => type.toLowerCase().includes(searchTerm)) ||
                item.totalBillAmount.toLocaleString().includes(searchTerm) ||
                item.billType.toLowerCase().includes(searchTerm) ||
                new Date(item.saleDate).toLocaleDateString().includes(searchTerm) ||
                calculateRemainingAmount(item).toLocaleString().includes(searchTerm)
            );

            // Payment method filter
            const matchesPayment = filterStates.selectedPaymentMethod === 'all' ||
                item.paymentTypes.includes(filterStates.selectedPaymentMethod);

            // Bill type filter
            const matchesBillType = filterStates.selectedBillType === 'all' ||
                item.billType === filterStates.selectedBillType;

            // Date range filter
            const matchesDateRange = !filterStates.dateRange.from || !filterStates.dateRange.to || (
                (() => {
                    const itemDate = new Date(item.saleDate);
                    const fromDate = new Date(filterStates.dateRange.from);
                    const toDate = new Date(filterStates.dateRange.to);
                    toDate.setHours(23, 59, 59, 999); // Include entire end date
                    return itemDate >= fromDate && itemDate <= toDate;
                })()
            );

            return matchesSearch && matchesPayment && matchesBillType && matchesDateRange;
        });

        // Sort data with improved type handling
        const sortedData = [...filteredData].sort((a, b) => {
            const columnAccessor = tableStates.sortStatus.columnAccessor;
            const direction = tableStates.sortStatus.direction === 'desc' ? -1 : 1;

            // Special handling for different column types
            switch (columnAccessor) {
                case 'saleDate':
                    return (new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime()) * direction;

                case 'totalBillAmount':
                case 'remainingAmount':
                    const aValue = columnAccessor === 'remainingAmount' ?
                        calculateRemainingAmount(a) : a.totalBillAmount;
                    const bValue = columnAccessor === 'remainingAmount' ?
                        calculateRemainingAmount(b) : b.totalBillAmount;
                    return (aValue - bValue) * direction;

                case 'paymentTypes':
                    return (a.paymentTypes.join(',').localeCompare(b.paymentTypes.join(','))) * direction;

                default:
                    const first = a[columnAccessor as keyof InvoiceRecord];
                    const second = b[columnAccessor as keyof InvoiceRecord];

                    if (typeof first === 'string' && typeof second === 'string') {
                        return first.localeCompare(second) * direction;
                    }
                    if (first === undefined || second === undefined) {
                        return 0;
                    }
                    return ((first < second ? -1 : first > second ? 1 : 0) * direction);
            }
        });

        setRecordsData(sortedData);
    }, [
        filterStates.search,
        filterStates.selectedPaymentMethod,
        filterStates.selectedBillType,
        filterStates.dateRange.from,
        filterStates.dateRange.to,
        tableStates.sortStatus,
        initialRecords
    ]);

    const handleViewInvoice = (invoice: InvoiceRecord) => {
        setSelectedInvoice(invoice);
        setIsViewModalOpen(true);
    };

    const handleDeleteInvoice = (invoiceId: string) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, cancel!',
            reverseButtons: true,
        }).then((result) => {
            if (result.isConfirmed) {
                setInitialRecords((prev) => prev.filter((record) => record._id !== invoiceId));
                setRecordsData((prev) => prev.filter((record) => record._id !== invoiceId));
                Swal.fire('Deleted!', 'Invoice has been deleted.', 'success');
            }
        });
    };

    const capitalize = (text: string) => {
        return text.charAt(0).toUpperCase() + text.slice(1);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString();
    };

    const fetchAllInvoices = async () => {
        try {
            const allInvoices = await InventoryManagement.GetAllInvoices();
            if (allInvoices.invoices.length > 0) {
                setInitialRecords(allInvoices.invoices);
                setRecordsData(allInvoices.invoices);
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
        }
    };

    useEffect(() => {
        fetchAllInvoices();
    }, []);

    // Define columns for export
    const col = ['invoiceNumber', 'customerName', 'phoneNumber', 'totalBillAmount', 'remainingAmount', 'billType', 'paymentTypes', 'saleDate'];

    const header = ['Invoice #', 'Customer', 'Phone', 'Total Amount', 'Remaining Amount', 'Bill Type', 'Payment Method', 'Date'];

    // Replace the existing export functions with these
    const exportTable = (type: string) => {
        let columns: any = col;
        let records = recordsData;
        let filename = 'Invoice History';

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
                    let val = item[d];
                    if (d === 'totalBillAmount') {
                        val = `Rs. ${item[d].toLocaleString()}`;
                    } else if (d === 'remainingAmount') {
                        val = `Rs. ${calculateRemainingAmount(item).toLocaleString()}`;
                    } else if (d === 'saleDate') {
                        val = formatDate(item[d]);
                    } else if (d === 'paymentTypes') {
                        val = item[d].join(', ');
                    } else if (d === 'billType') {
                        val = item[d] === 'perfect' ? 'Perfect Bill' : 'Fake Bill';
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
                    let val = item[d];
                    if (d === 'totalBillAmount') {
                        val = `Rs. ${item[d].toLocaleString()}`;
                    } else if (d === 'remainingAmount') {
                        val = `Rs. ${calculateRemainingAmount(item).toLocaleString()}`;
                    } else if (d === 'saleDate') {
                        val = formatDate(item[d]);
                    } else if (d === 'paymentTypes') {
                        val = item[d].join(', ');
                    } else if (d === 'billType') {
                        val = item[d] === 'perfect' ? 'Perfect Bill' : 'Fake Bill';
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

    const handleDownloadExcel = () => {
        const excelData = recordsData.map((item) => ({
            'Invoice #': item.invoiceNumber,
            Customer: item.customerName,
            Phone: item.phoneNumber,
            'Total Amount': `Rs. ${item.totalBillAmount.toLocaleString()}`,
            'Remaining Amount': `Rs. ${calculateRemainingAmount(item).toLocaleString()}`,
            'Bill Type': item.billType === 'perfect' ? 'Perfect Bill' : 'Fake Bill',
            'Payment Method': item.paymentTypes.join(', '),
            Date: formatDate(item.saleDate),
        }));

        downloadExcel({
            fileName: 'invoice-history',
            sheet: 'Invoices',
            tablePayload: {
                header,
                body: excelData,
            },
        });
    };

    const calculateRemainingAmount = (invoice: InvoiceRecord): number => {
        const totalPaid = invoice.cashAmount + invoice.bankAmount + invoice.checkAmount;
        return invoice.totalBillAmount - totalPaid;
    };

    const handleAddPayment = (invoice: InvoiceRecord) => {
        setSelectedInvoiceForPayment(invoice);
        setIsPaymentModalOpen(true);
    };

    const handlePaymentSubmit = (values: PaymentUpdateFormData): void => {
        if (!selectedInvoiceForPayment) return;

        const newCashAmount = Number(values.cashAmount || 0);
        const newBankAmount = Number(values.bankAmount || 0);
        const newCheckAmount = Number(values.checkAmount || 0);
        const totalNewPayment = newCashAmount + newBankAmount + newCheckAmount;
        const remainingAmount = calculateRemainingAmount(selectedInvoiceForPayment);

        if (totalNewPayment > remainingAmount) {
            Swal.fire('Error', 'Total payment cannot exceed remaining amount', 'error');
            return;
        }

        setInitialRecords((prev) =>
            prev.map((record) => {
                if (record._id === selectedInvoiceForPayment._id) {
                    return {
                        ...record,
                        paymentTypes: [...new Set([...record.paymentTypes, ...values.paymentTypes])] as PaymentType[],
                        cashAmount: record.cashAmount + newCashAmount,
                        bankAmount: record.bankAmount + newBankAmount,
                        checkAmount: record.checkAmount + newCheckAmount,
                        bankName: values.bankName || record.bankName,
                        checkNumber: values.checkNumber || record.checkNumber,
                    };
                }
                return record;
            })
        );

        setIsPaymentModalOpen(false);
        setSelectedInvoiceForPayment(null);
        Swal.fire('Success', 'Payment updated successfully', 'success');
    };
    const theme = useSelector((state: IRootState) => state.themeConfig);
    return (
        <>
            <div className="panel mt-6">
                <div className="flex md:items-center justify-between md:flex-row flex-col mb-4.5 gap-5">
                    {/* Export buttons */}
                    <div className="flex items-center flex-wrap gap-2">
                        <button type="button" onClick={() => exportTable('csv')} className="btn btn-primary btn-sm">
                            <IconFile className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                            CSV
                        </button>
                        <button type="button" onClick={handleDownloadExcel} className="btn btn-primary btn-sm">
                            <IconFile className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                            EXCEL
                        </button>
                        <button type="button" onClick={() => exportTable('print')} className="btn btn-primary btn-sm">
                            <IconPrinter className="ltr:mr-2 rtl:ml-2" />
                            PRINT
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-2">
                        {/* Bill Type Filter */}
                        <select className="form-select" value={filterStates.selectedBillType} onChange={(e) => setFilterStates({ ...filterStates, selectedBillType: e.target.value as BillType })}>
                            <option value="all">All Bill Types</option>
                            <option value="perfect">Perfect Bill</option>
                            <option value="fake">Fake Bill</option>
                        </select>

                        {/* Payment Method Filter */}
                        <select
                            className="form-select"
                            value={filterStates.selectedPaymentMethod}
                            onChange={(e) => setFilterStates({ ...filterStates, selectedPaymentMethod: e.target.value as PaymentType })}
                        >
                            <option value="all">All Payment Methods</option>
                            <option value="cash">Cash</option>
                            <option value="bank">Bank Transfer</option>
                            <option value="check">Check</option>
                        </select>

                        {/* Search Input */}
                        <input
                            type="text"
                            className="form-input w-auto"
                            placeholder="Search..."
                            value={filterStates.search}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterStates({ ...filterStates, search: e.target.value })}
                        />
                    </div>
                </div>

                {/* DataTable */}
                <div className="datatables">
                    <DataTable
                        highlightOnHover
                        className="whitespace-nowrap table-hover"
                        records={recordsData}
                        columns={[
                            { accessor: 'invoiceNumber', title: 'Invoice #', sortable: true },
                            { accessor: 'customerName', title: 'Customer', sortable: true },
                            { accessor: 'phoneNumber', title: 'Phone', sortable: true },
                            {
                                accessor: 'totalBillAmount',
                                title: 'Total Amount',
                                sortable: true,
                                render: ({ totalBillAmount }) => `Rs. ${totalBillAmount.toLocaleString()}`,
                            },
                            {
                                accessor: 'billType',
                                title: 'Bill Type',
                                sortable: true,
                                render: ({ billType }) => (
                                    <span className={`badge ${billType === 'perfect' ? 'badge-outline-success' : 'badge-outline-warning'}`}>
                                        {billType === 'perfect' ? 'Perfect Bill' : 'Fake Bill'}
                                    </span>
                                ),
                            },
                            {
                                accessor: 'paymentTypes',
                                title: 'Payment Method',
                                render: ({ paymentTypes }) => paymentTypes.join(', '),
                            },
                            {
                                accessor: 'saleDate',
                                title: 'Date',
                                sortable: true,
                                render: ({ saleDate }) => new Date(saleDate).toLocaleDateString(),
                            },
                            {
                                accessor: 'remainingAmount',
                                title: 'Remaining Amount',
                                sortable: true,
                                render: (row) => {
                                    const remaining = calculateRemainingAmount(row);
                                    return <span className={`${remaining > 0 ? 'text-danger' : 'text-success'}`}>Rs. {remaining.toLocaleString()}</span>;
                                },
                            },
                            {
                                accessor: 'actions',
                                title: 'Actions',
                                render: (row) => (
                                    <div className="flex gap-2">
                                        <button className="btn btn-sm btn-primary" onClick={() => handleViewInvoice(row)}>
                                            <IconEye className="w-4 h-4" />
                                        </button>
                                        <PDFDownloadLink document={<InvoicePDF invoiceData={row} themeConfig={theme} />} fileName="invoice.pdf">
                                            {({ loading }) => (
                                                <button type="button" className="btn btn-sm btn-primary">
                                                    {loading ? 'Loading...' : <IconDownload />}
                                                </button>
                                            )}
                                        </PDFDownloadLink>
                                        {calculateRemainingAmount(row) > 0 && (
                                            <button className="btn btn-sm btn-success" onClick={() => handleAddPayment(row)}>
                                                <IconPlus />
                                            </button>
                                        )}
                                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteInvoice(row._id)}>
                                            Delete
                                        </button>
                                    </div>
                                ),
                            },
                        ]}
                        totalRecords={recordsData.length}
                        recordsPerPage={tableStates.pageSize}
                        page={tableStates.page}
                        onPageChange={(p) => setTableStates({ ...tableStates, page: p })}
                        recordsPerPageOptions={[...PAGE_SIZES]}
                        onRecordsPerPageChange={(p) => setTableStates({ ...tableStates, pageSize: p })}
                        sortStatus={tableStates.sortStatus}
                        onSortStatusChange={(s) => setTableStates({ ...tableStates, sortStatus: s })}
                        minHeight={200}
                        paginationText={({ from, to, totalRecords }) => `Showing ${from} to ${to} of ${totalRecords} entries`}
                    />
                </div>
            </div>
            {/* Invoice View Modal */}
            {isViewModalOpen && (
                <div className="absolute inset-0 z-[1050] flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white my-20 dark:bg-navy-700 rounded-lg overflow-y-auto max-h-[90vh]">
                        <div className="flex items-center justify-between p-5 border-b border-[#ebedf2] dark:border-[#1b2e4b]">
                            <h5 className="text-lg font-semibold">Invoice Preview</h5>
                            <button
                                type="button"
                                className="text-white-dark hover:text-dark"
                                onClick={() => {
                                    setIsViewModalOpen(false);
                                    setSelectedInvoice(null);
                                }}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div className="p-5">{selectedInvoice && <InvoiceView invoiceData={selectedInvoice} />}</div>
                    </div>
                </div>
            )}
            {isPaymentModalOpen && selectedInvoiceForPayment && (
                <div className="fixed inset-0 z-[999]">
                    <div className="flex items-start justify-center min-h-screen px-4 mt-10">
                        <div className="panel dark:bg-navy-700 mt-10 rounded-lg w-full max-w-lg">
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
                                    onSubmit={handlePaymentSubmit}
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

                                            {values.paymentTypes?.includes('cash') && (
                                                <div className={submitCount ? (errors.cashAmount ? 'has-error' : 'has-success') : ''}>
                                                    <label>Cash Amount</label>
                                                    <Field name="cashAmount" type="number" className="form-input" />
                                                    {touched.cashAmount && errors.cashAmount && <div className="text-danger mt-1">{errors.cashAmount}</div>}
                                                </div>
                                            )}

                                            {values.paymentTypes?.includes('bank') && (
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

                                            {values.paymentTypes?.includes('check') && (
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
            )}
        </>
    );
};

export default InvoiceHistory;
