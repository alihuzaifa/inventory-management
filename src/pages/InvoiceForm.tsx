import { lazy, useEffect, useState, useRef } from 'react';
import * as Yup from 'yup';
import { Field, Form, Formik, FormikProps } from 'formik';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../store/themeConfigSlice';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import IconFile from '../components/Icon/IconFile';
import IconPrinter from '../components/Icon/IconPrinter';
import IconEye from '../components/Icon/IconEye';
import { downloadExcel } from 'react-export-table-to-excel';
import InventoryManagement from '../services/api';
const InvoiceView = lazy(() => import('./Invoice'));

interface FormikCustomerDetails {
    customerName: string;
    phoneNumber: string;
    paymentTypes: string[];
    cashAmount?: string;
    bankAmount?: string;
    bankName?: string;
    checkAmount?: string;
    checkNumber?: string;
    billType: 'perfect' | 'fake';
}

interface FormikProductDetails {
    product: string;
    availableQuantity: string | number;
    sellingQuantity: string | number;
    price: string | number;
    totalPrice: string | number;
    availableQuantityId: string;
}

interface ProductItem {
    id: number;
    product: string;
    availableQuantity: number;
    sellingQuantity: number;
    price: number;
    totalPrice: number;
    availableQuantityId: string;
}

interface CustomerDetails {
    customerName: string;
    phoneNumber: string;
    paymentTypes: string[];
    cashAmount?: string;
    bankAmount?: string;
    bankName?: string;
    checkAmount?: string;
    checkNumber?: string;
    billType?: string;
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

interface FilterStates {
    search: string;
    dateRange: {
        from: string;
        to: string;
    };
    selectedPaymentMethod: PaymentType | 'all';
    selectedBillType: BillType | 'all';
}

interface PaymentFormValues {
    paymentTypes: PaymentType[];
    cashAmount: string;
    bankAmount: string;
    bankName: string;
    checkAmount: string;
    checkNumber: string;
}

const customerDetailsSchema = Yup.object().shape({
    customerName: Yup.string().required('Customer name is required'),
    phoneNumber: Yup.string()
        .matches(/^[0-9]+$/, 'Phone number must contain only digits')
        .min(11, 'Phone number must be at least 11 digits')
        .max(11, 'Phone number must not exceed 11 digits'),
    paymentTypes: Yup.array().min(1, 'At least one payment type is required'),
    cashAmount: Yup.string().when('paymentTypes', {
        is: (types: string[]) => types?.includes('cash'),
        then: (schema) => schema.required('Cash amount is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
    bankAmount: Yup.string().when('paymentTypes', {
        is: (types: string[]) => types?.includes('bank'),
        then: (schema) => schema.required('Bank amount is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
    bankName: Yup.string().when('paymentTypes', {
        is: (types: string[]) => types?.includes('bank'),
        then: (schema) => schema.required('Bank name is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
    checkAmount: Yup.string().when('paymentTypes', {
        is: (types: string[]) => types?.includes('check'),
        then: (schema) => schema.required('Check amount is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
    checkNumber: Yup.string().when('paymentTypes', {
        is: (types: string[]) => types?.includes('check'),
        then: (schema) => schema.required('Check number is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
    billType: Yup.string().oneOf(['perfect', 'fake'], 'Invalid bill type').required('Bill type is required'),
});

const productSchema = Yup.object().shape({
    product: Yup.string().required('Product is required'),
    availableQuantity: Yup.number().required('Available quantity is required'),
    sellingQuantity: Yup.number()
        .required('Selling quantity is required')
        .positive('Quantity must be positive')
        .test('max', 'Selling quantity cannot exceed available quantity', function (value) {
            return !value || value <= this.parent.availableQuantity;
        }),
    price: Yup.number().required('Price is required').positive('Price must be positive'),
    totalPrice: Yup.number().required('Total price is required'),
});

const paymentUpdateSchema = Yup.object().shape({
    paymentTypes: Yup.array().of(Yup.string()).min(1, 'At least one payment type is required'),
    cashAmount: Yup.string().when('paymentTypes', {
        is: (types: string[]) => types?.includes('cash'),
        then: (schema) => schema.required('Cash amount is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
    bankAmount: Yup.string().when('paymentTypes', {
        is: (types: string[]) => types?.includes('bank'),
        then: (schema) => schema.required('Bank amount is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
    bankName: Yup.string().when('paymentTypes', {
        is: (types: string[]) => types?.includes('bank'),
        then: (schema) => schema.required('Bank name is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
    checkAmount: Yup.string().when('paymentTypes', {
        is: (types: string[]) => types?.includes('check'),
        then: (schema) => schema.required('Check amount is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
    checkNumber: Yup.string().when('paymentTypes', {
        is: (types: string[]) => types?.includes('check'),
        then: (schema) => schema.required('Check number is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
});

const Invoice = () => {
    const dispatch = useDispatch();
    const [initialRecords, setInitialRecords] = useState<InvoiceRecord[]>([]);
    const [recordsData, setRecordsData] = useState<InvoiceRecord[]>([]);
    const [currentProducts, setCurrentProducts] = useState<ProductItem[]>([]);
    const [customerData, setCustomerData] = useState<CustomerDetails | null>(null);
    const [totalBillAmount, setTotalBillAmount] = useState(0);
    const customerFormRef = useRef<FormikProps<FormikCustomerDetails>>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({ columnAccessor: 'id', direction: 'asc' });
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [filterStates, setFilterStates] = useState<FilterStates>({
        search: '',
        dateRange: {
            from: '',
            to: '',
        },
        selectedPaymentMethod: 'all',
        selectedBillType: 'all',
    });

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<InvoiceRecord | null>(null);

    useEffect(() => {
        dispatch(setPageTitle('Sale Form'));
    }, [dispatch]);

    const fetchProducts = async () => {
        try {
            const response = await InventoryManagement.getProductStockForDropdown();
            const allInvoices = await InventoryManagement.GetAllInvoices();
            console.log('allInvoices', allInvoices);

            if (allInvoices.invoices.length > 0) {
                setInitialRecords(allInvoices.invoices)
            }
            setProducts(response);
        } catch (error: any) {
            console.error('Error fetching stocks:', error);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        const filteredData = initialRecords.filter((item) => {
            return (
                item.customerName.toLowerCase().includes(search.toLowerCase()) ||
                item.phoneNumber.includes(search) ||
                item.paymentTypes.some((type) => type.toLowerCase().includes(search.toLowerCase())) ||
                item.totalBillAmount.toString().includes(search) ||
                new Date(item.saleDate).toLocaleDateString().includes(search)
            );
        });
        setRecordsData(filteredData);
    }, [search, initialRecords]);

    const handleCustomerSubmit = (values: FormikCustomerDetails) => {
        // Calculate total payment
        const cashAmount = Number(values.cashAmount || 0);
        const bankAmount = Number(values.bankAmount || 0);
        const checkAmount = Number(values.checkAmount || 0);
        const totalPayment = cashAmount + bankAmount + checkAmount;

        // Check if total payment exceeds total bill amount
        if (totalPayment > totalBillAmount) {
            Swal.fire({
                icon: 'error',
                title: 'Payment Error',
                text: `Total payment (${totalPayment.toLocaleString()}) cannot exceed bill amount (${totalBillAmount.toLocaleString()})`,
            });
            return;
        }

        // If validation passes, proceed with saving
        setCustomerData(values);
        Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Customer details saved successfully',
        });
    };

    const handleAddProduct = (values: FormikProductDetails, { resetForm }: any) => {
        // Create new product object
        const newProduct: ProductItem = {
            id: currentProducts.length + 1,
            product: values.product as string,
            availableQuantity: Number(values.availableQuantity),
            sellingQuantity: Number(values.sellingQuantity),
            price: Number(values.price),
            totalPrice: Number(values.totalPrice),
            availableQuantityId: values.availableQuantityId,
        };

        // Update current products list
        const updatedProducts = [...currentProducts, newProduct];
        setCurrentProducts(updatedProducts);

        // Calculate and update total bill amount
        const newTotalAmount = updatedProducts.reduce((sum, product) => sum + product.totalPrice, 0);
        setTotalBillAmount(newTotalAmount);

        // Reduce selected quantity from the products array
        setProducts((prevProducts) =>
            prevProducts.map((product) => {
                if (product.name === values.product) {
                    return {
                        ...product,
                        quantities: product.quantities
                            .map((qty: any) => {
                                if (qty._id === values.availableQuantityId) {
                                    const newQuantity = qty.quantity - Number(values.sellingQuantity);
                                    return newQuantity > 0 ? { ...qty, quantity: newQuantity } : null;
                                }
                                return qty;
                            })
                            .filter(Boolean), // Remove null values (quantities that reached 0)
                    };
                }
                return product;
            })
        );

        // Force Formik to revalidate
        if (customerFormRef.current) {
            customerFormRef.current.setFieldValue('cashAmount', customerFormRef.current.values.cashAmount, true);
            customerFormRef.current.setFieldValue('bankAmount', customerFormRef.current.values.bankAmount, true);
            customerFormRef.current.setFieldValue('checkAmount', customerFormRef.current.values.checkAmount, true);
        }

        resetForm();
    };

    const handleRemoveProduct = (productId: number) => {
        const updatedProducts = currentProducts.filter((p) => p.id !== productId);
        setCurrentProducts(updatedProducts);

        // Calculate and update total bill amount
        const newTotalAmount = updatedProducts.reduce((sum, product) => sum + product.totalPrice, 0);
        setTotalBillAmount(newTotalAmount);

        // Force Formik to revalidate with new total bill amount
        if (customerFormRef.current) {
            customerFormRef.current.setFieldValue('cashAmount', customerFormRef.current.values.cashAmount, true);
            customerFormRef.current.setFieldValue('bankAmount', customerFormRef.current.values.bankAmount, true);
            customerFormRef.current.setFieldValue('checkAmount', customerFormRef.current.values.checkAmount, true);
        }
    };

    const handleSaveInvoice = async () => {
        if (currentProducts.length === 0) {
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                text: 'Please add at least one product',
            });
            return;
        }

        if (!customerData) {
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                text: 'Please fill in customer details',
            });
            return;
        }

        const newInvoice = {
            "customerName": customerData?.customerName,
            "phoneNumber": customerData?.phoneNumber,
            products: currentProducts.map((product) => {
                return {
                    product: product.availableQuantityId,
                    availableQuantity: product.availableQuantity,
                    sellingQuantity: product.sellingQuantity,
                    price: product.price,
                    totalPrice: product.totalPrice,
                };
            }),
            "paymentTypes": customerData?.paymentTypes,
            "cashAmount": Number(customerData?.cashAmount) || null,
            "bankAmount": Number(customerData?.bankAmount) || null,
            "bankName": customerData?.bankName || null,
            "checkAmount": Number(customerData?.checkAmount) || null,
            "checkNumber": customerData?.checkNumber || null,
            "totalBillAmount": totalBillAmount,
            billType: (customerData.billType as 'perfect' | 'fake') || 'perfect',
            "saleDate": new Date().toISOString()
        }
        const createInvoice = await InventoryManagement.CreateInvoice(newInvoice)
        // setInitialRecords([...initialRecords, newInvoice])
        // console.log('dummyInvoice', newInvoice);
        setCurrentProducts([]);
        setCustomerData(null);
        setTotalBillAmount(0);

        if (customerFormRef.current) {
            customerFormRef.current.resetForm();
        }

        Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Invoice saved successfully',
        });
    };

    const handleViewInvoice = (invoice: InvoiceRecord) => {
        setSelectedInvoice(invoice);
        setIsViewModalOpen(true);
    };

    const handleDeleteInvoice = (invoiceId: string) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, cancel!',
            reverseButtons: true,
        }).then(async (result) => {
            if (result.isConfirmed) {
                const deleteInvoice = await InventoryManagement.DeleteInvoice(invoiceId)
                // setInitialRecords((prev) => prev.filter((record) => record.id !== invoiceId));
                // setRecordsData((prev) => prev.filter((record) => record.id !== invoiceId));
                // Swal.fire('Deleted!', 'Invoice has been deleted.', 'success');
            }
        });
    };

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
        const excelData = recordsData.map((item) => ({
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

    const calculateRemainingAmount = (invoice: InvoiceRecord): number => {
        const totalPaid = invoice.cashAmount + invoice.bankAmount + invoice.checkAmount;
        return invoice.totalBillAmount - totalPaid;
    };

    const handleAddPayment = (invoice: InvoiceRecord) => {
        setSelectedInvoiceForPayment(invoice);
        setIsPaymentModalOpen(true);
    };

    const handlePaymentSubmit = (values: PaymentFormValues) => {
        if (!selectedInvoiceForPayment) return;

        const cashAmount = Number(values.cashAmount || 0);
        const bankAmount = Number(values.bankAmount || 0);
        const checkAmount = Number(values.checkAmount || 0);
        const totalNewPayment = cashAmount + bankAmount + checkAmount;
        const remainingAmount = calculateRemainingAmount(selectedInvoiceForPayment);

        // Validate total payment against remaining amount
        if (totalNewPayment > remainingAmount) {
            Swal.fire({
                icon: 'error',
                title: 'Payment Error',
                text: `Total payment (${totalNewPayment.toLocaleString()}) cannot exceed remaining amount (${remainingAmount.toLocaleString()})`,
            });
            return;
        }

        // Update records if validation passes
        setInitialRecords((prev) =>
            prev.map((record) => {
                if (record._id === selectedInvoiceForPayment._id) {
                    const updatedPaymentTypes = [...new Set([...record.paymentTypes, ...values.paymentTypes])] as PaymentType[];
                    return {
                        ...record,
                        paymentTypes: updatedPaymentTypes,
                        cashAmount: record.cashAmount + cashAmount,
                        bankAmount: record.bankAmount + bankAmount,
                        checkAmount: record.checkAmount + checkAmount,
                        bankName: values.bankName || record.bankName,
                        checkNumber: values.checkNumber || record.checkNumber,
                    };
                }
                return record;
            })
        );

        // Update recordsData to reflect changes
        setRecordsData((prev) =>
            prev.map((record) => {
                if (record._id === selectedInvoiceForPayment._id) {
                    const updatedPaymentTypes = [...new Set([...record.paymentTypes, ...values.paymentTypes])] as PaymentType[];
                    return {
                        ...record,
                        paymentTypes: updatedPaymentTypes,
                        cashAmount: record.cashAmount + cashAmount,
                        bankAmount: record.bankAmount + bankAmount,
                        checkAmount: record.checkAmount + checkAmount,
                        bankName: values.bankName || record.bankName,
                        checkNumber: values.checkNumber || record.checkNumber,
                    };
                }
                return record;
            })
        );

        setIsPaymentModalOpen(false);
        setSelectedInvoiceForPayment(null);
        Swal.fire('Success', 'Payment updated successfully', 'success');
    };

    return (
        <>
            <div className="panel">
                {/* Product Details Section */}
                <div className="mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light mb-4">Product Details</h5>
                    <Formik
                        initialValues={{
                            product: '',
                            availableQuantity: '',
                            sellingQuantity: '',
                            price: '',
                            totalPrice: '',
                            availableQuantityId: '',
                        }}
                        validationSchema={productSchema}
                        onSubmit={handleAddProduct}
                    >
                        {({ errors, touched, values, setFieldValue, submitCount }) => (
                            <Form>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className={submitCount ? (errors.product ? 'has-error' : 'has-success') : ''}>
                                        <label htmlFor="product">Product *</label>
                                        <Field as="select" name="product" className="form-select">
                                            <option value="">Select Product</option>
                                            {products.map((p) => (
                                                <option key={p.id} value={p.name}>
                                                    {p.name}
                                                </option>
                                            ))}
                                        </Field>
                                        {submitCount > 0 && errors.product && <div className="text-danger mt-1">{errors.product}</div>}
                                    </div>

                                    {values.product && (
                                        <>
                                            <div className={submitCount ? (errors.availableQuantity ? 'has-error' : 'has-success') : ''}>
                                                <label htmlFor="availableQuantity">Available Qty *</label>
                                                <Field
                                                    as="select"
                                                    name="availableQuantity"
                                                    className="form-select"
                                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                                        const selectedQuantity = e.target.value;
                                                        setFieldValue('availableQuantity', selectedQuantity);

                                                        const selectedProduct = products.find((p) => p.name === values.product);
                                                        if (selectedProduct) {
                                                            const selectedQtyObj = selectedProduct.quantities.find((qty: any) => qty.quantity.toString() === selectedQuantity);
                                                            if (selectedQtyObj) {
                                                                console.log('Setting availableQuantityId:', selectedQtyObj._id); // Debugging log
                                                                setFieldValue('availableQuantityId', selectedQtyObj._id);
                                                            } else {
                                                                setFieldValue('availableQuantityId', '');
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <option value="">Select Quantity</option>
                                                    {products
                                                        .find((p) => p.name === values.product)
                                                        ?.quantities.map((qty: any, idx: any) => (
                                                            <option key={idx} value={qty.quantity}>
                                                                {qty.quantity}
                                                            </option>
                                                        ))}
                                                </Field>
                                                {touched.availableQuantity && errors.availableQuantity && <div className="text-danger mt-1">{errors.availableQuantity}</div>}
                                            </div>

                                            <div className={submitCount ? (errors.sellingQuantity ? 'has-error' : 'has-success') : ''}>
                                                <label htmlFor="sellingQuantity">Selling Qty *</label>
                                                <Field
                                                    name="sellingQuantity"
                                                    type="number"
                                                    className="form-input"
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                        const qty = Number(e.target.value);
                                                        setFieldValue('sellingQuantity', qty);
                                                        if (values.price) {
                                                            setFieldValue('totalPrice', qty * Number(values.price));
                                                        }
                                                    }}
                                                />
                                                {touched.sellingQuantity && errors.sellingQuantity && <div className="text-danger mt-1">{errors.sellingQuantity}</div>}
                                            </div>

                                            <div className={submitCount ? (errors.price ? 'has-error' : 'has-success') : ''}>
                                                <label htmlFor="price">Price *</label>
                                                <Field
                                                    name="price"
                                                    type="number"
                                                    className="form-input"
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                        const price = Number(e.target.value);
                                                        setFieldValue('price', price);
                                                        if (values.sellingQuantity) {
                                                            setFieldValue('totalPrice', price * Number(values.sellingQuantity));
                                                        }
                                                    }}
                                                />
                                                {touched.price && errors.price && <div className="text-danger mt-1">{errors.price}</div>}
                                            </div>

                                            <div className={submitCount ? (errors.totalPrice ? 'has-error' : 'has-success') : ''}>
                                                <label htmlFor="totalPrice">Total Price</label>
                                                <Field name="totalPrice" type="number" className="form-input" disabled />
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="mt-4">
                                    <button type="submit" className="btn btn-primary">
                                        Add Product
                                    </button>
                                </div>
                            </Form>
                        )}
                    </Formik>

                    {/* Current Products Table */}
                    {currentProducts.length > 0 && (
                        <div className="mt-6">
                            <h6 className="font-semibold mb-3">Added Products</h6>
                            <div className="table-responsive">
                                <table className="table-striped table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Quantity</th>
                                            <th>Price</th>
                                            <th>Total</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentProducts.map((item) => (
                                            <tr key={item.id}>
                                                <td>{item.product}</td>
                                                <td>{item.sellingQuantity}</td>
                                                <td>Rs. {item.price.toLocaleString()}</td>
                                                <td>Rs. {item.totalPrice.toLocaleString()}</td>
                                                <td>
                                                    <button type="button" className="btn btn-sm btn-danger" onClick={() => handleRemoveProduct(item.id)}>
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        <tr>
                                            <td colSpan={3} className="text-right font-bold">
                                                Total Bill Amount:
                                            </td>
                                            <td colSpan={2} className="font-bold">
                                                Rs. {totalBillAmount.toLocaleString()}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Customer Details Section */}
                {currentProducts.length > 0 && (
                    <div className="mb-5">
                        <h5 className="font-semibold text-lg dark:text-white-light mb-4">Customer Details</h5>
                        <Formik
                            initialValues={{
                                customerName: '',
                                phoneNumber: '',
                                paymentTypes: [],
                                cashAmount: '',
                                bankAmount: '',
                                bankName: '',
                                checkAmount: '',
                                checkNumber: '',
                                billType: 'perfect',
                            }}
                            validationSchema={customerDetailsSchema}
                            onSubmit={handleCustomerSubmit}
                            enableReinitialize
                            validateOnChange={true}
                            validateOnBlur={true}
                            context={{ totalBillAmount: totalBillAmount }}
                            innerRef={customerFormRef}
                        >
                            {({ errors, touched, values, submitCount }) => (
                                <Form>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <div className={submitCount ? (errors.customerName ? 'has-error' : 'has-success') : ''}>
                                            <label htmlFor="customerName">Customer Name *</label>
                                            <Field name="customerName" type="text" className="form-input" />
                                            {touched.customerName && errors.customerName && <div className="text-danger mt-1">{errors.customerName}</div>}
                                        </div>

                                        <div className={submitCount ? (errors.phoneNumber ? 'has-error' : 'has-success') : ''}>
                                            <label htmlFor="phoneNumber">Phone Number *</label>
                                            <Field name="phoneNumber" type="text" className="form-input" />
                                            {touched.phoneNumber && errors.phoneNumber && <div className="text-danger mt-1">{errors.phoneNumber}</div>}
                                        </div>

                                        {/* Add Bill Type Dropdown */}
                                        <div className={submitCount ? (errors.billType ? 'has-error' : 'has-success') : ''}>
                                            <label htmlFor="billType">Bill Type *</label>
                                            <Field as="select" name="billType" className="form-select">
                                                <option value="perfect">Perfect Bill</option>
                                                <option value="fake">Fake Bill</option>
                                            </Field>
                                            {touched.billType && errors.billType && <div className="text-danger mt-1">{errors.billType}</div>}
                                        </div>

                                        <div className={submitCount ? (errors.paymentTypes ? 'has-error' : 'has-success') : ''}>
                                            <label>Payment Types *</label>
                                            <div className="mt-2">
                                                <label className="inline-flex items-center mr-3">
                                                    <Field type="checkbox" name="paymentTypes" value="cash" className="form-checkbox" />
                                                    <span className="ml-2">Cash</span>
                                                </label>
                                                <label className="inline-flex items-center mr-3">
                                                    <Field type="checkbox" name="paymentTypes" value="bank" className="form-checkbox" />
                                                    <span className="ml-2">Bank</span>
                                                </label>
                                                <label className="inline-flex items-center">
                                                    <Field type="checkbox" name="paymentTypes" value="check" className="form-checkbox" />
                                                    <span className="ml-2">Check</span>
                                                </label>
                                            </div>
                                            {touched.paymentTypes && errors.paymentTypes && <div className="text-danger mt-1">{errors.paymentTypes}</div>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4">
                                        {values.paymentTypes?.includes('cash') && (
                                            <div className={submitCount ? (errors.cashAmount ? 'has-error' : 'has-success') : ''}>
                                                <label htmlFor="cashAmount">Cash Amount *</label>
                                                <Field name="cashAmount" type="text" className="form-input" />
                                                {touched.cashAmount && errors.cashAmount && <div className="text-danger mt-1">{errors.cashAmount}</div>}
                                            </div>
                                        )}

                                        {values.paymentTypes.includes('bank') && (
                                            <>
                                                <div className={submitCount ? (errors.bankName ? 'has-error' : 'has-success') : ''}>
                                                    <label htmlFor="bankName">Bank Name *</label>
                                                    <Field name="bankName" type="text" className="form-input" />
                                                    {touched.bankName && errors.bankName && <div className="text-danger mt-1">{errors.bankName}</div>}
                                                </div>
                                                <div className={submitCount ? (errors.bankAmount ? 'has-error' : 'has-success') : ''}>
                                                    <label htmlFor="bankAmount">Bank Amount *</label>
                                                    <Field name="bankAmount" type="text" className="form-input" />
                                                    {touched.bankAmount && errors.bankAmount && <div className="text-danger mt-1">{errors.bankAmount}</div>}
                                                </div>
                                            </>
                                        )}

                                        {values.paymentTypes.includes('check') && (
                                            <>
                                                <div className={submitCount ? (errors.checkNumber ? 'has-error' : 'has-success') : ''}>
                                                    <label htmlFor="checkNumber">Check Number *</label>
                                                    <Field name="checkNumber" type="text" className="form-input" />
                                                    {touched.checkNumber && errors.checkNumber && <div className="text-danger mt-1">{errors.checkNumber}</div>}
                                                </div>
                                                <div className={submitCount ? (errors.checkAmount ? 'has-error' : 'has-success') : ''}>
                                                    <label htmlFor="checkAmount">Check Amount *</label>
                                                    <Field name="checkAmount" type="text" className="form-input" />
                                                    {touched.checkAmount && errors.checkAmount && <div className="text-danger mt-1">{errors.checkAmount}</div>}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="mt-4">
                                        <button type="submit" className="btn btn-primary">
                                            Save Customer Details
                                        </button>
                                    </div>
                                </Form>
                            )}
                        </Formik>
                    </div>
                )}

                {/* Save Invoice Button */}
                {currentProducts.length > 0 && customerData && (
                    <div className="flex justify-end gap-4 mt-6">
                        <button type="button" className="btn btn-success" onClick={handleSaveInvoice}>
                            Save Invoice
                        </button>
                    </div>
                )}
            </div>

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

            {/* Invoice View Modal */}
            {isViewModalOpen && (
                <div className="absolute inset-0 z-[1050] flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white my-20 dark:bg-navy-700 rounded-lg overflow-y-auto max-h-[90vh]">
                        <div className="flex items-center justify-between p-5 border-b border-[#ebedf2] dark:border-[#1b2e4b]">
                            <h5 className="text-lg font-semibold">Invoice Preview</h5>
                            <button
                                type="button"
                                className="text-white-dark hover:text-dark"
                                onClick={() => {
                                    setIsViewModalOpen(false);
                                    setSelectedInvoice(null);
                                }}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div className="p-5">{selectedInvoice && <InvoiceView invoiceData={selectedInvoice} />}</div>
                    </div>
                </div>
            )}

            {isPaymentModalOpen && selectedInvoiceForPayment && (
                <div className="absolute top-20 inset-0 z-[999]">
                    <div className="flex items-start justify-center min-h-screen px-4">
                        <div className="panel rounded-lg w-full max-w-lg">
                            <div className="flex items-center justify-between p-5 border-b border-[#ebedf2] dark:border-[#1b2e4b]">
                                <h5 className="text-lg font-semibold">Add Payment</h5>
                                <button
                                    type="button"
                                    className="text-white-dark hover:text-dark"
                                    onClick={() => {
                                        setIsPaymentModalOpen(false);
                                        setSelectedInvoiceForPayment(null);
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <circle opacity="0.5" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                                        <path d="M14.5 9.50002L9.5 14.5M9.49998 9.5L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </button>
                            </div>
                            <div className="p-5">
                                <div className="mb-5">
                                    <p className="text-base">
                                        Remaining Amount: <span className="font-semibold text-danger">Rs. {calculateRemainingAmount(selectedInvoiceForPayment).toLocaleString()}</span>
                                    </p>
                                </div>
                                <Formik<PaymentFormValues>
                                    initialValues={{
                                        paymentTypes: [],
                                        cashAmount: '',
                                        bankAmount: '',
                                        bankName: '',
                                        checkAmount: '',
                                        checkNumber: '',
                                    }}
                                    validationSchema={paymentUpdateSchema}
                                    onSubmit={(values) => {
                                        const cashAmount = Number(values.cashAmount || 0);
                                        const bankAmount = Number(values.bankAmount || 0);
                                        const checkAmount = Number(values.checkAmount || 0);
                                        const totalNewPayment = cashAmount + bankAmount + checkAmount;

                                        if (!selectedInvoiceForPayment) return;

                                        const remainingAmount = calculateRemainingAmount(selectedInvoiceForPayment);

                                        if (totalNewPayment > remainingAmount) {
                                            Swal.fire({
                                                icon: 'error',
                                                title: 'Payment Error',
                                                text: `Total payment (${totalNewPayment.toLocaleString()}) cannot exceed remaining amount (${remainingAmount.toLocaleString()})`,
                                            });
                                            return;
                                        }

                                        handlePaymentSubmit(values);
                                    }}
                                >
                                    {({ values, errors, touched, submitCount }) => (
                                        <Form className="space-y-5">
                                            <div className={submitCount ? (errors.paymentTypes ? 'has-error' : 'has-success') : ''}>
                                                <label className="mb-2 block">Payment Types</label>
                                                <div className="flex gap-4">
                                                    <label className="inline-flex">
                                                        <Field type="checkbox" name="paymentTypes" value="cash" className="form-checkbox" />
                                                        <span className="ml-2">Cash</span>
                                                    </label>
                                                    <label className="inline-flex">
                                                        <Field type="checkbox" name="paymentTypes" value="bank" className="form-checkbox" />
                                                        <span className="ml-2">Bank</span>
                                                    </label>
                                                    <label className="inline-flex">
                                                        <Field type="checkbox" name="paymentTypes" value="check" className="form-checkbox" />
                                                        <span className="ml-2">Check</span>
                                                    </label>
                                                </div>
                                                {touched.paymentTypes && errors.paymentTypes && <div className="text-danger mt-1">{errors.paymentTypes}</div>}
                                            </div>

                                            {values.paymentTypes.includes('cash') && (
                                                <div className={submitCount ? (errors.cashAmount ? 'has-error' : 'has-success') : ''}>
                                                    <label>Cash Amount</label>
                                                    <Field name="cashAmount" type="number" className="form-input" />
                                                    {touched.cashAmount && errors.cashAmount && <div className="text-danger mt-1">{errors.cashAmount}</div>}
                                                </div>
                                            )}

                                            {values.paymentTypes.includes('bank') && (
                                                <>
                                                    <div className={submitCount ? (errors.bankAmount ? 'has-error' : 'has-success') : ''}>
                                                        <label>Bank Amount</label>
                                                        <Field name="bankAmount" type="number" className="form-input" />
                                                        {touched.bankAmount && errors.bankAmount && <div className="text-danger mt-1">{errors.bankAmount}</div>}
                                                    </div>
                                                    <div className={submitCount ? (errors.bankName ? 'has-error' : 'has-success') : ''}>
                                                        <label>Bank Name</label>
                                                        <Field name="bankName" type="text" className="form-input" />
                                                        {touched.bankName && errors.bankName && <div className="text-danger mt-1">{errors.bankName}</div>}
                                                    </div>
                                                </>
                                            )}

                                            {values.paymentTypes.includes('check') && (
                                                <>
                                                    <div className={submitCount ? (errors.checkAmount ? 'has-error' : 'has-success') : ''}>
                                                        <label>Check Amount</label>
                                                        <Field name="checkAmount" type="number" className="form-input" />
                                                        {touched.checkAmount && errors.checkAmount && <div className="text-danger mt-1">{errors.checkAmount}</div>}
                                                    </div>
                                                    <div className={submitCount ? (errors.checkNumber ? 'has-error' : 'has-success') : ''}>
                                                        <label>Check Number</label>
                                                        <Field name="checkNumber" type="text" className="form-input" />
                                                        {touched.checkNumber && errors.checkNumber && <div className="text-danger mt-1">{errors.checkNumber}</div>}
                                                    </div>
                                                </>
                                            )}

                                            <button type="submit" className="btn btn-primary !mt-6">
                                                Update Payment
                                            </button>
                                        </Form>
                                    )}
                                </Formik>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Invoice;
