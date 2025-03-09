import { Document, Page, View, Text, StyleSheet, Font } from '@react-pdf/renderer';

// Use the same interfaces as Ledger.tsx
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

interface LedgerPDFProps {
    ledgerData: LedgerRecord;
    themeConfig: any;
}

Font.register({
    family: 'Nunito',
    fonts: [
        { src: '/fonts/Nunito-Regular.ttf' },
        { src: '/fonts/Nunito-SemiBold.ttf', fontWeight: 600 },
        { src: '/fonts/Nunito-Bold.ttf', fontWeight: 700 },
        { src: '/fonts/Nunito-ExtraBold.ttf', fontWeight: 800 },
    ],
});

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Nunito',
        backgroundColor: '#ffffff',
        paddingHorizontal: 10,
        paddingVertical: 30,
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        textAlign: 'center',
        fontWeight: 800,
        color: '#000000',
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    contactInfo: {
        textAlign: 'right',
        fontSize: 10,
        color: '#888EA8',
        marginBottom: 5,
    },
    contactLabel: {
        fontWeight: 600,
    },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: '#e0e6ed',
        marginVertical: 15,
    },
    infoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    infoSection: {
        width: '48%',
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 8,
        gap: 16,
    },
    label: {
        fontSize: 10,
        color: '#888EA8',
    },
    value: {
        fontSize: 10,
        color: '#000000',
        fontWeight: 600,
    },
    table: {
        marginTop: 24,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e6ed',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e6ed',
        padding: 12,
    },
    tableRowEven: {
        backgroundColor: '#f8f9fa',
    },
    column: {
        fontSize: 9,
        color: '#000000',
    },
    columnHeader: {
        fontSize: 9,
        color: '#000000',
        fontWeight: 600,
    },
    columnSNo: { width: '4%' },
    columnDate: { width: '8%' },
    columnDescription: { width: '15%' },
    columnQty: { width: '6%', textAlign: 'center' },
    columnPrice: { width: '8%', textAlign: 'right' },
    columnAmount: { width: '10%', textAlign: 'right' },
    columnDebit: { width: '10%', textAlign: 'right' },
    columnCredit: { width: '10%', textAlign: 'right' },
    columnPaymentType: {
        width: '19%',
        paddingLeft: 6,
    },
    columnBalance: { width: '10%', textAlign: 'right' },
    creditPaymentSeparator: {
        borderRightWidth: 1,
        borderRightColor: '#e0e6ed',
        marginHorizontal: 4,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
    },
    footerText: {
        fontSize: 10,
        textAlign: 'center',
        color: '#888EA8',
        marginBottom: 4,
    },
});

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

const LedgerPDF = ({ ledgerData }: LedgerPDFProps) => {
    const calculateRunningBalance = () => {
        let balance = 0;
        const rows: Array<{ type: string; balance: number }> = [];

        ledgerData.transactions.forEach((transaction) => {
            if (transaction.products.length > 0) {
                transaction.products.forEach((product) => {
                    balance += product.totalPrice;
                    rows.push({
                        type: 'product',
                        balance: balance,
                    });
                });
            }
            if (transaction.paidAmount > 0) {
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

        ledgerData.transactions.forEach((transaction) => {
            if (transaction.products.length > 0) {
                transaction.products.forEach((product) => {
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

            if (transaction.paidAmount > 0) {
                const payment = ledgerData.paymentHistory.find((p) => p.date === transaction.date);
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
                    amount: transaction.paidAmount,
                    debit: '-',
                    credit: transaction.paidAmount,
                    paymentType: paymentDetails,
                    balance: balances[balanceIndex++].balance,
                });
            }
        });

        return rows;
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.title}>{SoftwareDetail.shopName}</Text>
                    <Text style={styles.contactInfo}>
                        <Text style={styles.contactLabel}>{SoftwareDetail.softwareName}: </Text>
                        {SoftwareDetail.number1} | {SoftwareDetail.number2}
                    </Text>
                    <Text style={styles.contactInfo}>
                        <Text style={styles.contactLabel}>Azeem Badshah: </Text>
                        {SoftwareDetail.number3} | {SoftwareDetail.number4}
                    </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoContainer}>
                    <View style={styles.infoSection}>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Name:</Text>
                            <Text style={styles.value}>{ledgerData.customerName}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Phone Number:</Text>
                            <Text style={styles.value}>{ledgerData.phoneNumber}</Text>
                        </View>
                    </View>
                    <View style={styles.infoSection}>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Khata Number:</Text>
                            <Text style={styles.value}>#{ledgerData.id}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.columnHeader, styles.columnSNo]}>S.NO</Text>
                        <Text style={[styles.columnHeader, styles.columnDate]}>DATE</Text>
                        <Text style={[styles.columnHeader, styles.columnDescription]}>DESCRIPTION</Text>
                        <Text style={[styles.columnHeader, styles.columnQty]}>QTY</Text>
                        <Text style={[styles.columnHeader, styles.columnPrice]}>PRICE</Text>
                        <Text style={[styles.columnHeader, styles.columnAmount]}>AMOUNT</Text>
                        <Text style={[styles.columnHeader, styles.columnDebit]}>DEBIT</Text>
                        <Text style={[styles.columnHeader, styles.columnCredit]}>CREDIT</Text>
                        <View style={styles.creditPaymentSeparator} />
                        <Text style={[styles.columnHeader, styles.columnPaymentType]}>PAYMENT TYPE</Text>
                        <Text style={[styles.columnHeader, styles.columnBalance]}>BALANCE</Text>
                    </View>

                    {formatLedgerRows().map((row, index) => (
                        <View key={index} style={[styles.tableRow]}>
                            <Text style={[styles.column, styles.columnSNo]}>{row.sno}</Text>
                            <Text style={[styles.column, styles.columnDate]}>{row.date}</Text>
                            <Text style={[styles.column, styles.columnDescription]}>{row.description}</Text>
                            <Text style={[styles.column, styles.columnQty]}>{row.quantity}</Text>
                            <Text style={[styles.column, styles.columnPrice]}>{row.price !== '-' ? `Rs. ${row.price.toLocaleString()}` : '-'}</Text>
                            <Text style={[styles.column, styles.columnAmount]}>{row.amount !== '-' ? `Rs. ${row.amount.toLocaleString()}` : '-'}</Text>
                            <Text style={[styles.column, styles.columnDebit]}>{row.debit !== '-' ? `Rs. ${row.debit.toLocaleString()}` : '-'}</Text>
                            <Text style={[styles.column, styles.columnCredit]}>{row.credit !== '-' ? `Rs. ${row.credit.toLocaleString()}` : '-'}</Text>
                            <View style={styles.creditPaymentSeparator} />
                            <Text style={[styles.column, styles.columnPaymentType]}>{row.paymentType}</Text>
                            <Text style={[styles.column, styles.columnBalance]}>Rs. {row.balance.toLocaleString()}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>{SoftwareDetail.shopAddress}</Text>
                    <Text style={styles.footerText}>{SoftwareDetail.shopDescription}</Text>
                </View>
            </Page>
        </Document>
    );
};

export default LedgerPDF;
