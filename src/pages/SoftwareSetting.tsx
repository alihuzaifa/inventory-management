// SoftwareSettings.tsx
import { useEffect, useRef } from 'react';
import * as Yup from 'yup';
import { Field, Form, Formik } from 'formik';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../store/themeConfigSlice';

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

    useEffect(() => {
        dispatch(setPageTitle('Software Settings'));
    }, []);

    const handleSubmit = (values: any, { resetForm }: any) => {
        try {
            localStorage.setItem('softwareSettings', JSON.stringify(values));
            Swal.fire({
                toast: true,
                position: 'top',
                showConfirmButton: false,
                timer: 3000,
                icon: 'success',
                title: 'Settings saved successfully',
                padding: '10px 20px',
            });
        } catch (error) {
            Swal.fire({
                toast: true,
                position: 'top',
                showConfirmButton: false,
                timer: 3000,
                icon: 'error',
                title: 'Failed to save settings',
                padding: '10px 20px',
            });
        }
    };

    return (
        <div className="panel">
            <div className="flex items-center justify-between mb-5">
                <h5 className="font-semibold text-lg dark:text-white-light">Software Settings</h5>
            </div>

            <Formik
                innerRef={formikRef}
                initialValues={{
                    firstOwnerName: '',
                    firstOwnerNumber1: '',
                    firstOwnerNumber2: '',
                    secondOwnerName: '',
                    secondOwnerNumber1: '',
                    secondOwnerNumber2: '',
                    softwareName: '',
                    shopName: '',
                    shopAddress: '',
                    shopDescription: '',
                }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
            >
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
                            <button type="submit" className="btn btn-primary">
                                Save Settings
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    );
};

export default SoftwareSettings;
