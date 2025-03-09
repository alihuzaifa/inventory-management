import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../store/themeConfigSlice';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import IconEye from '../components/Icon/IconEye';
import IconFile from '../components/Icon/IconFile';
import IconPrinter from '../components/Icon/IconPrinter';
import { capitalize } from 'lodash';
import Ledger from './Ledger';

interface KhataHistory {
    id: number;
    khataNumber: string;
    customerName: string;
    phoneNumber: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    paymentMethod: string[];
    status: 'paid' | 'partial' | 'unpaid';
    khataDate: string;
    dueDate: string;
}

// Ledger Interfaces
interface LedgerItem {
    id: number;
    product: string;
    availableQuantity: number;
    sellingQuantity: number;
    price: number;
    totalPrice: number;
}

interface Transaction {
    id: number;
    date: string;
    products: LedgerItem[];
    totalAmount: number;
    paidAmount: number;
}

interface Payment {
    date: string;
    amount: number;
    paymentType: string;
    bankName?: string;
    checkNumber?: string;
}

interface LedgerRecord {
    id: number;
    customerName: string;
    phoneNumber: string;
    transactions: Transaction[];
    paymentHistory: Payment[];
}

// Dummy Ledger Data
const dummyLedgerData: LedgerRecord[] = [
    {
        id: 1001,
        customerName: 'Abdul Rehman',
        phoneNumber: '0321-1234567',
        transactions: [
            {
                id: 1,
                date: '2024-03-01',
                products: [
                    { id: 1, product: 'Power Cable 7/29', availableQuantity: 500, sellingQuantity: 100, price: 250, totalPrice: 25000 },
                    { id: 2, product: 'Electric Cable 3/29', availableQuantity: 300, sellingQuantity: 50, price: 180, totalPrice: 9000 },
                    { id: 3, product: 'Welding Cable', availableQuantity: 200, sellingQuantity: 30, price: 300, totalPrice: 9000 },
                    { id: 4, product: 'Internet Cable', availableQuantity: 1000, sellingQuantity: 200, price: 120, totalPrice: 24000 },
                ],
                totalAmount: 67000,
                paidAmount: 0,
            },
            {
                id: 2,
                date: '2024-03-02',
                products: [],
                totalAmount: 0,
                paidAmount: 30000,
            },
            {
                id: 3,
                date: '2024-03-05',
                products: [
                    { id: 5, product: 'Heat-Proof Cable', availableQuantity: 150, sellingQuantity: 40, price: 400, totalPrice: 16000 },
                    { id: 6, product: 'Water-Proof Cable', availableQuantity: 180, sellingQuantity: 60, price: 350, totalPrice: 21000 },
                    { id: 7, product: 'Power Cable 7/29', availableQuantity: 400, sellingQuantity: 80, price: 250, totalPrice: 20000 },
                ],
                totalAmount: 57000,
                paidAmount: 0,
            },
            {
                id: 4,
                date: '2024-03-07',
                products: [],
                totalAmount: 0,
                paidAmount: 45000,
            },
        ],
        paymentHistory: [
            { date: '2024-03-02', amount: 30000, paymentType: 'cash' },
            { date: '2024-03-07', amount: 45000, paymentType: 'bank', bankName: 'HBL' },
        ],
    },
    {
        id: 1002,
        customerName: 'Muhammad Ali',
        phoneNumber: '0333-9876543',
        transactions: [
            {
                id: 1,
                date: '2024-03-03',
                products: [
                    { id: 1, product: 'Welding Cable', availableQuantity: 300, sellingQuantity: 150, price: 300, totalPrice: 45000 },
                    { id: 2, product: 'Heat-Proof Cable', availableQuantity: 200, sellingQuantity: 50, price: 400, totalPrice: 20000 },
                    { id: 3, product: 'Internet Cable', availableQuantity: 800, sellingQuantity: 250, price: 120, totalPrice: 30000 },
                ],
                totalAmount: 95000,
                paidAmount: 0,
            },
            {
                id: 2,
                date: '2024-03-04',
                products: [],
                totalAmount: 0,
                paidAmount: 50000,
            },
            {
                id: 3,
                date: '2024-03-08',
                products: [
                    { id: 4, product: 'Power Cable 7/29', availableQuantity: 450, sellingQuantity: 120, price: 250, totalPrice: 30000 },
                    { id: 5, product: 'Electric Cable 3/29', availableQuantity: 280, sellingQuantity: 90, price: 180, totalPrice: 16200 },
                ],
                totalAmount: 46200,
                paidAmount: 0,
            },
            {
                id: 4,
                date: '2024-03-10',
                products: [],
                totalAmount: 0,
                paidAmount: 40000,
            },
        ],
        paymentHistory: [
            { date: '2024-03-04', amount: 50000, paymentType: 'bank', bankName: 'HBL' },
            { date: '2024-03-10', amount: 40000, paymentType: 'check', checkNumber: '123456' },
        ],
    },
    {
        id: 1003,
        customerName: 'Usman Khan',
        phoneNumber: '0345-5555555',
        transactions: [
            {
                id: 1,
                date: '2024-03-05',
                products: [
                    { id: 1, product: 'Internet Cable', availableQuantity: 1000, sellingQuantity: 300, price: 120, totalPrice: 36000 },
                    { id: 2, product: 'Water-Proof Cable', availableQuantity: 200, sellingQuantity: 70, price: 350, totalPrice: 24500 },
                    { id: 3, product: 'Heat-Proof Cable', availableQuantity: 180, sellingQuantity: 45, price: 400, totalPrice: 18000 },
                ],
                totalAmount: 78500,
                paidAmount: 0,
            },
            {
                id: 2,
                date: '2024-03-06',
                products: [],
                totalAmount: 0,
                paidAmount: 40000,
            },
            {
                id: 3,
                date: '2024-03-12',
                products: [
                    { id: 4, product: 'Welding Cable', availableQuantity: 250, sellingQuantity: 100, price: 300, totalPrice: 30000 },
                    { id: 5, product: 'Power Cable 7/29', availableQuantity: 380, sellingQuantity: 85, price: 250, totalPrice: 21250 },
                ],
                totalAmount: 51250,
                paidAmount: 0,
            },
            {
                id: 4,
                date: '2024-03-15',
                products: [],
                totalAmount: 0,
                paidAmount: 60000,
            },
        ],
        paymentHistory: [
            { date: '2024-03-06', amount: 40000, paymentType: 'cash' },
            { date: '2024-03-15', amount: 60000, paymentType: 'bank', bankName: 'MCB' },
        ],
    },
    {
        id: 1004,
        customerName: 'Imran Ahmed',
        phoneNumber: '0321-7777777',
        transactions: [
            {
                id: 1,
                date: '2024-03-07',
                products: [
                    { id: 1, product: 'Power Cable 7/29', availableQuantity: 400, sellingQuantity: 200, price: 250, totalPrice: 50000 },
                    { id: 2, product: 'Electric Cable 3/29', availableQuantity: 250, sellingQuantity: 100, price: 180, totalPrice: 18000 },
                    { id: 3, product: 'Internet Cable', availableQuantity: 900, sellingQuantity: 280, price: 120, totalPrice: 33600 },
                ],
                totalAmount: 101600,
                paidAmount: 0,
            },
            {
                id: 2,
                date: '2024-03-08',
                products: [],
                totalAmount: 0,
                paidAmount: 50000,
            },
            {
                id: 3,
                date: '2024-03-14',
                products: [
                    { id: 4, product: 'Heat-Proof Cable', availableQuantity: 160, sellingQuantity: 55, price: 400, totalPrice: 22000 },
                    { id: 5, product: 'Water-Proof Cable', availableQuantity: 190, sellingQuantity: 75, price: 350, totalPrice: 26250 },
                ],
                totalAmount: 48250,
                paidAmount: 0,
            },
            {
                id: 4,
                date: '2024-03-16',
                products: [],
                totalAmount: 0,
                paidAmount: 60000,
            },
        ],
        paymentHistory: [
            { date: '2024-03-08', amount: 50000, paymentType: 'check', checkNumber: '234567' },
            { date: '2024-03-16', amount: 60000, paymentType: 'bank', bankName: 'UBL' },
        ],
    },
    {
        id: 1005,
        customerName: 'Yasir Mahmood',
        phoneNumber: '0333-1111111',
        transactions: [
            {
                id: 1,
                date: '2024-03-09',
                products: [
                    { id: 1, product: 'Water-Proof Cable', availableQuantity: 250, sellingQuantity: 100, price: 350, totalPrice: 35000 },
                    { id: 2, product: 'Welding Cable', availableQuantity: 220, sellingQuantity: 80, price: 300, totalPrice: 24000 },
                    { id: 3, product: 'Electric Cable 3/29', availableQuantity: 270, sellingQuantity: 95, price: 180, totalPrice: 17100 },
                ],
                totalAmount: 76100,
                paidAmount: 0,
            },
            {
                id: 2,
                date: '2024-03-10',
                products: [],
                totalAmount: 0,
                paidAmount: 35000,
            },
            {
                id: 3,
                date: '2024-03-16',
                products: [
                    { id: 4, product: 'Power Cable 7/29', availableQuantity: 420, sellingQuantity: 110, price: 250, totalPrice: 27500 },
                    { id: 5, product: 'Internet Cable', availableQuantity: 850, sellingQuantity: 260, price: 120, totalPrice: 31200 },
                ],
                totalAmount: 58700,
                paidAmount: 0,
            },
            {
                id: 4,
                date: '2024-03-18',
                products: [],
                totalAmount: 0,
                paidAmount: 70000,
            },
        ],
        paymentHistory: [
            { date: '2024-03-10', amount: 35000, paymentType: 'bank', bankName: 'UBL' },
            { date: '2024-03-18', amount: 70000, paymentType: 'cash' },
        ],
    },
    {
        id: 1006,
        customerName: 'Zafar Iqbal',
        phoneNumber: '0345-2222222',
        transactions: [
            {
                id: 1,
                date: '2024-03-11',
                products: [
                    { id: 1, product: 'Power Cable 7/29', availableQuantity: 350, sellingQuantity: 150, price: 250, totalPrice: 37500 },
                    { id: 2, product: 'Heat-Proof Cable', availableQuantity: 140, sellingQuantity: 60, price: 400, totalPrice: 24000 },
                    { id: 3, product: 'Internet Cable', availableQuantity: 750, sellingQuantity: 200, price: 120, totalPrice: 24000 },
                    { id: 4, product: 'Electric Cable 3/29', availableQuantity: 220, sellingQuantity: 70, price: 180, totalPrice: 12600 },
                ],
                totalAmount: 98100,
                paidAmount: 0,
            },
            {
                id: 2,
                date: '2024-03-12',
                products: [],
                totalAmount: 0,
                paidAmount: 50000,
            },
            {
                id: 3,
                date: '2024-03-18',
                products: [
                    { id: 5, product: 'Welding Cable', availableQuantity: 180, sellingQuantity: 90, price: 300, totalPrice: 27000 },
                    { id: 6, product: 'Water-Proof Cable', availableQuantity: 160, sellingQuantity: 50, price: 350, totalPrice: 17500 },
                    { id: 7, product: 'Power Cable 7/29', availableQuantity: 200, sellingQuantity: 80, price: 250, totalPrice: 20000 },
                ],
                totalAmount: 64500,
                paidAmount: 0,
            },
            {
                id: 4,
                date: '2024-03-20',
                products: [],
                totalAmount: 0,
                paidAmount: 70000,
            },
        ],
        paymentHistory: [
            { date: '2024-03-12', amount: 50000, paymentType: 'bank', bankName: 'MCB' },
            { date: '2024-03-20', amount: 70000, paymentType: 'check', checkNumber: '345678' },
        ],
    },
    {
        id: 1007,
        customerName: 'Kashif Ali',
        phoneNumber: '0321-3333333',
        transactions: [
            {
                id: 1,
                date: '2024-03-13',
                products: [
                    { id: 1, product: 'Internet Cable', availableQuantity: 700, sellingQuantity: 400, price: 120, totalPrice: 48000 },
                    { id: 2, product: 'Electric Cable 3/29', availableQuantity: 240, sellingQuantity: 100, price: 180, totalPrice: 18000 },
                    { id: 3, product: 'Heat-Proof Cable', availableQuantity: 130, sellingQuantity: 45, price: 400, totalPrice: 18000 },
                ],
                totalAmount: 84000,
                paidAmount: 0,
            },
            {
                id: 2,
                date: '2024-03-14',
                products: [],
                totalAmount: 0,
                paidAmount: 40000,
            },
            {
                id: 3,
                date: '2024-03-19',
                products: [
                    { id: 4, product: 'Power Cable 7/29', availableQuantity: 300, sellingQuantity: 120, price: 250, totalPrice: 30000 },
                    { id: 5, product: 'Welding Cable', availableQuantity: 160, sellingQuantity: 70, price: 300, totalPrice: 21000 },
                    { id: 6, product: 'Water-Proof Cable', availableQuantity: 140, sellingQuantity: 55, price: 350, totalPrice: 19250 },
                ],
                totalAmount: 70250,
                paidAmount: 0,
            },
            {
                id: 4,
                date: '2024-03-21',
                products: [],
                totalAmount: 0,
                paidAmount: 65000,
            },
        ],
        paymentHistory: [
            { date: '2024-03-14', amount: 40000, paymentType: 'cash' },
            { date: '2024-03-21', amount: 65000, paymentType: 'bank', bankName: 'HBL' },
        ],
    },
    {
        id: 1008,
        customerName: 'Naveed Khan',
        phoneNumber: '0333-4444444',
        transactions: [
            {
                id: 1,
                date: '2024-03-15',
                products: [
                    { id: 1, product: 'Power Cable 7/29', availableQuantity: 280, sellingQuantity: 130, price: 250, totalPrice: 32500 },
                    { id: 2, product: 'Internet Cable', availableQuantity: 600, sellingQuantity: 250, price: 120, totalPrice: 30000 },
                    { id: 3, product: 'Electric Cable 3/29', availableQuantity: 200, sellingQuantity: 85, price: 180, totalPrice: 15300 },
                    { id: 4, product: 'Heat-Proof Cable', availableQuantity: 120, sellingQuantity: 40, price: 400, totalPrice: 16000 },
                ],
                totalAmount: 93800,
                paidAmount: 0,
            },
            {
                id: 2,
                date: '2024-03-16',
                products: [],
                totalAmount: 0,
                paidAmount: 45000,
            },
            {
                id: 3,
                date: '2024-03-22',
                products: [
                    { id: 5, product: 'Welding Cable', availableQuantity: 150, sellingQuantity: 65, price: 300, totalPrice: 19500 },
                    { id: 6, product: 'Water-Proof Cable', availableQuantity: 130, sellingQuantity: 45, price: 350, totalPrice: 15750 },
                ],
                totalAmount: 35250,
                paidAmount: 0,
            },
            {
                id: 4,
                date: '2024-03-24',
                products: [],
                totalAmount: 0,
                paidAmount: 50000,
            },
        ],
        paymentHistory: [
            { date: '2024-03-16', amount: 45000, paymentType: 'bank', bankName: 'UBL' },
            { date: '2024-03-24', amount: 50000, paymentType: 'check', checkNumber: '456789' },
        ],
    },
    {
        id: 1009,
        customerName: 'Sajid Mahmood',
        phoneNumber: '0345-6666666',
        transactions: [
            {
                id: 1,
                date: '2024-03-17',
                products: [
                    { id: 1, product: 'Water-Proof Cable', availableQuantity: 150, sellingQuantity: 60, price: 350, totalPrice: 21000 },
                    { id: 2, product: 'Heat-Proof Cable', availableQuantity: 120, sellingQuantity: 40, price: 400, totalPrice: 16000 },
                    { id: 3, product: 'Power Cable 7/29', availableQuantity: 250, sellingQuantity: 100, price: 250, totalPrice: 25000 },
                ],
                totalAmount: 62000,
                paidAmount: 0,
            },
            {
                id: 2,
                date: '2024-03-18',
                products: [],
                totalAmount: 0,
                paidAmount: 30000,
            },
            {
                id: 3,
                date: '2024-03-23',
                products: [
                    { id: 4, product: 'Electric Cable 3/29', availableQuantity: 180, sellingQuantity: 75, price: 180, totalPrice: 13500 },
                    { id: 5, product: 'Internet Cable', availableQuantity: 550, sellingQuantity: 220, price: 120, totalPrice: 26400 },
                    { id: 6, product: 'Welding Cable', availableQuantity: 140, sellingQuantity: 55, price: 300, totalPrice: 16500 },
                ],
                totalAmount: 56400,
                paidAmount: 0,
            },
            {
                id: 4,
                date: '2024-03-25',
                products: [],
                totalAmount: 0,
                paidAmount: 55000,
            },
        ],
        paymentHistory: [
            { date: '2024-03-18', amount: 30000, paymentType: 'cash' },
            { date: '2024-03-25', amount: 55000, paymentType: 'bank', bankName: 'MCB' },
        ],
    },
    {
        id: 1010,
        customerName: 'Asif Iqbal',
        phoneNumber: '0321-8888888',
        transactions: [
            {
                id: 1,
                date: '2024-03-19',
                products: [
                    { id: 1, product: 'Welding Cable', availableQuantity: 130, sellingQuantity: 60, price: 300, totalPrice: 18000 },
                    { id: 2, product: 'Power Cable 7/29', availableQuantity: 220, sellingQuantity: 90, price: 250, totalPrice: 22500 },
                    { id: 3, product: 'Heat-Proof Cable', availableQuantity: 110, sellingQuantity: 35, price: 400, totalPrice: 14000 },
                    { id: 4, product: 'Internet Cable', availableQuantity: 500, sellingQuantity: 180, price: 120, totalPrice: 21600 },
                ],
                totalAmount: 76100,
                paidAmount: 0,
            },
            {
                id: 2,
                date: '2024-03-20',
                products: [],
                totalAmount: 0,
                paidAmount: 40000,
            },
            {
                id: 3,
                date: '2024-03-24',
                products: [
                    { id: 5, product: 'Water-Proof Cable', availableQuantity: 120, sellingQuantity: 40, price: 350, totalPrice: 14000 },
                    { id: 6, product: 'Electric Cable 3/29', availableQuantity: 160, sellingQuantity: 65, price: 180, totalPrice: 11700 },
                ],
                totalAmount: 25700,
                paidAmount: 0,
            },
            {
                id: 4,
                date: '2024-03-26',
                products: [],
                totalAmount: 0,
                paidAmount: 35000,
            },
        ],
        paymentHistory: [
            { date: '2024-03-20', amount: 40000, paymentType: 'bank', bankName: 'HBL' },
            { date: '2024-03-26', amount: 35000, paymentType: 'check', checkNumber: '567890' },
        ],
    },
];

