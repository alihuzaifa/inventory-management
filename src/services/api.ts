import { BASE_URL, URL_METHODS } from "./constant";
import request from "./request";

const Login = async (data: { email: string; password: string }) => {
    try {
        const response = await request({
            url: `${BASE_URL}users/login`,
            method: URL_METHODS.POST,
            data,
        });
        return response;
    } catch (error) {
        throw error;
    }
};

const CreateUser = async (data: any) => {
    try {
        const response = await request({
            url: `${BASE_URL}users`,
            method: URL_METHODS.POST,
            data,
        });
        return response;
    } catch (error) {
        throw error;
    }
};

const GetAllUsers = async () => {
    try {
        const response = await request({
            url: `${BASE_URL}users`,
            method: URL_METHODS.GET,
        });
        return response;
    } catch (error) {
        throw error;
    }
};

const DeleteUser = async (id: string) => {
    try {
        const response = await request({
            url: `${BASE_URL}users/${id}`,
            method: URL_METHODS.DELETE,
        });
        return response;
    } catch (error) {
        throw error;
    }
};

const ActivateDeactivateUser = async (id: string, status: "active" | "inactive") => {
    try {
        const response = await request({
            url: `${BASE_URL}users/${id}/status`,
            method: URL_METHODS.PUT,
            data: { status },
        });
        return response;
    } catch (error) {
        throw error;
    }
};

const UpdateUser = async (id: string, data: any) => {
    try {
        const response = await request({
            url: `${BASE_URL}users/${id}`,
            method: URL_METHODS.PUT,
            data,
        });
        return response;
    } catch (error) {
        throw error;
    }
};

// Add these new methods
const CreateExpense = async (data: any) => {
    try {
        const response = await request({
            url: `${BASE_URL}expenses`,
            method: URL_METHODS.POST,
            data,
        });
        return response;
    } catch (error) {
        throw error;
    }
};

const GetAllExpenses = async () => {
    try {
        const response = await request({
            url: `${BASE_URL}expenses`,
            method: URL_METHODS.GET,
        });
        return response;
    } catch (error) {
        throw error;
    }
};

const UpdateExpense = async (id: string, data: any) => {
    try {
        const response = await request({
            url: `${BASE_URL}expenses/${id}`,
            method: URL_METHODS.PUT,
            data,
        });
        return response;
    } catch (error) {
        throw error;
    }
};

const DeleteExpense = async (id: string) => {
    try {
        const response = await request({
            url: `${BASE_URL}expenses/${id}`,
            method: URL_METHODS.DELETE,
        });
        return response;
    } catch (error) {
        throw error;
    }
};

// Add these new methods
const GetSoftwareSettings = async () => {
    try {
        const response = await request({
            url: `${BASE_URL}settings`,
            method: URL_METHODS.GET,
        });
        return response;
    } catch (error) {
        throw error;
    }
};

const UpdateSoftwareSettings = async (data: any) => {
    try {
        const response = await request({
            url: `${BASE_URL}settings`,
            method: URL_METHODS.PUT,
            data,
        });
        return response;
    } catch (error) {
        throw error;
    }
};

// Add these new methods
const CreatePurchase = async (data: any) => {
    try {
        const response = await request({
            url: `${BASE_URL}purchases`,
            method: URL_METHODS.POST,
            data,
        });
        return response;
    } catch (error) {
        throw error;
    }
};

const GetAllPurchases = async () => {
    try {
        const response = await request({
            url: `${BASE_URL}purchases`,
            method: URL_METHODS.GET,
        });
        return response;
    } catch (error) {
        throw error;
    }
};

const GetPurchasesByDateRange = async (startDate: string, endDate: string) => {
    try {
        const response = await request({
            url: `${BASE_URL}purchases/date-range`,
            method: URL_METHODS.GET,
            params: { startDate, endDate },
        });
        return response;
    } catch (error) {
        throw error;
    }
};

const UpdatePurchase = async (id: string, data: Partial<any>) => {
    try {
        const response = await request({
            url: `${BASE_URL}purchases/${id}`,
            method: URL_METHODS.PUT,
            data,
        });
        return response;
    } catch (error) {
        throw error;
    }
};

const DeletePurchase = async (id: string) => {
    try {
        const response = await request({
            url: `${BASE_URL}purchases/${id}`,
            method: URL_METHODS.DELETE,
        });
        return response;
    } catch (error) {
        throw error;
    }
};

// Helper function to get last week's purchases
const GetLastWeekPurchases = async () => {
    try {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const response = await request({
            url: `${BASE_URL}purchases/date-range`,
            method: URL_METHODS.GET,
            params: { startDate, endDate },
        });
        return response;
    } catch (error) {
        throw error;
    }
};

const GetAllStocks = async () => {
    try {
        const response = await request({
            url: `${BASE_URL}stocks`,
            method: URL_METHODS.GET,
        });
        return response;
    } catch (error) {
        throw error;
    }
};

const GetStockByProduct = async (product: string) => {
    try {
        const response = await request({
            url: `${BASE_URL}stocks/${product}`,
            method: URL_METHODS.GET,
        });
        return response;
    } catch (error) {
        throw error;
    }
};

const GetStockHistory = async (product: string, startDate?: string, endDate?: string) => {
    try {
        const response = await request({
            url: `${BASE_URL}stocks/${product}/history`,
            method: URL_METHODS.GET,
            params: { startDate, endDate },
        });
        return response;
    } catch (error) {
        throw error;
    }
};

const InventoryManagement = {
    Login,
    CreateUser,
    GetAllUsers,
    DeleteUser,
    ActivateDeactivateUser,
    UpdateUser,
    CreateExpense,
    GetAllExpenses,
    UpdateExpense,
    DeleteExpense,
    GetSoftwareSettings,
    UpdateSoftwareSettings,
    CreatePurchase,
    GetAllPurchases,
    GetPurchasesByDateRange,
    UpdatePurchase,
    DeletePurchase,
    GetLastWeekPurchases,
    GetStockByProduct,
    GetStockHistory,
    GetAllStocks,
}
export default InventoryManagement;