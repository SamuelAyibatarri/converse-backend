const PaymentHistory = () => {
    return (
        <div className="space-y-4">
            <p className="text-md font-semibold text-gray-900 dark:text-white">Payment History</p>
            <div className="space-y-3">
                <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded-lg flex items-center justify-between">
                    <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">Electricity Bills</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">July 17, 2025</p>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white">₦9,000</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded-lg flex items-center justify-between">
                    <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">Rent - Monthly</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">June 15, 2025</p>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white">₦29,000</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded-lg flex items-center justify-between">
                    <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">Rent - Monthly</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">May 15, 2025</p>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white">₦29,000</p>
                </div>
            </div>
            <button className="w-full text-end text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors hover:underline cursor-pointer">See More</button>
        </div>
    )
}

export default PaymentHistory;