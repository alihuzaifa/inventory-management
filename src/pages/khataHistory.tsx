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

interface KhataHistory {
    id: number;
    khataNumber: string;
    customerName: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    paymentMethod: string[];
    status: 'paid' | 'partial' | 'unpaid';
    khataDate: string;
    dueDate: string;
}

interface KhataPaymentHistory {
    id: number;
    khataId: number;
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
                        <input type="number" className="form-input" value={amount} onChange={(e) => setAmount(Number(e.target.value))} required />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2">Payment Method</label>
                        <select className="form-select" value={method[0]} onChange={(e) => setMethod([e.target.value])} required>
                            <option value="cash">Cash</option>
                            <option value="bank">Bank Transfer</option>
                            <option value="check">Check</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2">Note</label>
                        <textarea className="form-textarea" value={note} onChange={(e) => setNote(e.target.value)} required />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" className="btn btn-outline-danger" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Update
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const KhataHistory = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Khata History'));
    }, []);

    // Modal state
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedKhataId, setSelectedKhataId] = useState<number | null>(null);

    // Sample khata history data
    const khataHistoryData: KhataHistory[] = [
        {
            id: 1,
            khataNumber: 'KH-001',
            customerName: 'John Doe',
            totalAmount: 90000,
            paidAmount: 50000,
            remainingAmount: 40000,
            paymentMethod: ['cash'],
            status: 'partial',
            khataDate: '2024-01-15',
            dueDate: '2024-02-15',
        },
        {
            id: 2,
            khataNumber: 'KH-002',
            customerName: 'Jane Smith',
            totalAmount: 75000,
            paidAmount: 0,
            remainingAmount: 75000,
            paymentMethod: [],
            status: 'unpaid',
            khataDate: '2024-01-20',
            dueDate: '2024-02-20',
        },
    ];

    // Payment history data
    const [paymentHistory, setPaymentHistory] = useState<KhataPaymentHistory[]>([
        {
            id: 1,
            khataId: 1,
            paidAmount: 50000,
            paymentMethod: ['cash'],
            paymentDate: '2024-01-16',
            note: 'Initial payment',
        },
    ]);

    // Table states
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [records, setRecords] = useState(khataHistoryData);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'id',
        direction: 'asc',
    });

    // Filter states
    const [selectedStatus, setSelectedStatus] = useState('all');

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

    // Handle view khata details
    const handleViewKhata = (id: number) => {
        const khata = records.find((k) => k.id === id);
        const history = paymentHistory.filter((ph) => ph.khataId === id);

        alert(
            `Khata #${khata?.khataNumber}\nPayment History:\n${history
                .map((h) => `Date: ${formatDate(h.paymentDate)}\nAmount: Rs. ${h.paidAmount}\nMethod: ${h.paymentMethod.join(', ')}\nNote: ${h.note}`)
                .join('\n\n')}`
        );
    };

    // Handle payment updates
    const handleUpdatePayment = (khataId: number, amount: number, method: string[], note: string) => {
        // Update khata record
        const updatedRecords = records.map((khata) => {
            if (khata.id === khataId) {
                const newPaidAmount = khata.paidAmount + amount;
                const newRemainingAmount = khata.totalAmount - newPaidAmount;
                const newStatus = newPaidAmount >= khata.totalAmount ? 'paid' : newPaidAmount > 0 ? 'partial' : 'unpaid';

                return {
                    ...khata,
                    paidAmount: newPaidAmount,
                    remainingAmount: newRemainingAmount,
                    status: newStatus,
                    paymentMethod: [...new Set([...khata.paymentMethod, ...method])],
                };
            }
            return khata;
        });
        setRecords(updatedRecords as KhataHistory[]);

        // Add payment history entry
        const newHistoryEntry: KhataPaymentHistory = {
            id: paymentHistory.length + 1,
            khataId,
            paidAmount: amount,
            paymentMethod: method,
            paymentDate: new Date().toISOString().split('T')[0],
            note,
        };
        setPaymentHistory([...paymentHistory, newHistoryEntry]);
    };

    // Export functions
    const handleExportExcel = () => {
        const header = ['Khata #', 'Customer', 'Total Amount', 'Paid Amount', 'Remaining', 'Payment Method', 'Status', 'Khata Date', 'Due Date'];

        const excelData = records.map((item) => ({
            'Khata #': item.khataNumber,
            Customer: item.customerName,
            'Total Amount': `Rs. ${item.totalAmount.toLocaleString()}`,
            'Paid Amount': `Rs. ${item.paidAmount.toLocaleString()}`,
            Remaining: `Rs. ${item.remainingAmount.toLocaleString()}`,
            'Payment Method': item.paymentMethod.join(', '),
            Status: capitalize(item.status),
            'Khata Date': formatDate(item.khataDate),
            'Due Date': formatDate(item.dueDate),
        }));

        downloadExcel({
            fileName: 'khata-history',
            sheet: 'Khata',
            tablePayload: {
                header,
                body: excelData,
            },
        });
    };

    const exportTable = (type: string) => {
        if (type === 'csv') {
            const header = ['Khata #', 'Customer', 'Total Amount', 'Paid Amount', 'Remaining', 'Payment Method', 'Status', 'Khata Date', 'Due Date'];
            const csvContent = [
                header.join(','),
                ...records.map((item) =>
                    [item.khataNumber, item.customerName, item.totalAmount, item.paidAmount, item.remainingAmount, item.paymentMethod.join(';'), item.status, item.khataDate, item.dueDate].join(',')
                ),
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'khata_history.csv';
            link.click();
        } else if (type === 'print') {
            const printContent = document.querySelector('.datatables')?.innerHTML;
            if (printContent) {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(`
                        <html>
                            <head>
                                <title>Khata History</title>
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
        let filteredData = khataHistoryData.filter((item) => {
            const matchesSearch = search ? Object.values(item).some((val) => val.toString().toLowerCase().includes(search.toLowerCase())) : true;
            const matchesStatus = selectedStatus === 'all' ? true : item.status === selectedStatus;
            return matchesSearch && matchesStatus;
        });

        // Sort data
        const sortedData = [...filteredData].sort((a, b) => {
            const first = a[sortStatus.columnAccessor as keyof KhataHistory];
            const second = b[sortStatus.columnAccessor as keyof KhataHistory];
            const dir = sortStatus.direction === 'desc' ? -1 : 1;
            return first < second ? -1 * dir : first > second ? 1 * dir : 0;
        });

        setRecords(sortedData);
    }, [search, selectedStatus, sortStatus]);

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
                            { accessor: 'khataNumber', title: 'Khata #', sortable: true },
                            { accessor: 'customerName', title: 'Customer', sortable: true },
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
                                accessor: 'khataDate',
                                title: 'Khata Date',
                                sortable: true,
                                render: ({ khataDate }) => formatDate(khataDate),
                            },
                            {
                                accessor: 'dueDate',
                                title: 'Due Date',
                                sortable: true,
                                render: ({ dueDate }) => formatDate(dueDate),
                            },
                            {
                                accessor: 'actions',
                                title: 'Actions',
                                render: (row) => (
                                    <div className="flex gap-2">
                                        <button type="button" className="btn btn-sm btn-outline-info" onClick={() => handleViewKhata(row.id)}>
                                            <IconEye className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => {
                                                setSelectedKhataId(row.id);
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
                    setSelectedKhataId(null);
                }}
                onUpdate={(amount, method, note) => {
                    if (selectedKhataId) {
                        handleUpdatePayment(selectedKhataId, amount, method, note);
                    }
                }}
            />
        </>
    );
};

export default KhataHistory;
