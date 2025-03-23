import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../store/themeConfigSlice';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import IconFile from '../components/Icon/IconFile';
import IconPrinter from '../components/Icon/IconPrinter';
import IconEye from '../components/Icon/IconEye';
import IconEdit from '../components/Icon/IconEdit';
import IconTrash from '../components/Icon/IconTrash';
import { downloadExcel } from 'react-export-table-to-excel';
import InventoryManagement from '../services/api';
import Swal from 'sweetalert2';

interface Expense {
    _id: string;
    shopId: string;
    expenseName: string;
    amount: number;
    date: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
}

interface GroupedExpense {
    date: string;
    totalExpense: number;
    expenses: Expense[];
}

const searchAndFilterHelpers = {
    formatDateForSearch: (dateStr: string) => {
        const date = new Date(dateStr);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return {
            fullDate: `${day}/${month}/${year}`,
            dayMonth: `${day}/${month}`,
            monthYear: `${month}/${year}`,
            dayOnly: day,
            monthOnly: month,
            yearOnly: year.toString(),
        };
    },

    isDateMatch: (dateStr: string, searchTerm: string) => {
        const dates = searchAndFilterHelpers.formatDateForSearch(dateStr);
        const searchLower = searchTerm.toLowerCase();

        return (
            dates.fullDate.includes(searchLower) ||
            dates.dayMonth.includes(searchLower) ||
            dates.monthYear.includes(searchLower) ||
            dates.dayOnly.includes(searchLower) ||
            dates.monthOnly.includes(searchLower) ||
            dates.yearOnly.includes(searchLower) ||
            dateStr.includes(searchLower)
        );
    },

    isAmountMatch: (amount: number, searchTerm: string) => {
        const searchNumber = searchTerm.replace(/[^0-9]/g, '');
        if (!searchNumber) return false;
        return amount.toString().includes(searchNumber);
    },

    isExpenseMatch: (expense: Expense, searchTerm: string) => {
        if (!searchTerm) return true;

        const searchLower = searchTerm.toLowerCase();

        // Check expense name
        if (expense.expenseName.toLowerCase().includes(searchLower)) return true;

        // Check amount
        if (searchAndFilterHelpers.isAmountMatch(expense.amount, searchTerm)) return true;

        // Check date
        if (searchAndFilterHelpers.isDateMatch(expense.date, searchTerm)) return true;

        return false;
    },
};

