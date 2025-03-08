import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
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
const InvoicePdf = lazy(() => import('./Invoice'));

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
    id: number;
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

        // Replace the existing sampleData with this:
        const sampleData: InvoiceRecord[] = [
            {
                id: 1,
                customerName: 'John Doe',
                phoneNumber: '12345678901',
                paymentTypes: ['cash'],
                cashAmount: 90000,
                bankAmount: 0,
                checkAmount: 0,
                products: [
                    {
                        id: 1,
                        product: 'LED TV',
                        availableQuantity: 100,
                        sellingQuantity: 2,
                        price: 45000,
                        totalPrice: 90000,
                    },
                ],
                saleDate: '2024-01-15',
                totalBillAmount: 90000,
                billType: 'perfect',
            },
            {
                id: 2,
                customerName: 'Alice Smith',
                phoneNumber: '12345678902',
                paymentTypes: ['bank', 'cash'],
                cashAmount: 30000,
                bankAmount: 40000,
                checkAmount: 0,
                products: [
                    {
                        id: 1,
                        product: 'Laptop',
                        availableQuantity: 50,
                        sellingQuantity: 1,
                        price: 70000,
                        totalPrice: 70000,
                    },
                ],
                saleDate: '2024-01-16',
                totalBillAmount: 70000,
                billType: 'fake',
            },
            {
                id: 3,
                customerName: 'Bob Wilson',
                phoneNumber: '12345678903',
                paymentTypes: ['check'],
                cashAmount: 0,
                bankAmount: 0,
                checkAmount: 120000,
                checkNumber: 'CHK001',
                products: [
                    {
                        id: 1,
                        product: 'Refrigerator',
                        availableQuantity: 30,
                        sellingQuantity: 1,
                        price: 120000,
                        totalPrice: 120000,
                    },
                ],
                saleDate: '2024-01-17',
                totalBillAmount: 120000,
                billType: 'perfect',
            },
            {
                id: 4,
                customerName: 'Carol Brown',
                phoneNumber: '12345678904',
                paymentTypes: ['cash', 'bank'],
                cashAmount: 25000,
                bankAmount: 25000,
                checkAmount: 0,
                products: [
                    {
                        id: 1,
                        product: 'Mobile Phone',
                        availableQuantity: 200,
                        sellingQuantity: 1,
                        price: 80000,
                        totalPrice: 80000,
                    },
                ],
                saleDate: '2024-01-18',
                totalBillAmount: 80000,
                billType: 'fake',
            },
            {
                id: 5,
                customerName: 'David Miller',
                phoneNumber: '12345678905',
                paymentTypes: ['bank'],
                cashAmount: 0,
                bankAmount: 150000,
                bankName: 'ABC Bank',
                checkAmount: 0,
                products: [
                    {
                        id: 1,
                        product: 'Smart TV',
                        availableQuantity: 75,
                        sellingQuantity: 1,
                        price: 150000,
                        totalPrice: 150000,
                    },
                ],
                saleDate: '2024-01-19',
                totalBillAmount: 150000,
                billType: 'perfect',
            },
            {
                id: 6,
                customerName: 'Emma Davis',
                phoneNumber: '12345678906',
                paymentTypes: ['cash'],
                cashAmount: 40000,
                bankAmount: 0,
                checkAmount: 0,
                products: [
                    {
                        id: 1,
                        product: 'Washing Machine',
                        availableQuantity: 45,
                        sellingQuantity: 1,
                        price: 60000,
                        totalPrice: 60000,
                    },
                ],
                saleDate: '2024-01-20',
                totalBillAmount: 60000,
                billType: 'fake',
            },
            {
                id: 7,
                customerName: 'Frank Johnson',
                phoneNumber: '12345678907',
                paymentTypes: ['check', 'cash'],
                cashAmount: 30000,
                bankAmount: 0,
                checkAmount: 50000,
                checkNumber: 'CHK002',
                products: [
                    {
                        id: 1,
                        product: 'Air Conditioner',
                        availableQuantity: 25,
                        sellingQuantity: 1,
                        price: 80000,
                        totalPrice: 80000,
                    },
                ],
                saleDate: '2024-01-21',
                totalBillAmount: 80000,
                billType: 'perfect',
            },
            {
                id: 8,
                customerName: 'Grace Lee',
                phoneNumber: '12345678908',
                paymentTypes: ['bank', 'check'],
                cashAmount: 0,
                bankAmount: 70000,
                bankName: 'XYZ Bank',
                checkAmount: 30000,
                checkNumber: 'CHK003',
                products: [
                    {
                        id: 1,
                        product: 'Gaming Console',
                        availableQuantity: 60,
                        sellingQuantity: 1,
                        price: 100000,
                        totalPrice: 100000,
                    },
                ],
                saleDate: '2024-01-22',
                totalBillAmount: 100000,
                billType: 'fake',
            },
            {
                id: 9,
                customerName: 'Henry Wilson',
                phoneNumber: '12345678909',
                paymentTypes: ['cash', 'bank', 'check'],
                cashAmount: 40000,
                bankAmount: 30000,
                bankName: 'DEF Bank',
                checkAmount: 30000,
                checkNumber: 'CHK004',
                products: [
                    {
                        id: 1,
                        product: 'Home Theater',
                        availableQuantity: 35,
                        sellingQuantity: 1,
                        price: 100000,
                        totalPrice: 100000,
                    },
                ],
                saleDate: '2024-01-23',
                totalBillAmount: 100000,
                billType: 'perfect',
            },
            {
                id: 10,
                customerName: 'Isabel Garcia',
                phoneNumber: '12345678910',
                paymentTypes: ['cash'],
                cashAmount: 40000,
                bankAmount: 0,
                checkAmount: 0,
                products: [
                    {
                        id: 1,
                        product: 'Digital Camera',
                        availableQuantity: 40,
                        sellingQuantity: 1,
                        price: 75000,
                        totalPrice: 75000,
                    },
                ],
                saleDate: '2024-01-24',
                totalBillAmount: 75000,
                billType: 'fake',
            },
        ];

        setInitialRecords(sampleData);
        setRecordsData(sampleData);
    }, [dispatch]);

    useEffect(() => {
        const filteredData = initialRecords.filter((item) => {
            const matchesSearch =
                filterStates.search === ''
                    ? true
                    : item.customerName.toLowerCase().includes(String(filterStates.search).toLowerCase()) ||
                      item.phoneNumber.includes(String(filterStates.search)) ||
                      item.paymentTypes.some((type) => type.toLowerCase().includes(String(filterStates.search).toLowerCase())) ||
                      item.totalBillAmount.toString().includes(String(filterStates.search)) ||
                      item.billType.toLowerCase().includes(String(filterStates.search).toLowerCase()) ||
                      new Date(item.saleDate).toLocaleDateString().includes(String(filterStates.search));

            const matchesPayment = filterStates.selectedPaymentMethod === 'all' ? true : item.paymentTypes.includes(filterStates.selectedPaymentMethod);

            const matchesBillType = filterStates.selectedBillType === 'all' ? true : item.billType === filterStates.selectedBillType;

            const matchesDateRange = true; // Implement date range filtering if needed

            return matchesSearch && matchesPayment && matchesBillType && matchesDateRange;
        });

        // Sort data
        const sortedData = [...filteredData].sort((a, b) => {
            const first = a[tableStates.sortStatus.columnAccessor as keyof InvoiceRecord];
            const second = b[tableStates.sortStatus.columnAccessor as keyof InvoiceRecord];
            const dir = tableStates.sortStatus.direction === 'desc' ? -1 : 1;

            if (typeof first === 'string' && typeof second === 'string') {
                return first.localeCompare(second) * dir;
            }
            if (first === undefined || second === undefined) {
                return 0;
            }
            return (first < second ? -1 : first > second ? 1 : 0) * dir;
        });

        setRecordsData(sortedData);
    }, [filterStates.search, filterStates.selectedPaymentMethod, filterStates.selectedBillType, filterStates.dateRange, tableStates.sortStatus, initialRecords]);

    const handleViewInvoice = (invoice: InvoiceRecord) => {
        setSelectedInvoice(invoice);
        setIsViewModalOpen(true);
    };

    const handleDeleteInvoice = (invoiceId: number) => {
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
                setInitialRecords((prev) => prev.filter((record) => record.id !== invoiceId));
                setRecordsData((prev) => prev.filter((record) => record.id !== invoiceId));
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

    // Define columns for export
    const col = [
        'id',
        'customerName',
        'phoneNumber',
        'totalBillAmount',
        'remainingAmount',
        'billType',
        'paymentTypes',
        'saleDate'
    ];

    const header = [
        'Invoice #',
        'Customer',
        'Phone',
        'Total Amount',
        'Remaining Amount',
        'Bill Type',
        'Payment Method',
        'Date'
    ];

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
            'Invoice #': item.id,
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
                if (record.id === selectedInvoiceForPayment.id) {
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
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                setFilterStates({ ...filterStates, search: e.target.value })
                            }
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
                            { accessor: 'id', title: 'Invoice #', sortable: true },
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
                                        {calculateRemainingAmount(row) > 0 && (
                                            <button className="btn btn-sm btn-success" onClick={() => handleAddPayment(row)}>
                                                Add Payment
                                            </button>
                                        )}
                                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteInvoice(row.id)}>
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
                <div className="fixed inset-0 bg-black/60 z-[999] overflow-y-auto">
                    <div className="flex items-start justify-center min-h-screen px-4">
                        <div className="bg-white dark:bg-navy-700 mt-10 rounded-lg w-full max-w-5xl">
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
                            <div className="p-5">{selectedInvoice && <InvoicePdf invoiceData={selectedInvoice} />}</div>
                        </div>
                    </div>
                </div>
            )}

            {isPaymentModalOpen && selectedInvoiceForPayment && (
                <div className="fixed inset-0 z-[999] overflow-y-auto">
                    <div className="flex items-start justify-center min-h-screen px-4">
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
                                    {({ values, errors, touched, setFieldValue }) => (
                                        <Form className="space-y-5">
                                            <div>
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
                                                <div>
                                                    <label>Cash Amount</label>
                                                    <Field name="cashAmount" type="number" className="form-input" />
                                                    {touched.cashAmount && errors.cashAmount && <div className="text-danger mt-1">{errors.cashAmount}</div>}
                                                </div>
                                            )}

                                            {values.paymentTypes?.includes('bank') && (
                                                <>
                                                    <div>
                                                        <label>Bank Amount</label>
                                                        <Field name="bankAmount" type="number" className="form-input" />
                                                        {touched.bankAmount && errors.bankAmount && <div className="text-danger mt-1">{errors.bankAmount}</div>}
                                                    </div>
                                                    <div>
                                                        <label>Bank Name</label>
                                                        <Field name="bankName" type="text" className="form-input" />
                                                        {touched.bankName && errors.bankName && <div className="text-danger mt-1">{errors.bankName}</div>}
                                                    </div>
                                                </>
                                            )}

                                            {values.paymentTypes?.includes('check') && (
                                                <>
                                                    <div>
                                                        <label>Check Amount</label>
                                                        <Field name="checkAmount" type="number" className="form-input" />
                                                        {touched.checkAmount && errors.checkAmount && <div className="text-danger mt-1">{errors.checkAmount}</div>}
                                                    </div>
                                                    <div>
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
