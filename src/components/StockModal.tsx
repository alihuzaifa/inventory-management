const StockModal = ({ stock, onClose }: any) => {
    if (!stock || !stock.stocks || !Array.isArray(stock.stocks)) return null;

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
        <div className="absolute inset-0 flex items-center justify-center flex-wrap z-50">
            <div className="p-6 panel rounded-lg shadow-xl w-2/3 bg-white">
                {' '}
                {/* Increased width */}
                <h2 className="text-xl font-semibold mb-4">Stock Details - {stock.product}</h2>
                <table className="table-auto w-full border">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="px-4 py-2">Supplier</th>
                            <th className="px-4 py-2">Quantity</th>
                            <th className="px-4 py-2">Price</th>
                            <th className="px-4 py-2">Total Price</th>
                            <th className="px-4 py-2">Purchase Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stock.stocks.map((item: any, index: number) => (
                            <tr key={index}>
                                <td className="border px-4 py-2">{item.supplier}</td>
                                <td className="border px-4 py-2">{item.quantity}</td>
                                <td className="border px-4 py-2">Rs. {item.price.toLocaleString()}</td>
                                <td className="border px-4 py-2">Rs. {(item.quantity * item.price).toLocaleString()}</td>
                                <td className="border px-4 py-2">{formatDate(item.date)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-100">
                        <tr>
                            <td className="border px-4 py-2 font-semibold">Total</td>
                            <td className="border px-4 py-2 font-semibold">{stock.totalQuantity}</td>
                            <td className="border px-4 py-2"></td>
                            <td className="border px-4 py-2 font-semibold">Rs. {stock.totalPrice.toLocaleString()}</td>
                            <td className="border px-4 py-2"></td>
                        </tr>
                    </tfoot>
                </table>
                <div className="text-right mt-4">
                    <button onClick={onClose} className="btn btn-danger">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StockModal;
