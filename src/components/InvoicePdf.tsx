import { Document, Page, View, Text, StyleSheet, Font } from '@react-pdf/renderer';

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
        padding: 30,
        fontFamily: 'Nunito',
    },
    darkPage: {
        backgroundColor: '#1B2E4B',
        color: '#888EA8',
    },
    lightPage: {
        backgroundColor: '#FFFFFF',
        color: '#000000',
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        textAlign: 'center',
        fontWeight: 700,
        textTransform: 'uppercase',
    },
    titleDark: {
        color: '#888EA8',
    },
    titleLight: {
        color: '#000000',
    },
    contactInfo: {
        marginTop: 8,
        textAlign: 'right',
        fontSize: 10,
    },
    contactInfoDark: {
        color: '#888EA8',
    },
    contactInfoLight: {
        color: '#4B5563',
    },
    contactName: {
        fontWeight: 600,
    },
    divider: {
        borderBottomWidth: 1,
        marginVertical: 15,
    },
    dividerDark: {
        borderBottomColor: '#191E3A',
    },
    dividerLight: {
        borderBottomColor: '#E0E6ED',
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
    },
    label: {
        width: '40%',
        fontSize: 10,
    },
    labelDark: {
        color: '#888EA8',
    },
    labelLight: {
        color: '#4B5563',
    },
    value: {
        flex: 1,
        fontSize: 10,
        fontWeight: 600,
    },
    valueDark: {
        color: '#888EA8',
    },
    valueLight: {
        color: '#000000',
    },
    paymentStatus: {
        backgroundColor: '#DEF7EC',
        color: '#03543F',
        padding: '2 6',
        borderRadius: 4,
        fontSize: 10,
        alignSelf: 'flex-start',
    },
    table: {
        marginTop: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        padding: '12 16',
    },
    tableHeaderDark: {
        backgroundColor: '#1A2941',
    },
    tableHeaderLight: {
        backgroundColor: '#F6F8FA',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        padding: '12 16',
    },
    tableRowDark: {
        borderBottomColor: '#191E3A',
    },
    tableRowLight: {
        borderBottomColor: '#E0E6ED',
    },
    tableRowStriped: {
        backgroundColor: 'rgba(26, 41, 65, 0.4)',
    },
    tableRowStripedLight: {
        backgroundColor: 'rgba(246, 248, 250, 0.5)',
    },
    column: {
        fontSize: 10,
    },
    columnId: {
        width: '10%',
    },
    columnProduct: {
        width: '40%',
    },
    columnQty: {
        width: '15%',
    },
    columnPrice: {
        width: '15%',
        textAlign: 'right',
    },
    columnAmount: {
        width: '20%',
        textAlign: 'right',
    },
    summaryContainer: {
        flexDirection: 'row',
        marginTop: 20,
        paddingHorizontal: 16,
    },
    paymentDetails: {
        flex: 1,
        marginRight: 10,
    },
    paymentTitle: {
        fontSize: 10,
        fontWeight: 600,
        marginBottom: 8,
    },
    paymentRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    paymentLabel: {
        flex: 1,
        fontSize: 10,
    },
    paymentValue: {
        width: '37%',
        fontSize: 10,
        textAlign: 'right',
    },
    totalSection: {
        width: '25%',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    grandTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
    },
    grandTotalDark: {
        borderTopColor: '#191E3A',
    },
    grandTotalLight: {
        borderTopColor: '#E0E6ED',
    },
    remainingAmount: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
        color: '#EF4444',
    },
    footer: {
        marginTop: 40,
        textAlign: 'center',
    },
    footerText: {
        fontSize: 10,
        marginBottom: 4,
    },
    footerTextDark: {
        color: '#888EA8',
    },
    footerTextLight: {
        color: '#4B5563',
    },
    columnHeader: {
        fontSize: 10,
        fontWeight: 600,
        color: '#1B2E4B',
    },
});

interface InvoicePDFProps {
    invoiceData: any;
    themeConfig: any;
}

