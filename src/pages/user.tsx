import { useEffect, useRef, useState } from 'react';
import * as Yup from 'yup';
import { Field, Form, Formik } from 'formik';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../store/themeConfigSlice';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import IconEdit from '../components/Icon/IconEdit';
import IconTrash from '../components/Icon/IconTrash';

interface IUser {
    id: number;
    type: 'user' | 'khata';
    email?: string;
    password?: string;
    name?: string;
    phoneNumber?: string;
    status: 'active' | 'inactive';
    createdAt: string;
}

const User = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('User Management'));
    }, []);

    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const formikRef = useRef<any>(null);

    // Initialize with empty users array
    const [users, setUsers] = useState<IUser[]>([]);

    // Table configuration
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<IUser[]>([]);
    const [recordsData, setRecordsData] = useState<IUser[]>([]);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({ columnAccessor: 'id', direction: 'asc' });

    // Form validation schema
    const userSchema = Yup.object().shape({
        type: Yup.string().oneOf(['user', 'khata'], 'Please select a user type').required('User type is required'),
        email: Yup.string().when('type', {
            is: 'user',
            then: (schema) => schema.required('Email is required').email('Invalid email format'),
            otherwise: (schema) => schema.notRequired(),
        }),
        password: Yup.string().when('type', {
            is: 'user',
            then: (schema) => schema.required('Password is required').min(6, 'Password must be at least 6 characters'),
            otherwise: (schema) => schema.notRequired(),
        }),
        name: Yup.string().when('type', {
            is: 'khata',
            then: (schema) => schema.required('Name is required'),
            otherwise: (schema) => schema.notRequired(),
        }),
        phoneNumber: Yup.string().when('type', {
            is: 'khata',
            then: (schema) =>
                schema
                    .required('Phone number is required')
                    .matches(/^[0-9]+$/, 'Phone number must contain only digits')
                    .min(11, 'Phone number must be at least 11 digits')
                    .max(11, 'Phone number must not exceed 11 digits'),
            otherwise: (schema) => schema.notRequired(),
        }),
    });

    // Filtering and sorting effect
    useEffect(() => {
        const filteredData = users.filter((item) => {
            const searchLower = search.toLowerCase();
            return (
                item.id.toString().includes(searchLower) ||
                (item.email || '').toLowerCase().includes(searchLower) ||
                (item.name || '').toLowerCase().includes(searchLower) ||
                (item.phoneNumber || '').includes(searchLower) ||
                item.type.toLowerCase().includes(searchLower) ||
                item.status.toLowerCase().includes(searchLower)
            );
        });

        const sortedData = [...filteredData].sort((a, b) => {
            const first = a[sortStatus.columnAccessor as keyof IUser];
            const second = b[sortStatus.columnAccessor as keyof IUser];
            const dir = sortStatus.direction === 'desc' ? -1 : 1;

            if (first === undefined || second === undefined) return 0;
            return first < second ? -1 * dir : first > second ? 1 * dir : 0;
        });

        setInitialRecords(sortedData);

        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData(sortedData.slice(from, to));
    }, [users, search, sortStatus, page, pageSize]);

    // Handle form submission
    const handleSubmit = (values: any, { resetForm }: any) => {
        if (editMode && editId !== null) {
            // Update existing user
            const updatedUsers = users.map((user) => {
                if (user.id === editId) {
                    return {
                        ...user,
                        type: values.type,
                        email: values.type === 'user' ? values.email : undefined,
                        password: values.type === 'user' ? values.password : undefined,
                        name: values.type === 'khata' ? values.name : undefined,
                        phoneNumber: values.type === 'khata' ? values.phoneNumber : undefined,
                    };
                }
                return user;
            });
            setUsers(updatedUsers);
        } else {
            // Add new user
            const newUser: IUser = {
                id: users.length + 1,
                type: values.type,
                email: values.type === 'user' ? values.email : undefined,
                password: values.type === 'user' ? values.password : undefined,
                name: values.type === 'khata' ? values.name : undefined,
                phoneNumber: values.type === 'khata' ? values.phoneNumber : undefined,
                status: 'active',
                createdAt: new Date().toISOString().split('T')[0],
            };
            setUsers([...users, newUser]);
        }

        const toast = Swal.mixin({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            timer: 3000,
        });

        toast.fire({
            icon: 'success',
            title: editMode ? 'User updated successfully' : 'User added successfully',
            padding: '10px 20px',
        });

        resetForm();
        setEditMode(false);
        setEditId(null);
    };

    // Handle edit
    const handleEdit = (id: number) => {
        const user = users.find((item) => item.id === id);
        if (user && formikRef.current) {
            formikRef.current.setValues({
                type: user.type,
                email: user.email || '',
                password: '',
                name: user.name || '',
                phoneNumber: user.phoneNumber || '',
            });
            setEditMode(true);
            setEditId(id);
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
                const updatedData = users.filter((item) => item.id !== id);
                setUsers(updatedData);
                Swal.fire('Deleted!', 'User has been deleted.', 'success');
            }
        });
    };

    // Handle status toggle
    const handleToggleStatus = (id: number) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "Do you want to change the user's status?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, change it!',
            padding: '2em',
        }).then((result) => {
            if (result.value) {
                const updatedData = users.map((item) => {
                    if (item.id === id) {
                        return { ...item, status: item.status === 'active' ? 'inactive' : 'active' };
                    }
                    return item;
                });
                setUsers(updatedData as IUser[]);
                Swal.fire('Updated!', 'User status has been updated.', 'success');
            }
        });
    };

    // Rest of the JSX remains the same
    return (
        <>
            <div className="panel">
                {/* Form section */}
                <div className="mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light mb-4">{editMode ? 'Edit User' : 'Add User'}</h5>
                    <Formik
                        innerRef={formikRef}
                        initialValues={{
                            type: '',
                            email: '',
                            password: '',
                            name: '',
                            phoneNumber: '',
                        }}
                        validationSchema={userSchema}
                        onSubmit={handleSubmit}
                    >
                        {/* Existing form JSX */}
                        {({ errors, submitCount, values }) => (
                            <Form className="space-y-5">
                                {/* Existing form fields */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className={submitCount ? (errors.type ? 'has-error' : 'has-success') : ''}>
                                        <label htmlFor="type">User Type *</label>
                                        <Field as="select" name="type" id="type" className="form-select">
                                            <option value="">Select Type</option>
                                            <option value="user">Regular User</option>
                                            <option value="khata">Khata User</option>
                                        </Field>
                                        {submitCount > 0 && errors.type && <div className="text-danger mt-1">{errors.type}</div>}
                                    </div>

                                    {values.type === 'user' && (
                                        <>
                                            <div className={submitCount ? (errors.email ? 'has-error' : 'has-success') : ''}>
                                                <label htmlFor="email">Email *</label>
                                                <Field name="email" type="email" id="email" placeholder="Enter Email" className="form-input" />
                                                {submitCount > 0 && errors.email && <div className="text-danger mt-1">{errors.email}</div>}
                                            </div>

                                            <div className={submitCount ? (errors.password ? 'has-error' : 'has-success') : ''}>
                                                <label htmlFor="password">Password *</label>
                                                <Field name="password" type="password" id="password" placeholder="Enter Password" className="form-input" />
                                                {submitCount > 0 && errors.password && <div className="text-danger mt-1">{errors.password}</div>}
                                            </div>
                                        </>
                                    )}

                                    {values.type === 'khata' && (
                                        <>
                                            <div className={submitCount ? (errors.name ? 'has-error' : 'has-success') : ''}>
                                                <label htmlFor="name">Name *</label>
                                                <Field name="name" type="text" id="name" placeholder="Enter Name" className="form-input" />
                                                {submitCount > 0 && errors.name && <div className="text-danger mt-1">{errors.name}</div>}
                                            </div>

                                            <div className={submitCount ? (errors.phoneNumber ? 'has-error' : 'has-success') : ''}>
                                                <label htmlFor="phoneNumber">Phone Number *</label>
                                                <Field name="phoneNumber" type="text" id="phoneNumber" placeholder="Enter Phone Number" className="form-input" />
                                                {submitCount > 0 && errors.phoneNumber && <div className="text-danger mt-1">{errors.phoneNumber}</div>}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="flex justify-end gap-4">
                                    {editMode && (
                                        <button
                                            type="button"
                                            className="btn btn-danger"
                                            onClick={() => {
                                                setEditMode(false);
                                                setEditId(null);
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

            {/* Users list section */}
            <div className="panel mt-6">
                <div className="mb-5 flex items-center justify-between">
                    <h5 className="font-semibold text-lg dark:text-white-light">Users List</h5>
                    <input type="text" className="form-input w-auto" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="datatables">
                    <DataTable
                        highlightOnHover
                        className="whitespace-nowrap table-hover"
                        records={recordsData}
                        columns={[
                            { accessor: 'id', title: '#', sortable: true },
                            {
                                accessor: 'type',
                                title: 'Type',
                                sortable: true,
                                render: ({ type }) => <span className="capitalize">{type === 'user' ? 'Regular User' : 'Khata User'}</span>,
                            },
                            {
                                accessor: 'email',
                                title: 'Email',
                                sortable: true,
                                render: ({ type, email }) => (type === 'user' ? email : '-'),
                            },
                            {
                                accessor: 'name',
                                title: 'Name',
                                sortable: true,
                                render: ({ type, name }) => (type === 'khata' ? name : '-'),
                            },
                            {
                                accessor: 'phoneNumber',
                                title: 'Phone Number',
                                sortable: true,
                                render: ({ type, phoneNumber }) => (type === 'khata' ? phoneNumber : '-'),
                            },
                            {
                                accessor: 'status',
                                title: 'Status',
                                sortable: true,
                                render: ({ status }) => (
                                    <span className={`badge ${status === 'active' ? 'badge-outline-success' : 'badge-outline-danger'}`}>{status === 'active' ? 'Active' : 'Inactive'}</span>
                                ),
                            },
                            {
                                accessor: 'actions',
                                title: 'Actions',
                                render: (row) => (
                                    <div className="flex gap-2">
                                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(row.id)}>
                                            <IconEdit className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            className={`btn btn-sm ${row.status === 'active' ? 'btn-outline-danger' : 'btn-outline-success'}`}
                                            onClick={() => handleToggleStatus(row.id)}
                                        >
                                            {row.status === 'active' ? 'Deactivate' : 'Activate'}
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

export default User;