const Expense = () => {
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('Expense (Kharcha)'));
    }, []);

    const getAllExpenses = async () => {
        setIsLoading(true);
        try {
            const response = await InventoryManagement.GetAllExpenses();
            if (response?.data) {
                setRecords(response.data);
            }
        } catch (error: any) {
            console.error('Error fetching expenses:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to fetch expenses',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getAllExpenses();
    }, []);

    // Form states
    const [expenseName, setExpenseName] = useState('');
    const [amount, setAmount] = useState<number | ''>('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [expenseDetails, setExpenseDetails] = useState<Expense[]>([]);

    // Table states
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [records, setRecords] = useState<Expense[]>([]);
    const [groupedRecords, setGroupedRecords] = useState<GroupedExpense[]>([]);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'date',
        direction: 'desc',
    });

    // Group records by date
    const groupRecordsByDate = (records: Expense[]) => {
        const grouped = records.reduce((acc: { [key: string]: GroupedExpense }, curr) => {
            if (!acc[curr.date]) {
                acc[curr.date] = {
                    date: curr.date,
                    totalExpense: 0,
                    expenses: [],
                };
            }
            acc[curr.date].expenses.push(curr);
            acc[curr.date].totalExpense += curr.amount;
            return acc;
        }, {});

        return Object.values(grouped).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (expenseName && amount) {
                if (editMode && selectedExpense) {
                    // Update existing expense
                    const updateData = {
                        expenseName,
                        amount: Number(amount),
                        date,
                    };
                    const response = await InventoryManagement.UpdateExpense(selectedExpense, updateData);
                    if (response?.data) {
                        await getAllExpenses();
                        Swal.fire({
                            icon: 'success',
                            title: 'Success',
                            text: 'Expense updated successfully',
                        });
                    }
                } else {
                    // Add new expense
                    const newExpense = {
                        expenseName,
                        amount: Number(amount),
                        date,
                    };
                    const response = await InventoryManagement.CreateExpense(newExpense);
                    if (response?.data) {
                        await getAllExpenses();
                        Swal.fire({
                            icon: 'success',
                            title: 'Success',
                            text: 'Expense added successfully',
                        });
                    }
                }
                // Reset form
                setExpenseName('');
                setAmount('');
                setDate(new Date().toISOString().split('T')[0]);
                setEditMode(false);
                setSelectedExpense(null);
                setIsModalOpen(false);
            }
        } catch (error: any) {
            console.error('Error submitting expense:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to process expense',
            });
        }
    };

    const handleEdit = (expense: Expense) => {
        const date = new Date(expense.createdAt);
        const formatttedDate = date.toISOString().split('T')[0];
        setExpenseName(expense.expenseName);
        setAmount(expense.amount);
        setDate(formatttedDate);
        setEditMode(true);
        setSelectedExpense(expense._id);
        setIsModalOpen(false);
    };

    const handleDelete = async (id: string) => {
        try {
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: "You won't be able to revert this!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, delete it!',
            });

            if (result.isConfirmed) {
                const deleteItem = await InventoryManagement.DeleteExpense(id);
                if (deleteItem.success) {
                    await getAllExpenses();
                    Swal.fire('Deleted!', 'Expense has been deleted.', 'success');
                    setIsModalOpen(false);
                }
            }
        } catch (error: any) {
            console.error('Error deleting expense:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to delete expense',
            });
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
    const handleExportCSV = () => {
        const csvContent = [['Date', 'Total Expense'].join(','), ...groupedRecords.map((item) => [formatDate(item.date), `Rs. ${item.totalExpense.toLocaleString()}`].join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'expense_summary.csv';
        link.click();
    };

    const handleDownloadExcel = () => {
        const excelData = groupedRecords.map((item) => ({
            Date: formatDate(item.date),
            'Total Expense': `Rs. ${item.totalExpense.toLocaleString()}`,
        }));

        downloadExcel({
            fileName: 'expense_summary',
            sheet: 'Expenses',
            tablePayload: {
                header: ['Date', 'Total Expense'],
                body: excelData,
            },
        });
    };

    const handlePrint = () => {
        let printContent = '<h2 style="text-align: center; margin-bottom: 20px;">Expense Summary</h2>';
        printContent += '<table border="1" style="width:100%; border-collapse: collapse;">';
        printContent += '<tr><th style="padding: 8px;">Date</th><th style="padding: 8px;">Total Expense</th></tr>';

        groupedRecords.forEach((item) => {
            printContent += `
                <tr>
                    <td style="padding: 8px; text-align: center;">${formatDate(item.date)}</td>
                    <td style="padding: 8px; text-align: center;">Rs. ${item.totalExpense.toLocaleString()}</td>
                </tr>
            `;
        });
        printContent += '</table>';

        const printWindow = window.open('', '', 'width=800,height=600');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.print();
        }
    };

    // Update records when search or sort changes
    useEffect(() => {
        let filteredData = [...records];

        // Apply search filter
        if (search) {
            filteredData = filteredData.filter((item) => searchAndFilterHelpers.isExpenseMatch(item, search));
        }

        // Apply sorting
        if (sortStatus) {
            filteredData.sort((a, b) => {
                const aValue = a[sortStatus.columnAccessor as keyof Expense];
                const bValue = b[sortStatus.columnAccessor as keyof Expense];

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return sortStatus.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                }

                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return sortStatus.direction === 'asc' ? aValue - bValue : bValue - aValue;
                }

                return 0;
            });
        }

        // Group the filtered and sorted data
        const grouped = groupRecordsByDate(filteredData);
        setGroupedRecords(grouped);
    }, [records, search, sortStatus]);

    return (
        <div className="space-y-6">
            {/* Add Expense Form */}
            <div className="panel">
                <h2 className="text-xl font-bold mb-4">{editMode ? 'Edit Expense' : 'Add New Expense'}</h2>
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
                            <label htmlFor="date" className="block mb-2">
                                Date
                            </label>
                            <input id="date" type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} required />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        {editMode && (
                            <button
                                type="button"
                                className="btn btn-outline-danger ltr:mr-2 rtl:ml-2"
                                onClick={() => {
                                    setEditMode(false);
                                    setSelectedExpense(null);
                                    setExpenseName('');
                                    setAmount('');
                                    setDate(new Date().toISOString().split('T')[0]);
                                }}
                            >
                                Cancel
                            </button>
                        )}
                        <button type="submit" className="btn btn-primary">
                            {editMode ? 'Update Expense' : 'Add Expense'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Expense Summary Table */}
            <div className="panel">
                <div className="flex md:items-center justify-between md:flex-row flex-col mb-4.5 gap-5">
                    <div className="flex items-center flex-wrap">
                        <button type="button" onClick={handleExportCSV} className="btn btn-primary btn-sm m-1">
                            <IconFile className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                            CSV
                        </button>
                        <button type="button" className="btn btn-primary btn-sm m-1" onClick={handleDownloadExcel}>
                            <IconFile className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                            EXCEL
                        </button>
                        <button type="button" onClick={handlePrint} className="btn btn-primary btn-sm m-1">
                            <IconPrinter className="ltr:mr-2 rtl:ml-2" />
                            PRINT
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <input type="text" className="form-input w-auto" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>

                {/* Main DataTable */}
                <div className="datatables">
                    <DataTable
                        highlightOnHover
                        className="whitespace-nowrap table-hover"
                        records={groupedRecords}
                        columns={[
                            {
                                accessor: 'date',
                                title: 'Date',
                                render: ({ date }) => formatDate(date),
                            },
                            {
                                accessor: 'totalExpense',
                                title: 'Total Expense',
                                render: ({ totalExpense }) => `Rs. ${totalExpense.toLocaleString()}`,
                            },
                            {
                                accessor: 'actions',
                                title: 'Actions',
                                render: (item) => (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setExpenseDetails(item.expenses);
                                                setIsModalOpen(true);
                                            }}
                                            className="btn btn-sm btn-outline-info"
                                        >
                                            <IconEye className="w-5 h-5" />
                                        </button>
                                    </div>
                                ),
                            },
                        ]}
                        totalRecords={groupedRecords.length}
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

                {/* Total Summary */}
                <div className="mt-4 flex justify-end">
                    <div className="bg-primary/10 p-4 rounded-lg">
                        <span className="text-lg font-semibold">Total Expenses: Rs. {records.reduce((sum, record) => sum + record.amount, 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Details Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg w-11/12 md:w-3/4 lg:w-1/2 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Expense Details - {formatDate(expenseDetails[0]?.date || '')}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="btn btn-sm btn-outline-danger">
                                &times;
                            </button>
                        </div>
                        <div className="datatables">
                            <DataTable
                                highlightOnHover
                                className="whitespace-nowrap table-hover"
                                records={expenseDetails}
                                columns={[
                                    { accessor: '_id', title: 'Id' },
                                    { accessor: 'expenseName', title: 'Expense Name' },
                                    {
                                        accessor: 'amount',
                                        title: 'Amount',
                                        render: ({ amount }) => `Rs. ${amount.toLocaleString()}`,
                                    },
                                    {
                                        accessor: 'actions',
                                        title: 'Actions',
                                        render: (item) => (
                                            <div className="flex gap-2">
                                                <button onClick={() => handleEdit(item)} className="btn btn-sm btn-outline-primary">
                                                    <IconEdit className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => handleDelete(item._id)} className="btn btn-sm btn-outline-danger">
                                                    <IconTrash className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ),
                                    },
                                ]}
                            />
                        </div>
                        <div className="mt-4 flex justify-end">
                            <div className="bg-primary/10 p-4 rounded-lg">
                                <span className="text-lg font-semibold">Date Total: Rs. {expenseDetails.reduce((sum, record) => sum + record.amount, 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expense;
