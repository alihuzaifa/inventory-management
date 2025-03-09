// Interfaces for Ledger Props
interface Product {
    id: number;
    product: string;
    availableQuantity: number;
    sellingQuantity: number;
    price: number;
    totalPrice: number;
}

interface Transaction {
    id: number;
    date: string;
    products: Product[];
    totalAmount: number;
    paidAmount: number;
}

interface Payment {
    date: string;
    amount: number;
    paymentType: 'cash' | 'bank' | 'check';
    bankName?: string;
    checkNumber?: string;
}

interface LedgerRecord {
    id: number;
    customerName: string;
    phoneNumber: string;
    transactions: Transaction[];
    paymentHistory: Payment[];
}

interface LedgerProps {
    ledgerData: LedgerRecord;
}

const Ledger = ({ ledgerData }: LedgerProps) => {
    const columns = [
        { key: 'sno', label: 'S.NO' },
        { key: 'date', label: 'DATE' },
        { key: 'description', label: 'DESCRIPTION' },
        { key: 'quantity', label: 'QTY' },
        { key: 'price', label: 'PRICE' },
        { key: 'amount', label: 'AMOUNT' },
        { key: 'debit', label: 'DEBIT' },
        { key: 'credit', label: 'CREDIT' },
        { key: 'paymentType', label: 'PAYMENT TYPE' },
        { key: 'balance', label: 'BALANCE' },
    ];

    const calculateRunningBalance = () => {
        let balance = 0;
        const rows: Array<{ type: string; balance: number }> = [];

        ledgerData.transactions.forEach((transaction: { products: Array<{ totalPrice: number }>; paidAmount: number }) => {
            if (transaction.products.length > 0) {
                // Purchase entries
                transaction.products.forEach((product: { totalPrice: number }) => {
                    balance += product.totalPrice;
                    rows.push({
                        type: 'product',
                        balance: balance,
                    });
                });
            }
            if (transaction.paidAmount > 0) {
                // Payment entry
                balance -= transaction.paidAmount;
                rows.push({
                    type: 'payment',
                    balance: balance,
                });
            }
        });

        return rows;
    };

    const formatLedgerRows = () => {
        let sno = 1;
        const rows: any[] = [];
        const balances = calculateRunningBalance();
        let balanceIndex = 0;

        ledgerData.transactions.forEach((transaction: { products: Array<{ product: string; sellingQuantity: number; price: number; totalPrice: number }>; date: string }) => {
            if (transaction.products.length > 0) {
                // Add product entries
                transaction.products.forEach((product: { product: string; sellingQuantity: number; price: number; totalPrice: number }) => {
                    rows.push({
                        sno: sno++,
                        date: new Date(transaction.date).toLocaleDateString(),
                        description: product.product,
                        quantity: product.sellingQuantity,
                        price: product.price,
                        amount: product.totalPrice,
                        debit: product.totalPrice,
                        credit: '-',
                        paymentType: '-',
                        balance: balances[balanceIndex++].balance,
                    });
                });
            }

            if ((transaction as any).paidAmount > 0) {
                // Find corresponding payment details
                const payment = ledgerData.paymentHistory.find((p: { date: string }) => p.date === transaction.date);
                let paymentDetails = '';

                if (payment) {
                    switch (payment.paymentType) {
                        case 'cash':
                            paymentDetails = 'Cash Payment';
                            break;
                        case 'bank':
                            paymentDetails = `Bank: ${payment.bankName}`;
                            break;
                        case 'check':
                            paymentDetails = `Check #${payment.checkNumber}`;
                            break;
                    }
                }

                rows.push({
                    sno: sno++,
                    date: new Date(transaction.date).toLocaleDateString(),
                    description: 'Payment Received',
                    quantity: '-',
                    price: '-',
                    amount: transaction.products.reduce((sum, product) => sum + product.totalPrice, 0),
                    debit: '-',
                    credit: transaction.products.reduce((sum, product) => sum + product.totalPrice, 0),
                    paymentType: paymentDetails,
                    balance: balances[balanceIndex++].balance,
                });
            }
        });

        return rows;
    };

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

    return (
        <div className="panel p-6">
            {/* Shop Header */}
            <div className="text-2xl font-bold uppercase text-center">{SoftwareDetail.shopName}</div>
            <div className="text-white-dark mt-2 text-end">
                <span className="font-semibold">{SoftwareDetail.softwareName}: </span> {SoftwareDetail.number1} | {SoftwareDetail.number2}
                <br /> <span className="font-semibold">Azeem Badshah:</span> {SoftwareDetail.number3} | {SoftwareDetail.number4}
            </div>
            <hr className="border-white-light dark:border-[#1b2e4b] my-6" />

            {/* Customer Info */}
            <div className="flex justify-between lg:flex-row flex-col gap-6">
                <div className="lg:w-1/2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-gray-600 dark:text-gray-400">Name:</div>
                        <div className="font-semibold">{ledgerData.customerName}</div>
                        <div className="text-gray-600 dark:text-gray-400">Phone Number:</div>
                        <div className="font-semibold">{ledgerData.phoneNumber}</div>
                    </div>
                </div>
                <div className="lg:w-1/2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-gray-600 dark:text-gray-400">Khata Number:</div>
                        <div className="font-semibold">#{ledgerData.id}</div>
                    </div>
                </div>
            </div>

            {/* Ledger Table */}
            <div className="table-responsive mt-6">
                <table className="table-striped w-full">
                    <thead>
                        <tr>
                            {columns.map((column) => (
                                <th key={column.key} className="border-b border-[#e0e6ed] dark:border-[#1b2e4b] p-3 text-left">
                                    {column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {formatLedgerRows().map((row, index) => (
                            <tr key={index}>
                                <td className="border-b border-[#e0e6ed] dark:border-[#1b2e4b] p-3">{row.sno}</td>
                                <td className="border-b border-[#e0e6ed] dark:border-[#1b2e4b] p-3">{row.date}</td>
                                <td className="border-b border-[#e0e6ed] dark:border-[#1b2e4b] p-3">{row.description}</td>
                                <td className="border-b border-[#e0e6ed] dark:border-[#1b2e4b] p-3">{row.quantity}</td>
                                <td className="border-b border-[#e0e6ed] dark:border-[#1b2e4b] p-3">{row.price !== '-' ? `Rs. ${row.price.toLocaleString()}` : '-'}</td>
                                <td className="border-b border-[#e0e6ed] dark:border-[#1b2e4b] p-3">{row.amount !== '-' ? `Rs. ${row.amount.toLocaleString()}` : '-'}</td>
                                <td className="border-b border-[#e0e6ed] dark:border-[#1b2e4b] p-3">{row.debit !== '-' ? `Rs. ${row.debit.toLocaleString()}` : '-'}</td>
                                <td className="border-b border-[#e0e6ed] dark:border-[#1b2e4b] p-3">{row.credit !== '-' ? `Rs. ${row.credit.toLocaleString()}` : '-'}</td>
                                <td className="border-b border-[#e0e6ed] dark:border-[#1b2e4b] p-3">{row.paymentType}</td>
                                <td className="border-b border-[#e0e6ed] dark:border-[#1b2e4b] p-3 text-right">Rs. {row.balance.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Shop Footer */}
            <div className="mt-10">
                <div className="text-white-dark text-center my-1">{SoftwareDetail.shopAddress}</div>
                <div className="text-white-dark text-center my-1">{SoftwareDetail.shopDescription}</div>
            </div>
        </div>
    );
};

export default Ledger;
