import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setPageTitle } from '../store/themeConfigSlice';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import IconEye from '../components/Icon/IconEye';
import IconFile from '../components/Icon/IconFile';
import IconPrinter from '../components/Icon/IconPrinter';
import { capitalize } from 'lodash';
import Ledger from './Ledger';
import { downloadExcel } from 'react-export-table-to-excel';
import { PDFDownloadLink } from '@react-pdf/renderer';
import LedgerPDF from '../components/LedgerPDF';
import IconDownload from '../components/Icon/IconDownload';
import { IRootState } from '../store';

interface Product {
    id: number;
    product: string;
    availableQuantity: number;
    sellingQuantity: number;
    price: number;
    totalPrice: number;
}

interface Payment {
    date: string;
    amount: number;
    paymentType: 'cash' | 'bank' | 'check';
    bankName?: string;
    checkNumber?: string;
}

interface Transaction {
    id: number;
    date: string;
    products: Product[];
    totalAmount: number;
    paidAmount: number;
    payments?: Payment[];
}

interface LedgerRecord {
    id: number;
    customerName: string;
    phoneNumber: string;
    transactions: Transaction[];
    paymentHistory: Payment[];
}

interface KhataHistory {
    id: number;
    khataNumber: string;
    customerName: string;
    phoneNumber: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    paymentDetails: {
        date: string;
        amount: number;
        paymentType: string;
        bankName?: string;
        checkNumber?: string;
    }[];
    status: 'paid' | 'partial' | 'unpaid';
    khataDate: string;
    dueDate: string;
}

