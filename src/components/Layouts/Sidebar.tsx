import PerfectScrollbar from 'react-perfect-scrollbar';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useLocation } from 'react-router-dom';
import { toggleSidebar } from '../../store/themeConfigSlice';
import { IRootState } from '../../store';
import { useEffect } from 'react';
import IconCaretsDown from '../Icon/IconCaretsDown';
import IconMenuDashboard from '../Icon/Menu/IconMenuDashboard';
import IconUser from '../Icon/IconUser';
import IconSettings from '../Icon/IconSettings';
import IconDollarSign from '../Icon/IconDollarSign';

const Sidebar = () => {
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const semidark = useSelector((state: IRootState) => state.themeConfig.semidark);
    const location = useLocation();
    const dispatch = useDispatch();
    const { t } = useTranslation();

    useEffect(() => {
        const selector = document.querySelector('.sidebar ul a[href="' + window.location.pathname + '"]');
        if (selector) {
            selector.classList.add('active');
            const ul: any = selector.closest('ul.sub-menu');
            if (ul) {
                let ele: any = ul.closest('li.menu').querySelectorAll('.nav-link') || [];
                if (ele.length) {
                    ele = ele[0];
                    setTimeout(() => {
                        ele.click();
                    });
                }
            }
        }
    }, []);

    useEffect(() => {
        if (window.innerWidth < 1024 && themeConfig.sidebar) {
            dispatch(toggleSidebar());
        }
    }, [location]);

    return (
        <div className={semidark ? 'dark' : ''}>
            <nav
                className={`sidebar fixed min-h-screen h-full top-0 bottom-0 w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] z-50 transition-all duration-300 ${semidark ? 'text-white-dark' : ''}`}
            >
                <div className="bg-white dark:bg-black h-full">
                    <div className="flex justify-between items-center px-4 py-3">
                        <NavLink to="/" className="main-logo flex items-center shrink-0">
                            <img className="w-8 ml-[5px] flex-none" src="/assets/images/logo.svg" alt="logo" />
                            <span className="text-2xl ltr:ml-1.5 rtl:mr-1.5 font-semibold align-middle lg:inline dark:text-white-light">{t('Inventory')}</span>
                        </NavLink>

                        <button
                            type="button"
                            className="collapse-icon w-8 h-8 rounded-full flex items-center hover:bg-gray-500/10 dark:hover:bg-dark-light/10 dark:text-white-light transition duration-300 rtl:rotate-180"
                            onClick={() => dispatch(toggleSidebar())}
                        >
                            <IconCaretsDown className="m-auto rotate-90" />
                        </button>
                    </div>
                    <PerfectScrollbar className="h-[calc(100vh-80px)] relative">
                        <ul className="relative font-semibold space-y-0.5 p-4 py-0">
                            {/* Dashboard */}
                            <li className="nav-item">
                                <NavLink to="/" className="group">
                                    <div className="flex items-center">
                                        <IconMenuDashboard className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Dashboard')}</span>
                                    </div>
                                </NavLink>
                            </li>

                            {/* Inventory Management */}
                            <li className="nav-item">
                                <NavLink to="/purchase" className="group">
                                    <div className="flex items-center">
                                        <IconDollarSign className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Purchase')}</span>
                                    </div>
                                </NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink to="/stock" className="group">
                                    <div className="flex items-center">
                                        <IconMenuDashboard className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Stock')}</span>
                                    </div>
                                </NavLink>
                            </li>

                            {/* Sales Management */}
                            <li className="nav-item">
                                <NavLink to="/invoice" className="group">
                                    <div className="flex items-center">
                                        <IconDollarSign className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Invoice')}</span>
                                    </div>
                                </NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink to="/invoiceHistory" className="group">
                                    <div className="flex items-center">
                                        <IconDollarSign className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Invoice History')}</span>
                                    </div>
                                </NavLink>
                            </li>

                            {/* Khata Management */}
                            <li className="nav-item">
                                <NavLink to="/khata-sale" className="group">
                                    <div className="flex items-center">
                                        <IconDollarSign className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Khata Sale')}</span>
                                    </div>
                                </NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink to="/khata-history" className="group">
                                    <div className="flex items-center">
                                        <IconDollarSign className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Khata History')}</span>
                                    </div>
                                </NavLink>
                            </li>

                            {/* Finance */}
                            <li className="nav-item">
                                <NavLink to="/expense" className="group">
                                    <div className="flex items-center">
                                        <IconDollarSign className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Expense')}</span>
                                    </div>
                                </NavLink>
                            </li>

                            {/* User Management */}
                            <li className="nav-item">
                                <NavLink to="/user" className="group">
                                    <div className="flex items-center">
                                        <IconUser className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('User')}</span>
                                    </div>
                                </NavLink>
                            </li>

                            {/* Settings */}
                            <li className="nav-item">
                                <NavLink to="/setting" className="group">
                                    <div className="flex items-center">
                                        <IconSettings className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Setting')}</span>
                                    </div>
                                </NavLink>
                            </li>
                        </ul>
                    </PerfectScrollbar>
                </div>
            </nav>
        </div>
    );
};

export default Sidebar;
