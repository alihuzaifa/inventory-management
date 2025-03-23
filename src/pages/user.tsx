import { useEffect, useRef, useState } from 'react';
import * as Yup from 'yup';
import { Field, Form, Formik } from 'formik';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../store/themeConfigSlice';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import IconEdit from '../components/Icon/IconEdit';
import IconTrash from '../components/Icon/IconTrash';
import InventoryManagement from '../services/api';

// Interfaces
interface IUser {
    _id: string;
    type: 'user' | 'khata';
    email?: string;
    name?: string;
    phoneNumber?: string;
    password?: string;
    status: 'active' | 'inactive';
    role: 'admin' | 'staff';
    shopId: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
}

interface FormValues {
    type: 'user' | 'khata';
    email?: string;
    password?: string;
    name?: string;
    phoneNumber?: string;
    status?: 'active' | 'inactive';
}

interface ApiResponse<T> {
    data: T;
    message?: string;
    status?: number;
}

const PAGE_SIZES = [10, 20, 30, 50, 100];

const User = () => {
    const dispatch = useDispatch();
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const formikRef = useRef<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Table states
    const [users, setUsers] = useState<IUser[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState<IUser[]>([]);
    const [recordsData, setRecordsData] = useState<IUser[]>([]);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: '_id',
        direction: 'asc',
    });

    useEffect(() => {
        dispatch(setPageTitle('User Management'));
        getAllUsers();
    }, []);

    // Form validation schema
    const userSchema = Yup.object().shape({
        type: Yup.string().oneOf(['user', 'khata'], 'Please select a user type').required('User type is required'),
        email: Yup.string().when('type', {
            is: (val: string) => val === 'user',
            then: () => Yup.string().required('Email is required').email('Invalid email format'),
            otherwise: () => Yup.string().notRequired(),
        }),
        password: Yup.string().when('type', {
            is: (val: string) => val === 'user',
            then: () => Yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
            otherwise: () => Yup.string().notRequired(),
        }),
        name: Yup.string().when('type', {
            is: (val: string) => val === 'khata',
            then: () => Yup.string().required('Name is required'),
            otherwise: () => Yup.string().notRequired(),
        }),
        phoneNumber: Yup.string().when('type', {
            is: (val: string) => val === 'khata',
            then: () =>
                Yup.string()
                    .required('Phone number is required')
                    .matches(/^[0-9]+$/, 'Phone number must contain only digits')
                    .length(11, 'Phone number must be exactly 11 digits'),
            otherwise: () => Yup.string().notRequired(),
        }),
    });

    const getAllUsers = async () => {
        setIsLoading(true);
        try {
            const response: any = await InventoryManagement.GetAllUsers();
            if (response) {
                setUsers(response);
                setInitialRecords(response);
            }
        } catch (error: any) {
            console.error('Error fetching users:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || error.message || 'Failed to fetch users',
                padding: '2em',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (values: FormValues, { resetForm, setSubmitting }: { resetForm: () => void; setSubmitting: (isSubmitting: boolean) => void }) => {
        try {
            setSubmitting(true);

            if (editMode && editId !== null) {
                const updatedUser = await InventoryManagement.UpdateUser(editId, {
                    type: values.type,
                    status: values.status,
                    ...(values.type === 'user' && {
                        email: values.email,
                        password: values.password,
                    }),
                    ...(values.type === 'khata' && {
                        name: values.name,
                        phoneNumber: values.phoneNumber,
                    }),
                });
                const updatedUsers = users.map((user) => {
                    if (user._id === editId) {
                        return updatedUser;
                    }
                    return user;
                });
                setUsers(updatedUsers);
            } else {
                const userData = {
                    type: values.type,
                    ...(values.type === 'user' && {
                        email: values.email,
                        password: values.password,
                    }),
                    ...(values.type === 'khata' && {
                        name: values.name,
                        phoneNumber: values.phoneNumber,
                    }),
                };

                const response = (await InventoryManagement.CreateUser(userData)) as ApiResponse<IUser>;

                if (!response) {
                    throw new Error('Failed to create user. No data received.');
                }

                await getAllUsers();
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
        } catch (error: any) {
            console.error('Error submitting form:', error);

            const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage,
                padding: '2em',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (id: string) => {
        const user = users.find((item) => item._id === id);
        if (user && formikRef.current) {
            formikRef.current.setValues({
                type: user.type,
                email: user.email || '',
                password: user.password || '',
                name: user.name || '',
                phoneNumber: user.phoneNumber || '',
                status: user.status,
            });
            setEditMode(true);
            setEditId(id);
        }
    };

    const handleDelete = (id: string) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            padding: '2em',
        }).then(async (result) => {
            if (result.value) {
                try {
                    const deleteUser = await InventoryManagement.DeleteUser(id); // TODO: Implement delete API call
                    if (deleteUser) {
                        const updatedData = users.filter((item) => item._id !== id);
                        setUsers(updatedData);
                        Swal.fire('Deleted!', 'User has been deleted.', 'success');
                    }
                } catch (error: any) {
                    Swal.fire('Error!', error.message || 'Failed to delete user.', 'error');
                }
            }
        });
    };

    const handleToggleStatus = (id: string) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "Do you want to change the user's status?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, change it!',
            padding: '2em',
        }).then(async (result) => {
            if (result.value) {
                try {
                    const findUser = users.find((item) => item._id === id);
                    if (findUser) {
                        const updatedUser = await InventoryManagement.ActivateDeactivateUser(id, findUser.status === 'active' ? 'inactive' : 'active');
                        if (updatedUser) {
                            console.log('updatedUser', updatedUser);
                            const updatedData = users.map((item) => {
                                if (item._id === id) {
                                    return updatedUser.user;
                                }
                                return item;
                            });
                            console.log('updatedData', updatedData);
                            setUsers(updatedData);
                        }
                        Swal.fire('Updated!', 'User status has been updated.', 'success');
                    }
                } catch (error: any) {
                    Swal.fire('Error!', error.message || 'Failed to update user status.', 'error');
                }
            }
        });
    };

    useEffect(() => {
        const filteredData = users.filter((item) => {
            const searchLower = search.toLowerCase();
            return (
                item._id.toString().includes(searchLower) ||
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

    return (
        <>
            <div className="panel">
                <div className="mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light mb-4">{editMode ? 'Edit User' : 'Add User'}</h5>
                    <Formik
                        innerRef={formikRef}
                        initialValues={{
                            type: 'user',
                            email: '',
                            password: '',
                            name: '',
                            phoneNumber: '',
                        }}
                        validationSchema={userSchema}
                        onSubmit={handleSubmit}
                    >
                        {({ errors, submitCount, values, isSubmitting }) => (
                            <Form className="space-y-5">
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
                                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                        {isSubmitting ? 'Processing...' : editMode ? 'Update User' : 'Add User'}
                                    </button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
            </div>

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
                            { accessor: '_id', title: '#', sortable: true },
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
                                accessor: 'password',
                                title: 'Password',
                                sortable: true,
                                render: ({ type, password }) => (type === 'user' ? password || '-' : '-'),
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
                                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(row._id)}>
                                            <IconEdit className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            className={`btn btn-sm ${row.status === 'active' ? 'btn-outline-danger' : 'btn-outline-success'}`}
                                            onClick={() => handleToggleStatus(row._id)}
                                        >
                                            {row.status === 'active' ? 'Deactivate' : 'Activate'}
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
                        onPageChange={(p) => setPage(p)}
                        recordsPerPageOptions={PAGE_SIZES}
                        onRecordsPerPageChange={setPageSize}
                        sortStatus={sortStatus}
                        onSortStatusChange={setSortStatus}
                        minHeight={200}
                        noRecordsText="No users found"
                        loadingText="Loading users..."
                        paginationText={({ from, to, totalRecords }) => `Showing ${from} to ${to} of ${totalRecords} entries`}
                    />
                </div>
            </div>
        </>
    );
};

export default User;
