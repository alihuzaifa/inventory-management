import { useEffect, useRef, useState } from 'react';
import * as Yup from 'yup';
import { Field, Form, Formik } from 'formik';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../store/themeConfigSlice';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { sortBy } from 'lodash';
import { downloadExcel } from 'react-export-table-to-excel';
import IconEdit from '../components/Icon/IconEdit';
import IconTrash from '../components/Icon/IconTrash';
import IconFile from '../components/Icon/IconFile';
import IconPrinter from '../components/Icon/IconPrinter';

const Supplier = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Supplier Form'));
    }, []);
    const [editMode, setEditMode] = useState(false);
    const formikRef = useRef<any>(null);
    const submitForm = () => {
        const toast = Swal.mixin({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            timer: 3000,
        });
        toast.fire({
            icon: 'success',
            title: 'Supplier added successfully',
            padding: '10px 20px',
        });
    };

    const supplierSchema = Yup.object().shape({
        name: Yup.string().required('Supplier name is required'),
        email: Yup.string().email('Invalid email').required('Email is required'),
        phoneNumber: Yup.string().matches(/^[0-9]+$/, 'Must be only digits'),
        address: Yup.string(),
    });

    const rowData = [
        {
            id: 1,
            name: 'Ali Trading Company',
            email: 'ali@trading.pk',
            phone: '0300-1234567',
            address: 'Shop #123, Johar Town, Lahore',
            createdDate: '2024-01-15',
            balance: 50000,
        },
        {
            id: 2,
            name: 'Karachi Electronics',
            email: 'info@karachielectronics.com',
            phone: '0321-9876543',
            address: 'Plot 45, Tariq Road, Karachi',
            createdDate: '2024-01-16',
            balance: -30000,
        },
    ];

    const col = ['id', 'name', 'email', 'phone', 'address', 'createdDate', 'balance'];
    const header = ['Id', 'Name', 'Email', 'Phone', 'Address', 'Created Date', 'Balance'];

    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState(sortBy(rowData, 'id'));
    const [recordsData, setRecordsData] = useState(initialRecords);

    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({ columnAccessor: 'id', direction: 'asc' });

    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData([...initialRecords.slice(from, to)]);
    }, [page, pageSize, initialRecords]);

    useEffect(() => {
        setInitialRecords(() => {
            return rowData.filter((item: any) => {
                return (
                    item.id.toString().includes(search.toLowerCase()) ||
                    item.name.toLowerCase().includes(search.toLowerCase()) ||
                    item.email.toLowerCase().includes(search.toLowerCase()) ||
                    item.phone.toLowerCase().includes(search.toLowerCase()) ||
                    item.address.toLowerCase().includes(search.toLowerCase()) ||
                    item.createdDate.toLowerCase().includes(search.toLowerCase()) ||
                    item.balance.toString().includes(search.toLowerCase())
                );
            });
        });
    }, [search]);

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
        const supplier = rowData.find((item) => item.id === id);
        if (supplier) {
            // Update form values
            if (formikRef.current) {
                formikRef.current.setValues({
                    name: supplier.name,
                    email: supplier.email,
                    phoneNumber: supplier.phone,
                    address: supplier.address,
                });
            }
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
                const updatedData = initialRecords.filter((item) => item.id !== id);
                setInitialRecords(updatedData);
                setRecordsData(updatedData);

                Swal.fire('Deleted!', 'Supplier has been deleted.', 'success');
            }
        });
    };

    const formatBalance = (balance: number) => {
        const formattedAmount = Math.abs(balance).toLocaleString('en-IN', {
            maximumFractionDigits: 2,
            style: 'currency',
            currency: 'INR',
        });
        return balance >= 0 ? <div className="text-danger">Payable: {formattedAmount}</div> : <div className="text-success">Receivable: {formattedAmount}</div>;
    };

    function handleDownloadExcel() {
        downloadExcel({
            fileName: 'suppliers',
            sheet: 'Suppliers',
            tablePayload: {
                header,
                body: rowData,
            },
        });
    }

    const exportTable = (type: string) => {
        let columns: any = col;
        let records = rowData;
        let filename = 'suppliers';

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

    const capitalize = (text: string) => {
        return text
            .replace('_', ' ')
            .replace('-', ' ')
            .toLowerCase()
            .split(' ')
            .map((s: string) => s.charAt(0).toUpperCase() + s.substring(1))
            .join(' ');
    };

    return (
        <>
            <div className="panel">
                <div className="mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light mb-4">Add Supplier</h5>
                    <Formik
                        innerRef={formikRef}
                        initialValues={{
                            name: '',
                            email: '',
                            phoneNumber: '',
                            address: '',
                        }}
                        validationSchema={supplierSchema}
                        onSubmit={(values, { resetForm }) => {
                            console.log(values);
                            submitForm();
                            resetForm();
                            setEditMode(false);
                        }}
                    >
                        {({ errors, submitCount }) => (
                            <Form className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className={submitCount ? (errors.name ? 'has-error' : 'has-success') : ''}>
                                        <label htmlFor="name">Supplier Name *</label>
                                        <Field name="name" type="text" id="name" placeholder="Enter Supplier Name" className="form-input" />
                                        {submitCount > 0 && errors.name && <div className="text-danger mt-1">{errors.name}</div>}
                                    </div>

                                    <div className={submitCount ? (errors.email ? 'has-error' : 'has-success') : ''}>
                                        <label htmlFor="email">Email *</label>
                                        <Field name="email" type="text" id="email" placeholder="Enter Email" className="form-input" />
                                        {submitCount > 0 && errors.email && <div className="text-danger mt-1">{errors.email}</div>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className={submitCount ? (errors.phoneNumber ? 'has-error' : 'has-success') : ''}>
                                        <label htmlFor="phoneNumber">Phone Number</label>
                                        <Field name="phoneNumber" type="text" id="phoneNumber" placeholder="Enter Phone Number" className="form-input" />
                                        {submitCount > 0 && errors.phoneNumber && <div className="text-danger mt-1">{errors.phoneNumber}</div>}
                                    </div>

                                    <div className={submitCount > 0 ? (errors.address ? 'has-error' : 'has-success') : ''}>
                                        <label htmlFor="address">Address</label>
                                        <Field name="address" type="text" id="address" placeholder="Enter Address" className="form-input" />
                                        {submitCount > 0 && errors.address && <div className="text-danger mt-1">{errors.address}</div>}
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
                                        {editMode ? 'Update Supplier' : 'Add Supplier'}
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
                        <button type="button" onClick={() => exportTable('txt')} className="btn btn-primary btn-sm m-1">
                            <IconFile className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                            TXT
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
                            { accessor: 'name', title: 'Supplier Name', sortable: true },
                            { accessor: 'email', title: 'Email', sortable: true },
                            { accessor: 'phone', title: 'Phone', sortable: true },
                            { accessor: 'address', title: 'Address', sortable: true },
                            {
                                accessor: 'createdDate',
                                title: 'Created Date',
                                sortable: true,
                                render: ({ createdDate }) => <div>{formatDate(createdDate)}</div>,
                            },
                            {
                                accessor: 'balance',
                                title: 'Balance',
                                sortable: true,
                                render: ({ balance }) => formatBalance(balance),
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
                        paginationText={({ from, to, totalRecords }) => `Showing  ${from} to ${to} of ${totalRecords} entries`}
                    />
                </div>
            </div>
        </>
    );
};

export default Supplier;
