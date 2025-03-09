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
    page: { fontFamily: 'Nunito', backgroundColor: '#ffffff', paddingVertical: 30 },
    darkPage: { backgroundColor: '#1B2E4B', color: '#888EA8' },
    lightPage: { backgroundColor: '#FFFFFF', color: '#000000' },
    header: { marginBottom: 20, paddingHorizontal: 30 },
    title: { fontSize: 24, textAlign: 'center', fontWeight: 800, color: '#000000', marginBottom: 10, textTransform: 'uppercase' },
    titleDark: { color: '#888EA8' },
    titleLight: { color: '#000000' },
    contactInfo: { marginTop: 8, textAlign: 'right', fontSize: 10 },
    contactInfoDark: { color: '#888EA8' },
    contactInfoLight: { color: '#4B5563' },
    contactName: { fontWeight: 600 },
    contactLabel: {
        fontWeight: 600,
    },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: '#e0e6ed',
        marginVertical: 15,
        paddingHorizontal: 30,
    },
    infoContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 30 },
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
    labelDark: {
        color: '#888EA8',
    },
    labelLight: {
        color: '#4B5563',
    },
    value: {
        fontSize: 10,
        color: '#000000',
        fontWeight: 600,
    },
    table: {
        marginTop: 24,
    },
    tableHeader: { flexDirection: 'row', padding: '12 16' },
    tableHeaderDark: { backgroundColor: '#1A2941' },
    tableHeaderLight: { backgroundColor: '#F6F8FA' },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, padding: '12 16' },
    tableRowDark: { borderBottomColor: '#191E3A' },
    tableRowLight: { borderBottomColor: '#E0E6ED' },
    tableRowStriped: { backgroundColor: 'rgba(26, 41, 65, 0.4)' },
    tableRowStripedLight: { backgroundColor: 'rgba(246, 248, 250, 0.5)' },
    column: {
        fontSize: 9,
        color: '#000000',
    },
    columnHeader: {
        fontSize: 9,
        color: '#000000',
        fontWeight: 600,
    },
    valueDark: { color: '#888EA8' },
    valueLight: { color: '#000000' },
    columnDate: { width: '10%' },
    columnDescription: { width: '23%' }, // Increased width for description
    columnQty: { width: '6%', textAlign: 'center' },
    columnPrice: { width: '8%', textAlign: 'right' },
    columnAmount: { width: '10%', textAlign: 'right' },
    columnDebit: { width: '10%', textAlign: 'right' },
    columnCredit: { width: '10%', textAlign: 'right' },
    columnPaymentType: {
        width: '13%',
        paddingLeft: 6,
    },
    columnBalance: { width: '10%', textAlign: 'right' },
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

const LedgerPDF = ({ ledgerData, themeConfig }: LedgerPDFProps) => {
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
    const isLight = themeConfig.theme === 'light' || themeConfig.theme === 'system';
    return (
        <Document>
            <Page size="A4" style={[styles.page, isLight ? styles.lightPage : styles.darkPage]}>
                <View style={styles.header}>
                    <Text style={[styles.title, isLight ? styles.titleLight : styles.titleDark]}>{SoftwareDetail.shopName}</Text>
                    <View style={styles.contactInfo}>
                        <Text style={[styles.contactInfo, isLight ? styles.contactInfoLight : styles.contactInfoDark]}>
                            <Text style={styles.contactName}>{SoftwareDetail.softwareName}: </Text>
                            {SoftwareDetail.number1} | {SoftwareDetail.number2}
                        </Text>
                        <Text style={[styles.contactInfo, isLight ? styles.contactInfoLight : styles.contactInfoDark]}>
                            <Text style={styles.contactName}>Azeem Badshah: </Text>
                            {SoftwareDetail.number3} | {SoftwareDetail.number4}
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoContainer}>
                    <View style={styles.infoSection}>
                        <View style={styles.infoRow}>
                            <Text style={[styles.label, isLight ? styles.labelLight : styles.labelDark]}>Name:</Text>
                            <Text style={[styles.value, isLight ? styles.valueLight : styles.valueDark]}>{ledgerData.customerName}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={[styles.label, isLight ? styles.labelLight : styles.labelDark]}>Phone Number:</Text>
                            <Text style={[styles.value, isLight ? styles.valueLight : styles.valueDark]}>{ledgerData.phoneNumber}</Text>
                        </View>
                    </View>
                    <View style={styles.infoSection}>
                        <View style={styles.infoRow}>
                            <Text style={[styles.label, isLight ? styles.labelLight : styles.labelDark]}>Khata Number:</Text>
                            <Text style={[styles.value, isLight ? styles.valueLight : styles.valueDark]}>#{ledgerData.id}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.table}>
                    <View style={[styles.tableHeader, isLight ? styles.tableHeaderLight : styles.tableHeaderDark]}>
                        <Text style={[styles.columnHeader, styles.columnDate, isLight ? styles.valueLight : styles.valueDark]}>DATE</Text>
                        <Text style={[styles.columnHeader, styles.columnDescription, isLight ? styles.valueLight : styles.valueDark]}>DESCRIPTION</Text>
                        <Text style={[styles.columnHeader, styles.columnQty, isLight ? styles.valueLight : styles.valueDark]}>QTY</Text>
                        <Text style={[styles.columnHeader, styles.columnPrice, isLight ? styles.valueLight : styles.valueDark]}>PRICE</Text>
                        <Text style={[styles.columnHeader, styles.columnAmount, isLight ? styles.valueLight : styles.valueDark]}>AMOUNT</Text>
                        <Text style={[styles.columnHeader, styles.columnDebit, isLight ? styles.valueLight : styles.valueDark]}>DEBIT</Text>
                        <Text style={[styles.columnHeader, styles.columnCredit, isLight ? styles.valueLight : styles.valueDark]}>CREDIT</Text>
                        <Text style={[styles.columnHeader, styles.columnPaymentType, isLight ? styles.valueLight : styles.valueDark]}>PAYMENT TYPE</Text>
                        <Text style={[styles.columnHeader, styles.columnBalance, isLight ? styles.valueLight : styles.valueDark]}>BALANCE</Text>
                    </View>

                    {formatLedgerRows().map((row, index) => (
                        <View key={index} style={[styles.tableRow, isLight ? styles.tableRowLight : styles.tableRowDark]}>
                            <Text style={[styles.column, styles.columnDate, isLight ? styles.valueLight : styles.valueDark]}>{row.date}</Text>
                            <Text style={[styles.column, styles.columnDescription, isLight ? styles.valueLight : styles.valueDark]}>{row.description}</Text>
                            <Text style={[styles.column, styles.columnQty, isLight ? styles.valueLight : styles.valueDark]}>{row.quantity}</Text>
                            <Text style={[styles.column, styles.columnPrice, isLight ? styles.valueLight : styles.valueDark]}>{row.price !== '-' ? `Rs. ${row.price.toLocaleString()}` : '-'}</Text>
                            <Text style={[styles.column, styles.columnAmount, isLight ? styles.valueLight : styles.valueDark]}>{row.amount !== '-' ? `Rs. ${row.amount.toLocaleString()}` : '-'}</Text>
                            <Text style={[styles.column, styles.columnDebit, isLight ? styles.valueLight : styles.valueDark]}>{row.debit !== '-' ? `Rs. ${row.debit.toLocaleString()}` : '-'}</Text>
                            <Text style={[styles.column, styles.columnCredit, isLight ? styles.valueLight : styles.valueDark]}>{row.credit !== '-' ? `Rs. ${row.credit.toLocaleString()}` : '-'}</Text>
                            <Text style={[styles.column, styles.columnPaymentType, isLight ? styles.valueLight : styles.valueDark]}>{row.paymentType}</Text>
                            <Text style={[styles.column, styles.columnBalance, isLight ? styles.valueLight : styles.valueDark]}>Rs. {row.balance.toLocaleString()}</Text>
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
