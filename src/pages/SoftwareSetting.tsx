import { useEffect, useRef, useState } from 'react';
import * as Yup from 'yup';
import { Field, Form, Formik } from 'formik';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../store/themeConfigSlice';
import InventoryManagement from '../services/api';

interface SoftwareSettingsData {
    _id?: string;
    shopId?: string;
    shopName: string;
    softwareName: string;
    shopAddress: string;
    shopDescription: string;
    firstOwnerName: string;
    firstOwnerNumber1: string;
    firstOwnerNumber2?: string;
    secondOwnerName?: string;
    secondOwnerNumber1?: string;
    secondOwnerNumber2?: string;
    createdAt?: string;
    updatedAt?: string;
    __v?: number;
}

const phoneRegExp = /^(\+92|92|0)(3\d{2}|3\d{2})[-]?\d{7}$/;

const validationSchema = Yup.object().shape({
    shopName: Yup.string().required('Shop name is required'),
    softwareName: Yup.string().required('Software name is required'),
    shopAddress: Yup.string().required('Shop address is required'),
    shopDescription: Yup.string().required('Shop description is required'),
    firstOwnerName: Yup.string().required('First owner name is required'),
    firstOwnerNumber1: Yup.string().matches(phoneRegExp, 'Please enter a valid Pakistani phone number').required('Primary number is required'),
    firstOwnerNumber2: Yup.string().matches(phoneRegExp, 'Please enter a valid Pakistani phone number').notRequired(),
    secondOwnerName: Yup.string(),
    secondOwnerNumber1: Yup.string()
        .matches(phoneRegExp, 'Please enter a valid Pakistani phone number')
        .when('secondOwnerName', {
            is: (val: string) => val && val.length > 0,
            then: (schema) => schema.required('Primary number is required when second owner is specified'),
        }),
    secondOwnerNumber2: Yup.string().matches(phoneRegExp, 'Please enter a valid Pakistani phone number').notRequired(),
});