const KhataHistory = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Khata History'));
    }, []);

    // States
    const [isLedgerViewOpen, setIsLedgerViewOpen] = useState(false);
    const [selectedLedgerData, setSelectedLedgerData] = useState<LedgerRecord | null>(null);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({ columnAccessor: 'id', direction: 'asc' });

    // Generate KhataHistory data from ledger data
    const khataHistoryData: KhataHistory[] = dummyLedgerData.map((ledger) => {
        const totalAmount = ledger.transactions.reduce((sum, t) => sum + t.totalAmount, 0);
        const paidAmount = ledger.transactions.reduce((sum, t) => sum + t.paidAmount, 0);
        const remainingAmount = totalAmount - paidAmount;

        return {
            id: ledger.id,
            khataNumber: `KH-${String(ledger.id).padStart(3, '0')}`,
            customerName: ledger.customerName,
            phoneNumber: ledger.phoneNumber,
            totalAmount,
            paidAmount,
            remainingAmount,
            paymentMethod: [...new Set(ledger.paymentHistory.map((p) => p.paymentType))],
            status: paidAmount >= totalAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
            khataDate: ledger.transactions[0].date,
            dueDate: new Date(new Date(ledger.transactions[0].date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        };
    });

    const [records, setRecords] = useState(khataHistoryData);

    // Handlers
    const handleViewKhata = (id: number) => {
        const ledgerData = dummyLedgerData.find((l) => l.id === id);
        setSelectedLedgerData(ledgerData || null);
        setIsLedgerViewOpen(true);
    };

    const handleExportTable = (type: string) => {
        // ... Your existing export logic ...
    };

    // Filter and sort records
    useEffect(() => {
        let filteredData = khataHistoryData.filter((item) => {
            const matchesSearch = search === '' || Object.values(item).some((val) => val.toString().toLowerCase().includes(search.toLowerCase()));
            const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
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
                {/* Export Buttons */}
                <div className="flex md:items-center justify-between md:flex-row flex-col mb-4.5 gap-5">
                    <div className="flex items-center flex-wrap gap-2">
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => handleExportTable('csv')}>
                            <IconFile className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                            CSV
                        </button>
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => handleExportTable('excel')}>
                            <IconFile className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                            EXCEL
                        </button>
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => handleExportTable('print')}>
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

                {/* Data Table */}
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
                                render: ({ khataDate }) => new Date(khataDate).toLocaleDateString(),
                            },
                            {
                                accessor: 'dueDate',
                                title: 'Due Date',
                                sortable: true,
                                render: ({ dueDate }) => new Date(dueDate).toLocaleDateString(),
                            },
                            {
                                accessor: 'actions',
                                title: 'Actions',
                                render: (row) => (
                                    <div className="flex gap-2">
                                        <button type="button" className="btn btn-sm btn-outline-info" onClick={() => handleViewKhata(row.id)}>
                                            <IconEye className="w-4 h-4" />
                                        </button>
                                    </div>
                                ),
                            },
                        ]}
                        totalRecords={records.length}
                        recordsPerPage={pageSize}
                        page={page}
                        onPageChange={setPage}
                        recordsPerPageOptions={PAGE_SIZES}
                        onRecordsPerPageChange={setPageSize}
                        sortStatus={sortStatus}
                        onSortStatusChange={setSortStatus}
                        minHeight={200}
                        paginationText={({ from, to, totalRecords }) => `Showing ${from} to ${to} of ${totalRecords} entries`}
                    />
                </div>
            </div>

            {/* Ledger View Modal */}
            {isLedgerViewOpen && selectedLedgerData && (
                <div className="fixed inset-0 flex items-center justify-center z-50 ">
                    <div className="p-6 panel rounded-lg shadow-xl w-2/3 bg-white">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-xl font-bold">Khata Details</h2>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => {
                                    setIsLedgerViewOpen(false);
                                    setSelectedLedgerData(null);
                                }}
                            >
                                Close
                            </button>
                        </div>
                        <Ledger ledgerData={selectedLedgerData} />
                    </div>
                </div>
            )}
        </>
    );
};

export default KhataHistory;
