import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../store/themeConfigSlice';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import IconFile from '../components/Icon/IconFile';
import IconPrinter from '../components/Icon/IconPrinter';
import { downloadExcel } from 'react-export-table-to-excel';
import { capitalize } from 'lodash';

interface Expense {
    id: number;
    expenseName: string;
    amount: number;
    date: string;
}

const col = ['id', 'expenseName', 'amount', 'date'];
const header = ['ID', 'Expense Name', 'Amount', 'Date'];

const Expense = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Expense (Kharcha)'));
    }, []);

    // Form states
    const [expenseName, setExpenseName] = useState('');
    const [amount, setAmount] = useState<number | ''>('');

    // Table states
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [records, setRecords] = useState<Expense[]>([]);
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
            };
            setRecords([newExpense, ...records]);

            // Reset form
            setExpenseName('');
            setAmount('');
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

    const handleExportCSV = () => {
        const csvContent = [header.join(','), ...records.map((item) => col.map((key) => (key === 'amount' ? `Rs. ${item[key as keyof Expense]}` : item[key as keyof Expense])).join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'expense_records.csv';
        link.click();
    };

    const handleDownloadExcel = () => {
        const excelData = records.map((item) => ({
            ID: item.id,
            'Expense Name': item.expenseName,
            Amount: `Rs. ${item.amount.toLocaleString()}`,
            Date: formatDate(item.date),
        }));

        downloadExcel({
            fileName: 'expense_records',
            sheet: 'Expenses',
            tablePayload: { header, body: excelData },
        });
    };

    const handlePrint = () => {
        let printContent = '<h2 style="text-align: center; margin-bottom: 20px;">Expense Records</h2>';
        printContent += '<table border="1" style="width:100%; border-collapse: collapse;">';
        printContent += '<tr>' + header.map((h) => `<th style="padding: 8px; text-align: center;">${h}</th>`).join('') + '</tr>';

        records.forEach((item) => {
            printContent +=
                '<tr>' +
                col
                    .map((key) => {
                        let value = '';
                        if (key === 'amount') {
                            value = `Rs. ${item[key as keyof Expense]}`;
                        } else if (key === 'date') {
                            value = formatDate(item[key as keyof Expense] as string);
                        } else {
                            value = item[key as keyof Expense].toString();
                        }
                        return `<td style="padding: 8px; text-align: center;">${value}</td>`;
                    })
                    .join('') +
                '</tr>';
        });
        printContent += '</table>';

        const printWindow = window.open('', '', 'width=800,height=600');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.print();
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div className="flex items-center flex-wrap">
                        <button type="button" onClick={() => handleExportCSV()} className="btn btn-primary btn-sm m-1 ">
                            <IconFile className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                            CSV
                        </button>
                        <button type="button" className="btn btn-primary btn-sm m-1" onClick={handleDownloadExcel}>
                            <IconFile className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                            EXCEL
                        </button>
                        <button type="button" onClick={() => handlePrint()} className="btn btn-primary btn-sm m-1">
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
                            {
                                accessor: 'id',
                                title: 'Id',
                                render: (item) => item.id,
                            },
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
