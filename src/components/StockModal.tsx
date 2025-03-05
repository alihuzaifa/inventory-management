const StockModal = ({ stock, onClose }: any) => {
    if (!stock || !stock.stocks || !Array.isArray(stock.stocks)) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="p-6 panel rounded-lg shadow-xl w-1/3 bg-white">
                <h2 className="text-xl font-semibold mb-4">Stock Details</h2>
                <table className="table-auto w-full border">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="px-4 py-2">Supplier</th>
                            <th className="px-4 py-2">Quantity</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stock.stocks.map((item: any, index: number) => (
                            <tr key={index}>
                                <td className="border px-4 py-2">{item.supplier}</td>
                                <td className="border px-4 py-2">{item.quantity}</td>
                            </tr>
                        ))}
                    </tbody>
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