const SoftwareSettings = () => {
    const dispatch = useDispatch();
    const formikRef = useRef<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasExistingSettings, setHasExistingSettings] = useState(false);
    const [initialValues, setInitialValues] = useState<SoftwareSettingsData>({
        shopName: '',
        softwareName: '',
        shopAddress: '',
        shopDescription: '',
        firstOwnerName: '',
        firstOwnerNumber1: '',
        firstOwnerNumber2: '',
        secondOwnerName: '',
        secondOwnerNumber1: '',
        secondOwnerNumber2: '',
    });

    useEffect(() => {
        dispatch(setPageTitle('Software Settings'));
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setIsLoading(true);
            const response = await InventoryManagement.GetSoftwareSettings();

            if (response) {
                const settingsData = response;
                setHasExistingSettings(true);
                setInitialValues({
                    shopName: settingsData.shopName || '',
                    softwareName: settingsData.softwareName || '',
                    shopAddress: settingsData.shopAddress || '',
                    shopDescription: settingsData.shopDescription || '',
                    firstOwnerName: settingsData.firstOwnerName || '',
                    firstOwnerNumber1: settingsData.firstOwnerNumber1 || '',
                    firstOwnerNumber2: settingsData.firstOwnerNumber2 || '',
                    secondOwnerName: settingsData.secondOwnerName || '',
                    secondOwnerNumber1: settingsData.secondOwnerNumber1 || '',
                    secondOwnerNumber2: settingsData.secondOwnerNumber2 || '',
                });
            }
        } catch (error: any) {
            if (error.response?.status === 404) {
                setHasExistingSettings(false);
            } else {
                console.error('Error fetching settings:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response?.data?.message || 'Failed to fetch settings',
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (values: SoftwareSettingsData) => {
        try {
            setIsLoading(true);
            const response = await InventoryManagement.UpdateSoftwareSettings({
                shopName: values.shopName,
                softwareName: values.softwareName,
                shopAddress: values.shopAddress,
                shopDescription: values.shopDescription,
                firstOwnerName: values.firstOwnerName,
                firstOwnerNumber1: values.firstOwnerNumber1,
                firstOwnerNumber2: values.firstOwnerNumber2,
                secondOwnerName: values.secondOwnerName,
                secondOwnerNumber1: values.secondOwnerNumber1,
                secondOwnerNumber2: values.secondOwnerNumber2,
            });

            if (response?.data) {
                Swal.fire({
                    toast: true,
                    position: 'top',
                    showConfirmButton: false,
                    timer: 3000,
                    icon: 'success',
                    title: hasExistingSettings ? 'Settings updated successfully' : 'Settings saved successfully',
                    padding: '10px 20px',
                });
                fetchSettings();
            }
        } catch (error: any) {
            console.error('Error saving settings:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to save settings',
                padding: '10px 20px',
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="panel">
            <div className="flex items-center justify-between mb-5">
                <h5 className="font-semibold text-lg dark:text-white-light">Software Settings</h5>
            </div>

            <Formik innerRef={formikRef} initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit} enableReinitialize={true}>
                {({ errors, submitCount }) => (
                    <Form className="space-y-5">
                        {/* Shop Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className={submitCount ? (errors.shopName ? 'has-error' : 'has-success') : ''}>
                                <label htmlFor="shopName">Shop Name *</label>
                                <Field name="shopName" type="text" id="shopName" placeholder="Enter shop name" className="form-input" />
                                {submitCount > 0 && errors.shopName && <div className="text-danger mt-1">{errors.shopName}</div>}
                            </div>
                            <div className={submitCount ? (errors.softwareName ? 'has-error' : 'has-success') : ''}>
                                <label htmlFor="softwareName">Software Name *</label>
                                <Field name="softwareName" type="text" id="softwareName" placeholder="Enter software name" className="form-input" />
                                {submitCount > 0 && errors.softwareName && <div className="text-danger mt-1">{errors.softwareName}</div>}
                            </div>
                        </div>

                        {/* First Owner Details */}
                        <div>
                            <h6 className="text-base font-semibold dark:text-white-light mb-3">First Owner Details *</h6>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className={submitCount ? (errors.firstOwnerName ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="firstOwnerName">Owner Name *</label>
                                    <Field name="firstOwnerName" type="text" id="firstOwnerName" placeholder="Enter owner name" className="form-input" />
                                    {submitCount > 0 && errors.firstOwnerName && <div className="text-danger mt-1">{errors.firstOwnerName}</div>}
                                </div>
                                <div className={submitCount ? (errors.firstOwnerNumber1 ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="firstOwnerNumber1">Primary Number *</label>
                                    <Field name="firstOwnerNumber1" type="text" id="firstOwnerNumber1" placeholder="03XX-XXXXXXX" className="form-input" />
                                    {submitCount > 0 && errors.firstOwnerNumber1 && <div className="text-danger mt-1">{errors.firstOwnerNumber1}</div>}
                                </div>
                                <div className={submitCount ? (errors.firstOwnerNumber2 ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="firstOwnerNumber2">Secondary Number</label>
                                    <Field name="firstOwnerNumber2" type="text" id="firstOwnerNumber2" placeholder="03XX-XXXXXXX" className="form-input" />
                                    {submitCount > 0 && errors.firstOwnerNumber2 && <div className="text-danger mt-1">{errors.firstOwnerNumber2}</div>}
                                </div>
                            </div>
                        </div>

                        {/* Second Owner Details */}
                        <div>
                            <h6 className="text-base font-semibold dark:text-white-light mb-3">Second Owner Details</h6>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className={submitCount ? (errors.secondOwnerName ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="secondOwnerName">Owner Name</label>
                                    <Field name="secondOwnerName" type="text" id="secondOwnerName" placeholder="Enter owner name" className="form-input" />
                                    {submitCount > 0 && errors.secondOwnerName && <div className="text-danger mt-1">{errors.secondOwnerName}</div>}
                                </div>
                                <div className={submitCount ? (errors.secondOwnerNumber1 ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="secondOwnerNumber1">Primary Number</label>
                                    <Field name="secondOwnerNumber1" type="text" id="secondOwnerNumber1" placeholder="03XX-XXXXXXX" className="form-input" />
                                    {submitCount > 0 && errors.secondOwnerNumber1 && <div className="text-danger mt-1">{errors.secondOwnerNumber1}</div>}
                                </div>
                                <div className={submitCount ? (errors.secondOwnerNumber2 ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="secondOwnerNumber2">Secondary Number</label>
                                    <Field name="secondOwnerNumber2" type="text" id="secondOwnerNumber2" placeholder="03XX-XXXXXXX" className="form-input" />
                                    {submitCount > 0 && errors.secondOwnerNumber2 && <div className="text-danger mt-1">{errors.secondOwnerNumber2}</div>}
                                </div>
                            </div>
                        </div>

                        {/* Shop Address and Description */}
                        <div>
                            <div className="mb-5">
                                <div className={submitCount ? (errors.shopAddress ? 'has-error' : 'has-success') : ''}>
                                    <label htmlFor="shopAddress">Shop Address *</label>
                                    <Field as="textarea" name="shopAddress" id="shopAddress" rows={3} placeholder="Enter complete shop address" className="form-textarea" />
                                    {submitCount > 0 && errors.shopAddress && <div className="text-danger mt-1">{errors.shopAddress}</div>}
                                </div>
                            </div>
                            <div className={submitCount ? (errors.shopDescription ? 'has-error' : 'has-success') : ''}>
                                <label htmlFor="shopDescription">Shop Description *</label>
                                <Field as="textarea" name="shopDescription" id="shopDescription" rows={3} placeholder="Enter shop description (e.g., types of cables)" className="form-textarea" />
                                {submitCount > 0 && errors.shopDescription && <div className="text-danger mt-1">{errors.shopDescription}</div>}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                {isLoading ? (
                                    <span className="flex items-center">
                                        <span className="animate-spin mr-2">
                                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                />
                                            </svg>
                                        </span>
                                        {hasExistingSettings ? 'Updating...' : 'Saving...'}
                                    </span>
                                ) : hasExistingSettings ? (
                                    'Update Settings'
                                ) : (
                                    'Save Settings'
                                )}
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    );
};

export default SoftwareSettings;
