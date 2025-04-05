interface ProductItem {
    id: number;
    product: string;
    availableQuantity: number;
    sellingQuantity: number;
    price: number;
    totalPrice: number;
}

interface InvoiceRecord {
    _id: string;
    invoiceNumber: string;
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
}

interface InvoiceProps {
    invoiceData: InvoiceRecord;
}

const Invoice = ({ invoiceData }: InvoiceProps) => {
    const columns = [
        { key: 'id', label: 'S.NO' },
        { key: 'title', label: 'ITEMS' },
        { key: 'quantity', label: 'QTY' },
        { key: 'price', label: 'PRICE', class: 'ltr:text-right rtl:text-left' },
        { key: 'amount', label: 'AMOUNT', class: 'ltr:text-right rtl:text-left' },
    ];

    const SoftwareDetail = {
        number1: '03212727660',
        number2: '03122727660',
        number3: '03054747660',
        number4: '03125555336',
        softwareName: 'Hamza',
        shopName: 'AL NOOR CABLE MERCHANT',
        shopAddress: 'Shop # 8, Subhan Allah Market, Near MashaAllah Godown, Dargah Road, Kabari Bazar, Shershah Karachi.',
        shopDescription: 'Power Cable, Electric Cable, Welding Cable, Internet Cable, Heat-Proof Cable & Water-Proof Cable',
    };

    const calculatePaymentStatus = (invoice: InvoiceRecord) => {
        const totalPaid = Number(invoice.cashAmount || 0) + Number(invoice.bankAmount || 0) + Number(invoice.checkAmount || 0);

        if (totalPaid >= invoice.totalBillAmount) {
            return <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Fully Paid</span>;
        } else if (totalPaid > 0) {
            return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Partially Paid</span>;
        } else {
            return <span className="px-2 py-1 bg-red-100 text-red-800 rounded">Unpaid</span>;
        }
    };

    const getTotalPaidAmount = (invoice: InvoiceRecord) => {
        return Number(invoice.cashAmount || 0) + Number(invoice.bankAmount || 0) + Number(invoice.checkAmount || 0);
    };

    const getRemainingAmount = (invoice: InvoiceRecord) => {
        const totalPaid = getTotalPaidAmount(invoice);
        return invoice.totalBillAmount - totalPaid;
    };

    return (
        <div className="panel p-6">
            <div className="text-2xl font-bold uppercase text-center">{SoftwareDetail.shopName}</div>

            <div className="text-white-dark mt-2 text-end">
                <span className="font-semibold">{SoftwareDetail.softwareName}: </span> {SoftwareDetail.number1} | {SoftwareDetail.number2}
                <br /> <span className="font-semibold">Azeem Badshah:</span> {SoftwareDetail.number3} | {SoftwareDetail.number4}
            </div>

            <hr className="border-white-light dark:border-[#1b2e4b] my-6" />
            <div className="flex justify-between lg:flex-row flex-col gap-6">
                <div className="lg:w-1/2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-gray-600 dark:text-gray-400">Name:</div>
                        <div className="font-semibold">{invoiceData.customerName}</div>

                        <div className="text-gray-600 dark:text-gray-400">Phone Number:</div>
                        <div className="font-semibold">{invoiceData.phoneNumber}</div>

                        <div className="text-gray-600 dark:text-gray-400">Date:</div>
                        <div className="font-semibold">{new Date(invoiceData.saleDate).toLocaleDateString()}</div>
                    </div>
                </div>
                <div className="lg:w-1/2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-gray-600 dark:text-gray-400">Invoice Number:</div>
                        <div className="font-semibold">{invoiceData.invoiceNumber}</div>

                        <div className="text-gray-600 dark:text-gray-400">Payment Status:</div>
                        <div className="font-semibold">{calculatePaymentStatus(invoiceData)}</div>

                        <div className="text-gray-600 dark:text-gray-400">Payment Method:</div>
                        <div className="font-semibold">{invoiceData.paymentTypes.join(', ')}</div>
                    </div>
                </div>
            </div>

            <div className="table-responsive mt-6">
                <table className="table-striped">
                    <thead>
                        <tr>
                            {columns.map((column) => (
                                <th key={column.key} className={column.class}>
                                    {column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {invoiceData.products.map((item, index) => (
                            <tr key={item.id}>
                                <td>{index + 1}</td>
                                <td>{item.product}</td>
                                <td>{item.sellingQuantity}</td>
                                <td className="ltr:text-right rtl:text-left">Rs. {item.price.toLocaleString()}</td>
                                <td className="ltr:text-right rtl:text-left">Rs. {item.totalPrice.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="grid sm:grid-cols-2 grid-cols-1 px-4 mt-6">
                {/* Payment Details Section */}
                <div className="ltr:text-left rtl:text-right space-y-2">
                    <div className="text-gray-600 dark:text-gray-400 font-semibold mb-2">Payment Details:</div>
                    {invoiceData.paymentTypes.includes('cash') && (
                        <div className="flex items-center">
                            <div className="flex-1">Cash Amount:</div>
                            <div className="w-[37%]">Rs. {Number(invoiceData.cashAmount).toLocaleString()}</div>
                        </div>
                    )}
                    {invoiceData.paymentTypes.includes('bank') && (
                        <>
                            <div className="flex items-center">
                                <div className="flex-1">Bank Name:</div>
                                <div className="w-[37%]">{invoiceData.bankName}</div>
                            </div>
                            <div className="flex items-center">
                                <div className="flex-1">Bank Amount:</div>
                                <div className="w-[37%]">Rs. {Number(invoiceData.bankAmount).toLocaleString()}</div>
                            </div>
                        </>
                    )}
                    {invoiceData.paymentTypes.includes('check') && (
                        <>
                            <div className="flex items-center">
                                <div className="flex-1">Check Number:</div>
                                <div className="w-[37%]">{invoiceData.checkNumber}</div>
                            </div>
                            <div className="flex items-center">
                                <div className="flex-1">Check Amount:</div>
                                <div className="w-[37%]">Rs. {Number(invoiceData.checkAmount).toLocaleString()}</div>
                            </div>
                        </>
                    )}
                    <div className="flex items-center font-semibold">
                        <div className="flex-1">Total Paid Amount:</div>
                        <div className="w-[37%]">Rs. {getTotalPaidAmount(invoiceData).toLocaleString()}</div>
                    </div>
                </div>

                {/* Bill Summary Section */}
                <div className="ltr:text-right rtl:text-left space-y-2">
                    <div className="flex items-center">
                        <div className="flex-1">Subtotal</div>
                        <div className="w-[37%]">Rs. {invoiceData.totalBillAmount.toLocaleString()}</div>
                    </div>
                    <div className="flex items-center font-semibold text-lg">
                        <div className="flex-1">Grand Total</div>
                        <div className="w-[37%]">Rs. {invoiceData.totalBillAmount.toLocaleString()}</div>
                    </div>
                    {getRemainingAmount(invoiceData) > 0 && (
                        <div className="flex items-center text-red-500 font-semibold">
                            <div className="flex-1">Remaining Amount</div>
                            <div className="w-[37%]">Rs. {getRemainingAmount(invoiceData).toLocaleString()}</div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-10">
                <div className="text-white-dark text-center my-1">{SoftwareDetail.shopAddress}</div>
                <div className="text-white-dark text-center my-1">{SoftwareDetail.shopDescription}</div>
            </div>
        </div>
    );
};

export default Invoice;
