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
        productName: 'LED TV',
        supplier: 'Ali Trading Company',
        totalQuantity: 50,
        remainingQuantity: 35,
        soldQuantity: 15,
        purchasePrice: 45000,
        sellingPrice: 50000,
        lastPurchaseDate: '2024-01-15',
        status: 'In Stock', // In Stock, Low Stock, Out of Stock
    },
    {
        id: 2,
        productName: 'Laptop',
        supplier: 'Karachi Electronics',
        totalQuantity: 20,
        remainingQuantity: 3,
        soldQuantity: 17,
        purchasePrice: 85000,
        sellingPrice: 95000,
        lastPurchaseDate: '2024-01-16',
        status: 'Low Stock',
    },
    // Add more sample data...
];

const col = ['id', 'productName', 'supplier', 'totalQuantity', 'remainingQuantity', 'soldQuantity', 'purchasePrice', 'sellingPrice', 'lastPurchaseDate', 'status'];
const header = ['ID', 'Product Name', 'Supplier', 'Total Quantity', 'Remaining Quantity', 'Sold Quantity', 'Purchase Price', 'Selling Price', 'Last Purchase Date', 'Status'];

const Stock = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Stock Management'));
    }, []);

    // States for filtering
    const [selectedSupplier, setSelectedSupplier] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');

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

    // Status badge colors
    const getStatusBadge = (status: string) => {
        const badges = {
            'In Stock': <span className="badge badge-success">In Stock</span>,
            'Low Stock': <span className="badge badge-warning">Low Stock</span>,
            'Out of Stock': <span className="badge badge-danger">Out of Stock</span>,
        };
        return badges[status as keyof typeof badges] || status;
    };

    // Filter and search effect
    useEffect(() => {
        const filteredData = rowData.filter((item: any) => {
            const matchesSearch = search
                ? item.id.toString().includes(search.toLowerCase()) ||
                  item.productName.toLowerCase().includes(search.toLowerCase()) ||
                  item.supplier.toLowerCase().includes(search.toLowerCase()) ||
                  item.status.toLowerCase().includes(search.toLowerCase()) ||
                  item.totalQuantity.toString().includes(search.toLowerCase()) ||
                  item.remainingQuantity.toString().includes(search.toLowerCase())
                : true;

            const matchesSupplier = selectedSupplier === 'all' || item.supplier === selectedSupplier;
            const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

            return matchesSearch && matchesSupplier && matchesStatus;
        });

        const sortedData = sortBy(filteredData, sortStatus.columnAccessor);
        const sorted = sortStatus.direction === 'desc' ? sortedData.reverse() : sortedData;

        setInitialRecords(sorted);

        // Update recordsData with paginated results
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData(sorted.slice(from, to));
    }, [search, selectedSupplier, selectedStatus, sortStatus, page, pageSize]);

    // View stock details handler
    const handleViewDetails = (id: number) => {
        // Implement view details functionality
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
                    if (d === 'purchasePrice' || d === 'sellingPrice') {
                        val = `Rs. ${val.toLocaleString()}`;
                    } else if (d === 'lastPurchaseDate') {
                        val = formatDate(val);
                    } else if (d === 'status') {
                        // Ensure status is properly formatted
                        val = item.status;
                    } else if (d === 'remainingQuantity' || d === 'totalQuantity' || d === 'soldQuantity') {
                        // Format quantities
                        val = val.toString();
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
                    if (d === 'purchasePrice' || d === 'sellingPrice') {
                        val = `Rs. ${val.toLocaleString()}`;
                    } else if (d === 'lastPurchaseDate') {
                        val = formatDate(val);
                    } else if (d === 'status') {
                        // Add color coding for status in print
                        const statusColors = {
                            'In Stock': '#10b981',
                            'Low Stock': '#eab308',
                            'Out of Stock': '#ef4444',
                        };
                        val = `<span style="color: ${statusColors[item.status as keyof typeof statusColors] || '#000'}">${item.status}</span>`;
                    }
                    rowhtml += '<td>' + val + '</td>';
                });
                rowhtml += '</tr>';
            });

            // Enhanced print styling
            rowhtml +=
                '<style>' +
                'body {font-family: Arial, sans-serif; color: #495057;}' +
                'p {text-align: center; font-size: 18px; font-weight: bold; margin: 15px;}' +
                'table {border-collapse: collapse; border-spacing: 0; width: 100%;}' +
                'th, td {font-size: 12px; text-align: left; padding: 8px; border: 1px solid #e5e7eb;}' +
                'th {background: #eff5ff; color: #515365; font-weight: bold;}' +
                'tr:nth-child(2n-1) {background: #f7f7f7;}' +
                '.status-badge {padding: 4px 8px; border-radius: 4px; font-weight: 500;}' +
                '</style>';
            rowhtml += '</tbody></table>';

            var winPrint: any = window.open('', '', 'left=0,top=0,width=1000,height=600,toolbar=0,scrollbars=0,status=0');
            winPrint.document.write('<title>Stock Report</title>' + rowhtml);
            winPrint.document.close();
            winPrint.focus();
            winPrint.print();
        }
    };

    // Add this function for Excel export
    function handleDownloadExcel() {
        const excelData = rowData.map((item) => ({
            ID: item.id,
            'Product Name': item.productName,
            Supplier: item.supplier,
            'Total Quantity': item.totalQuantity,
            'Remaining Quantity': item.remainingQuantity,
            'Sold Quantity': item.soldQuantity,
            'Purchase Price': `Rs. ${item.purchasePrice.toLocaleString()}`,
            'Selling Price': `Rs. ${item.sellingPrice.toLocaleString()}`,
            'Last Purchase Date': formatDate(item.lastPurchaseDate),
            Status: item.status,
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

                    <select className="form-select" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                        <option value="all">All Status</option>
                        <option value="In Stock">In Stock</option>
                        <option value="Low Stock">Low Stock</option>
                        <option value="Out of Stock">Out of Stock</option>
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
                        { accessor: 'productName', title: 'Product Name', sortable: true },
                        { accessor: 'supplier', title: 'Supplier', sortable: true },
                        { accessor: 'totalQuantity', title: 'Total Qty', sortable: true },
                        { accessor: 'remainingQuantity', title: 'Remaining Qty', sortable: true },
                        { accessor: 'soldQuantity', title: 'Sold Qty', sortable: true },
                        {
                            accessor: 'purchasePrice',
                            title: 'Purchase Price',
                            sortable: true,
                            render: ({ purchasePrice }) => `Rs. ${purchasePrice.toLocaleString()}`,
                        },
                        {
                            accessor: 'sellingPrice',
                            title: 'Selling Price',
                            sortable: true,
                            render: ({ sellingPrice }) => `Rs. ${sellingPrice.toLocaleString()}`,
                        },
                        {
                            accessor: 'lastPurchaseDate',
                            title: 'Last Purchase',
                            sortable: true,
                            render: ({ lastPurchaseDate }) => formatDate(lastPurchaseDate),
                        },
                        {
                            accessor: 'status',
                            title: 'Status',
                            sortable: true,
                            render: ({ status }) => getStatusBadge(status),
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
