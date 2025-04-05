interface StockEntry {
    _id: string;
    quantity: number;
    price: number;
    totalPrice: number;
    purchaseDate: string;
    supplier: string;
}

interface Stock {
    product: string;
    totalQuantity: number;
    totalAmount: number;
    averagePrice: number;
    lastPurchaseDate: string;
    purchaseCount: number;
    purchases: StockEntry[];
}

interface StockModalProps {
    stock: Stock;
    onClose: () => void;
}

const StockModal: React.FC<StockModalProps> = ({ stock, onClose }) => {
    if (!stock || !stock.purchases || !Array.isArray(stock.purchases)) return null;

    const formatDate = (date: string) => {
        if (date) {
            const dt = new Date(date);
            const month = dt.getMonth() + 1 < 10 ? '0' + (dt.getMonth() + 1) : dt.getMonth() + 1;
            const day = dt.getDate() < 10 ? '0' + dt.getDate() : dt.getDate();
            return day + '/' + month + '/' + dt.getFullYear();
        }
        return '';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 top-10">
            <div className="relative bg-white rounded-lg shadow-xl w-full sm:w-11/12 md:w-4/5 lg:w-2/3 max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="sticky top-0 bg-white border-b p-4 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-semibold">
                        Stock Details - {stock.product}
                    </h2>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                        aria-label="Close modal"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-4 sm:p-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="text-sm text-blue-800 font-medium">Total Quantity</h3>
                            <p className="text-xl font-bold text-blue-900">{stock.totalQuantity}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <h3 className="text-sm text-green-800 font-medium">Average Price</h3>
                            <p className="text-xl font-bold text-green-900">Rs. {stock.averagePrice.toLocaleString()}</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <h3 className="text-sm text-purple-800 font-medium">Total Amount</h3>
                            <p className="text-xl font-bold text-purple-900">Rs. {stock.totalAmount.toLocaleString()}</p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg">
                            <h3 className="text-sm text-orange-800 font-medium">Purchase Count</h3>
                            <p className="text-xl font-bold text-orange-900">{stock.purchaseCount}</p>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="table-auto w-full min-w-[600px]">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-600">
                                        Supplier
                                    </th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-600">
                                        Quantity
                                    </th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-600">
                                        Price
                                    </th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-600">
                                        Total Price
                                    </th>
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-600">
                                        Purchase Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {stock.purchases.map((item: StockEntry) => (
                                    <tr key={item._id} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-gray-900">
                                            {item.supplier}
                                        </td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-gray-900">
                                            {item.quantity}
                                        </td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-gray-900">
                                            Rs. {item.price.toLocaleString()}
                                        </td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-gray-900">
                                            Rs. {item.totalPrice.toLocaleString()}
                                        </td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-gray-900">
                                            {formatDate(item.purchaseDate)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50">
                                <tr>
                                    <td className="px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-gray-900">
                                        Total
                                    </td>
                                    <td className="px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-gray-900">
                                        {stock.totalQuantity}
                                    </td>
                                    <td className="px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-gray-900">
                                        Rs. {stock.averagePrice.toLocaleString()}
                                    </td>
                                    <td className="px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-gray-900">
                                        Rs. {stock.totalAmount.toLocaleString()}
                                    </td>
                                    <td className="px-3 py-2 sm:px-4 sm:py-3"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Modal Footer */}
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-red-600 text-white text-sm sm:text-base rounded-lg hover:bg-red-700 transition-colors duration-200"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockModal;