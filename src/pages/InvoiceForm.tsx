import { lazy, useEffect, useState, useRef } from 'react';
import { FormikProps } from 'formik';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../store/themeConfigSlice';
import { DataTableSortStatus } from 'mantine-datatable';
import InventoryManagement from '../services/api';

// ✅ Lazy load components
const Product = lazy(() => import('../components/Product'));
const InvoiceTable = lazy(() => import('../components/InvoiceTable'));
const PaymentModal = lazy(() => import('../components/paymentModal'));
const InvoiceView = lazy(() => import('./Invoice'));

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
    invoiceNumber: string;
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

const Invoice = () => {
    const dispatch = useDispatch();
    const [initialRecords, setInitialRecords] = useState<InvoiceRecord[]>([]);
    const [recordsData, setRecordsData] = useState<InvoiceRecord[]>([]);
    const [currentProducts, setCurrentProducts] = useState<ProductItem[]>([]);
    const [customerData, setCustomerData] = useState<CustomerDetails | null>(null);
    const [totalBillAmount, setTotalBillAmount] = useState(0);
    const customerFormRef = useRef<FormikProps<any>>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [search] = useState('');
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

    const fetchStocksForDropdown = async () => {
        try {
            const response = await InventoryManagement.getProductStockForDropdown();
            setProducts(response);
        } catch (error) {
            console.error('Error fetching product stocks:', error);
        }
    };

    const fetchAllInvoices = async () => {
        try {
            const allInvoices = await InventoryManagement.GetAllInvoices();
            if (allInvoices.invoices.length > 0) {
                setInitialRecords(allInvoices.invoices);
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
        }
    };

    // Optional combined fetch if needed
    const fetchInitialData = async () => {
        await Promise.all([fetchStocksForDropdown(), fetchAllInvoices()]);
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        let filteredData = [...initialRecords];

        if (filterStates.search) {
            const searchTerm = filterStates.search.toLowerCase();
            filteredData = filteredData.filter((item) => {
                return (
                    item.customerName.toLowerCase().includes(searchTerm) ||
                    item.phoneNumber.includes(searchTerm) ||
                    item.paymentTypes.some(type => type.toLowerCase().includes(searchTerm)) ||
                    item.totalBillAmount.toString().includes(searchTerm) ||
                    new Date(item.saleDate).toLocaleDateString().includes(searchTerm) ||
                    item.billType.toLowerCase().includes(searchTerm)
                );
            });
        }

        if (filterStates.dateRange.from && filterStates.dateRange.to) {
            const fromDate = new Date(filterStates.dateRange.from);
            const toDate = new Date(filterStates.dateRange.to);
            toDate.setHours(23, 59, 59); 

            filteredData = filteredData.filter((item) => {
                const itemDate = new Date(item.saleDate);
                return itemDate >= fromDate && itemDate <= toDate;
            });
        }

        // Payment method filter
        if (filterStates.selectedPaymentMethod !== 'all') {
            filteredData = filteredData.filter((item) =>
                item.paymentTypes.includes(filterStates.selectedPaymentMethod)
            );
        }

        // Bill type filter
        if (filterStates.selectedBillType !== 'all') {
            filteredData = filteredData.filter((item) =>
                item.billType === filterStates.selectedBillType
            );
        }

        setRecordsData(filteredData);
    }, [filterStates, initialRecords]);

    const handleCustomerSubmit = (values: any) => {
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

    const updateProductQuantity = (id: string, quantityToReduce: number) => {
        setProducts((prevProducts) => {
            return prevProducts
                .map((product) => ({
                    ...product,
                    quantities: product.quantities.map((q: any) => (q._id === id ? { ...q, quantity: q.quantity - quantityToReduce } : q)).filter((q: any) => q.quantity > 0),
                }))
                .filter((product) => product.quantities.length > 0);
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
        updateProductQuantity(values.availableQuantityId, Number(values.sellingQuantity));

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

    const createInvoicePayload = () => {
        // Base invoice object with common fields
        const baseInvoice = {
            customerName: customerData?.customerName,
            phoneNumber: customerData?.phoneNumber,
            products: currentProducts.map((product) => ({
                product: product.availableQuantityId,
                availableQuantity: product.availableQuantity,
                sellingQuantity: product.sellingQuantity,
                price: product.price,
                totalPrice: product.totalPrice,
            })),
            paymentTypes: customerData?.paymentTypes || [],
            totalBillAmount: totalBillAmount,
            billType: (customerData?.billType as 'perfect' | 'fake') || 'perfect',
            saleDate: new Date().toISOString(),
        };

        // Payment specific fields
        const paymentFields: any = {};

        // Add cash payment if exists
        if (customerData?.paymentTypes?.includes('cash') && customerData?.cashAmount) {
            paymentFields.cashAmount = Number(customerData.cashAmount);
        }

        // Add bank payment if exists
        if (customerData?.paymentTypes?.includes('bank')) {
            paymentFields.bankAmount = Number(customerData.bankAmount);
            if (customerData?.bankName) {
                paymentFields.bankName = customerData.bankName;
            }
        }

        // Add check payment if exists
        if (customerData?.paymentTypes?.includes('check')) {
            paymentFields.checkAmount = Number(customerData.checkAmount);
            if (customerData?.checkNumber) {
                paymentFields.checkNumber = customerData.checkNumber;
            }
        }

        // Combine base invoice with payment fields
        const newInvoice = {
            ...baseInvoice,
            ...paymentFields,
        };

        return newInvoice;
    };

    const handleSaveInvoice = async () => {
        try {
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

            const newInvoice = createInvoicePayload();
            const createInvoice = await InventoryManagement.CreateInvoice(newInvoice);
            await fetchStocksForDropdown();
            setInitialRecords((prev) => [...prev, createInvoice]);
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
        } catch (error) {
            console.error('Error saving invoice:', error);

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to save the invoice. Please try again.',
            });
        }
    };

    const handleViewInvoice = (invoice: InvoiceRecord) => {
        setSelectedInvoice(invoice);
        setIsViewModalOpen(true);
    };

    const handleDeleteInvoice = async (invoiceId: string) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, cancel!',
            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        try {
            setIsDeleting(true);

            await InventoryManagement.DeleteInvoice(invoiceId);

            // Refresh stock dropdown after deletion
            await fetchStocksForDropdown();

            // Update state to remove the deleted invoice
            setInitialRecords((prev) => prev.filter((record) => record._id !== invoiceId));
            setRecordsData((prev) => prev.filter((record) => record._id !== invoiceId));

            await Swal.fire({
                title: 'Deleted!',
                text: 'Invoice has been deleted successfully.',
                icon: 'success',
            });
        } catch (error) {
            console.error('Delete Invoice Error:', error);

            Swal.fire({
                title: 'Error!',
                text: 'Failed to delete the invoice. Please try again.',
                icon: 'error',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const calculateRemainingAmount = (invoice: InvoiceRecord): number => {
        const totalPaid = invoice.cashAmount + invoice.bankAmount + invoice.checkAmount;
        return invoice.totalBillAmount - totalPaid;
    };

    const handleAddPayment = (invoice: InvoiceRecord) => {
        setSelectedInvoiceForPayment(invoice);
        setIsPaymentModalOpen(true);
    };

    const handlePaymentSubmit = async (values: PaymentFormValues) => {
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

        try {
            const response = await InventoryManagement.UpdateInvoicePayment(
                selectedInvoiceForPayment._id,
                {
                    paymentTypes: values.paymentTypes,
                    cashAmount,
                    bankAmount,
                    bankName: values.bankName,
                    checkAmount,
                    checkNumber: values.checkNumber,
                }
            );

            if (response) {
                // Update initialRecords with the new invoice data
                setInitialRecords(prevRecords =>
                    prevRecords.map(record =>
                        record._id === response._id ? response : record
                    )
                );

                // Update recordsData with the new invoice data
                setRecordsData(prevRecords =>
                    prevRecords.map(record =>
                        record._id === response._id ? response : record
                    )
                );

                setIsPaymentModalOpen(false);
                setSelectedInvoiceForPayment(null);
                Swal.fire('Success', 'Payment updated successfully', 'success');
            }
        } catch (error: any) {
            console.error('Error updating payment:', error);
            Swal.fire('Error', error.response?.data?.message || 'Failed to update payment', 'error');
        }
    };

    return (
        <>
            <Product
                handleSaveInvoice={handleSaveInvoice}
                currentProducts={currentProducts}
                customerData={customerData}
                handleCustomerSubmit={handleCustomerSubmit}
                customerFormRef={customerFormRef}
                totalBillAmount={totalBillAmount}
                handleAddProduct={handleAddProduct}
                products={products}
                handleRemoveProduct={handleRemoveProduct}
            />
            {/* Previous Invoices Table */}
            <InvoiceTable
                filterStates={filterStates}
                setFilterStates={setFilterStates}
                recordsData={recordsData}
                calculateRemainingAmount={calculateRemainingAmount}
                page={page}
                setPage={setPage}
                pageSize={pageSize}
                setPageSize={setPageSize}
                sortStatus={sortStatus}
                setSortStatus={setSortStatus}
                handleViewInvoice={handleViewInvoice}
                handleAddPayment={handleAddPayment}
                handleDeleteInvoice={handleDeleteInvoice}
                PAGE_SIZES={PAGE_SIZES}
                isDeleting={isDeleting}
            />

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
                <PaymentModal
                    setIsPaymentModalOpen={setIsPaymentModalOpen}
                    setSelectedInvoiceForPayment={setSelectedInvoiceForPayment}
                    selectedInvoiceForPayment={selectedInvoiceForPayment}
                    calculateRemainingAmount={calculateRemainingAmount}
                    handlePaymentSubmit={handlePaymentSubmit}
                />
            )}
        </>
    );
};

export default Invoice;
