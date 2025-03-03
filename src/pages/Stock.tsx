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

// Sample data structure for stocks
const rowData = [
    {
        id: 1,
        supplier: 'Ali Trading Company', // Changed from supplierName
        product: 'LED TV', // Changed from productName
        quantity: 50,
        price: 45000,
        totalPrice: 2250000, // quantity * price
        lastPurchaseDate: '2024-01-15',
    },
    {
        id: 2,
        supplier: 'Karachi Electronics',
        product: 'Laptop',
        quantity: 20,
        price: 85000,
        totalPrice: 1700000,
        lastPurchaseDate: '2024-01-16',
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

    // Get unique suppliers for filter dropdown
    const suppliers = ['all', ...new Set(rowData.map((item) => item.supplier))];

    // Table configuration
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState(sortBy(rowData, 'id'));
    const [recordsData, setRecordsData] = useState(initialRecords);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({ columnAccessor: 'id', direction: 'asc' });

    // Filter and search effect
    useEffect(() => {
        const filteredData = rowData.filter((item: any) => {
            const matchesSearch = search
                ? item.id.toString().includes(search.toLowerCase()) ||
                  item.product.toLowerCase().includes(search.toLowerCase()) ||
                  item.supplier.toLowerCase().includes(search.toLowerCase()) ||
                  item.quantity.toString().includes(search.toLowerCase()) ||
                  item.price.toString().includes(search.toLowerCase())
                : true;

            const matchesSupplier = selectedSupplier === 'all' || item.supplier === selectedSupplier;

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
    const handleViewDetails = (id: number) => {
        console.log('Viewing details for stock ID:', id);
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
        let columns: any = col;
        let records = rowData;
        let filename = 'Stock Report';

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
                    let val = item[d] ? item[d] : '';
                    if (d === 'price' || d === 'totalPrice') {
                        val = `Rs. ${val.toLocaleString()}`;
                    } else if (d === 'lastPurchaseDate') {
                        val = formatDate(val);
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
                    let val = item[d] ? item[d] : '';
                    if (d === 'price' || d === 'totalPrice') {
                        val = `Rs. ${val.toLocaleString()}`;
                    } else if (d === 'lastPurchaseDate') {
                        val = formatDate(val);
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

    function handleDownloadExcel() {
        const excelData = rowData.map((item) => ({
            ID: item.id,
            Supplier: item.supplier,
            Product: item.product,
            Quantity: item.quantity,
            Price: `Rs. ${item.price.toLocaleString()}`,
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
                    <select className="form-select" value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)}>
                        <option value="all">All Suppliers</option>
                        {suppliers
                            .filter((s) => s !== 'all')
                            .map((supplier) => (
                                <option key={supplier} value={supplier}>
                                    {supplier}
                                </option>
                            ))}
                    </select>

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
                        { accessor: 'id', title: '#', sortable: true },
                        { accessor: 'product', title: 'Product', sortable: true },
                        { accessor: 'supplier', title: 'Supplier', sortable: true },
                        { accessor: 'quantity', title: 'Quantity', sortable: true },
                        {
                            accessor: 'price',
                            title: 'Price',
                            sortable: true,
                            render: ({ price }) => `Rs. ${price.toLocaleString()}`,
                        },
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
                            accessor: 'actions',
                            title: 'Actions',
                            render: (row) => (
                                <button type="button" className="btn btn-sm btn-outline-info" onClick={() => handleViewDetails(row.id)}>
                                    <IconEye className="w-4 h-4" />
                                </button>
                            ),
                        },
                    ]}
                    totalRecords={initialRecords.length}
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
    );
};

export default Stock;
