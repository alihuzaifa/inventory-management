import { Document, Page, View, Text, StyleSheet, Font } from '@react-pdf/renderer';

// Import font files
import NunitoRegular from '../assets/fonts/Nunito-Regular.ttf';
import NunitoSemiBold from '../assets/fonts/Nunito-SemiBold.ttf';
import NunitoBold from '../assets/fonts/Nunito-Bold.ttf';
import NunitoExtraBold from '../assets/fonts/Nunito-ExtraBold.ttf';

// Register Nunito font
Font.register({
    family: 'Nunito',
    fonts: [
        { src: NunitoRegular }, // regular
        { src: NunitoSemiBold, fontWeight: 600 }, // semibold
        { src: NunitoBold, fontWeight: 700 }, // bold
        { src: NunitoExtraBold, fontWeight: 900 }, // extra bold
    ],
});

const styles = StyleSheet.create({
    page: {
        padding: 10,
        fontFamily: 'Nunito',
    },
    header: {
        marginBottom: 10,
    },
    title: {
        fontSize: 18,

        textAlign: 'center',
        fontWeight: 700,
        fontFamily: 'Nunito',
    },
    contactSection: {
        marginTop: 10,
        alignItems: 'flex-end', // This is equivalent to text-end
    },
    contactRow: {
        fontSize: 10,

        marginBottom: 2,
    },
    contactName: {
        fontFamily: 'Nunito',
        fontWeight: 600,
    },
    contactInfo: {
        fontFamily: 'Nunito',
    },
    divider: {
        borderBottomWidth: 1,
        borderBottom: 1,
        marginVertical: 15,
        width: '100%',
    },
    infoContainer: {
        flexDirection: 'row',
        gap: 24, // equivalent to gap-6
        marginBottom: 24,
    },
    infoSection: {
        flex: 1, // equivalent to w-1/2
    },
    infoGrid: {
        gap: 12, // equivalent to gap-4
    },
    infoRow: {
        flexDirection: 'row',
    },
    label: {
        flex: 1,
        fontSize: 10,
        color: '#4B5563',
    },
    value: {
        flex: 1,
        fontSize: 10,
        fontFamily: 'Nunito',
        fontWeight: 'semibold',
    },
    paymentStatusContainer: {
        flex: 1,
        flexDirection: 'row', // This ensures the container wraps around the text
    },
    paymentStatus: {
        backgroundColor: '#DEF7EC',
        color: '#03543F',
        padding: '2 8', // Increased horizontal padding
        borderRadius: 4,
        fontSize: 10,
        alignSelf: 'flex-start', // This makes the background only as wide as the text
    },
    tableContainer: {
        borderRadius: 4,
    },
    tableHeader: {
        flexDirection: 'row',
        padding: '12 16',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        padding: '12 16',
    },
    tableRowLight: {
        backgroundColor: '#ffffff',
        borderBottomColor: '#e0e6ed',
    },
    tableRowDark: {
        backgroundColor: '#1a2941',
        borderBottomColor: '#191e3a',
    },
    tableRowStripedLight: {
        backgroundColor: 'rgba(246, 248, 250, 0.5)',
    },
    tableRowStripedDark: {
        backgroundColor: 'rgba(26, 41, 65, 0.4)',
    },
    tableHeaderLight: {
        backgroundColor: '#f6f8fa',
    },
    tableHeaderDark: {
        backgroundColor: '#1a2941',
    },
    columnId: {
        width: '10%',
        fontSize: 10,

        textAlign: 'left',
    },
    columnTitle: {
        width: '40%',
        fontSize: 10,

        textAlign: 'left',
    },
    columnQty: {
        width: '15%',
        fontSize: 10,

        textAlign: 'left',
    },
    columnPrice: {
        width: '15%',
        fontSize: 10,

        textAlign: 'right',
    },
    columnAmount: {
        width: '20%',
        fontSize: 10,

        textAlign: 'right',
    },
    headerText: {
        fontWeight: 600,
        color: '#515365',
    },
    summaryContainer: {
        flexDirection: 'row',
        marginTop: 24, // equivalent to mt-6
        paddingHorizontal: 16, // equivalent to px-4
    },
    summaryLeftColumn: {
        flex: 1,
    },
    summaryRightColumn: {
        flex: 1,
        gap: 4,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryLabel: {
        flex: 1,
        fontSize: 10,

        textAlign: 'left',
    },
    summaryValue: {
        width: '37%',
        fontSize: 10,

        textAlign: 'right',
    },
    summaryTotal: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    summaryTotalLabel: {
        flex: 1,
        fontSize: 12,
        fontWeight: 'semibold',

        textAlign: 'left',
    },
    summaryTotalValue: {
        width: '37%',
        fontSize: 12,
        fontWeight: 'semibold',

        textAlign: 'right',
    },
    footer: {
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
    },
    footerText: {
        fontSize: 10,

        textAlign: 'center',
        marginVertical: 4,
    },
});

const InvoicePDF = ({ items, SoftwareDetail, themeConfig }: any) => {
    const columns = [
        { key: 'id', label: 'S.NO', style: styles.columnId },
        { key: 'title', label: 'ITEMS', style: styles.columnTitle },
        { key: 'quantity', label: 'QTY', style: styles.columnQty },
        { key: 'price', label: 'PRICE', style: styles.columnPrice },
        { key: 'amount', label: 'AMOUNT', style: styles.columnAmount },
    ];
    return (
        <Document>
            <Page size="A4" style={[styles.page, themeConfig.theme === 'dark' ? { backgroundColor: '#0e1726', color: '#888ea8' } : { backgroundColor: '#fff', color: '#000' }]}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>{SoftwareDetail.shopName}</Text>
                </View>

                {/* Contact Section */}
                <View style={styles.contactSection}>
                    <View style={styles.contactRow}>
                        <Text>
                            <Text style={styles.contactName}>{SoftwareDetail.softwareName}: </Text>
                            <Text style={styles.contactInfo}>
                                {SoftwareDetail.number1} | {SoftwareDetail.number2}
                            </Text>
                        </Text>
                    </View>
                    <View style={styles.contactRow}>
                        <Text>
                            <Text style={styles.contactName}>Azeem Badshah: </Text>
                            <Text style={styles.contactInfo}>
                                {SoftwareDetail.number3} | {SoftwareDetail.number4}
                            </Text>
                        </Text>
                    </View>
                </View>

                {/* Divider */}
                <View style={[styles.divider]} />

                {/* Client and Invoice Information */}
                <View style={styles.infoContainer}>
                    {/* Client Information */}
                    <View style={styles.infoSection}>
                        <View style={styles.infoGrid}>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Name:</Text>
                                <Text style={styles.value}>Ali Huzaifa</Text>
                            </View>

                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Phone Number:</Text>
                                <Text style={styles.value}>0311 1260357</Text>
                            </View>

                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Date:</Text>
                                <Text style={styles.value}>13 Sep 2022</Text>
                            </View>
                        </View>
                    </View>

                    {/* Invoice Information */}
                    <View style={styles.infoSection}>
                        <View style={styles.infoGrid}>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Invoice Number:</Text>
                                <Text style={styles.value}>#8701</Text>
                            </View>

                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Payment Status:</Text>
                                <View style={styles.paymentStatusContainer}>
                                    <Text style={styles.paymentStatus}>Fully Paid</Text>
                                </View>
                            </View>
                            <View style={{ marginTop: -2 }}>
                                <View style={styles.infoRow}>
                                    <Text style={styles.label}>Payment Method:</Text>
                                    <Text style={styles.value}>Bank Transfer</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Table Section */}
                <View style={styles.tableContainer}>
                    {/* Table Header */}
                    <View style={[styles.tableHeader, themeConfig.theme === 'dark' ? styles.tableRowStripedDark : styles.tableRowStripedLight]}>
                        {columns.map((column) => (
                            <Text key={column.key} style={[column.style, styles.headerText]}>
                                {column.label}
                            </Text>
                        ))}
                    </View>

                    {/* Table Body */}
                    {items.map((item: any, index: number) => {
                        // Determine the row style based on theme and even/odd pattern
                        const rowStyle = [
                            styles.tableRow,
                            themeConfig.theme === 'dark' ? (index % 2 === 0 ? styles.tableRowDark : styles.tableRowStripedDark) : index % 2 === 0 ? styles.tableRowLight : styles.tableRowStripedLight,
                        ];

                        return (
                            <View key={item.id} style={rowStyle}>
                                <Text style={styles.columnId}>{index + 1}</Text>
                                <Text style={styles.columnTitle}>{item.title}</Text>
                                <Text style={styles.columnQty}>{item.quantity}</Text>
                                <Text style={styles.columnPrice}>{item.price}</Text>
                                <Text style={styles.columnAmount}>{item.amount}</Text>
                            </View>
                        );
                    })}
                </View>

                {/* Summary Section */}
                <View style={styles.summaryContainer}>
                    {/* Left empty column */}
                    <View style={styles.summaryLeftColumn}></View>

                    {/* Right column with totals */}
                    <View style={styles.summaryRightColumn}>
                        {/* Subtotal */}
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal</Text>
                            <Text style={styles.summaryValue}>3255</Text>
                        </View>

                        {/* Tax */}
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Tax</Text>
                            <Text style={styles.summaryValue}>700</Text>
                        </View>

                        {/* Discount */}
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Discount</Text>
                            <Text style={styles.summaryValue}>10</Text>
                        </View>

                        {/* Grand Total */}
                        <View style={styles.summaryTotal}>
                            <Text style={styles.summaryTotalLabel}>Grand Total</Text>
                            <Text style={styles.summaryTotalValue}>3945</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>{SoftwareDetail.shopAddress}</Text>
                    <Text style={styles.footerText}>{SoftwareDetail.shopDescription}</Text>
                </View>
            </Page>
        </Document>
    );
};

export default InvoicePDF;