const InvoicePDF = ({ invoiceData, themeConfig }: InvoicePDFProps) => {
    const getTotalPaidAmount = () => {
        return Number(invoiceData.cashAmount || 0) + Number(invoiceData.bankAmount || 0);
    };

    const getRemainingAmount = () => {
        return invoiceData.totalBillAmount - getTotalPaidAmount();
    };

    const getPaymentStatus = () => {
        const totalPaid = getTotalPaidAmount();
        if (totalPaid >= invoiceData.totalBillAmount) {
            return 'Fully Paid';
        } else if (totalPaid > 0) {
            return 'Partially Paid';
        }
        return 'Unpaid';
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

                {/* Client and Invoice Information */}
                <View style={styles.infoContainer}>
                    <View style={styles.infoSection}>
                        <View style={styles.infoRow}>
                            <Text style={[styles.label, isLight ? styles.labelLight : styles.labelDark]}>Name:</Text>
                            <Text style={[styles.value, isLight ? styles.valueLight : styles.valueDark]}>{invoiceData.customerName}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={[styles.label, isLight ? styles.labelLight : styles.labelDark]}>Phone Number:</Text>
                            <Text style={[styles.value, isLight ? styles.valueLight : styles.valueDark]}>{invoiceData.phoneNumber}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={[styles.label, isLight ? styles.labelLight : styles.labelDark]}>Date:</Text>
                            <Text style={[styles.value, isLight ? styles.valueLight : styles.valueDark]}>{new Date(invoiceData.saleDate).toLocaleDateString()}</Text>
                        </View>
                    </View>

                    <View style={styles.infoSection}>
                        <View style={styles.infoRow}>
                            <Text style={[styles.label, isLight ? styles.labelLight : styles.labelDark]}>Invoice Number:</Text>
                            <Text style={[styles.value, isLight ? styles.valueLight : styles.valueDark]}>#{invoiceData.id}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={[styles.label, isLight ? styles.labelLight : styles.labelDark]}>Payment Status:</Text>
                            <Text style={styles.paymentStatus}>{getPaymentStatus()}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={[styles.label, isLight ? styles.labelLight : styles.labelDark]}>Payment Method:</Text>
                            <Text style={[styles.value, isLight ? styles.valueLight : styles.valueDark]}>{invoiceData.paymentTypes.join(', ')}</Text>
                        </View>
                    </View>
                </View>

                {/* Products Table */}
                <View style={styles.table}>
                    <View style={[styles.tableHeader, isLight ? styles.tableHeaderLight : styles.tableHeaderDark]}>
                        <Text style={[styles.column, styles.columnId, isLight ? styles.valueLight : styles.valueDark]}>S.NO</Text>
                        <Text style={[styles.column, styles.columnProduct, isLight ? styles.valueLight : styles.valueDark]}>ITEMS</Text>
                        <Text style={[styles.column, styles.columnQty, isLight ? styles.valueLight : styles.valueDark]}>QTY</Text>
                        <Text style={[styles.column, styles.columnPrice, isLight ? styles.valueLight : styles.valueDark]}>PRICE</Text>
                        <Text style={[styles.column, styles.columnAmount, isLight ? styles.valueLight : styles.valueDark]}>AMOUNT</Text>
                    </View>

                    {invoiceData.products.map((item: any, index: number) => (
                        <View key={item.id} style={[styles.tableRow, isLight ? styles.tableRowLight : styles.tableRowDark]}>
                            <Text style={[styles.column, styles.columnId, isLight ? styles.valueLight : styles.valueDark]}>{index + 1}</Text>
                            <Text style={[styles.column, styles.columnProduct, isLight ? styles.valueLight : styles.valueDark]}>{item.product}</Text>
                            <Text style={[styles.column, styles.columnQty, isLight ? styles.valueLight : styles.valueDark]}>{item.sellingQuantity}</Text>
                            <Text style={[styles.column, styles.columnPrice, isLight ? styles.valueLight : styles.valueDark]}>Rs. {item.price.toLocaleString()}</Text>
                            <Text style={[styles.column, styles.columnAmount, isLight ? styles.valueLight : styles.valueDark]}>Rs. {item.totalPrice.toLocaleString()}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.summaryContainer}>
                    {/* Payment Details */}
                    <View style={styles.paymentDetails}>
                        <Text style={[styles.paymentTitle, isLight ? styles.valueLight : styles.valueDark]}>Payment Details:</Text>
                        {invoiceData.paymentTypes.includes('cash') && (
                            <View style={styles.paymentRow}>
                                <Text style={[styles.paymentLabel, isLight ? styles.labelLight : styles.labelDark]}>Cash Amount:</Text>
                                <Text style={[styles.paymentValue, isLight ? styles.valueLight : styles.valueDark]}>Rs. {Number(invoiceData.cashAmount).toLocaleString()}</Text>
                            </View>
                        )}
                        {invoiceData.paymentTypes.includes('bank') && (
                            <>
                                <View style={styles.paymentRow}>
                                    <Text style={[styles.paymentLabel, isLight ? styles.labelLight : styles.labelDark]}>Bank Name:</Text>
                                    <Text style={[styles.paymentValue, isLight ? styles.valueLight : styles.valueDark]}>{invoiceData.bankName}</Text>
                                </View>
                                <View style={styles.paymentRow}>
                                    <Text style={[styles.paymentLabel, isLight ? styles.labelLight : styles.labelDark]}>Bank Amount:</Text>
                                    <Text style={[styles.paymentValue, isLight ? styles.valueLight : styles.valueDark]}>Rs. {Number(invoiceData.bankAmount).toLocaleString()}</Text>
                                </View>
                            </>
                        )}
                        {invoiceData.paymentTypes.includes('check') && (
                            <>
                                <View style={styles.paymentRow}>
                                    <Text style={[styles.paymentLabel, isLight ? styles.labelLight : styles.labelDark]}>Check Number:</Text>
                                    <Text style={[styles.paymentValue, isLight ? styles.valueLight : styles.valueDark]}>{invoiceData.checkNumber}</Text>
                                </View>
                                <View style={styles.paymentRow}>
                                    <Text style={[styles.paymentLabel, isLight ? styles.labelLight : styles.labelDark]}>Check Amount:</Text>
                                    <Text style={[styles.paymentValue, isLight ? styles.valueLight : styles.valueDark]}>Rs. {Number(invoiceData.checkAmount).toLocaleString()}</Text>
                                </View>
                            </>
                        )}
                        <View style={styles.paymentRow}>
                            <Text style={[styles.paymentLabel, isLight ? styles.labelLight : styles.labelDark, { fontWeight: 600 }]}>Total Paid Amount:</Text>
                            <Text style={[styles.paymentValue, isLight ? styles.valueLight : styles.valueDark, { fontWeight: 600 }]}>Rs. {getTotalPaidAmount().toLocaleString()}</Text>
                        </View>
                    </View>

                    {/* Totals */}
                    <View style={styles.totalSection}>
                        <View style={styles.totalRow}>
                            <Text style={[styles.label, isLight ? styles.labelLight : styles.labelDark]}>Subtotal</Text>
                            <Text style={[styles.value, isLight ? styles.valueLight : styles.valueDark]}>Rs. {invoiceData.totalBillAmount.toLocaleString()}</Text>
                        </View>
                        <View style={[styles.grandTotal, isLight ? styles.grandTotalLight : styles.grandTotalDark]}>
                            <Text style={[styles.value, isLight ? styles.valueLight : styles.valueDark, { fontWeight: 700 }]}>Grand Total</Text>
                            <Text style={[styles.value, isLight ? styles.valueLight : styles.valueDark, { fontWeight: 700 }]}>Rs. {invoiceData.totalBillAmount.toLocaleString()}</Text>
                        </View>
                        {getRemainingAmount() > 0 && (
                            <View style={styles.remainingAmount}>
                                <Text style={[styles.value, { fontWeight: 600 }]}>Remaining Amount</Text>
                                <Text style={[styles.value, { fontWeight: 600 }]}>Rs. {getRemainingAmount().toLocaleString()}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={[styles.footerText, isLight ? styles.footerTextLight : styles.footerTextDark]}>{SoftwareDetail.shopAddress}</Text>
                    <Text style={[styles.footerText, isLight ? styles.footerTextLight : styles.footerTextDark]}>{SoftwareDetail.shopDescription}</Text>
                </View>
            </Page>
        </Document>
    );
};

export default InvoicePDF;
