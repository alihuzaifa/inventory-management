interface LedgerItem {
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
    products: LedgerItem[];
    totalAmount: number;
    paidAmount: number;
}

interface Payment {
    date: string;
    amount: number;
    paymentType: string;
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

const Ledger = ({ ledgerData }: LedgerProps) => {
    const columns = [
        { key: 'id', label: 'S.NO' },
        { key: 'date', label: 'DATE' },
        { key: 'description', label: 'DESCRIPTION' },
        { key: 'debit', label: 'DEBIT' },
        { key: 'credit', label: 'CREDIT' },
        { key: 'balance', label: 'BALANCE' },
    ];

    const calculateRunningBalance = () => {
        let balance = 0;
        return ledgerData.transactions.map((transaction) => {
            balance += transaction.totalAmount - transaction.paidAmount;
            return balance;
        });
    };

    const getTotalBalance = () => {
        const totalBilled = ledgerData.transactions.reduce((sum, t) => sum + t.totalAmount, 0);
        const totalPaid = ledgerData.transactions.reduce((sum, t) => sum + t.paidAmount, 0);
        return totalBilled - totalPaid;
    };

    const formatTransactionRow = (transaction: Transaction, index: number) => {
        if (transaction.products.length > 0) {
            // This is a purchase transaction
            return {
                sno: index + 1,
                date: new Date(transaction.date).toLocaleDateString(),
                description: transaction.products.map((p) => `${p.product} (${p.sellingQuantity} × Rs.${p.price})`).join(', '),
                debit: transaction.totalAmount,
                credit: 0,
                balance: calculateRunningBalance()[index],
            };
        } else {
            // This is a payment transaction
            return {
                sno: index + 1,
                date: new Date(transaction.date).toLocaleDateString(),
                description: 'Payment Received',
                debit: 0,
                credit: transaction.paidAmount,
                balance: calculateRunningBalance()[index],
            };
        }
    };

    return (
        <div className="panel p-6">
            {/* Shop Header */}
            <div className="text-2xl font-bold uppercase text-center">{SoftwareDetail.shopName}</div>
            <div className="mt-2 text-end">
                <span className="font-semibold">{SoftwareDetail.softwareName}: </span>
                {SoftwareDetail.number1} | {SoftwareDetail.number2}
                <br />
                <span className="font-semibold">Azeem Badshah:</span>
                {SoftwareDetail.number3} | {SoftwareDetail.number4}
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

                        <div className="text-gray-600 dark:text-gray-400">Total Balance:</div>
                        <div className="font-semibold text-red-500">Rs. {getTotalBalance().toLocaleString()}</div>
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
                        {ledgerData.transactions.map((transaction, index) => {
                            const row = formatTransactionRow(transaction, index);
                            return (
                                <tr key={transaction.id}>
                                    <td className="border-b border-[#e0e6ed] dark:border-[#1b2e4b] p-3">{row.sno}</td>
                                    <td className="border-b border-[#e0e6ed] dark:border-[#1b2e4b] p-3">{row.date}</td>
                                    <td className="border-b border-[#e0e6ed] dark:border-[#1b2e4b] p-3">{row.description}</td>
                                    <td className="border-b border-[#e0e6ed] dark:border-[#1b2e4b] p-3 text-right">{row.debit > 0 ? `Rs. ${row.debit.toLocaleString()}` : '-'}</td>
                                    <td className="border-b border-[#e0e6ed] dark:border-[#1b2e4b] p-3 text-right">{row.credit > 0 ? `Rs. ${row.credit.toLocaleString()}` : '-'}</td>
                                    <td className="border-b border-[#e0e6ed] dark:border-[#1b2e4b] p-3 text-right">Rs. {row.balance.toLocaleString()}</td>
                                </tr>
                            );
                        })}
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
