import { DataTable } from 'mantine-datatable';
import { useEffect, useState } from 'react';
import sortBy from 'lodash/sortBy';
import { downloadExcel } from 'react-export-table-to-excel';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../store/themeConfigSlice';
import IconFile from '../components/Icon/IconFile';
import IconPrinter from '../components/Icon/IconPrinter';
import IconEye from '../components/Icon/IconEye';
import { capitalize } from 'lodash';
import StockModal from '../components/StockModal';
import InventoryManagement from '../services/api';
import Swal from 'sweetalert2';

// Constants
const PAGE_SIZES = [10, 20, 30, 50, 100];

// Interfaces
interface StockEntry {
    supplier: string;
    quantity: number;
    price: number;
    date: string;
}

interface Stock {
    _id: string;
    shopId: string;
    product: string;
    totalQuantity: number;
    totalPrice: number;
    lastPurchaseDate: string;
    stocks: StockEntry[];
}

const Stock = () => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<Stock[]>([]);
    const [recordsData, setRecordsData] = useState<Stock[]>([]);
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sortStatus, setSortStatus] = useState({ columnAccessor: 'product', direction: 'asc' });

    useEffect(() => {
        dispatch(setPageTitle('Stock Management'));
        fetchStocks();
    }, []);

    // Fetch all stocks
    const fetchStocks = async () => {
        try {
            setLoading(true);
            const response = await InventoryManagement.GetAllStocks();
            if (response) {
                setInitialRecords(response);
            }
        } catch (error: any) {
            console.error('Error fetching stocks:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to fetch stocks',
            });
        } finally {
            setLoading(false);
        }
    };

    // Format date helper
    const formatDate = (date: string) => {
        if (!date) return '';
        const dt = new Date(date);
        const month = dt.getMonth() + 1 < 10 ? '0' + (dt.getMonth() + 1) : dt.getMonth() + 1;
        const day = dt.getDate() < 10 ? '0' + dt.getDate() : dt.getDate();
        return day + '/' + month + '/' + dt.getFullYear();
    };

    // Handle view stock details
    const handleViewDetails = async (stock: Stock) => {
        try {
            const response = await InventoryManagement.GetStockHistory(stock.product);
            if (response) {
                setSelectedStock({ ...stock, stocks: response.history });
                setIsModalOpen(true);
            }
        } catch (error: any) {
            console.error('Error fetching stock history:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to fetch stock history',
            });
        }
    };

    // Export table as CSV
    const exportTable = (type: string) => {
        let columns = ['_id', 'product', 'totalQuantity', 'totalPrice', 'lastPurchaseDate'];
        let records = initialRecords;
        let filename = 'Stock Report';

        if (type === 'csv') {
            let coldelimiter = ';';
            let linedelimiter = '\n';
            let result = columns.map(capitalize).join(coldelimiter);
            result += linedelimiter;

            records.forEach((item) => {
                columns.forEach((d, index) => {
                    if (index > 0) result += coldelimiter;
                    let val = item[d as keyof Stock] || '';
                    if (d === 'totalPrice') val = `Rs. ${val.toLocaleString()}`;
                    if (d === 'lastPurchaseDate') val = formatDate(val as string);
                    result += val;
                });
                result += linedelimiter;
            });

            const data = 'data:application/csv;charset=utf-8,' + encodeURIComponent(result);
            const link = document.createElement('a');
            link.setAttribute('href', data);
            link.setAttribute('download', filename + '.csv');
            link.click();
        } else if (type === 'print') {
            // Print functionality
            let rowhtml = `<p>${filename}</p>`;
            rowhtml += `<table style="width: 100%;" cellpadding="0" cellspacing="0">
                <thead><tr style="color: #515365; background: #eff5ff; print-color-adjust: exact;">`;

            columns.forEach((d) => {
                rowhtml += `<th>${capitalize(d)}</th>`;
            });

            rowhtml += `</tr></thead><tbody>`;

            records.forEach((item) => {
                rowhtml += '<tr>';
                columns.forEach((d) => {
                    let val = item[d as keyof Stock] || '';
                    if (d === 'totalPrice') val = `Rs. ${(val as number).toLocaleString()}`;
                    if (d === 'lastPurchaseDate') val = formatDate(val as string);
                    rowhtml += `<td>${val}</td>`;
                });
                rowhtml += '</tr>';
            });

            rowhtml += `</tbody></table>
                <style>
                    body { font-family: Arial; color:#495057; }
                    p { text-align:center; font-size:18px; font-weight:bold; margin:15px; }
                    table { border-collapse: collapse; }
                    th, td { font-size:12px; text-align:left; padding: 4px; }
                    th { padding:8px 4px; }
                    tr:nth-child(odd) { background:#f7f7f7; }
                </style>`;

            const winPrint = window.open('', '', 'width=1000,height=600');
            if (winPrint) {
                winPrint.document.write(`<title>Print</title>${rowhtml}`);
                winPrint.document.close();
                winPrint.focus();
                winPrint.print();
            }
        }
    };

    // Handle Excel export
    const handleDownloadExcel = () => {
        const excelData = initialRecords.map((item) => ({
            ID: item._id,
            Product: item.product,
            'Total Quantity': item.totalQuantity,
            'Total Price': `Rs. ${item.totalPrice.toLocaleString()}`,
            'Last Purchase Date': formatDate(item.lastPurchaseDate),
        }));

        downloadExcel({
            fileName: 'stock-report',
            sheet: 'Stock Details',
            tablePayload: {
                header: ['ID', 'Product', 'Total Quantity', 'Total Price', 'Last Purchase Date'],
                body: excelData,
            },
        });
    };

    // Filter and sort records
    useEffect(() => {
        const filteredData = initialRecords.filter((item) => {
            const searchTerm = search.toLowerCase();
            return (
                item.product.toLowerCase().includes(searchTerm) ||
                item.totalQuantity.toString().includes(searchTerm) ||
                item.totalPrice.toString().includes(searchTerm) ||
                formatDate(item.lastPurchaseDate).toLowerCase().includes(searchTerm)
            );
        });

        const sortedData = sortBy(filteredData, sortStatus.columnAccessor);
        const sorted = sortStatus.direction === 'desc' ? sortedData.reverse() : sortedData;

        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData(sorted.slice(from, to));
    }, [search, sortStatus, page, pageSize, initialRecords]);

    return (
        <div className="panel mt-6">
            <div className="flex md:items-center justify-between md:flex-row flex-col mb-4.5 gap-5">
                {/* Export buttons */}
                <div className="flex items-center flex-wrap gap-2">
                    <button type="button" onClick={() => exportTable('csv')} className="btn btn-primary btn-sm">
                        <IconFile className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                        CSV
                    </button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={handleDownloadExcel}>
                        <IconFile className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                        EXCEL
                    </button>
                    <button type="button" onClick={() => exportTable('print')} className="btn btn-primary btn-sm">
                        <IconPrinter className="ltr:mr-2 rtl:ml-2" />
                        PRINT
                    </button>
                </div>

                {/* Search */}
                <div className="ltr:ml-auto rtl:mr-auto">
                    <input type="text" className="form-input w-auto" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
            </div>

            {/* DataTable */}
            <div className="datatables">
                <DataTable
                    highlightOnHover
                    className="whitespace-nowrap table-hover"
                    records={recordsData}
                    columns={[
                        { accessor: '_id', title: '#' },
                        { accessor: 'product', title: 'Product', sortable: true },
                        { accessor: 'totalQuantity', title: 'Total Quantity', sortable: true },
                        {
                            accessor: 'totalPrice',
                            title: 'Total Price',
                            sortable: true,
                            render: ({ totalPrice }) => `Rs. ${totalPrice.toLocaleString()}`,
                        },
                        {
                            accessor: 'lastPurchaseDate',
                            title: 'Last Purchase',
                            sortable: true,
                            render: ({ lastPurchaseDate }) => formatDate(lastPurchaseDate),
                        },
                        {
                            accessor: 'action',
                            title: 'Action',
                            render: (row) => (
                                <button onClick={() => handleViewDetails(row)} className="btn btn-primary btn-sm">
                                    <IconEye className="w-5 h-5" />
                                </button>
                            ),
                        },
                    ]}
                    totalRecords={initialRecords.length}
                    recordsPerPage={pageSize}
                    page={page}
                    onPageChange={setPage}
                    recordsPerPageOptions={PAGE_SIZES}
                    onRecordsPerPageChange={setPageSize}
                    sortStatus={sortStatus as any}
                    onSortStatusChange={setSortStatus}
                    minHeight={200}
                    noRecordsText="No stocks found"
                    paginationText={({ from, to, totalRecords }) => `Showing ${from} to ${to} of ${totalRecords} entries`}
                />
            </div>

            {/* Stock Details Modal */}
            {isModalOpen && selectedStock && <StockModal stock={selectedStock} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

export default Stock;
