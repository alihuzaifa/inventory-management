import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../store/themeConfigSlice';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import IconFile from '../components/Icon/IconFile';
import IconPrinter from '../components/Icon/IconPrinter';
import { downloadExcel } from 'react-export-table-to-excel';

interface Expense {
    id: number;
    expenseName: string;
    amount: number;
    date: string;
    note?: string;
}

const Expense = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Expense (Kharcha)'));
    }, []);

    // Form states
    const [expenseName, setExpenseName] = useState('');
    const [amount, setAmount] = useState<number | ''>('');
    const [note, setNote] = useState('');

    // Table states
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [records, setRecords] = useState<Expense[]>([
        {
            id: 1,
            expenseName: 'Chai',
            amount: 500,
            date: '2024-03-20',
            note: 'Morning tea expenses',
        },
        {
            id: 2,
            expenseName: 'Stationary',
            amount: 1200,
            date: '2024-03-20',
            note: 'Office supplies',
        },
    ]);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'date',
        direction: 'desc',
    });

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (expenseName && amount) {
            const newExpense: Expense = {
                id: records.length + 1,
                expenseName,
                amount: Number(amount),
                date: new Date().toISOString().split('T')[0],
                note: note || undefined,
            };
            setRecords([newExpense, ...records]);

            // Reset form
            setExpenseName('');
            setAmount('');
            setNote('');
        }
    };

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

    // Export functions
    const handleExportExcel = () => {
        const header = ['Expense Name', 'Amount', 'Date', 'Note'];
        const excelData = records.map((item) => ({
            'Expense Name': item.expenseName,
            Amount: `Rs. ${item.amount.toLocaleString()}`,
            Date: formatDate(item.date),
            Note: item.note || '',
        }));

        downloadExcel({
            fileName: 'expense-history',
            sheet: 'Expenses',
            tablePayload: {
                header,
                body: excelData,
            },
        });
    };

    const exportTable = (type: string) => {
        if (type === 'csv') {
            const header = ['Expense Name', 'Amount', 'Date', 'Note'];
            const csvContent = [header.join(','), ...records.map((item) => [item.expenseName, item.amount, item.date, item.note || ''].join(','))].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'expense_history.csv';
            link.click();
        } else if (type === 'print') {
            const printContent = document.querySelector('.datatables')?.innerHTML;
            if (printContent) {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(`
                        <html>
                            <head>
                                <title>Expense History</title>
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
        const filteredData = [...records].filter((item) => {
            return search ? Object.values(item).some((val) => val.toString().toLowerCase().includes(search.toLowerCase())) : true;
        });

        // Sort data
        filteredData.sort((a, b) => {
            const first = a[sortStatus.columnAccessor as keyof Expense];
            const second = b[sortStatus.columnAccessor as keyof Expense];
            const dir = sortStatus.direction === 'desc' ? -1 : 1;
            
            if (first === undefined || second === undefined) {
                return 0;
            }
            
            return first < second ? -1 * dir : first > second ? 1 * dir : 0;
        });

        setRecords(filteredData);
    }, [search, sortStatus]);

    return (
        <div className="space-y-6">
            {/* Add Expense Form */}
            <div className="panel">
                <h2 className="text-xl font-bold mb-4">Add New Expense</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="expenseName" className="block mb-2">
                                Expense Name
                            </label>
                            <input id="expenseName" type="text" className="form-input" value={expenseName} onChange={(e) => setExpenseName(e.target.value)} placeholder="Enter expense name" required />
                        </div>
                        <div>
                            <label htmlFor="amount" className="block mb-2">
                                Amount
                            </label>
                            <input id="amount" type="number" className="form-input" value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder="Enter amount" required />
                        </div>
                        <div>
                            <label htmlFor="note" className="block mb-2">
                                Note (Optional)
                            </label>
                            <input id="note" type="text" className="form-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note" />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" className="btn btn-primary">
                            Add Expense
                        </button>
                    </div>
                </form>
            </div>

            {/* Expense History Table */}
            <div className="panel">
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

                    {/* Search */}
                    <div className="flex items-center gap-2">
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
                            { accessor: 'expenseName', title: 'Expense Name', sortable: true },
                            {
                                accessor: 'amount',
                                title: 'Amount',
                                sortable: true,
                                render: ({ amount }) => `Rs. ${amount.toLocaleString()}`,
                            },
                            {
                                accessor: 'date',
                                title: 'Date',
                                sortable: true,
                                render: ({ date }) => formatDate(date),
                            },
                            { accessor: 'note', title: 'Note' },
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

                {/* Total Expenses Summary */}
                <div className="mt-4 flex justify-end">
                    <div className="bg-primary/10 p-4 rounded-lg">
                        <span className="text-lg font-semibold">Total Expenses: Rs. {records.reduce((sum, record) => sum + record.amount, 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Expense;
