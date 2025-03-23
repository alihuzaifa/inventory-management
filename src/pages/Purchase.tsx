import { useEffect, useRef, useState } from 'react';
import { DataTable } from 'mantine-datatable';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../store/themeConfigSlice';
import IconFile from '../components/Icon/IconFile';
import IconEdit from '../components/Icon/IconEdit';
import IconTrash from '../components/Icon/IconTrash';
import { Field, Form, Formik } from 'formik';
import * as Yup from 'yup';
import { downloadExcel } from 'react-export-table-to-excel';
import sortBy from 'lodash/sortBy';
import Swal from 'sweetalert2';
import InventoryManagement from '../services/api';
import { capitalize } from 'lodash';
import IconPrinter from '../components/Icon/IconPrinter';

// Constants
const PAGE_SIZES = [10, 20, 30, 50, 100];

const col = ['supplier', 'product', 'quantity', 'price', 'totalPrice', 'purchaseDate'];
const header = ['Supplier', 'Product', 'Quantity', 'Price', 'Total Price', 'Purchase Date'];

// Interfaces
interface Purchase {
    _id: string;
    supplier: string;
    product: string;
    quantity: number;
    price: number;
    totalPrice: number;
    purchaseDate: string;
}

interface FormValues {
    supplier: string;
    product: string;
    quantity: string | number;
    price: string | number;
    totalPrice: string | number;
}

// Validation Schema
const purchaseSchema = Yup.object().shape({
    supplier: Yup.string().required('Supplier is required'),
    product: Yup.string().required('Product is required'),
    quantity: Yup.number().required('Quantity is required').positive('Quantity must be positive'),
    price: Yup.number().required('Price is required').positive('Price must be positive'),
    totalPrice: Yup.number().required('Total Price is required').positive('Total Price must be positive'),
});

const Purchase = () => {
    const dispatch = useDispatch();
    const formikRef = useRef<any>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<Purchase[]>([]);
    const [recordsData, setRecordsData] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedPurchaseId, setSelectedPurchaseId] = useState<string>('');
    const [sortStatus, setSortStatus] = useState({ columnAccessor: 'purchaseDate', direction: 'desc' });

    useEffect(() => {
        dispatch(setPageTitle('Purchase'));
        fetchPurchases();
    }, []);

    // Fetch purchases
    const fetchPurchases = async () => {
        try {
            setLoading(true);
            const response = await InventoryManagement.GetAllPurchases();
            if (response) {
                setInitialRecords(response);
            }
        } catch (error: any) {
            console.error('Error fetching purchases:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to fetch purchases',
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle edit
    const handleEdit = (purchase: Purchase) => {
        setSelectedPurchaseId(purchase._id);
        setEditMode(true);
        if (formikRef.current) {
            formikRef.current.setValues({
                supplier: purchase.supplier,
                product: purchase.product,
                quantity: purchase.quantity,
                price: purchase.price,
                totalPrice: purchase.totalPrice,
            });
        }
    };

    // Handle delete
    const handleDelete = async (id: string) => {
        try {
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: "You won't be able to revert this!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, delete it!',
                padding: '2em',
            });

            if (result.value) {
                await InventoryManagement.DeletePurchase(id);
                await fetchPurchases();
                Swal.fire('Deleted!', 'Purchase has been deleted.', 'success');
            }
        } catch (error: any) {
            console.error('Error deleting purchase:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to delete purchase',
            });
        }
    };

    // Submit form
    const submitForm = async (values: FormValues, { resetForm }: any) => {
        try {
            setLoading(true);
            const purchaseData = {
                ...values,
                quantity: Number(values.quantity),
                price: Number(values.price),
                totalPrice: Number(values.totalPrice),
                purchaseDate: new Date().toISOString(),
            };

            if (editMode) {
                await InventoryManagement.UpdatePurchase(selectedPurchaseId, purchaseData);
                Swal.fire('Updated!', 'Purchase has been updated.', 'success');
            } else {
                await InventoryManagement.CreatePurchase(purchaseData);
                Swal.fire('Added!', 'Purchase has been added.', 'success');
            }

            resetForm();
            setEditMode(false);
            setSelectedPurchaseId('');
            await fetchPurchases();
        } catch (error: any) {
            console.error('Error submitting purchase:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to submit purchase',
            });
        } finally {
            setLoading(false);
        }
    };

    // Format date
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
        let records = initialRecords;
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
        const excelData = initialRecords.map((item) => ({
            ID: item._id,
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
    // Filter records based on search
    useEffect(() => {
        const filteredData = initialRecords.filter((item) => {
            return (
                item.supplier.toLowerCase().includes(search.toLowerCase()) ||
                item.product.toLowerCase().includes(search.toLowerCase()) ||
                item.quantity.toString().includes(search) ||
                item.price.toString().includes(search) ||
                item.totalPrice.toString().includes(search) ||
                formatDate(item.purchaseDate).includes(search)
            );
        });

        const sortedData = sortBy(filteredData, sortStatus.columnAccessor);
        setRecordsData(sortStatus.direction === 'desc' ? sortedData.reverse() : sortedData);
    }, [search, sortStatus, initialRecords]);

    return (
        <>
            <div className="panel">
                <div className="mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">{editMode ? 'Edit Purchase' : 'Add New Purchase'}</h5>
                </div>

                <div className="mb-5">
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
                        onSubmit={submitForm}
                    >
                        {({ errors, touched, values, setFieldValue, submitCount }) => (
                            <Form className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className={`${errors.supplier && touched.supplier && submitCount > 0 ? 'has-error' : 'has-success'}`}>
                                        <label htmlFor="supplier">Supplier Name *</label>
                                        <Field name="supplier" type="text" id="supplier" placeholder="Enter Supplier Name" className="form-input" />
                                        {submitCount > 0 && errors.supplier && <div className="text-danger mt-1">{errors.supplier}</div>}
                                    </div>

                                    <div className={`${errors.product && touched.product && submitCount > 0 ? 'has-error' : 'has-success'}`}>
                                        <label htmlFor="product">Product Name *</label>
                                        <Field name="product" type="text" id="product" placeholder="Enter Product Name" className="form-input" />
                                        {submitCount > 0 && errors.product && <div className="text-danger mt-1">{errors.product}</div>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className={`${errors.quantity && touched.quantity && submitCount > 0 ? 'has-error' : 'has-success'}`}>
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

                                    <div className={`${errors.price && touched.price && submitCount > 0 ? 'has-error' : 'has-success'}`}>
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
                                        <Field name="totalPrice" type="number" id="totalPrice" className="form-input" disabled />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-4">
                                    {editMode && (
                                        <button
                                            type="button"
                                            className="btn btn-danger"
                                            onClick={() => {
                                                setEditMode(false);
                                                setSelectedPurchaseId('');
                                                formikRef.current.resetForm();
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? (
                                            <span className="flex items-center">
                                                <span className="animate-spin mr-2">
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                        <path
                                                            className="opacity-75"
                                                            fill="currentColor"
                                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                        />
                                                    </svg>
                                                </span>
                                                {editMode ? 'Updating...' : 'Saving...'}
                                            </span>
                                        ) : editMode ? (
                                            'Update Purchase'
                                        ) : (
                                            'Add Purchase'
                                        )}
                                    </button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
            </div>

            <div className="panel mt-6">
                <div className="flex md:items-center md:flex-row flex-col mb-5 gap-5">
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

                    <div className="ltr:ml-auto rtl:mr-auto">
                        <input type="text" className="form-input w-auto" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>

                <div className="datatables">
                    <DataTable
                        highlightOnHover
                        className="whitespace-nowrap table-hover"
                        records={recordsData}
                        columns={[
                            { accessor: '_id', title: '#', sortable: true },
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
                                    <div className="flex gap-2">
                                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(row)}>
                                            <IconEdit className="w-4 h-4" />
                                        </button>
                                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(row._id)}>
                                            <IconTrash className="w-4 h-4" />
                                        </button>
                                    </div>
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
                        paginationText={({ from, to, totalRecords }) => `Showing ${from} to ${to} of ${totalRecords} entries`}
                    />
                </div>
            </div>
        </>
    );
};

export default Purchase;
