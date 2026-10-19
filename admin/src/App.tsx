import { Route, BrowserRouter as Router, Routes } from "react-router";
import { RequireAuth, RequirePermission } from "./components/auth/RequireAuth";
import { ScrollToTop } from "./components/common/ScrollToTop";
import AppLayout from "./layout/AppLayout";
import SignIn from "./pages/AuthPages/SignIn";
import Categories from "./pages/Categories/Categories";
import DesignCategories from "./pages/DesignCategories/DesignCategories";
import CmsPages from "./pages/Content/CmsPages";
import Banners from "./pages/Content/Banners";
import HomeSections from "./pages/Content/HomeSections";
import Coupons from "./pages/Coupons/Coupons";
import CustomerDetail from "./pages/Customers/CustomerDetail";
import CustomerList from "./pages/Customers/CustomerList";
import Home from "./pages/Dashboard/Ecommerce";
import Inventory from "./pages/Inventory/Inventory";
import MessageList from "./pages/Messages/MessageList";
import Movements from "./pages/Inventory/Movements";
import OrderDetail from "./pages/Orders/OrderDetail";
import OrderList from "./pages/Orders/OrderList";
import NotFound from "./pages/OtherPage/NotFound";
import ProductForm from "./pages/Products/ProductForm";
import Attributes from "./pages/Products/Attributes";
import ProductList from "./pages/Products/ProductList";
import Reviews from "./pages/Products/Reviews";
import Tags from "./pages/Products/Tags";
import Settings from "./pages/Settings/Settings";

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Signed-in staff only. Each page is also guarded by its permission. */}
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route index path="/" element={<RequirePermission permission="view-dashboard"><Home /></RequirePermission>} />

            <Route path="/orders" element={<RequirePermission permission="manage-orders"><OrderList /></RequirePermission>} />
            <Route path="/orders/:number" element={<RequirePermission permission="manage-orders"><OrderDetail /></RequirePermission>} />

            <Route path="/products" element={<RequirePermission permission="manage-products"><ProductList /></RequirePermission>} />
            <Route path="/products/new" element={<RequirePermission permission="manage-products"><ProductForm /></RequirePermission>} />
            <Route path="/products/tags" element={<RequirePermission permission="manage-products"><Tags /></RequirePermission>} />
            <Route path="/products/attributes" element={<RequirePermission permission="manage-products"><Attributes /></RequirePermission>} />
            <Route path="/products/reviews" element={<RequirePermission permission="manage-products"><Reviews /></RequirePermission>} />
            <Route path="/products/:id" element={<RequirePermission permission="manage-products"><ProductForm /></RequirePermission>} />
            <Route path="/categories" element={<RequirePermission permission="manage-categories"><Categories /></RequirePermission>} />
            <Route path="/design-categories" element={<RequirePermission permission="manage-design-categories"><DesignCategories /></RequirePermission>} />

            <Route path="/inventory" element={<RequirePermission permission="manage-inventory"><Inventory /></RequirePermission>} />
            <Route path="/inventory/movements" element={<RequirePermission permission="manage-inventory"><Movements /></RequirePermission>} />

            <Route path="/customers" element={<RequirePermission permission="view-customers"><CustomerList /></RequirePermission>} />
            <Route path="/customers/:id" element={<RequirePermission permission="view-customers"><CustomerDetail /></RequirePermission>} />

            <Route path="/coupons" element={<RequirePermission permission="manage-coupons"><Coupons /></RequirePermission>} />

            <Route path="/content/banners" element={<RequirePermission permission="manage-content"><Banners /></RequirePermission>} />
            <Route path="/content/sections" element={<RequirePermission permission="manage-content"><HomeSections /></RequirePermission>} />
            <Route path="/content/pages" element={<RequirePermission permission="manage-content"><CmsPages /></RequirePermission>} />

            <Route path="/messages" element={<RequirePermission permission="manage-messages"><MessageList /></RequirePermission>} />

            <Route path="/settings" element={<RequirePermission permission="manage-settings"><Settings /></RequirePermission>} />
          </Route>
        </Route>

        <Route path="/signin" element={<SignIn />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
