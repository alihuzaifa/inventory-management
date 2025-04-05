import { DataTable } from 'mantine-datatable';
import React from 'react';
import IconFile from './Icon/IconFile';
import IconPrinter from './Icon/IconPrinter';
import IconEye from './Icon/IconEye';
import { downloadExcel } from 'react-export-table-to-excel';

interface ProductItem {
    id: number;
    product: string;
    availableQuantity: number;
    sellingQuantity: number;
    price: number;
    totalPrice: number;
    availableQuantityId: string;
}

interface InvoiceRecord {
    _id: string;
    customerName: string;
    phoneNumber: string;
    paymentTypes: string[];
    cashAmount: number;
    bankAmount: number;
    bankName?: string;
    checkAmount: number;
    checkNumber?: string;
    products: ProductItem[];
    saleDate: string;
    totalBillAmount: number;
    billType: 'perfect' | 'fake';
}

type PaymentType = 'cash' | 'bank' | 'check';
type BillType = 'perfect' | 'fake';

const InvoiceTable = ({
    filterStates,
    setFilterStates,
    recordsData,
    calculateRemainingAmount,
    page,
    setPage,
    pageSize,
    setPageSize,
    sortStatus,
    setSortStatus,
    handleViewInvoice,
    handleAddPayment,
    handleDeleteInvoice,
    PAGE_SIZES,
}: any) => {
    const capitalize = (text: string) => {
        return text.charAt(0).toUpperCase() + text.slice(1);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString();
    };

    const exportTable = (type: string) => {
        let columns: any = ['customerName', 'phoneNumber', 'totalBillAmount', 'remainingAmount', 'billType', 'paymentTypes', 'saleDate'];
        let records = recordsData;
        let filename = 'Invoice Record';

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
                    if (d === 'totalBillAmount') {
                        val = `Rs. ${val.toLocaleString()}`;
                    } else if (d === 'remainingAmount') {
                        val = `Rs. ${calculateRemainingAmount(item).toLocaleString()}`;
                    } else if (d === 'saleDate') {
                        val = formatDate(val);
                    } else if (d === 'paymentTypes') {
                        val = val.join(', ');
                    } else if (d === 'billType') {
                        val = val === 'perfect' ? 'Perfect Bill' : 'Fake Bill';
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
                    if (d === 'totalBillAmount') {
                        val = `Rs. ${val.toLocaleString()}`;
                    } else if (d === 'remainingAmount') {
                        val = `Rs. ${calculateRemainingAmount(item).toLocaleString()}`;
                    } else if (d === 'saleDate') {
                        val = formatDate(val);
                    } else if (d === 'paymentTypes') {
                        val = val.join(', ');
                    } else if (d === 'billType') {
                        val = val === 'perfect' ? 'Perfect Bill' : 'Fake Bill';
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

    const handleDownloadExcel = () => {
        const excelData = recordsData.map((item: any) => ({
            'Invoice #': item._id,
            Customer: item.customerName,
            Phone: item.phoneNumber,
            'Total Amount': `Rs. ${item.totalBillAmount.toLocaleString()}`,
            'Remaining Amount': `Rs. ${calculateRemainingAmount(item).toLocaleString()}`,
            'Bill Type': item.billType === 'perfect' ? 'Perfect Bill' : 'Fake Bill',
            'Payment Method': item.paymentTypes.join(', '),
            Date: formatDate(item.saleDate),
        }));

        const header = ['Invoice #', 'Customer', 'Phone', 'Total Amount', 'Remaining Amount', 'Bill Type', 'Payment Method', 'Date'];

        downloadExcel({
            fileName: 'invoices',
            sheet: 'Invoices',
            tablePayload: {
                header,
                body: excelData,
            },
        });
    };
    return (
        <div>
            {/* Previous Invoices Table */}
            <div className="panel mt-6">
                <div className="flex md:items-center justify-between md:flex-row flex-col mb-4.5 gap-5">
                    <div className="flex items-center flex-wrap gap-2">
                        <h5 className="font-semibold text-lg dark:text-white-light">Previous Invoices</h5>
                        <button type="button" onClick={() => exportTable('csv')} className="btn btn-primary btn-sm">
                            <IconFile className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                            CSV
                        </button>
                        <button type="button" onClick={handleDownloadExcel} className="btn btn-primary btn-sm">
                            <IconFile className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                            EXCEL
                        </button>
                        <button type="button" onClick={() => exportTable('print')} className="btn btn-primary btn-sm">
                            <IconPrinter className="ltr:mr-2 rtl:ml-2" />
                            PRINT
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <select className="form-select" value={filterStates.selectedBillType} onChange={(e) => setFilterStates({ ...filterStates, selectedBillType: e.target.value as BillType })}>
                            <option value="all">All Bill Types</option>
                            <option value="perfect">Perfect Bill</option>
                            <option value="fake">Fake Bill</option>
                        </select>
                        <select
                            className="form-select"
                            value={filterStates.selectedPaymentMethod}
                            onChange={(e) => setFilterStates({ ...filterStates, selectedPaymentMethod: e.target.value as PaymentType })}
                        >
                            <option value="all">All Payment Methods</option>
                            <option value="cash">Cash</option>
                            <option value="bank">Bank Transfer</option>
                            <option value="check">Check</option>
                        </select>
                        <input
                            type="text"
                            className="form-input w-auto"
                            placeholder="Search..."
                            value={filterStates.search}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterStates({ ...filterStates, search: e.target.value })}
                        />
                    </div>
                </div>

                <div className="datatables">
                    <DataTable
                        highlightOnHover
                        className="whitespace-nowrap table-hover"
                        records={recordsData}
                        columns={[
                            { accessor: '_id', title: 'Invoice #', sortable: true },
                            { accessor: 'customerName', title: 'Customer', sortable: true },
                            { accessor: 'phoneNumber', title: 'Phone', sortable: true },
                            {
                                accessor: 'totalBillAmount',
                                title: 'Total Amount',
                                sortable: true,
                                render: ({ totalBillAmount }) => `Rs. ${totalBillAmount.toLocaleString()}`,
                            },
                            {
                                accessor: 'billType',
                                title: 'Bill Type',
                                sortable: true,
                                render: ({ billType }) => (
                                    <span className={`badge ${billType === 'perfect' ? 'badge-outline-success' : 'badge-outline-warning'}`}>
                                        {billType === 'perfect' ? 'Perfect Bill' : 'Fake Bill'}
                                    </span>
                                ),
                            },
                            {
                                accessor: 'paymentTypes',
                                title: 'Payment Method',
                                render: ({ paymentTypes }) => paymentTypes.join(', '),
                            },
                            {
                                accessor: 'remainingAmount',
                                title: 'Remaining Amount',
                                sortable: true,
                                render: (row: InvoiceRecord) => {
                                    const remaining = calculateRemainingAmount(row);
                                    return <span className={`${remaining > 0 ? 'text-danger' : 'text-success'}`}>Rs. {remaining.toLocaleString()}</span>;
                                },
                            },
                            {
                                accessor: 'actions',
                                title: 'Actions',
                                render: (row: InvoiceRecord) => (
                                    <div className="flex gap-2">
                                        <button className="btn btn-sm btn-primary" onClick={() => handleViewInvoice(row)}>
                                            <IconEye className="w-4 h-4" />
                                        </button>
                                        {calculateRemainingAmount(row) > 0 && (
                                            <button className="btn btn-sm btn-success" onClick={() => handleAddPayment(row)}>
                                                Add Payment
                                            </button>
                                        )}
                                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteInvoice(row._id)}>
                                            Delete
                                        </button>
                                    </div>
                                ),
                            },
                        ]}
                        totalRecords={recordsData.length}
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
        </div>
    );
};
export default InvoiceTable;
