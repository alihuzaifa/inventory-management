import { DataTable, DataTableSortStatus } from 'mantine-datatable';
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

// Sample data structure for stocks
const rowData = [
    {
        id: 1,
        product: 'LED TV',
        totalQuantity: 550,
        totalPrice: 24750000,
        lastPurchaseDate: '2024-01-15',
        stocks: [
            { supplier: 'Noman', quantity: 100, price: 45000, date: '2024-01-10' },
            { supplier: 'Ahmed', quantity: 450, price: 45000, date: '2024-01-15' },
        ],
    },
    {
        id: 2,
        product: 'Laptop',
        totalQuantity: 300,
        totalPrice: 25500000,
        lastPurchaseDate: '2024-01-16',
        stocks: [
            { supplier: 'Ali Huzaifa', quantity: 200, price: 85000, date: '2024-01-12' },
            { supplier: 'Ali Hamza', quantity: 100, price: 85000, date: '2024-01-16' },
        ],
    },
];

const col = ['id', 'supplier', 'product', 'quantity', 'price', 'totalPrice', 'lastPurchaseDate'];
const header = ['ID', 'Supplier', 'Product', 'Quantity', 'Price', 'Total Price', 'Last Purchase Date'];

const Stock = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Stock Management'));
    }, []);

    // States for filtering
    const [selectedSupplier, setSelectedSupplier] = useState('all');
    const [selectedStock, setSelectedStock] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Table configuration
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState(sortBy(rowData, 'id'));
    const [recordsData, setRecordsData] = useState(initialRecords);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({ columnAccessor: 'id', direction: 'asc' });

    useEffect(() => {
        const filteredData = rowData.filter((item) => {
            const searchTerm = search.toLowerCase();
    
            const matchesSearch =
                searchTerm === '' ||
                item.id.toString().includes(searchTerm) ||
                item.product.toLowerCase().includes(searchTerm) ||
                item.totalQuantity.toString().includes(searchTerm) ||
                item.totalPrice.toString().includes(searchTerm) ||
                item.lastPurchaseDate.includes(searchTerm) ||
                item.stocks.some((stock) => stock.supplier.toLowerCase().includes(searchTerm)); // Check suppliers
    
            const matchesSupplier =
                selectedSupplier === 'all' || item.stocks.some((stock) => stock.supplier === selectedSupplier);
    
            return matchesSearch && matchesSupplier;
        });
    
        const sortedData = sortBy(filteredData, sortStatus.columnAccessor);
        const sorted = sortStatus.direction === 'desc' ? sortedData.reverse() : sortedData;
    
        setInitialRecords(sorted);
    
        // Update recordsData with paginated results
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData(sorted.slice(from, to));
    }, [search, selectedSupplier, sortStatus, page, pageSize]);
    

    // View stock details handler
    const handleViewDetails = (stock: any) => {
        setSelectedStock(stock);
        setIsModalOpen(true);
    };

    const formatDate = (date: string) => {
        if (date) {
            const dt = new Date(date);
            const month = dt.getMonth() + 1 < 10 ? '0' + (dt.getMonth() + 1) : dt.getMonth() + 1;
            const day = dt.getDate() < 10 ? '0' + dt.getDate() : dt.getDate();
            return day + '/' + month + '/' + dt.getFullYear();
        }
        return '';
    };

    const exportTable = (type: string) => {
        let columns = ['id', 'product', 'totalQuantity', 'totalPrice', 'lastPurchaseDate']; // Updated columns
        let records = rowData;
        let filename = 'Stock Report';

        if (type === 'csv') {
            let coldelimiter = ';';
            let linedelimiter = '\n';
            let result = columns.map(capitalize).join(coldelimiter);
            result += linedelimiter;

            records.forEach((item: any) => {
                columns.forEach((d, index) => {
                    if (index > 0) result += coldelimiter;
                    let val = item[d] ? item[d] : '';
                    if (d === 'totalPrice') val = `Rs. ${val.toLocaleString()}`;
                    if (d === 'lastPurchaseDate') val = formatDate(val);
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
            let rowhtml = `<p>${filename}</p>`;
            rowhtml += `<table style="width: 100%;" cellpadding="0" cellspacing="0">
                <thead><tr style="color: #515365; background: #eff5ff; print-color-adjust: exact;">`;

            columns.forEach((d) => {
                rowhtml += `<th>${capitalize(d)}</th>`;
            });

            rowhtml += `</tr></thead><tbody>`;

            records.forEach((item: any) => {
                rowhtml += '<tr>';
                columns.forEach((d: any) => {
                    let val = item[d] ? item[d] : '';
                    if (d === 'totalPrice') val = `Rs. ${val.toLocaleString()}`;
                    if (d === 'lastPurchaseDate') val = formatDate(val);
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

            const winPrint: any = window.open('', '', 'width=1000,height=600');
            winPrint.document.write(`<title>Print</title>${rowhtml}`);
            winPrint.document.close();
            winPrint.focus();
            winPrint.print();
        }
    };

    function handleDownloadExcel() {
        const excelData = rowData.map((item) => ({
            ID: item.id,
            Product: item.product,
            TotalQuantity: item.totalQuantity,
            'Total Price': `Rs. ${item.totalPrice.toLocaleString()}`,
            'Last Purchase Date': formatDate(item.lastPurchaseDate),
        }));

        downloadExcel({
            fileName: 'stock-report',
            sheet: 'Stock Details',
            tablePayload: {
                header,
                body: excelData,
            },
        });
    }

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

                {/* Filters and Search */}
                <div className="flex items-center gap-2">
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
                        { accessor: 'id', title: '#' },
                        { accessor: 'product', title: 'Product', sortable: true },
                        { accessor: 'totalQuantity', title: 'Total Quantity', sortable: true },
                        {
                            accessor: 'totalPrice',
                            title: 'Total Price',
                            render: ({ totalPrice }) => `Rs. ${totalPrice.toLocaleString()}`,
                        },
                        {
                            accessor: 'lastPurchaseDate',
                            title: 'Last Purchase',
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
                />
            </div>
            {isModalOpen && <StockModal stock={selectedStock} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

export default Stock;
