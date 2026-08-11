import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
export const adminNavigationItems = [

    {
        label: 'Home',
        href: '/admin/',
        icon: HomeOutlinedIcon,
    },
    {
        label: 'Orders',
        href: '/admin/orders',
        icon: ShoppingCartOutlinedIcon,
    },

    {
        label: 'Products',
        href: '/admin/products',
        icon: Inventory2OutlinedIcon,
    },

    {
        label: 'Customers',
        href: '/admin/customers',
        icon: PeopleOutlinedIcon,
    },

    {
        label: 'Installers',
        href: '/admin/installers',
        icon: BuildOutlinedIcon,
    },

    {
        label: 'Shipping',
        href: '/admin/shipping',
        icon: LocalShippingOutlinedIcon,
    },

    {
        label: 'Settings',
        href: '/admin/settings',
        icon: SettingsOutlinedIcon,
    },

];