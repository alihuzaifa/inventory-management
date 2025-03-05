import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../store/themeConfigSlice';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import IconEye from '../components/Icon/IconEye';
import IconFile from '../components/Icon/IconFile';
import IconPrinter from '../components/Icon/IconPrinter';
import IconEdit from '../components/Icon/IconEdit';
import { capitalize } from 'lodash';
import { downloadExcel } from 'react-export-table-to-excel';

interface InvoiceHistory {
    id: number;
    invoiceNumber: string;
    customerName: string;
    product: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    paymentMethod: string[];
    billType: 'fake' | 'real';
    status: 'paid' | 'partial' | 'unpaid';
    saleDate: string;
}

interface InvoicePaymentHistory {
    id: number;
    invoiceId: number;
    paidAmount: number;
    paymentMethod: string[];
    paymentDate: string;
    note: string;
}

interface UpdatePaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (amount: number, method: string[], note: string) => void;
}

const UpdatePaymentModal = ({ isOpen, onClose, onUpdate }: UpdatePaymentModalProps) => {
    const [amount, setAmount] = useState(0);
    const [method, setMethod] = useState<string[]>(['cash']);
    const [note, setNote] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(amount, method, note);
        onClose();
        // Reset form
        setAmount(0);
        setMethod(['cash']);
        setNote('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
                <h2 className="text-xl font-bold mb-4">Update Payment</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block mb-2">Amount</label>
                        <input
                            type="number"
                            className="form-input"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2">Payment Method</label>
                        <select
                            className="form-select"
                            value={method[0]}
                            onChange={(e) => setMethod([e.target.value])}
                            required
                        >
                            <option value="cash">Cash</option>
                            <option value="bank">Bank Transfer</option>
                            <option value="check">Check</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2">Note</label>
                        <textarea
                            className="form-textarea"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                        >
                            Update
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const InvoiceHistory = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Invoice History'));
    }, []);

    // Modal state
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);

    // Sample invoice history data
    const invoiceHistoryData: InvoiceHistory[] = [
        {
            id: 1,
            invoiceNumber: 'INV-001',
            customerName: 'John Doe',
            product: 'LED TV',
            quantity: 2,
            unitPrice: 45000,
            totalAmount: 90000,
            paidAmount: 90000,
            remainingAmount: 0,
            paymentMethod: ['cash'],
            billType: 'real',
            status: 'paid',
            saleDate: '2024-01-15',
        },
        {
            id: 2,
            invoiceNumber: 'INV-002',
            customerName: 'Jane Smith',
            product: 'Laptop',
            quantity: 1,
            unitPrice: 85000,
            totalAmount: 85000,
            paidAmount: 50000,
            remainingAmount: 35000,
            paymentMethod: ['bank', 'check'],
            billType: 'fake',
            status: 'partial',
            saleDate: '2024-01-16',
        },
    ];

    // Payment history data
    const [paymentHistory, setPaymentHistory] = useState<InvoicePaymentHistory[]>([
        {
            id: 1,
            invoiceId: 2,
            paidAmount: 50000,
            paymentMethod: ['bank'],
            paymentDate: '2024-01-16',
            note: 'Initial payment',
        },
    ]);

    // Table states
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [records, setRecords] = useState(invoiceHistoryData);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'id',
        direction: 'asc',
    });

    // Filter states
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all');

    // Format date helper
    const formatDate = (date: string) => {
        if (date) {
            const dt = new Date(date);
            const month = dt.getMonth() + 1 < 10 ? '0' + (dt.getMonth() + 1) : dt.getMonth() + 1;
            const day = dt.getDate() < 10 ? '0' + dt.getDate() : dt.getDate();
            return day + '/' + month + '/' + dt.getFullYear();
        }
        return '';
    };

    // Handle view invoice details
    const handleViewInvoice = (id: number) => {
        const invoice = records.find(inv => inv.id === id);
        const history = paymentHistory.filter(ph => ph.invoiceId === id);
        
        // Here you would typically open a modal or navigate to a detail page
        console.log('Invoice details:', invoice);
        console.log('Payment history:', history);
        alert(`Invoice #${invoice?.invoiceNumber}\nPayment History:\n${history.map(h => 
            `Date: ${formatDate(h.paymentDate)}\nAmount: Rs. ${h.paidAmount}\nMethod: ${h.paymentMethod.join(', ')}\nNote: ${h.note}`
        ).join('\n\n')}`);
    };

    // Handle payment updates
    const handleUpdatePayment = (invoiceId: number, amount: number, method: string[], note: string) => {
        // Update invoice record
        const updatedRecords = records.map(invoice => {
            if (invoice.id === invoiceId) {
                const newPaidAmount = invoice.paidAmount + amount;
                const newRemainingAmount = invoice.totalAmount - newPaidAmount;
                const newStatus = newPaidAmount >= invoice.totalAmount ? 'paid' : newPaidAmount > 0 ? 'partial' : 'unpaid';
                
                return {
                    ...invoice,
                    paidAmount: newPaidAmount,
                    remainingAmount: newRemainingAmount,
                    status: newStatus,
                    paymentMethod: [...new Set([...invoice.paymentMethod, ...method])],
                };
            }
            return invoice;
        });
        setRecords(updatedRecords as InvoiceHistory[]);

        // Add payment history entry
        const newHistoryEntry: InvoicePaymentHistory = {
            id: paymentHistory.length + 1,
            invoiceId,
            paidAmount: amount,
            paymentMethod: method,
            paymentDate: new Date().toISOString().split('T')[0],
            note,
        };
        setPaymentHistory([...paymentHistory, newHistoryEntry]);
    };

    // Export functions
    const handleExportExcel = () => {
        const header = ['Invoice #', 'Customer', 'Product', 'Quantity', 'Unit Price', 'Total Amount', 'Paid Amount', 'Remaining', 'Payment Method', 'Bill Type', 'Status', 'Sale Date'];

        const excelData = records.map((item) => ({
            'Invoice #': item.invoiceNumber,
            Customer: item.customerName,
            Product: item.product,
            Quantity: item.quantity,
            'Unit Price': `Rs. ${item.unitPrice.toLocaleString()}`,
            'Total Amount': `Rs. ${item.totalAmount.toLocaleString()}`,
            'Paid Amount': `Rs. ${item.paidAmount.toLocaleString()}`,
            Remaining: `Rs. ${item.remainingAmount.toLocaleString()}`,
            'Payment Method': item.paymentMethod.join(', '),
            'Bill Type': capitalize(item.billType),
            Status: capitalize(item.status),
            'Sale Date': formatDate(item.saleDate),
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

    const exportTable = (type: string) => {
        if (type === 'csv') {
            const header = ['Invoice #', 'Customer', 'Product', 'Quantity', 'Unit Price', 'Total Amount', 'Paid Amount', 'Remaining', 'Payment Method', 'Bill Type', 'Status', 'Sale Date'];
            const csvContent = [
                header.join(','),
                ...records.map(item => [
                    item.invoiceNumber,
                    item.customerName,
                    item.product,
                    item.quantity,
                    item.unitPrice,
                    item.totalAmount,
                    item.paidAmount,
                    item.remainingAmount,
                    item.paymentMethod.join(';'),
                    item.billType,
                    item.status,
                    item.saleDate
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'invoice_history.csv';
            link.click();
        } else if (type === 'print') {
            const printContent = document.querySelector('.datatables')?.innerHTML;
            if (printContent) {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(`
                        <html>
                            <head>
                                <title>Invoice History</title>
                                <style>
                                    table { border-collapse: collapse; width: 100%; }
                                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                                    th { background-color: #f8f9fa; }
                                </style>
                            </head>
                            <body>
                                ${printContent}
                            </body>
                        </html>
                    `);
                    printWindow.document.close();
                    printWindow.print();
                }
            }
        }
    };

    // Filter effect
    useEffect(() => {
        let filteredData = invoiceHistoryData.filter((item) => {
            const matchesSearch = search ? Object.values(item).some((val) => val.toString().toLowerCase().includes(search.toLowerCase())) : true;
            const matchesStatus = selectedStatus === 'all' ? true : item.status === selectedStatus;
            const matchesPayment = selectedPaymentMethod === 'all' ? true : item.paymentMethod.includes(selectedPaymentMethod);
            const matchesDateRange = true; // Implement date range filtering if needed
            return matchesSearch && matchesStatus && matchesPayment && matchesDateRange;
        });

        // Sort data
        const sortedData = [...filteredData].sort((a, b) => {
            const first = a[sortStatus.columnAccessor as keyof InvoiceHistory];
            const second = b[sortStatus.columnAccessor as keyof InvoiceHistory];
            const dir = sortStatus.direction === 'desc' ? -1 : 1;
            return first < second ? -1 * dir : first > second ? 1 * dir : 0;
        });

        setRecords(sortedData);
    }, [search, selectedStatus, selectedPaymentMethod, dateRange, sortStatus]);

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
                        <button type="button" onClick={handleExportExcel} className="btn btn-primary btn-sm">
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
                        <select className="form-select" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                            <option value="all">All Status</option>
                            <option value="paid">Paid</option>
                            <option value="partial">Partial</option>
                            <option value="unpaid">Unpaid</option>
                        </select>

                        <select className="form-select" value={selectedPaymentMethod} onChange={(e) => setSelectedPaymentMethod(e.target.value)}>
                            <option value="all">All Payment Methods</option>
                            <option value="cash">Cash</option>
                            <option value="bank">Bank Transfer</option>
                            <option value="check">Check</option>
                        </select>

                        <input type="text" className="form-input w-auto" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>

                {/* DataTable */}
                <div className="datatables">
                    <DataTable
                        highlightOnHover
                        className="whitespace-nowrap table-hover"
                        records={records}
                        columns={[
                            { accessor: 'invoiceNumber', title: 'Invoice #', sortable: true },
                            { accessor: 'customerName', title: 'Customer', sortable: true },
                            { accessor: 'product', title: 'Product', sortable: true },
                            { accessor: 'quantity', title: 'Quantity', sortable: true },
                            {
                                accessor: 'unitPrice',
                                title: 'Unit Price',
                                sortable: true,
                                render: ({ unitPrice }) => `Rs. ${unitPrice.toLocaleString()}`,
                            },
                            {
                                accessor: 'totalAmount',
                                title: 'Total Amount',
                                sortable: true,
                                render: ({ totalAmount }) => `Rs. ${totalAmount.toLocaleString()}`,
                            },
                            {
                                accessor: 'paidAmount',
                                title: 'Paid Amount',
                                sortable: true,
                                render: ({ paidAmount }) => `Rs. ${paidAmount.toLocaleString()}`,
                            },
                            {
                                accessor: 'remainingAmount',
                                title: 'Remaining',
                                sortable: true,
                                render: ({ remainingAmount }) => `Rs. ${remainingAmount.toLocaleString()}`,
                            },
                            {
                                accessor: 'paymentMethod',
                                title: 'Payment Method',
                                render: ({ paymentMethod }) => paymentMethod.join(', '),
                            },
                            {
                                accessor: 'billType',
                                title: 'Bill Type',
                                sortable: true,
                                render: ({ billType }) => capitalize(billType),
                            },
                            {
                                accessor: 'status',
                                title: 'Status',
                                sortable: true,
                                render: ({ status }) => (
                                    <span className={`badge ${status === 'paid' ? 'badge-outline-success' : status === 'partial' ? 'badge-outline-warning' : 'badge-outline-danger'}`}>
                                        {capitalize(status)}
                                    </span>
                                ),
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
                                    <div className="flex gap-2">
                                        <button 
                                            type="button" 
                                            className="btn btn-sm btn-outline-info" 
                                            onClick={() => handleViewInvoice(row.id)}
                                        >
                                            <IconEye className="w-4 h-4" />
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn btn-sm btn-outline-primary" 
                                            onClick={() => {
                                                setSelectedInvoiceId(row.id);
                                                setIsUpdateModalOpen(true);
                                            }}
                                        >
                                            <IconEdit className="w-4 h-4" />
                                        </button>
                                    </div>
                                ),
                            },
                        ]}
                        totalRecords={records.length}
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
            
            {/* Update Payment Modal */}
            <UpdatePaymentModal
                isOpen={isUpdateModalOpen}
                onClose={() => {
                    setIsUpdateModalOpen(false);
                    setSelectedInvoiceId(null);
                }}
                onUpdate={(amount, method, note) => {
                    if (selectedInvoiceId) {
                        handleUpdatePayment(selectedInvoiceId, amount, method, note);
                    }
                }}
            />
        </>
    );
};

export default InvoiceHistory;