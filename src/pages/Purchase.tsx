import { useEffect, useRef, useState } from 'react';
import * as Yup from 'yup';
import { Field, Form, Formik } from 'formik';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../store/themeConfigSlice';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { capitalize, sortBy } from 'lodash';
import IconEdit from '../components/Icon/IconEdit';
import IconTrash from '../components/Icon/IconTrash';
import IconFile from '../components/Icon/IconFile';
import IconPrinter from '../components/Icon/IconPrinter';
import { downloadExcel } from 'react-export-table-to-excel';

const col = ['id', 'supplier', 'product', 'quantity', 'price', 'totalPrice', 'purchaseDate'];
const header = ['Id', 'Supplier', 'Product', 'Quantity', 'Price', 'Total Price', 'Purchase Date'];

const Purchase = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Purchase Form'));
    }, []);

    const [editMode, setEditMode] = useState(false);
    const formikRef = useRef<any>(null);
    const [rowData, setRowData] = useState<any[]>([]);

    const submitForm = (values: any) => {
        const newPurchase = {
            id: rowData.length + 1,
            supplier: values.supplier,
            product: values.product,
            quantity: Number(values.quantity),
            price: Number(values.price),
            totalPrice: Number(values.totalPrice),
            purchaseDate: new Date().toISOString().split('T')[0],
        };
        console.log('newPurchase', newPurchase);
        setRowData([...rowData, newPurchase]);

        const toast = Swal.mixin({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            timer: 3000,
        });
        toast.fire({
            icon: 'success',
            title: 'Purchase added successfully',
            padding: '10px 20px',
        });
    };

    const purchaseSchema = Yup.object().shape({
        supplier: Yup.string(), // Optional supplier
        product: Yup.string().required('Product name is required'),
        quantity: Yup.number().required('Quantity is required').positive('Quantity must be positive'),
        price: Yup.number().required('Price is required').positive('Price must be positive'),
    });

    // Table configuration
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<any[]>([]);
    const [recordsData, setRecordsData] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({ columnAccessor: 'id', direction: 'asc' });

    useEffect(() => {
        setInitialRecords(sortBy(rowData, 'id'));
    }, [rowData]);

    useEffect(() => {
        const filteredData = initialRecords.filter((item: any) => {
            const searchLower = search.toLowerCase();
            return (
                item.id.toString().includes(searchLower) ||
                item.supplier.toLowerCase().includes(searchLower) ||
                item.product.toLowerCase().includes(searchLower) ||
                item.quantity.toString().includes(searchLower) ||
                item.price.toString().includes(searchLower) ||
                item.totalPrice.toString().includes(searchLower) ||
                formatDate(item.purchaseDate).toLowerCase().includes(searchLower)
            );
        });

        const sortedData = sortBy(filteredData, sortStatus.columnAccessor);
        const sorted = sortStatus.direction === 'desc' ? sortedData.reverse() : sortedData;

        setInitialRecords(sorted);

        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData(sorted.slice(from, to));
    }, [search, sortStatus, page, pageSize, initialRecords]);

    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    useEffect(() => {
        const data = sortBy(initialRecords, sortStatus.columnAccessor);
        setInitialRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
        setPage(1);
    }, [sortStatus]);

    const formatDate = (date: string) => {
        if (date) {
            const dt = new Date(date);
            const month = dt.getMonth() + 1 < 10 ? '0' + (dt.getMonth() + 1) : dt.getMonth() + 1;
            const day = dt.getDate() < 10 ? '0' + dt.getDate() : dt.getDate();
            return day + '/' + month + '/' + dt.getFullYear();
        }
        return '';
    };

    const handleEdit = (id: number) => {
        const purchase = rowData.find((item) => item.id === id);
        if (purchase && formikRef.current) {
            formikRef.current.setValues({
                supplier: purchase.supplier,
                product: purchase.product,
                quantity: purchase.quantity,
                price: purchase.price,
                totalPrice: purchase.totalPrice,
            });
            setEditMode(true);
        }
    };

    const handleDelete = (id: number) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            padding: '2em',
        }).then((result) => {
            if (result.value) {
                const updatedData = rowData.filter((item) => item.id !== id);
                setRowData(updatedData);
                Swal.fire('Deleted!', 'Purchase has been deleted.', 'success');
            }
        });
    };

    const exportTable = (type: string) => {
        let columns: any = col;
        let records = rowData;
        let filename = 'Purchase Record';

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
                    } else if (d === 'purchaseDate') {
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
                    } else if (d === 'purchaseDate') {
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
            'Purchase Date': formatDate(item.purchaseDate),
        }));

        downloadExcel({
            fileName: 'purchases',
            sheet: 'Purchases',
            tablePayload: {
                header,
                body: excelData,
            },
        });
    }

    return (
        <>
            <div className="panel">
                <div className="mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light mb-4">{editMode ? 'Edit Purchase' : 'Add Purchase'}</h5>
                    <Formik
                        innerRef={formikRef}
                        initialValues={{
                            supplier: '',
                            product: '',
                            quantity: '',
                            price: '',
                            totalPrice: '',
                        }}
                        validationSchema={purchaseSchema}
                        onSubmit={(values, { resetForm }) => {
                            submitForm(values);
                            resetForm();
                            setEditMode(false);
                        }}
                    >
                        {({ errors, submitCount, values, setFieldValue }) => (
                            <Form className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div>
                                        <label htmlFor="supplier">Supplier</label>
                                        <Field name="supplier" type="text" id="supplier" placeholder="Enter Supplier Name" className="form-input" />
                                    </div>

                                    <div className={submitCount ? (errors.product ? 'has-error' : 'has-success') : ''}>
                                        <label htmlFor="product">Product Name *</label>
                                        <Field name="product" type="text" id="product" placeholder="Enter Product Name" className="form-input" />
                                        {submitCount > 0 && errors.product && <div className="text-danger mt-1">{errors.product}</div>}
                                    </div>

                                    <div className={submitCount ? (errors.quantity ? 'has-error' : 'has-success') : ''}>
                                        <label htmlFor="quantity">Quantity *</label>
                                        <Field
                                            name="quantity"
                                            type="number"
                                            id="quantity"
                                            placeholder="Enter Quantity"
                                            className="form-input"
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                setFieldValue('quantity', e.target.value);
                                                if (values.price) {
                                                    setFieldValue('totalPrice', Number(e.target.value) * Number(values.price));
                                                }
                                            }}
                                        />
                                        {submitCount > 0 && errors.quantity && <div className="text-danger mt-1">{errors.quantity}</div>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className={submitCount ? (errors.price ? 'has-error' : 'has-success') : ''}>
                                        <label htmlFor="price">Price *</label>
                                        <Field
                                            name="price"
                                            type="number"
                                            id="price"
                                            placeholder="Enter Price"
                                            className="form-input"
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                setFieldValue('price', e.target.value);
                                                if (values.quantity) {
                                                    setFieldValue('totalPrice', Number(e.target.value) * Number(values.quantity));
                                                }
                                            }}
                                        />
                                        {submitCount > 0 && errors.price && <div className="text-danger mt-1">{errors.price}</div>}
                                    </div>

                                    <div>
                                        <label htmlFor="totalPrice">Total Price</label>
                                        <Field name="totalPrice" type="number" id="totalPrice" placeholder="Total Price" className="form-input" disabled />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    {editMode && (
                                        <button
                                            type="button"
                                            className="btn btn-danger ml-4"
                                            onClick={() => {
                                                setEditMode(false);
                                                formikRef.current.resetForm();
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                    <button type="submit" className="btn btn-primary">
                                        {editMode ? 'Update Purchase' : 'Add Purchase'}
                                    </button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
            </div>

            <div className="panel mt-6">
                <div className="flex md:items-center justify-between md:flex-row flex-col mb-4.5 gap-5">
                    <div className="flex items-center flex-wrap">
                        <button type="button" onClick={() => exportTable('csv')} className="btn btn-primary btn-sm m-1 ">
                            <IconFile className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                            CSV
                        </button>
                        <button type="button" className="btn btn-primary btn-sm m-1" onClick={handleDownloadExcel}>
                            <IconFile className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                            EXCEL
                        </button>
                        <button type="button" onClick={() => exportTable('print')} className="btn btn-primary btn-sm m-1">
                            <IconPrinter className="ltr:mr-2 rtl:ml-2" />
                            PRINT
                        </button>
                    </div>

                    <input type="text" className="form-input w-auto" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="datatables">
                    <DataTable
                        highlightOnHover
                        className="whitespace-nowrap table-hover"
                        records={recordsData}
                        columns={[
                            { accessor: 'id', title: '#', sortable: true },
                            { accessor: 'supplier', title: 'Supplier', sortable: true },
                            { accessor: 'product', title: 'Product', sortable: true },
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
                                accessor: 'purchaseDate',
                                title: 'Purchase Date',
                                sortable: true,
                                render: ({ purchaseDate }) => formatDate(purchaseDate),
                            },
                            {
                                accessor: 'actions',
                                title: 'Actions',
                                render: (row) => (
                                    <div className="flex items-center gap-2">
                                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(row.id)}>
                                            <IconEdit className="w-4 h-4" />
                                        </button>
                                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(row.id)}>
                                            <IconTrash className="w-4 h-4" />
                                        </button>
                                    </div>
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
        </>
    );
};

export default Purchase;
