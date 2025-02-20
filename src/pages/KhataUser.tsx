import { useEffect, useRef, useState } from 'react';
import * as Yup from 'yup';
import { Field, Form, Formik } from 'formik';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../store/themeConfigSlice';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import IconEdit from '../components/Icon/IconEdit';
import IconTrash from '../components/Icon/IconTrash';

interface IKhataUser {
    id: number;
    name: string;
    phoneNumber: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    lastPaymentDate: string;
    status: 'active' | 'inactive';
}

const KhataUser = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Khata Users'));
    }, []);

    const [editMode, setEditMode] = useState(false);
    const formikRef = useRef<any>(null);

    // Sample data
    const rowData: IKhataUser[] = [
        {
            id: 1,
            name: 'Ahmed Ali',
            phoneNumber: '03001234567',
            totalAmount: 25000,
            paidAmount: 15000,
            remainingAmount: 10000,
            lastPaymentDate: '2024-01-15',
            status: 'active',
        },
        {
            id: 2,
            name: 'Muhammad Khan',
            phoneNumber: '03009876543',
            totalAmount: 50000,
            paidAmount: 30000,
            remainingAmount: 20000,
            lastPaymentDate: '2024-01-16',
            status: 'active',
        },
    ];

    // Form validation schema
    const khataUserSchema = Yup.object().shape({
        name: Yup.string().required('Name is required'),
        phoneNumber: Yup.string()
            .required('Phone number is required')
            .matches(/^[0-9]+$/, 'Phone number must contain only digits')
            .min(11, 'Phone number must be at least 11 digits')
            .max(11, 'Phone number must not exceed 11 digits'),
    });

    // Table configuration
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState(rowData);
    const [recordsData, setRecordsData] = useState(initialRecords);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({ columnAccessor: 'id', direction: 'asc' });

    // Filtering and sorting effect
    useEffect(() => {
        const filteredData = rowData.filter((item) => {
            const searchLower = search.toLowerCase();
            return (
                item.id.toString().includes(searchLower) ||
                item.name.toLowerCase().includes(searchLower) ||
                item.phoneNumber.includes(searchLower) ||
                item.totalAmount.toString().includes(searchLower) ||
                item.paidAmount.toString().includes(searchLower) ||
                item.remainingAmount.toString().includes(searchLower) ||
                formatDate(item.lastPaymentDate).includes(searchLower) ||
                item.status.toLowerCase().includes(searchLower)
            );
        });

        const sortedData = [...filteredData].sort((a, b) => {
            const first = a[sortStatus.columnAccessor as keyof IKhataUser];
            const second = b[sortStatus.columnAccessor as keyof IKhataUser];
            const dir = sortStatus.direction === 'desc' ? -1 : 1;

            return first < second ? -1 * dir : first > second ? 1 * dir : 0;
        });

        setInitialRecords(sortedData);

        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData(sortedData.slice(from, to));
    }, [search, sortStatus, page, pageSize]);

    // Format date helper
    const formatDate = (date: string) => {
        if (date) {
            const dt = new Date(date);
            const month = dt.getMonth() + 1 < 10 ? '0' + (dt.getMonth() + 1) : dt.getMonth() + 1;
            const day = dt.getDate() < 10 ? '0' + dt.getDate() : dt.getDate();
            return day + '/' + month + '/' + dt.getFullYear();
        }
        return '';
    };

    // Handle form submission
    const handleSubmit = (values: any, { resetForm }: any) => {
        const toast = Swal.mixin({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            timer: 3000,
        });

        toast.fire({
            icon: 'success',
            title: editMode ? 'Khata user updated successfully' : 'Khata user added successfully',
            padding: '10px 20px',
        });

        resetForm();
        setEditMode(false);
    };

    // Handle edit
    const handleEdit = (id: number) => {
        const user = rowData.find((item) => item.id === id);
        if (user && formikRef.current) {
            formikRef.current.setValues({
                name: user.name,
                phoneNumber: user.phoneNumber,
            });
            setEditMode(true);
        }
    };

    // Handle delete
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
                Swal.fire('Deleted!', 'Khata user has been deleted.', 'success');
            }
        });
    };

    return (
        <>
            <div className="panel">
                <div className="mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light mb-4">
                        {editMode ? 'Edit Khata User' : 'Add Khata User'}
                    </h5>
                    <Formik
                        innerRef={formikRef}
                        initialValues={{
                            name: '',
                            phoneNumber: '',
                        }}
                        validationSchema={khataUserSchema}
                        onSubmit={handleSubmit}
                    >
                        {({ errors, submitCount }) => (
                            <Form className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className={submitCount ? (errors.name ? 'has-error' : 'has-success') : ''}>
                                        <label htmlFor="name">Name *</label>
                                        <Field 
                                            name="name" 
                                            type="text" 
                                            id="name" 
                                            placeholder="Enter Name" 
                                            className="form-input" 
                                        />
                                        {submitCount > 0 && errors.name && (
                                            <div className="text-danger mt-1">{errors.name}</div>
                                        )}
                                    </div>

                                    <div className={submitCount ? (errors.phoneNumber ? 'has-error' : 'has-success') : ''}>
                                        <label htmlFor="phoneNumber">Phone Number *</label>
                                        <Field 
                                            name="phoneNumber" 
                                            type="text" 
                                            id="phoneNumber" 
                                            placeholder="Enter Phone Number" 
                                            className="form-input" 
                                        />
                                        {submitCount > 0 && errors.phoneNumber && (
                                            <div className="text-danger mt-1">{errors.phoneNumber}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-4">
                                    {editMode && (
                                        <button
                                            type="button"
                                            className="btn btn-danger"
                                            onClick={() => {
                                                setEditMode(false);
                                                formikRef.current.resetForm();
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                    <button type="submit" className="btn btn-primary">
                                        {editMode ? 'Update User' : 'Add User'}
                                    </button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
            </div>

            <div className="panel mt-6">
                <div className="mb-5 flex items-center justify-between">
                    <h5 className="font-semibold text-lg dark:text-white-light">Khata Users List</h5>
                    <input 
                        type="text" 
                        className="form-input w-auto" 
                        placeholder="Search..." 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                    />
                </div>

                <div className="datatables">
                    <DataTable
                        highlightOnHover
                        className="whitespace-nowrap table-hover"
                        records={recordsData}
                        columns={[
                            { accessor: 'id', title: '#', sortable: true },
                            { accessor: 'name', title: 'Name', sortable: true },
                            { accessor: 'phoneNumber', title: 'Phone Number', sortable: true },
                            {
                                accessor: 'totalAmount',
                                title: 'Total Amount',
                                sortable: true,
                                render: ({ totalAmount }) => totalAmount ? `Rs. ${totalAmount.toLocaleString()}` : '-',
                            },
                            {
                                accessor: 'paidAmount',
                                title: 'Paid Amount',
                                sortable: true,
                                render: ({ paidAmount }) => paidAmount ? `Rs. ${paidAmount.toLocaleString()}` : '-',
                            },
                            {
                                accessor: 'remainingAmount',
                                title: 'Remaining Amount',
                                sortable: true,
                                render: ({ remainingAmount }) => remainingAmount ? `Rs. ${remainingAmount.toLocaleString()}` : '-',
                            },
                            {
                                accessor: 'lastPaymentDate',
                                title: 'Last Payment',
                                sortable: true,
                                render: ({ lastPaymentDate }) => lastPaymentDate ? formatDate(lastPaymentDate) : '-',
                            },
                            {
                                accessor: 'status',
                                title: 'Status',
                                sortable: true,
                                render: ({ status }) => (
                                    <span className={`badge ${status === 'active' ? 'badge-outline-success' : 'badge-outline-danger'}`}>
                                        {status === 'active' ? 'Active' : 'Inactive'}
                                    </span>
                                ),
                            },
                            {
                                accessor: 'actions',
                                title: 'Actions',
                                render: (row) => (
                                    <div className="flex gap-2">
                                        <button 
                                            type="button" 
                                            className="btn btn-sm btn-outline-primary" 
                                            onClick={() => handleEdit(row.id)}
                                        >
                                            <IconEdit className="w-4 h-4" />
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn btn-sm btn-outline-danger" 
                                            onClick={() => handleDelete(row.id)}
                                        >
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

export default KhataUser;