import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setPageTitle } from '../store/themeConfigSlice';
import IconPrinter from '../components/Icon/IconPrinter';
import IconDownload from '../components/Icon/IconDownload';
import InvoicePDF from '../components/InvoicePdf';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { IRootState } from '../store';

const Invoice = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Invoice Preview'));
    });

    const exportTable = () => {
        window.print();
    };

    const items = [
        { id: 1, title: 'Calendar App Customization', quantity: 1, price: '120', amount: '120' },
        { id: 2, title: 'Chat App Customization', quantity: 1, price: '230', amount: '230' },
        { id: 3, title: 'Laravel Integration', quantity: 1, price: '405', amount: '405' },
        { id: 4, title: 'Backend UI Design', quantity: 1, price: '2500', amount: '2500' },
    ];

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
    
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);

    return (
        <div>
            <div className="flex items-center lg:justify-end justify-center flex-wrap gap-4 mb-6">
                <button type="button" className="btn btn-primary gap-2" onClick={exportTable}>
                    <IconPrinter />
                    Print
                </button>
                <PDFDownloadLink document={<InvoicePDF themeConfig={themeConfig} items={items} SoftwareDetail={SoftwareDetail} />} fileName="invoice.pdf">
                    {({ loading }) => (
                        <button type="button" className="btn btn-primary gap-2">
                            <IconDownload />
                            {loading ? 'Loading...' : 'Download PDF'}
                        </button>
                    )}
                </PDFDownloadLink>
            </div>

            <div className="panel p-6">
                <div className="text-2xl font-bold uppercase text-center">{SoftwareDetail.shopName}</div>

                <div className="text-white-dark mt-2 text-end">
                    <span className="font-semibold">{SoftwareDetail.softwareName}: </span> {SoftwareDetail.number1} | {SoftwareDetail.number2}
                    <br /> <span className="font-semibold">Azeem Badshah:</span> {SoftwareDetail.number3} | {SoftwareDetail.number4}
                </div>

                <hr className="border-white-light dark:border-[#1b2e4b] my-6" />

                <div className="flex justify-between lg:flex-row flex-col gap-6">
                    {/* Client Information */}
                    <div className="lg:w-1/2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-gray-600 dark:text-gray-400">Name:</div>
                            <div className="font-semibold">Ali Huzaifa</div>

                            <div className="text-gray-600 dark:text-gray-400">Phone Number:</div>
                            <div className="font-semibold">0311 1260357</div>

                            <div className="text-gray-600 dark:text-gray-400">Date:</div>
                            <div className="font-semibold">13 Sep 2022</div>
                        </div>
                    </div>
                    <div className="lg:w-1/2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-gray-600 dark:text-gray-400">Invoice Number:</div>
                            <div className="font-semibold">#8701</div>

                            <div className="text-gray-600 dark:text-gray-400">Payment Status:</div>
                            <div className="font-semibold">
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Fully Paid</span>
                            </div>

                            <div className="text-gray-600 dark:text-gray-400">Payment Method:</div>
                            <div className="font-semibold">Bank Transfer</div>
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
                            {items.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.id}</td>
                                    <td>{item.title}</td>
                                    <td>{item.quantity}</td>
                                    <td className="ltr:text-right rtl:text-left">${item.price}</td>
                                    <td className="ltr:text-right rtl:text-left">${item.amount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="grid sm:grid-cols-2 grid-cols-1 px-4 mt-6">
                    <div></div>
                    <div className="ltr:text-right rtl:text-left space-y-2">
                        <div className="flex items-center">
                            <div className="flex-1">Subtotal</div>
                            <div className="w-[37%]">$3255</div>
                        </div>
                        <div className="flex items-center">
                            <div className="flex-1">Tax</div>
                            <div className="w-[37%]">$700</div>
                        </div>
                        <div className="flex items-center">
                            <div className="flex-1">Discount</div>
                            <div className="w-[37%]">$10</div>
                        </div>
                        <div className="flex items-center font-semibold text-lg">
                            <div className="flex-1">Grand Total</div>
                            <div className="w-[37%]">$3945</div>
                        </div>
                    </div>
                </div>
                <div className="mt-10">
                    <div className="text-white-dark text-center my-1">{SoftwareDetail.shopAddress}</div>
                    <div className="text-white-dark text-center my-1">{SoftwareDetail.shopDescription}</div>
                </div>
            </div>
        </div>
    );
};

export default Invoice;