const KhataHistory = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Khata History'));
    }, []);

    const [isLedgerViewOpen, setIsLedgerViewOpen] = useState(false);
    const [selectedLedgerData, setSelectedLedgerData] = useState<LedgerRecord | null>(null);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({ columnAccessor: 'id', direction: 'asc' });

    const dummyLedgerData: LedgerRecord[] = [
        {
            id: 1001,
            customerName: 'Ahmed Ali',
            phoneNumber: '0300-1234567',
            transactions: [
                {
                    id: 1,
                    date: '2024-03-01',
                    products: [
                        {
                            id: 101,
                            product: 'Power Cable 7/029',
                            availableQuantity: 1000,
                            sellingQuantity: 100,
                            price: 250,
                            totalPrice: 25000,
                        },
                        {
                            id: 102,
                            product: 'Electric Cable 3/029',
                            availableQuantity: 500,
                            sellingQuantity: 50,
                            price: 180,
                            totalPrice: 9000,
                        },
                    ],
                    totalAmount: 34000,
                    paidAmount: 20000,
                },
                {
                    id: 2,
                    date: '2024-03-15',
                    products: [
                        {
                            id: 103,
                            product: 'Welding Cable 35mm',
                            availableQuantity: 200,
                            sellingQuantity: 20,
                            price: 850,
                            totalPrice: 17000,
                        },
                    ],
                    totalAmount: 17000,
                    paidAmount: 15000,
                },
            ],
            paymentHistory: [
                {
                    date: '2024-03-01',
                    amount: 20000,
                    paymentType: 'bank',
                    bankName: 'HBL',
                },
                {
                    date: '2024-03-15',
                    amount: 15000,
                    paymentType: 'check',
                    checkNumber: 'CH-123456',
                },
            ],
        },
        {
            id: 1002,
            customerName: 'Muhammad Usman',
            phoneNumber: '0333-9876543',
            transactions: [
                {
                    id: 1,
                    date: '2024-03-05',
                    products: [
                        {
                            id: 201,
                            product: 'Internet Cable Cat6',
                            availableQuantity: 300,
                            sellingQuantity: 150,
                            price: 120,
                            totalPrice: 18000,
                        },
                        {
                            id: 202,
                            product: 'Heat-Proof Cable 2.5mm',
                            availableQuantity: 400,
                            sellingQuantity: 75,
                            price: 320,
                            totalPrice: 24000,
                        },
                    ],
                    totalAmount: 42000,
                    paidAmount: 30000,
                },
                {
                    id: 2,
                    date: '2024-03-20',
                    products: [
                        {
                            id: 203,
                            product: 'Water-Proof Cable 4mm',
                            availableQuantity: 250,
                            sellingQuantity: 40,
                            price: 450,
                            totalPrice: 18000,
                        },
                        {
                            id: 204,
                            product: 'Power Cable 7/044',
                            availableQuantity: 150,
                            sellingQuantity: 25,
                            price: 580,
                            totalPrice: 14500,
                        },
                    ],
                    totalAmount: 32500,
                    paidAmount: 20000,
                },
            ],
            paymentHistory: [
                {
                    date: '2024-03-05',
                    amount: 30000,
                    paymentType: 'cash',
                },
                {
                    date: '2024-03-20',
                    amount: 20000,
                    paymentType: 'bank',
                    bankName: 'Meezan Bank',
                },
            ],
        },
    ];

    const khataHistoryData: KhataHistory[] = dummyLedgerData.map((ledger) => {
        const totalAmount = ledger.transactions.reduce((sum, trans) => sum + trans.products.reduce((pSum, prod) => pSum + prod.totalPrice, 0), 0);
        const paidAmount = ledger.paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
        const remainingAmount = totalAmount - paidAmount;

        const paymentDetails = ledger.paymentHistory.map((payment) => ({
            date: payment.date,
            amount: payment.amount,
            paymentType: payment.paymentType,
            bankName: payment.bankName,
            checkNumber: payment.checkNumber,
        }));

        let status: 'paid' | 'partial' | 'unpaid';
        if (remainingAmount <= 0) {
            status = 'paid';
        } else if (paidAmount > 0) {
            status = 'partial';
        } else {
            status = 'unpaid';
        }

        const firstTransDate = ledger.transactions[0]?.date || '';
        const dueDate = firstTransDate ? new Date(new Date(firstTransDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : '';

        return {
            id: ledger.id,
            khataNumber: `KH-${String(ledger.id).padStart(4, '0')}`,
            customerName: ledger.customerName,
            phoneNumber: ledger.phoneNumber,
            totalAmount,
            paidAmount,
            remainingAmount,
            paymentDetails,
            status,
            khataDate: firstTransDate,
            dueDate,
        };
    });

    const [records, setRecords] = useState(khataHistoryData);

    const handleViewKhata = (id: number) => {
        const ledgerData = dummyLedgerData.find((l) => l.id === id);
        setSelectedLedgerData(ledgerData || null);
        setIsLedgerViewOpen(true);
    };

    // First, define the columns and headers
    const col = ['khataNumber', 'customerName', 'phoneNumber', 'totalAmount', 'paidAmount', 'remainingAmount', 'status', 'khataDate', 'dueDate'];
    const header = ['Khata #', 'Customer', 'Phone', 'Total Amount', 'Paid Amount', 'Remaining', 'Status', 'Khata Date', 'Due Date'];

    // Add these export handlers
    const handleExportCSV = () => {
        const csvContent = [
            header.join(','),
            ...records.map((item) =>
                col
                    .map((key) => {
                        if (['totalAmount', 'paidAmount', 'remainingAmount'].includes(key)) {
                            return `Rs. ${item[key as keyof KhataHistory].toLocaleString()}`;
                        } else if (['khataDate', 'dueDate'].includes(key)) {
                            return new Date(String(item[key as keyof KhataHistory])).toLocaleDateString();
                        } else if (key === 'status') {
                            return capitalize(String(item[key as keyof KhataHistory]));
                        }
                        return String(item[key as keyof KhataHistory]);
                    })
                    .join(',')
            ),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'khata_history.csv';
        link.click();
    };

    const handleDownloadExcel = () => {
        const excelData = records.map((item) => ({
            'Khata #': item.khataNumber,
            Customer: item.customerName,
            Phone: item.phoneNumber,
            'Total Amount': `Rs. ${item.totalAmount.toLocaleString()}`,
            'Paid Amount': `Rs. ${item.paidAmount.toLocaleString()}`,
            Remaining: `Rs. ${item.remainingAmount.toLocaleString()}`,
            Status: capitalize(item.status),
            'Khata Date': new Date(item.khataDate).toLocaleDateString(),
            'Due Date': new Date(item.dueDate).toLocaleDateString(),
        }));

        downloadExcel({
            fileName: 'khata_history',
            sheet: 'Khata History',
            tablePayload: { header, body: excelData },
        });
    };

    const handlePrint = () => {
        let printContent = '<h2 style="text-align: center; margin-bottom: 20px;">Khata History Records</h2>';
        printContent += '<table border="1" style="width:100%; border-collapse: collapse;">';
        printContent += '<tr>' + header.map((h) => `<th style="padding: 8px; text-align: center;">${h}</th>`).join('') + '</tr>';

        records.forEach((item) => {
            printContent +=
                '<tr>' +
                col
                    .map((key) => {
                        let value = '';
                        if (['totalAmount', 'paidAmount', 'remainingAmount'].includes(key)) {
                            value = `Rs. ${item[key as keyof KhataHistory].toLocaleString()}`;
                        } else if (['khataDate', 'dueDate'].includes(key)) {
                            value = new Date(item[key as keyof KhataHistory] as string).toLocaleDateString();
                        } else if (key === 'status') {
                            value = capitalize(item[key as keyof KhataHistory] as string);
                        } else {
                            value = item[key as keyof KhataHistory].toString();
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

    const theme = useSelector((state: IRootState) => state.themeConfig);

    useEffect(() => {
        let filteredData = khataHistoryData.filter((item) => {
            if (selectedStatus !== 'all' && item.status !== selectedStatus) {
                return false;
            }

            if (search === '') {
                return true;
            }

            const searchTerm = search.toLowerCase();

            // Search in basic fields
            const basicFieldsMatch = [
                item.khataNumber,
                item.customerName,
                item.phoneNumber,
                item.totalAmount.toString(),
                item.paidAmount.toString(),
                item.remainingAmount.toString(),
                item.status,
                new Date(item.khataDate).toLocaleDateString(),
                new Date(item.dueDate).toLocaleDateString(),
            ].some((value) => value.toLowerCase().includes(searchTerm));

            if (basicFieldsMatch) return true;

            // Search in payment details
            const paymentDetailsMatch = item.paymentDetails.some((payment) =>
                [payment.date, payment.amount.toString(), payment.paymentType, payment.bankName || '', payment.checkNumber || ''].some((value) => value.toLowerCase().includes(searchTerm))
            );

            return paymentDetailsMatch;
        });

        const sortedData = [...filteredData].sort((a, b) => {
            const first = a[sortStatus.columnAccessor as keyof KhataHistory];
            const second = b[sortStatus.columnAccessor as keyof KhataHistory];
            const dir = sortStatus.direction === 'desc' ? -1 : 1;

            return first < second ? -1 * dir : first > second ? 1 * dir : 0;
        });

        setRecords(sortedData);
    }, [search, selectedStatus, sortStatus, khataHistoryData]);
    return (
        <>
            <div className="panel mt-6">
                <div className="flex md:items-center justify-between md:flex-row flex-col mb-4.5 gap-5">
                    <div className="flex items-center flex-wrap gap-2">
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => handleExportCSV()}>
                            <IconFile className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                            CSV
                        </button>
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => handleDownloadExcel()}>
                            <IconFile className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                            EXCEL
                        </button>
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => handlePrint()}>
                            <IconPrinter className="ltr:mr-2 rtl:ml-2" />
                            PRINT
                        </button>
                    </div>

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
                                accessor: 'paymentDetails',
                                title: 'Payment Details',
                                render: ({ paymentDetails }) => (
                                    <div className="text-xs">
                                        {paymentDetails.map((payment, idx) => (
                                            <div key={idx}>
                                                {payment.date}: Rs. {payment.amount.toLocaleString()}({payment.paymentType}
                                                {payment.bankName ? ` - ${payment.bankName}` : ''}
                                                {payment.checkNumber ? ` - #${payment.checkNumber}` : ''})
                                            </div>
                                        ))}
                                    </div>
                                ),
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
                                render: (row) => {
                                    const ledgerData = dummyLedgerData.find((l) => l.id === row.id);
                                    return (
                                        <div className="flex gap-2">
                                            <button type="button" className="btn btn-sm btn-outline-info" onClick={() => handleViewKhata(row.id)}>
                                                <IconEye className="w-4 h-4" />
                                            </button>
                                            {ledgerData && (
                                                <PDFDownloadLink document={<LedgerPDF ledgerData={ledgerData} themeConfig={theme} />} fileName="Ledger.pdf">
                                                    {({ loading }) => (
                                                        <button type="button" className="btn btn-sm btn-primary">
                                                            {loading ? 'Loading...' : <IconDownload />}
                                                        </button>
                                                    )}
                                                </PDFDownloadLink>
                                            )}
                                        </div>
                                    );
                                },
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
            {isLedgerViewOpen && selectedLedgerData && (
                <div className="fixed inset-0 top-72 flex items-center justify-center z-[999]">
                    <div className="p-6 panel rounded-lg shadow-xl w-11/12">
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
